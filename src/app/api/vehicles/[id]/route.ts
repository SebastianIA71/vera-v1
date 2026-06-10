import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(vehicles).where(eq(vehicles.id, Number(id)));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db.update(vehicles).set({
    name:              body.name,
    brand:             body.brand             ?? null,
    model:             body.model             ?? null,
    plate:             body.plate             ?? null,
    color:             body.color             ?? '#5ba8e8',
    contractKmTotal:   body.contractKmTotal   ?? null,
    contractMonths:    body.contractMonths    ?? null,
    contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : null,
    contractEndDate:   body.contractEndDate   ? new Date(body.contractEndDate)   : null,
    contractId:        body.contractId        ?? null,
    notes:             body.notes             ?? null,
  }).where(eq(vehicles.id, Number(id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(vehicles).set({ active: false }).where(eq(vehicles.id, Number(id)));
  return NextResponse.json({ ok: true });
}
