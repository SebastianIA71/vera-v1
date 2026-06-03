import { db } from '@/lib/db';
import { events, tasks } from '@/lib/db/schema';
import { asc, desc, ne, gte } from 'drizzle-orm';
import { getUrgentAndStaleCounts } from '@/lib/queries';
import TripsClient from './TripsClient';

export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [allEvents, allTasks, { urgentCount, staleCount, inboxCount }] = await Promise.all([
    db.select().from(events).where(gte(events.startDate, today)).orderBy(asc(events.startDate)),
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    getUrgentAndStaleCounts(),
  ]);

  return (
    <TripsClient
      trips={allEvents}
      allTasks={allTasks}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxCount}
    />
  );
}
