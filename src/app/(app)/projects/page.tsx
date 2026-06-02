import { db } from '@/lib/db';
import { tasks, projects as projectsTable } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';
import { getUrgentAndStaleCounts } from '@/lib/queries';
import ProjectsClient from './ProjectsClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [allProjects, allTasks, { urgentCount, staleCount, inboxCount }] = await Promise.all([
    db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt)),
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)),
    getUrgentAndStaleCounts(),
  ]);

  return (
    <ProjectsClient
      projects={allProjects}
      allTasks={allTasks}
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxCount}
    />
  );
}
