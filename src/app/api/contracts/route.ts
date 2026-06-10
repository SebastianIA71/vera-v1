import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contracts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const rows = await db
    .select()
    .from(contracts)
    .where(eq(contracts.active, true));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [row] = await db.insert(contracts).values({
    name:             body.name,
    provider:         body.provider         ?? null,
    propertyId:       body.propertyId        ?? null,
    category:         body.category          ?? null,
    monthlyAmountEnc: body.monthlyAmountEnc  ?? null,
    startDate:        body.startDate  ? new Date(body.startDate)  : null,
    endDate:          body.endDate    ? new Date(body.endDate)    : null,
    alertDaysBefore:  body.alertDaysBefore   ?? 45,
    paymentDay:       body.paymentDay        ?? null,
    billingCycle:     body.billingCycle      ?? null,
    notes:            body.notes             ?? null,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
