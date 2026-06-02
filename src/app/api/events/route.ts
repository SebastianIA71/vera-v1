import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const upcomingDays = searchParams.get('upcoming');

  const rows = await db.select().from(events).orderBy(asc(events.startDate));

  let filtered = rows;
  if (type) filtered = filtered.filter(e => e.type === type);
  if (upcomingDays) {
    const cutoff = new Date(Date.now() + Number(upcomingDays) * 86400000);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    filtered = filtered.filter(e => e.startDate && e.startDate >= todayStart && e.startDate <= cutoff);
  }

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const [row] = await db.insert(events).values({
    title:         String(body.title ?? ''),
    type:          body.type          ?? 'social',
    startDate:     body.startDate     ? new Date(body.startDate) : null,
    endDate:       body.endDate       ? new Date(body.endDate)   : null,
    who:           body.who           ?? null,
    propertyId:    body.propertyId    ?? null,
    transport:     body.transport     ?? null,
    accommodation: body.accommodation ?? null,
    status:        body.status        ?? 'planning',
    notes:         body.notes         ?? null,
    approx:        body.approx        ?? false,
    meta:          body.meta          ?? null,
  }).returning();

  return NextResponse.json(row);
}
