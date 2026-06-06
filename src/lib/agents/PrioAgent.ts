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

function nextTripDays(allEvents: Event[]): number | null {
  const now = Date.now();
  const sorted = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate.getTime() > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));
  if (!sorted[0]?.startDate) return null;
  return Math.ceil((sorted[0].startDate.getTime() - now) / 86400000);
}

function calcPrioFinal(task: Task, allEvents: Event[]): number {
  const base = task.prioManual ?? task.prio ?? 0;
  const now = Date.now();

  // Staleness: +1 si >14 días sin acción, +2 si >28 días
  const daysSinceAction = task.lastActionAt
    ? Math.floor((now - task.lastActionAt.getTime()) / 86400000)
    : 0;
  const staleness = daysSinceAction >= 28 ? 2 : daysSinceAction >= 14 ? 1 : 0;

  // Season: +2 si hay evento próximo en la misma propiedad
  const season = propertyHasEventSoon(task.propertyId, allEvents) ? 2 : 0;

  // B.2 — Viaje próximo: +1 a tareas con tag del viaje
  const daysToTrip = nextTripDays(allEvents);
  const tags = (task.tags ?? '').toLowerCase();
  const tripBoost = (daysToTrip !== null && daysToTrip <= 21 && tags.includes('viaje')) ? 1 : 0;

  // B.1 — dueDate urgency: si vence en <7 días, asegurar mínimo 7
  const dueBoost = (() => {
    if (!task.dueDate) return 0;
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - now) / 86400000);
    return daysUntilDue >= 0 && daysUntilDue <= 7 ? 1 : 0;
  })();
  const dueMínimo = (() => {
    if (!task.dueDate) return 0;
    const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - now) / 86400000);
    return daysUntilDue >= 0 && daysUntilDue <= 7 ? 7 : 0;
  })();

  const raw = Math.min(9, base + staleness + season + tripBoost + dueBoost);
  return Math.max(raw, dueMínimo);
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

