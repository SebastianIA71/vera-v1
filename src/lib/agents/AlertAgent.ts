import { db } from '@/lib/db';
import { tasks, events, weightLog, contracts, agentLog, memory } from '@/lib/db/schema';
import { ne, desc, eq } from 'drizzle-orm';
import { sendPush } from '@/lib/push';
import { runContactAgent } from './ContactAgent';
import { getWillysWeather } from '@/lib/weather';

export async function runAlertAgent(): Promise<{ alerts: number }> {
  const startTime = Date.now();
  const now = new Date();
  let alertCount = 0;

  // Modo focus activo → no enviar alertas
  const focusRow = await db.select().from(memory).where(eq(memory.key, 'focus_until')).limit(1);
  if (focusRow[0]?.value) {
    const until = new Date(focusRow[0].value);
    if (until > now) return { alerts: 0 };
  }

  const [allTasks, allEvents, weights, allContracts] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')),
    db.select().from(events),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(1),
    db.select().from(contracts),
  ]);

  // 1. Tareas stale (prio >= 4, sin acción > 14 días)
  const staleTasks = allTasks.filter(t => {
    if ((t.prioFinal ?? 0) < 4 || !t.lastActionAt) return false;
    return Math.floor((now.getTime() - t.lastActionAt.getTime()) / 86400000) > 14;
  }).slice(0, 2);

  if (staleTasks.length > 0) {
    const names = staleTasks.map(t => t.title).join(' · ');
    const sent = await sendPush(
      'Vera · tareas sin mover',
      names.slice(0, 100),
      `stale_${staleTasks.map(t => t.id).join('_')}`,
      72,
    );
    if (sent) alertCount++;
  }

  // 2. Viaje próximo (< 21 días)
  const upcomingTrip = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0))[0];

  if (upcomingTrip?.startDate) {
    const daysTo = Math.ceil((upcomingTrip.startDate.getTime() - now.getTime()) / 86400000);
    if (daysTo <= 21) {
      const sent = await sendPush(
        `Vera · ${upcomingTrip.title}`,
        `Quedan ${daysTo} días. ¿Todo preparado?`,
        `trip_${upcomingTrip.id}`,
        24,
      );
      if (sent) alertCount++;
    }
  }

  // 3. Peso sin registrar (> 2 días)
  if (weights.length === 0 || (weights[0]?.date && Math.floor((now.getTime() - new Date(weights[0].date).getTime()) / 86400000) > 2)) {
    const days = weights[0]?.date
      ? Math.floor((now.getTime() - new Date(weights[0].date).getTime()) / 86400000)
      : 3;
    const sent = await sendPush(
      'Vera · registro de peso',
      `No has registrado peso en ${days} días.`,
      'weight_missing',
      20,
    );
    if (sent) alertCount++;
  }

  // 4. C.2 — Contratos que vencen en < 45 días
  const soonContracts = allContracts.filter(c => {
    if (!c.active || !c.endDate) return false;
    const daysToEnd = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / 86400000);
    return daysToEnd >= 0 && daysToEnd <= (c.alertDaysBefore ?? 45);
  });

  for (const contract of soonContracts.slice(0, 2)) {
    const daysToEnd = Math.ceil((new Date(contract.endDate!).getTime() - now.getTime()) / 86400000);
    const sent = await sendPush(
      `Vera · ${contract.name}`,
      `Vence en ${daysToEnd} días. Revisar renegociación.`,
      `contract_${contract.id}`,
      168, // cooldown 7 días
    );
    if (sent) alertCount++;
  }

  // 5. Tiempo en Willy's — alerta si hay evento próximo y lluvia prevista
  const willysEvents = allEvents.filter(e => {
    if (e.propertyId !== 'willys' && e.type !== 'willys') return false;
    if (!e.startDate) return false;
    const daysTo = Math.ceil((new Date(e.startDate).getTime() - now.getTime()) / 86400000);
    return daysTo >= 0 && daysTo <= 7;
  });

  if (willysEvents.length > 0) {
    const forecast = await getWillysWeather(7);
    const badDays = forecast.filter(d => d.isBad);
    if (badDays.length > 0) {
      const eventTitles = willysEvents.map(e => e.title).join(' · ');
      const weatherDesc = badDays.slice(0, 2).map(d => `${d.date.slice(5)} ${d.description}`).join(', ');
      const sent = await sendPush(
        `Vera · Willy's — previsión`,
        `${eventTitles}: ${weatherDesc} previstos.`,
        `willys_weather_${badDays[0].date}`,
        48,
      );
      if (sent) alertCount++;
    }
  }

  // 7. Contactos sociales pendientes
  const { alerts: contactAlerts } = await runContactAgent().catch(() => ({ alerts: 0 }));
  alertCount += contactAlerts;

  await db.insert(agentLog).values({
    agentId: 'alert', action: 'check',
    input: `${allTasks.length} tareas, ${allContracts.length} contratos`,
    output: `${alertCount} alertas enviadas`,
    status: 'ok', durationMs: Date.now() - startTime,
  }).catch(() => {});

  return { alerts: alertCount };
}
