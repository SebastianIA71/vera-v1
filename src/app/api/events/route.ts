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
    const now = new Date();
    filtered = filtered.filter(e => e.startDate && e.startDate >= now && e.startDate <= cutoff);
  }

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [row] = await db.insert(events).values({
    title:     body.title,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate:   body.endDate   ? new Date(body.endDate)   : null,
    type:      body.type      ?? 'social',
    who:       body.who       ?? null,
    status:    body.status    ?? 'planning',
    notes:     body.notes     ?? null,
  }).returning();
  return NextResponse.json(row);
}
