import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox, properties, projects, financeRecords } from '@/lib/db/schema';
import { ne, desc, eq, and, isNotNull, gte, or, lte } from 'drizzle-orm';
import HomeRouter from './HomeRouter';

export const dynamic = 'force-dynamic';

export default async function AppRootPage() {
  const now = new Date();

  const todayStartPre = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEndPre   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [allTasks, allEvents, weights, inboxItems, allProperties, allProjects, propTasks, projTasks, urgentTasksDb, financeData, doneTodayTasks] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)).limit(30),
    db.select().from(events).orderBy(desc(events.startDate)).limit(20),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(14),
    db.select().from(inbox).where(eq(inbox.processed, false)).orderBy(desc(inbox.createdAt)).limit(50),
    db.select().from(properties),
    db.select().from(projects).where(ne(projects.status, 'archived')),
    // Query dedicada para tareas de propiedades
    db.select().from(tasks)
      .where(and(ne(tasks.status, 'archived'), ne(tasks.status, 'done'), isNotNull(tasks.propertyId)))
      .orderBy(desc(tasks.prioFinal))
      .limit(50),
    // Query dedicada para tareas de proyectos
    db.select().from(tasks)
      .where(and(ne(tasks.status, 'archived'), ne(tasks.status, 'done'), isNotNull(tasks.projectId)))
      .orderBy(desc(tasks.prioFinal))
      .limit(50),
    // Query dedicada para urgentes (prio >= 8)
    db.select().from(tasks)
      .where(and(
        ne(tasks.status, 'archived'),
        ne(tasks.status, 'done'),
        or(gte(tasks.prio, 8), gte(tasks.prioFinal, 8)),
      ))
      .orderBy(desc(tasks.prioFinal), desc(tasks.prio))
      .limit(10),
    db.select({ calcD: financeRecords.calcD, calcB: financeRecords.calcB, calcA: financeRecords.calcA, calcE: financeRecords.calcE })
      .from(financeRecords).orderBy(desc(financeRecords.date)).limit(12),
    db.select({ id: tasks.id }).from(tasks)
      .where(and(eq(tasks.status, 'done'), gte(tasks.updatedAt, todayStartPre), lte(tasks.updatedAt, todayEndPre)))
      .limit(20),
  ]);

  // Merge: urgentTasksDb cubre prio alto aunque prioFinal=0; allTasks cubre prioFinal alto
  const urgentMap = new Map<number, typeof allTasks[0]>();
  urgentTasksDb.forEach(t => urgentMap.set(t.id, t));
  allTasks.filter(t => Math.max(t.prioFinal ?? 0, t.prio ?? 0) >= 8 && t.status !== 'done')
    .forEach(t => urgentMap.set(t.id, t));
  const allUrgent = [...urgentMap.values()]
    .sort((a, b) => Math.max(b.prioFinal ?? 0, b.prio ?? 0) - Math.max(a.prioFinal ?? 0, a.prio ?? 0));
  const urgentTasks = allUrgent.slice(0, 5);
  const urgentTotal = allUrgent.length;

  const todayStart = todayStartPre;

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate >= todayStart)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  // Próximo evento social (type != 'viaje')
  const nextEvent = allEvents
    .filter(e => e.type !== 'viaje' && e.startDate && e.startDate >= todayStart)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0))[0] ?? null;

  const daysToNextEvent = nextEvent?.startDate
    ? Math.ceil((nextEvent.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  const todayDate = now.toISOString().slice(0, 10);
  const todayWeight = weights[0];
  const todaySnm: string[] = [];
  if (todayWeight && todayWeight.date === todayDate) {
    const snmMap: Record<string, boolean | null | undefined> = {
      snmAgua: todayWeight.snmAgua, snmCaminar: todayWeight.snmCaminar,
      snmEntreno: todayWeight.snmEntreno, snmEscucha: todayWeight.snmEscucha,
      snmDisfruta: todayWeight.snmDisfruta,
    };
    Object.entries(snmMap).forEach(([k, v]) => { if (v) todaySnm.push(k); });
  }

  // Top tarea por propiedad — usa query dedicada que incluye TODAS las tareas con propertyId
  const topTaskByProperty = allProperties.map(prop => {
    const t = propTasks.find(t => t.propertyId === prop.id);
    return t ? { prop, task: t } : null;
  }).filter(Boolean) as { prop: typeof allProperties[0]; task: typeof propTasks[0] }[];

  // Top tarea por proyecto — similar a propiedades
  type ProjTask = { proj: typeof allProjects[0]; task: typeof projTasks[0] };
  const topTaskByProject = allProjects.map(proj => {
    const t = projTasks.find(t => t.projectId === proj.id);
    return t ? { proj, task: t } : null;
  }).filter(Boolean) as ProjTask[];

  return (
    <HomeRouter
      urgentTasks={urgentTasks}
      urgentTotal={urgentTotal}
      nextTrip={nextTrip !== null && daysToNextTrip !== null ? { id: nextTrip.id, title: nextTrip.title, daysTo: daysToNextTrip, startDate: nextTrip.startDate?.toISOString() ?? '', endDate: nextTrip.endDate?.toISOString() ?? '', who: nextTrip.who ?? '', transport: nextTrip.transport ?? '' } : null}
      nextEvent={nextEvent !== null && daysToNextEvent !== null ? { id: nextEvent.id, title: nextEvent.title, daysTo: daysToNextEvent, startDate: nextEvent.startDate?.toISOString() ?? '', who: nextEvent.who ?? '' } : null}
      weightLogs={weights}
      inboxCount={inboxItems.length}
      inboxItems={inboxItems}
      todaySnm={todaySnm}
      topTaskByProperty={topTaskByProperty}
      topTaskByProject={topTaskByProject}
      allEvents={allEvents
        .filter(e => e.startDate && e.startDate >= new Date(now.getFullYear(), now.getMonth(), 1))
        .map(e => ({ startDate: e.startDate!.toISOString(), type: e.type ?? 'social', title: e.title }))}
      financeRecords={financeData}
      doneTodayCount={doneTodayTasks.length}
    />
  );
}

