import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox, memory } from '@/lib/db/schema';
import { ne, desc, and, gte, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  // Auth simple por token en query param
  const token = req.nextUrl.searchParams.get('token');
  const secret = process.env.WIDGET_SECRET;
  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const [urgentTasks, allEvents, weights, inboxItems, focusRow] = await Promise.all([
    db.select({ id: tasks.id, title: tasks.title, prioFinal: tasks.prioFinal, propertyId: tasks.propertyId })
      .from(tasks)
      .where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived'), gte(tasks.prioFinal, 7)))
      .orderBy(desc(tasks.prioFinal))
      .limit(3),
    db.select({ title: events.title, startDate: events.startDate, type: events.type })
      .from(events)
      .where(gte(events.startDate, now))
      .orderBy(events.startDate)
      .limit(1),
    db.select({ value: weightLog.value, date: weightLog.date })
      .from(weightLog)
      .orderBy(desc(weightLog.date))
      .limit(2),
    db.select({ id: inbox.id })
      .from(inbox)
      .where(and(ne(inbox.processed, true)))
      .limit(50),
    db.select({ key: memory.key, value: memory.value })
      .from(memory)
      .limit(50),
  ]);

  const focusUntilRow = focusRow.find(r => r.key === 'focus_until');
  const focusActive = focusUntilRow?.value ? new Date(focusUntilRow.value) > now : false;

  const nextTrip = allEvents[0] ?? null;
  const daysToTrip = nextTrip?.startDate
    ? Math.ceil((new Date(nextTrip.startDate).getTime() - now.getTime()) / 86400000)
    : null;

  const w0 = weights[0]; const w1 = weights[1];
  const trend = w0 && w1
    ? w0.value > w1.value ? '↑' : w0.value < w1.value ? '↓' : '→'
    : '';

  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const todayStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return NextResponse.json({
    today: todayStr,
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    urgentTasks: urgentTasks.map(t => ({ title: t.title, prio: t.prioFinal, prop: t.propertyId })),
    nextTrip: nextTrip ? { title: nextTrip.title, days: daysToTrip } : null,
    weight: w0 ? { value: w0.value, trend } : null,
    inboxCount: inboxItems.length,
    focusActive,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
