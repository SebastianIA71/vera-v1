import { db } from '@/lib/db';
import { tasks, events, properties as propertiesTable } from '@/lib/db/schema';
import { ne, desc, asc } from 'drizzle-orm';
import { getUrgentAndStaleCounts } from '@/lib/queries';
import PropertiesClient from './PropertiesClient';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const now = new Date();
  const in90 = new Date(Date.now() + 90 * 86400000);

  const [allTasks, allEvents, allProperties, { urgentCount, staleCount, inboxCount }] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    db.select().from(events).orderBy(asc(events.startDate)),
    db.select().from(propertiesTable),
    getUrgentAndStaleCounts(),
  ]);

  const upcomingEvents = allEvents.filter(e => e.startDate && e.startDate >= now && e.startDate <= in90);

  return (
    <PropertiesClient
      allTasks={allTasks}
      upcomingEvents={upcomingEvents}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxCount}
      properties={allProperties}
    />
  );
}
