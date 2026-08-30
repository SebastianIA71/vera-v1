import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meterReadings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(meterReadings)
    .where(eq(meterReadings.meterId, Number(id)))
    .orderBy(desc(meterReadings.date));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  if (b?.date == null || b?.value == null || Number.isNaN(Number(b.value))) {
    return NextResponse.json({ error: 'date y value requeridos' }, { status: 400 });
  }
  const [row] = await db.insert(meterReadings).values({
    meterId:      Number(id),
    date:         String(b.date),
    value:        Number(b.value),
    origin:       b.origin === 'factura' || b.origin === 'foto' ? b.origin : 'manual',
    isCycleClose: !!b.isCycleClose,
    billId:       b.billId ?? null,
    photoUrl:     b.photoUrl ?? null,
    notes:        b.notes ?? null,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const readingId = new URL(req.url).searchParams.get('readingId');
  if (!readingId) return NextResponse.json({ error: 'readingId requerido' }, { status: 400 });
  await db.delete(meterReadings).where(eq(meterReadings.id, Number(readingId)));
  return NextResponse.json({ ok: true });
}
