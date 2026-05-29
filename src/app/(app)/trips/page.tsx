import { db } from '@/lib/db';
import { events, tasks, inbox } from '@/lib/db/schema';
import { eq, desc, asc, ne } from 'drizzle-orm';
import TripsClient from './TripsClient';

export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const [allEvents, allTasks, inboxItems] = await Promise.all([
    db.select().from(events).orderBy(asc(events.startDate)),
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    db.select({ id: inbox.id }).from(inbox).limit(100),
  ]);

  const trips = allEvents.filter(e => e.type === 'viaje');
  const urgentCount = allTasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done').length;
  const staleCount = allTasks.filter(t => {
    if (!t.lastActionAt || (t.prioFinal ?? 0) < 4) return false;
    return Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14;
  }).length;

  return (
    <TripsClient
      trips={trips}
      allTasks={allTasks}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxItems.length}
    />
  );
}
