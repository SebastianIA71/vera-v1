import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weightLog } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

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
  const snmFields = {
    snmAgua:     snmAgua     ?? false,
    snmCaminar:  snmCaminar  ?? false,
    snmEntreno:  snmEntreno  ?? false,
    snmEscucha:  snmEscucha  ?? false,
    snmDisfruta: snmDisfruta ?? false,
    notes:       notes ?? null,
  };

  // Upsert: si ya existe entrada para hoy, actualizarla
  const existing = await db
    .select({ id: weightLog.id })
    .from(weightLog)
    .where(eq(weightLog.date, today))
    .limit(1);

  if (existing[0]) {
    const [entry] = await db
      .update(weightLog)
      .set({ value: Number(value), ...snmFields })
      .where(eq(weightLog.date, today))
      .returning();
    return NextResponse.json(entry);
  }

  const [entry] = await db
    .insert(weightLog)
    .values({ date: today, value: Number(value), source: 'manual', ...snmFields })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
