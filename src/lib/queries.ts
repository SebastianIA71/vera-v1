import { db } from '@/lib/db';
import { tasks, events, inbox } from '@/lib/db/schema';
import { ne, desc, eq, and } from 'drizzle-orm';

export async function getUrgentAndStaleCounts() {
  const [allTasks, inboxItems] = await Promise.all([
    db.select({
      prioFinal: tasks.prioFinal,
      status: tasks.status,
      lastActionAt: tasks.lastActionAt,
    }).from(tasks).where(ne(tasks.status, 'archived')),
    db.select({ id: inbox.id }).from(inbox).where(eq(inbox.processed, false)),
  ]);

  const urgentCount = allTasks.filter(
    t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done'
  ).length;

  const staleCount = allTasks.filter(t => {
    if (!t.lastActionAt || (t.prioFinal ?? 0) < 4) return false;
    if (t.status === 'done') return false;
    return Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14;
  }).length;

  return { urgentCount, staleCount, inboxCount: inboxItems.length };
}

export async function getNextTrip(now: Date) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const allEvents = await db.select().from(events).orderBy(desc(events.startDate));
  const upcoming = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate >= todayStart)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));
  const next = upcoming[0] ?? null;
  if (!next?.startDate) return null;
  return {
    title: next.title,
    daysTo: Math.ceil((next.startDate.getTime() - now.getTime()) / 86400000),
    startDate: next.startDate.toISOString(),
    who: next.who ?? '',
  };
}
