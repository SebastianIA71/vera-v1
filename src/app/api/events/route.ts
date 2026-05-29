import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq, asc, lte, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const upcomingDays = searchParams.get('upcoming');

  let query = db.select().from(events);
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
