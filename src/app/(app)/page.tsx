import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';
import MobileHome from './MobileHome';

export const dynamic = 'force-dynamic';

export default async function AppRootPage() {
  const now = new Date();

  const [allTasks, allEvents, weights, inboxItems] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)).limit(30),
    db.select().from(events).orderBy(desc(events.startDate)).limit(10),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(14),
    db.select({ id: inbox.id }).from(inbox).limit(100),
  ]);

  const urgentTasks = allTasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done').slice(0, 3);

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  return (
    <MobileHome
      urgentTasks={urgentTasks}
      nextTrip={nextTrip && daysToNextTrip ? { title: nextTrip.title, daysTo: daysToNextTrip, startDate: nextTrip.startDate?.toISOString() ?? '' } : null}
      weightLogs={weights}
      inboxCount={inboxItems.length}
    />
  );
}
