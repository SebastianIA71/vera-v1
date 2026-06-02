import { db } from '@/lib/db';
import { tasks, events, inbox, properties, weightLog, projects } from '@/lib/db/schema';
import { ne, desc, eq } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const now = new Date();

  const [allTasks, allEvents, allProperties, weightLogs, allProjects] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)).limit(50),
    db.select().from(events).orderBy(desc(events.startDate)).limit(20),
    db.select().from(properties),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(1),
    db.select({ id: projects.id }).from(projects).where(ne(projects.status, 'archived')),
  ]);

  const urgentTasks = allTasks.filter(t =>
    (t.prioFinal ?? 0) >= 8 && t.status !== 'done' && t.status !== 'archived'
  );

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  const inboxCount = await db.$count(inbox, eq(inbox.processed, false));

  const upcomingEvents = allEvents.filter(e => e.startDate && e.startDate > now);
  const tasksActive   = allTasks.filter(t => t.status !== 'done').length;
  const tasksDone     = allTasks.filter(t => t.status === 'done').length;
  const tripsCount    = upcomingEvents.filter(e => e.type === 'viaje').length;
  const eventsCount   = upcomingEvents.filter(e => e.type !== 'viaje').length;
  const propsCount    = allProperties.length;
  const projectsCount = allProjects.length;
  const currentWeight = weightLogs[0]?.value ?? null;

  const todayDate = now.toISOString().slice(0, 10);
  const todayWeight = weightLogs[0];
  const todaySnm: string[] = [];
  if (todayWeight && todayWeight.date === todayDate) {
    const snmMap: Record<string, boolean | null | undefined> = {
      snmAgua: todayWeight.snmAgua, snmCaminar: todayWeight.snmCaminar,
      snmEntreno: todayWeight.snmEntreno, snmEscucha: todayWeight.snmEscucha,
      snmDisfruta: todayWeight.snmDisfruta,
    };
    Object.entries(snmMap).forEach(([k, v]) => { if (v) todaySnm.push(k); });
  }

  const nextEventItem = allEvents
    .filter(e => e.type !== 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0))[0] ?? null;
  const daysToNextEvent = nextEventItem?.startDate
    ? Math.ceil((nextEventItem.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  return (
    <DashboardClient
      initialTasks={allTasks}
      urgentCount={urgentTasks.length}
      inboxCount={inboxCount}
      nextTrip={nextTrip ? { title: nextTrip.title, daysTo: daysToNextTrip ?? 0 } : null}
      nextEvent={nextEventItem && daysToNextEvent ? { title: nextEventItem.title, daysTo: daysToNextEvent, startDate: nextEventItem.startDate!.toISOString() } : null}
      allEvents={allEvents.map(e => ({ startDate: e.startDate, type: e.type ?? '', title: e.title }))}
      todaySnm={todaySnm}
      kpis={{ tasksActive, tasksDone, inboxPending: inboxCount, tripsCount, eventsCount, propsCount, projectsCount, currentWeight }}
    />
  );
}
