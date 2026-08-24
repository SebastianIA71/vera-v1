import { db } from './db';
import { events } from './db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';

export const DOLLAR_EVENT_TITLE = '$$';

function clampDay(year: number, monthIndex: number, day: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function adjustToWeekday(date: Date): Date {
  let d = date;
  while (d.getDay() === 0 || d.getDay() === 6) {
    d = new Date(d.getTime() - 86400000);
  }
  return d;
}

function dollarDatesForMonth(year: number, monthIndex: number): Date[] {
  const d14 = adjustToWeekday(new Date(year, monthIndex, clampDay(year, monthIndex, 14)));
  const d29 = adjustToWeekday(new Date(year, monthIndex, clampDay(year, monthIndex, 29)));
  return [d14, d29];
}

/**
 * Genera (si faltan) las ocurrencias del evento recurrente "$$": el día
 * anterior al 15 y el día anterior al 30 de cada mes, adelantado día a día
 * si cae en sábado o domingo. Idempotente — no duplica fechas ya existentes.
 */
export async function ensureDollarEvents(monthsBack = 1, monthsForward = 4): Promise<void> {
  const now = new Date();
  const dates: Date[] = [];
  for (let offset = -monthsBack; offset <= monthsForward; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    dates.push(...dollarDatesForMonth(d.getFullYear(), d.getMonth()));
  }

  const rangeStart = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + monthsForward + 1, 0);

  const existing = await db.select({ startDate: events.startDate })
    .from(events)
    .where(and(eq(events.title, DOLLAR_EVENT_TITLE), gte(events.startDate, rangeStart), lte(events.startDate, rangeEnd)));

  const existingKeys = new Set(existing.map(e => e.startDate?.toISOString().slice(0, 10)));
  const missing = dates.filter(d => !existingKeys.has(d.toISOString().slice(0, 10)));
  if (missing.length === 0) return;

  await db.insert(events).values(missing.map(d => ({
    title: DOLLAR_EVENT_TITLE,
    startDate: d,
    endDate: d,
    type: 'pago',
    status: 'confirmed',
  })));
}
