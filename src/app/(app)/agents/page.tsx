import { db } from '@/lib/db';
import { tasks, inbox } from '@/lib/db/schema';
import { ne } from 'drizzle-orm';
import AgentsClient from './AgentsClient';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const [allTasks, inboxItems] = await Promise.all([
    db.select({ prioFinal: tasks.prioFinal, status: tasks.status, lastActionAt: tasks.lastActionAt })
      .from(tasks).where(ne(tasks.status, 'archived')),
    db.select({ id: inbox.id }).from(inbox),
  ]);

  const urgentCount = allTasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done').length;
  const staleCount = allTasks.filter(t => {
    if (!t.lastActionAt || (t.prioFinal ?? 0) < 4) return false;
    return Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14;
  }).length;

  return (
    <AgentsClient
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxItems.length}
    />
  );
}
