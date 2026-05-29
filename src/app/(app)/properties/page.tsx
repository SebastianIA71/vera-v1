import { db } from '@/lib/db';
import { tasks, events, inbox } from '@/lib/db/schema';
import { ne, desc, asc } from 'drizzle-orm';
import PropertiesClient from './PropertiesClient';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const now = new Date();
  const in90 = new Date(Date.now() + 90 * 86400000);

  const [allTasks, allEvents, inboxItems] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    db.select().from(events).orderBy(asc(events.startDate)),
    db.select({ id: inbox.id }).from(inbox).limit(100),
  ]);

  const urgentCount = allTasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done').length;
  const staleCount = allTasks.filter(t => {
    if (!t.lastActionAt || (t.prioFinal ?? 0) < 4) return false;
    return Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14;
  }).length;

  const upcomingEvents = allEvents.filter(e => e.startDate && e.startDate >= now && e.startDate <= in90);

  return (
    <PropertiesClient
      allTasks={allTasks}
      upcomingEvents={upcomingEvents}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxItems.length}
    />
  );
}
