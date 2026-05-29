import { db } from '@/lib/db';
import { inbox, tasks } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';
import InboxClient from './InboxClient';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const [inboxItems, allTasks] = await Promise.all([
    db.select().from(inbox).orderBy(desc(inbox.createdAt)).limit(100),
    db.select({ id: tasks.id }).from(tasks).where(ne(tasks.status, 'archived')).limit(1),
  ]);

  const urgentCount = 0; // skip extra query
  const staleCount = 0;

  return (
    <InboxClient
      initialItems={inboxItems}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxItems.filter(i => !i.processed).length}
    />
  );
}
