import { db } from '@/lib/db';
import { tasks, events, weightLog, projects as projectsTable } from '@/lib/db/schema';
import { ne, desc, asc, eq } from 'drizzle-orm';
import { renewOverdueObjectives, type ObjectiveTier } from '@/lib/objectives';
import MorningRitual, { type Objective } from '@/components/morning/MorningRitual';

export const dynamic = 'force-dynamic';

export default async function MorningPage() {
  await renewOverdueObjectives();

  const now = new Date();

  const [allTasks, allEvents, weights, activeProjects] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prio)).limit(50),
    db.select().from(events).orderBy(asc(events.startDate)).limit(20),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(14),
    db.select().from(projectsTable).where(eq(projectsTable.status, 'active')),
  ]);

  const effectivePrio = (t: typeof allTasks[0]) => Math.max(t.prioFinal ?? 0, t.prio ?? 0);
  const activeTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'archived');

  const top3Tasks = activeTasks
    .sort((a, b) => effectivePrio(b) - effectivePrio(a))
    .slice(0, 3)
    .map(t => ({
      id: t.id,
      title: t.title,
      detail: t.detail,
      propertyId: t.propertyId,
      projectId: t.projectId,
      prioFinal: effectivePrio(t),
      tags: t.tags,
      lastActionAt: t.lastActionAt ? t.lastActionAt.getTime() : null,
      createdAt: t.createdAt ? t.createdAt.getTime() : null,
    }));

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  // Objetivos: proyectos marcados explícitamente como objetivo, con periodicidad propia
  const withTier = activeProjects
    .filter(p => p.isObjective && p.objectiveTier && p.dueDate)
    .map(p => {
      const daysTo = Math.ceil((p.dueDate!.getTime() - now.getTime()) / 86400000);
      return { id: p.id, name: p.name, color: p.color, icon: p.icon, daysTo, tier: p.objectiveTier as ObjectiveTier } as Objective;
    });

  const byTier = (tier: ObjectiveTier, limit: number) =>
    withTier.filter(o => o.tier === tier).sort((a, b) => a.daysTo - b.daysTo).slice(0, limit);

  const objectives: Objective[] = [
    ...byTier('semanal', 2),
    ...byTier('quincenal', 1),
    ...byTier('mensual', 1),
    ...byTier('trimestral', 1),
  ];

  const projectsById = Object.fromEntries(activeProjects.map(p => [p.id, { name: p.name, color: p.color }]));

  return (
    <MorningRitual
      top3Tasks={top3Tasks}
      objectives={objectives}
      projectsById={projectsById}
      nextTrip={nextTrip && daysToNextTrip ? { title: nextTrip.title, daysTo: daysToNextTrip } : null}
      weightHistory={weights}
    />
  );
}
