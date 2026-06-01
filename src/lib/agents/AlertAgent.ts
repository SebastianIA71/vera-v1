import { db } from '@/lib/db';
import { tasks, events, weightLog, agentLog } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';
import { sendPush } from '@/lib/push';

export async function runAlertAgent(): Promise<{ alerts: number }> {
  const startTime = Date.now();
  const now = new Date();
  let alertCount = 0;

  const allTasks = await db.select().from(tasks).where(ne(tasks.status, 'archived'));
  const allEvents = await db.select().from(events);
  const weights = await db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(1);

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

  await db.insert(agentLog).values({
    agentId: 'alert', action: 'check',
    input: `${allTasks.length} tareas`,
    output: `${alertCount} alertas enviadas`,
    status: 'ok', durationMs: Date.now() - startTime,
  }).catch(() => {});

  return { alerts: alertCount };
}
