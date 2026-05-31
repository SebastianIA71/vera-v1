import { db } from '@/lib/db';
import { events, tasks } from '@/lib/db/schema';
import { asc, desc, ne } from 'drizzle-orm';
import { getUrgentAndStaleCounts } from '@/lib/queries';
import TripsClient from './TripsClient';

export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const [allEvents, allTasks, { urgentCount, staleCount, inboxCount }] = await Promise.all([
    db.select().from(events).orderBy(asc(events.startDate)),
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    getUrgentAndStaleCounts(),
  ]);

  const trips = allEvents.filter(e => e.type === 'viaje');

  return (
    <TripsClient
      trips={trips}
      allTasks={allTasks}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxCount}
    />
  );
}
