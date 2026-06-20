import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox, memory, projects, vehicles, kmLogs } from '@/lib/db/schema';
import { ne, desc, and, gte, eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const now = new Date();

  const [
    urgentTasks,
    upcomingEvents,
    weights,
    inboxItems,
    memoryRows,
    propCounts,
    activeProjects,
    projectTaskCounts,
    activeVehicles,
  ] = await Promise.all([
    db.select({ id: tasks.id, title: tasks.title, prioFinal: tasks.prioFinal, propertyId: tasks.propertyId })
      .from(tasks)
      .where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived'), gte(tasks.prioFinal, 7)))
      .orderBy(desc(tasks.prioFinal))
      .limit(3),

    db.select({ title: events.title, startDate: events.startDate, type: events.type, who: events.who, status: events.status })
      .from(events)
      .where(gte(events.startDate, now))
      .orderBy(events.startDate)
      .limit(3),

    db.select({ value: weightLog.value, date: weightLog.date })
      .from(weightLog)
      .orderBy(desc(weightLog.date))
      .limit(2),

    db.select({ id: inbox.id })
      .from(inbox)
      .where(ne(inbox.processed, true))
      .limit(50),

    db.select({ key: memory.key, value: memory.value })
      .from(memory)
      .limit(50),

    // Task counts per property (active tasks only)
    db.select({
        propertyId: tasks.propertyId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(tasks)
      .where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived')))
      .groupBy(tasks.propertyId),

    db.select({ id: projects.id, name: projects.name, icon: projects.icon, color: projects.color, status: projects.status, dueDate: projects.dueDate })
      .from(projects)
      .where(eq(projects.status, 'active'))
      .limit(4),

    // Project task counts (active tasks per project)
    db.select({
        projectId: tasks.projectId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(tasks)
      .where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived')))
      .groupBy(tasks.projectId),

    db.select().from(vehicles).where(eq(vehicles.active, true)),
  ]);

  // Pick widget vehicle: prefer memory preference, fall back to first active
  const widgetVehicleIdStr = memoryRows.find(r => r.key === 'widget_vehicle_id')?.value;
  const widgetVehicleId = widgetVehicleIdStr ? parseInt(widgetVehicleIdStr) : null;
  const chosenVehicle = widgetVehicleId
    ? (activeVehicles.find(v => v.id === widgetVehicleId) ?? activeVehicles[0])
    : activeVehicles[0];

  // Latest km for vehicle
  let vehicleData = null;
  if (chosenVehicle) {
    const v = chosenVehicle;
    const [latestLog] = await db
      .select({ km: kmLogs.km, date: kmLogs.date })
      .from(kmLogs)
      .where(eq(kmLogs.vehicleId, v.id))
      .orderBy(desc(kmLogs.date))
      .limit(1);

    if (v.contractKmTotal && v.contractStartDate) {
      const start = new Date(v.contractStartDate);
      const end = v.contractEndDate
        ? new Date(v.contractEndDate)
        : new Date(start.getTime() + (v.contractMonths ?? 48) * 30 * 24 * 3600 * 1000);
      const totalMonths = Math.max(1,
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      );
      const elapsed = Math.max(1,
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
      );
      const monthlyTarget = Math.round(v.contractKmTotal / totalMonths);
      const expectedNow = Math.round(monthlyTarget * elapsed);
      const latestKm = latestLog?.km ?? 0;
      const pct = expectedNow > 0 ? Math.round((latestKm / expectedNow) * 100) : 100;
      const status = pct > 110 ? 'pasado' : pct < 90 ? 'corto' : 'en_ritmo';
      const monthsLeft = Math.max(0,
        (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
      );

      vehicleData = {
        name: v.name,
        plate: v.plate,
        color: v.color ?? '#5ba8e8',
        latestKm,
        monthlyTarget,
        status,
        pct,
        monthsLeft,
        contractKmTotal: v.contractKmTotal,
      };
    }
  }

  // Focus check
  const focusUntilRow = memoryRows.find(r => r.key === 'focus_until');
  const focusActive = focusUntilRow?.value ? new Date(focusUntilRow.value) > now : false;

  // Weight trend
  const w0 = weights[0]; const w1 = weights[1];
  const trend = w0 && w1
    ? w0.value > w1.value ? '↑' : w0.value < w1.value ? '↓' : '→'
    : '→';

  // Events with days until
  const eventsOut = upcomingEvents.map(e => ({
    title: e.title,
    type: e.type,
    who: e.who,
    days: e.startDate
      ? Math.ceil((new Date(e.startDate).getTime() - now.getTime()) / 86400000)
      : null,
  }));

  // Property counts map
  const propertyCounts: Record<string, number> = { flat: 0, sarapita: 0, willys: 0 };
  for (const row of propCounts) {
    if (row.propertyId && row.propertyId in propertyCounts) {
      propertyCounts[row.propertyId] = Number(row.count);
    }
  }

  // Date strings
  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const todayStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  const payload = {
    today: todayStr,
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    urgentTasks: urgentTasks.map(t => ({ title: t.title, prio: t.prioFinal, prop: t.propertyId })),
    nextTrip: eventsOut[0] ?? null,
    events: eventsOut,
    weight: w0 ? { value: w0.value, trend } : null,
    inboxCount: inboxItems.length,
    focusActive,
    propertyCounts,
    projects: activeProjects.map(p => {
      const taskCountRow = projectTaskCounts.find(r => r.projectId === p.id);
      return {
        name: p.name,
        icon: p.icon ?? '●',
        color: p.color ?? '#c4a86a',
        dueDate: p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : null,
        taskCount: Number(taskCountRow?.count ?? 0),
      };
    }),
    vehicle: vehicleData,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
