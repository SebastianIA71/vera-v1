import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const [row] = await db.select().from(contracts).where(eq(contracts.id, Number(params.id)));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [row] = await db.update(contracts).set({
    name:             body.name,
    provider:         body.provider        ?? null,
    propertyId:       body.propertyId      ?? null,
    category:         body.category        ?? null,
    monthlyAmountEnc: body.monthlyAmountEnc ?? null,
    startDate:        body.startDate  ? new Date(body.startDate)  : null,
    endDate:          body.endDate    ? new Date(body.endDate)    : null,
    alertDaysBefore:  body.alertDaysBefore  ?? 45,
    paymentDay:       body.paymentDay      ?? null,
    billingCycle:     body.billingCycle    ?? null,
    notes:            body.notes           ?? null,
    active:           body.active          ?? true,
  }).where(eq(contracts.id, Number(params.id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.update(contracts).set({ active: false }).where(eq(contracts.id, Number(params.id)));
  return NextResponse.json({ ok: true });
}
