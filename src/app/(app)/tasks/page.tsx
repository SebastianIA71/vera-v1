import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';
import { getUrgentAndStaleCounts } from '@/lib/queries';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const [allTasks, { urgentCount, staleCount, inboxCount }] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    getUrgentAndStaleCounts(),
  ]);

  return (
    <TasksClient
      initialTasks={allTasks}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxCount}
    />
  );
}
