import { db } from '@/lib/db';
import { tasks, events, weightLog } from '@/lib/db/schema';
import { ne, desc, asc } from 'drizzle-orm';
import MorningRitual from '@/components/morning/MorningRitual';

export const dynamic = 'force-dynamic';

export default async function MorningPage() {
  const now = new Date();

  const [allTasks, allEvents, weights] = await Promise.all([
    // Ordenar por prio porque prioFinal defaultea a 0 hasta que corra PrioAgent
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prio)).limit(50),
    db.select().from(events).orderBy(asc(events.startDate)).limit(20),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(1),
  ]);

  const effectivePrio = (t: typeof allTasks[0]) => Math.max(t.prioFinal ?? 0, t.prio ?? 0);
  const urgentTasks = allTasks
    .filter(t => t.status !== 'done' && t.status !== 'archived' && effectivePrio(t) >= 6)
    .sort((a, b) => effectivePrio(b) - effectivePrio(a))
    .slice(0, 5);

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  return (
    <MorningRitual
      urgentTasks={urgentTasks}
      nextTrip={nextTrip && daysToNextTrip ? { title: nextTrip.title, daysTo: daysToNextTrip } : null}
      lastWeightEntry={weights[0] ?? null}
    />
  );
}
