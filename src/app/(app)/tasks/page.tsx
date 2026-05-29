import { db } from '@/lib/db';
import { tasks, inbox } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const [allTasks, inboxItems] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    db.select({ id: inbox.id }).from(inbox).limit(100),
  ]);

  const urgentCount = allTasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done').length;
  const staleCount = allTasks.filter(t => {
    if (!t.lastActionAt || (t.prioFinal ?? 0) < 4) return false;
    return Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14;
  }).length;

  return (
    <TasksClient
      initialTasks={allTasks}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxItems.length}
    />
  );
}
