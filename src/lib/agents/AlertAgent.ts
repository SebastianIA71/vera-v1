import { db } from '@/lib/db';
import { tasks, events, weightLog, notifications, pushSubscriptions, agentLog } from '@/lib/db/schema';
import { ne, desc, eq } from 'drizzle-orm';
import { capabilities } from '@/lib/capabilities';
import webpush from 'web-push';

if (capabilities.push) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:vera@vera.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

async function sendPush(title: string, body: string, cooldownKey: string): Promise<boolean> {
  if (!capabilities.push) return false;

  // Check cooldown (no enviar si ya se mandó cooldown en las últimas N horas)
  const recent = await db.select().from(notifications)
    .where(eq(notifications.cooldownKey, cooldownKey))
    .orderBy(desc(notifications.sentAt))
    .limit(1);

  if (recent.length > 0 && recent[0].sentAt) {
    const hoursAgo = (Date.now() - recent[0].sentAt.getTime()) / 3600000;
    if (hoursAgo < 72) return false; // cooldown 72h para stale
  }

  const subs = await db.select().from(pushSubscriptions);
  let sent = false;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, icon: '/icons/icon-192.png' }),
      );
      sent = true;
    } catch {
      // Sub expirada — limpiar
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
    }
  }

  if (sent) {
    await db.insert(notifications).values({
      type: 'push',
      title,
      body,
      channel: 'push',
      sentAt: new Date(),
      cooldownKey,
    });
  }

  return sent;
}

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
      `${names.slice(0, 100)}`,
      `stale_${staleTasks.map(t => t.id).join('_')}`,
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
