import { db } from '@/lib/db';
import { tasks, events, inbox, properties, weightLog, projects, financeRecords, vehicles, contracts, kmLogs } from '@/lib/db/schema';
import { ne, desc, asc, sql, and, or, isNull, lte, gte, eq } from 'drizzle-orm';
import { renewOverdueObjectives, buildObjectivesList } from '@/lib/objectives';
import { ensureDollarEvents, DOLLAR_EVENT_TITLE } from '@/lib/dollarEvent';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export default async function DashboardPage() {
  await Promise.all([renewOverdueObjectives(), ensureDollarEvents()]);

  const now = new Date();
  const eventsWindowStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [allTasks, doneCountRows, allEvents, allProperties, weightLogs, allProjects, financeData, allVehicles, allContracts, allKmLogs] = await Promise.all([
    db.select().from(tasks).where(and(
      ne(tasks.status, 'archived'),
      ne(tasks.status, 'done'),
      or(isNull(tasks.snoozedUntil), lte(tasks.snoozedUntil, now))!,
    )).orderBy(desc(tasks.prioFinal), desc(tasks.prio)).limit(100),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'done')),
    db.select().from(events).where(gte(events.startDate, eventsWindowStart)).orderBy(asc(events.startDate)).limit(60),
    db.select().from(properties),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(14),
    db.select().from(projects).where(ne(projects.status, 'archived')),
    db.select({ calcD: financeRecords.calcD, calcB: financeRecords.calcB, calcA: financeRecords.calcA, calcE: financeRecords.calcE })
      .from(financeRecords).orderBy(desc(financeRecords.date)).limit(24),
    db.select().from(vehicles).where(eq(vehicles.active, true)),
    db.select({ id: contracts.id }).from(contracts).where(eq(contracts.active, true)),
    db.select().from(kmLogs).orderBy(desc(kmLogs.date)),
  ]);

  const urgentTasks = allTasks.filter(t => (t.prioFinal ?? 0) >= 8);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate >= todayStart)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  const allInboxItems = await db.select({ id: inbox.id, processed: inbox.processed }).from(inbox).limit(200);
  const inboxCount = allInboxItems.filter(i => !i.processed).length;

  const upcomingEvents = allEvents.filter(e => e.startDate && e.startDate >= todayStart);
  const tasksActive   = allTasks.length;
  const tasksDone     = doneCountRows[0]?.count ?? 0;
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
    .filter(e => e.type !== 'viaje' && e.title !== DOLLAR_EVENT_TITLE && e.startDate && e.startDate >= todayStart)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0))[0] ?? null;
  const daysToNextEvent = nextEventItem?.startDate
    ? Math.ceil((nextEventItem.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  const vehicleSummaries = allVehicles.map(v => {
    const latestKm = allKmLogs.find(k => k.vehicleId === v.id)?.km ?? null;
    const pct = latestKm !== null && v.contractKmTotal ? Math.min(100, Math.round((latestKm / v.contractKmTotal) * 100)) : null;
    const contractEnd = v.contractEndDate
      ? new Date(v.contractEndDate)
      : (v.contractStartDate && v.contractMonths
          ? new Date(v.contractStartDate.getTime() + v.contractMonths * 30 * 24 * 3600 * 1000)
          : null);
    const monthsLeft = contractEnd ? Math.max(0, monthsBetween(now, contractEnd)) : null;
    return {
      id: v.id, name: v.name, brand: v.brand, model: v.model, plate: v.plate,
      latestKm, contractKmTotal: v.contractKmTotal, pct, monthsLeft,
    };
  });

  const activeProjects = allProjects.filter(p => p.status === 'active');
  const objectives = buildObjectivesList(activeProjects, now).slice(0, 2);

  const propertySummaries = allProperties.map(p => ({
    id: p.id, name: p.name, icon: p.icon, color: p.color,
    taskCount: allTasks.filter(t => t.propertyId === p.id).length,
  }));
  const projectSummaries = activeProjects.map(p => ({
    id: p.id, name: p.name, icon: p.icon, iconUrl: p.iconUrl, color: p.color,
    taskCount: allTasks.filter(t => t.projectId === p.id).length,
  }));

  return (
    <DashboardClient
      initialTasks={allTasks}
      urgentCount={urgentTasks.length}
      inboxCount={inboxCount}
      weightLogs={weightLogs.map(w => ({ date: w.date, value: w.value }))}
      nextTrip={nextTrip !== null ? { title: nextTrip.title, daysTo: daysToNextTrip ?? 0 } : null}
      nextEvent={nextEventItem !== null && daysToNextEvent !== null ? { title: nextEventItem.title, daysTo: daysToNextEvent, startDate: nextEventItem.startDate!.toISOString() } : null}
      allEvents={allEvents.map(e => ({ startDate: e.startDate, type: e.type ?? '', title: e.title }))}
      todaySnm={todaySnm}
      kpis={{ tasksActive, tasksDone, inboxPending: inboxCount, tripsCount, eventsCount, propsCount, projectsCount, currentWeight, vehiclesCount: allVehicles.length, contractsActive: allContracts.length }}
      financeRecords={financeData}
      vehicles={vehicleSummaries}
      objectives={objectives}
      propertySummaries={propertySummaries}
      projectSummaries={projectSummaries}
    />
  );
}
