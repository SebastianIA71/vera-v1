import { db } from '@/lib/db';
import { tasks, events, weightLog, projects as projectsTable } from '@/lib/db/schema';
import { ne, desc, asc, eq, and, isNotNull } from 'drizzle-orm';
import MorningRitual, { type Objective, type ObjectiveTier } from '@/components/morning/MorningRitual';

export const dynamic = 'force-dynamic';

function tierFor(daysTo: number): ObjectiveTier | null {
  if (daysTo <= 7) return 'semanal';
  if (daysTo <= 14) return 'quincenal';
  if (daysTo <= 31) return 'mensual';
  if (daysTo <= 92) return 'trimestral';
  return null;
}

export default async function MorningPage() {
  const now = new Date();

  const [allTasks, allEvents, weights, activeProjects] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prio)).limit(50),
    db.select().from(events).orderBy(asc(events.startDate)).limit(20),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(14),
    db.select().from(projectsTable).where(and(eq(projectsTable.status, 'active'), isNotNull(projectsTable.dueDate))),
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

  // Objetivos: proyectos activos con fecha límite, agrupados por horizonte temporal
  const withTier = activeProjects
    .map(p => {
      const daysTo = Math.ceil((p.dueDate!.getTime() - now.getTime()) / 86400000);
      const tier = tierFor(daysTo);
      if (!tier) return null;
      return { id: p.id, name: p.name, color: p.color, icon: p.icon, daysTo, tier } as Objective;
    })
    .filter((o): o is Objective => o !== null);

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
