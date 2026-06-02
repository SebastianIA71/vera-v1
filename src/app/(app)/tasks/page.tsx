import { db } from '@/lib/db';
import { tasks, inbox, properties as propertiesTable, projects as projectsTable } from '@/lib/db/schema';
import { ne, desc, eq } from 'drizzle-orm';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const [allTasks, inboxItems, allProperties, allProjects] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    db.select({ id: inbox.id }).from(inbox).where(eq(inbox.processed, false)),
    db.select().from(propertiesTable),
    db.select({ id: projectsTable.id, name: projectsTable.name, color: projectsTable.color })
      .from(projectsTable)
      .where(ne(projectsTable.status, 'archived')),
  ]);

  const urgentCount = allTasks.filter(t =>
    (t.prioFinal ?? 0) >= 8 && t.status !== 'done' && t.status !== 'archived'
  ).length;

  const waitingCount = allTasks.filter(t =>
    (t.prioFinal ?? 0) >= 5 && (t.prioFinal ?? 0) <= 7 &&
    t.status !== 'done' && t.status !== 'archived'
  ).length;

  return (
    <TasksClient
      initialTasks={allTasks}
      urgentCount={urgentCount}
      waitingCount={waitingCount}
      inboxCount={inboxItems.length}
      properties={allProperties}
      projects={allProjects}
    />
  );
}
