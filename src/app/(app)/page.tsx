import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox, properties } from '@/lib/db/schema';
import { ne, desc, eq, and, isNotNull } from 'drizzle-orm';
import HomeRouter from './HomeRouter';

export const dynamic = 'force-dynamic';

export default async function AppRootPage() {
  const now = new Date();

  const [allTasks, allEvents, weights, inboxItems, allProperties, propTasks] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)).limit(30),
    db.select().from(events).orderBy(desc(events.startDate)).limit(20),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(14),
    db.select().from(inbox).where(eq(inbox.processed, false)).orderBy(desc(inbox.createdAt)).limit(50),
    db.select().from(properties),
    // Query dedicada para tareas de propiedades — evita que limit(30) las excluya
    db.select().from(tasks)
      .where(and(ne(tasks.status, 'archived'), ne(tasks.status, 'done'), isNotNull(tasks.propertyId)))
      .orderBy(desc(tasks.prioFinal))
      .limit(50),
  ]);

  const urgentTasks = allTasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done').slice(0, 3);

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  // Próximo evento social (type != 'viaje')
  const nextEvent = allEvents
    .filter(e => e.type !== 'viaje' && e.startDate && e.startDate > now)
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

  return (
    <HomeRouter
      urgentTasks={urgentTasks}
      nextTrip={nextTrip && daysToNextTrip ? { title: nextTrip.title, daysTo: daysToNextTrip, startDate: nextTrip.startDate?.toISOString() ?? '', endDate: nextTrip.endDate?.toISOString() ?? '', who: nextTrip.who ?? '', transport: nextTrip.transport ?? '' } : null}
      nextEvent={nextEvent && daysToNextEvent ? { title: nextEvent.title, daysTo: daysToNextEvent, startDate: nextEvent.startDate?.toISOString() ?? '', who: nextEvent.who ?? '' } : null}
      weightLogs={weights}
      inboxCount={inboxItems.length}
      inboxItems={inboxItems}
      todaySnm={todaySnm}
      topTaskByProperty={topTaskByProperty}
      allEvents={allEvents
        .filter(e => e.startDate && e.startDate >= new Date(now.getFullYear(), now.getMonth(), 1))
        .map(e => ({ startDate: e.startDate!.toISOString(), type: e.type ?? 'social', title: e.title }))}
    />
  );
}

