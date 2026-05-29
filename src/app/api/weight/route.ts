import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weightLog } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';

export async function GET() {
  const rows = await db
    .select()
    .from(weightLog)
    .orderBy(desc(weightLog.date))
    .limit(14);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { value, snmAgua, snmCaminar, snmEntreno, snmEscucha, snmDisfruta, notes } = body;

  if (!value || isNaN(Number(value))) {
    return NextResponse.json({ error: 'value required' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const [entry] = await db
    .insert(weightLog)
    .values({
      date: today,
      value: Number(value),
      source: 'manual',
      snmAgua: snmAgua ?? false,
      snmCaminar: snmCaminar ?? false,
      snmEntreno: snmEntreno ?? false,
      snmEscucha: snmEscucha ?? false,
      snmDisfruta: snmDisfruta ?? false,
      notes: notes ?? null,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
