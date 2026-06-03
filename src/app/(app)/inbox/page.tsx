import { db } from '@/lib/db';
import { inbox, tasks, projects, events } from '@/lib/db/schema';
import { ne, desc, asc, eq } from 'drizzle-orm';
import InboxClient from './InboxClient';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const [inboxItems, allProjects, allEvents] = await Promise.all([
    db.select().from(inbox).orderBy(desc(inbox.createdAt)).limit(100),
    db.select({ id: projects.id, name: projects.name, color: projects.color }).from(projects),
    db.select({ id: events.id, title: events.title, type: events.type, startDate: events.startDate })
      .from(events).where(eq(events.type, 'viaje')).orderBy(asc(events.startDate)),
  ]);

  const now = new Date();
  const upcomingTrips = allEvents.filter(e => e.startDate && e.startDate > now);

  return (
    <InboxClient
      initialItems={inboxItems}
      urgentCount={0}
      staleCount={0}
      inboxCount={inboxItems.filter(i => !i.processed).length}
      projects={allProjects}
      trips={upcomingTrips.map(e => ({ id: e.id, title: e.title }))}
    />
  );
}
