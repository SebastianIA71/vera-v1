import { db } from '@/lib/db';
import { tasks, events, agentLog } from '@/lib/db/schema';
import { ne, eq, and } from 'drizzle-orm';

type Task = typeof tasks.$inferSelect;
type Event = typeof events.$inferSelect;

function propertyHasEventSoon(propertyId: string | null, allEvents: Event[]): boolean {
  if (!propertyId) return false;
  const now = Date.now();
  const in21 = now + 21 * 86400000;
  return allEvents.some(e => {
    if (!e.startDate || !e.propertyId) return false;
    return e.propertyId === propertyId && e.startDate.getTime() >= now && e.startDate.getTime() <= in21;
  });
}

function calcPrioFinal(task: Task, allEvents: Event[]): number {
  const base = task.prioManual ?? task.prio ?? 0;
  const daysSinceAction = task.lastActionAt
    ? Math.floor((Date.now() - task.lastActionAt.getTime()) / 86400000)
    : 0;
  // Discrete staleness: jumps only at day 14 and day 28 thresholds
  const staleness = daysSinceAction >= 28 ? 2 : daysSinceAction >= 14 ? 1 : 0;
  const season = propertyHasEventSoon(task.propertyId, allEvents) ? 2 : 0;
  return Math.min(9, base + staleness + season);
}

export async function runPrioAgent(): Promise<{ updated: number }> {
  const startTime = Date.now();

  const [allTasks, allEvents] = await Promise.all([
    db.select().from(tasks).where(and(ne(tasks.status, 'archived'), ne(tasks.status, 'done'))),
    db.select().from(events),
  ]);

  let updated = 0;
  for (const task of allTasks) {
    const newPrio = calcPrioFinal(task, allEvents);
    if (newPrio !== task.prioFinal) {
      await db.update(tasks).set({ prioFinal: newPrio }).where(eq(tasks.id, task.id));
      updated++;
    }
  }

  await db.insert(agentLog).values({
    agentId: 'prio', action: 'recalculate',
    input: `${allTasks.length} tareas`,
    output: `${updated} actualizadas`,
    status: 'ok', durationMs: Date.now() - startTime,
  }).catch(() => {});

  return { updated };
}

export function calcSingleTaskPrio(task: Task, allEvents: Event[]): number {
  return calcPrioFinal(task, allEvents);
}

