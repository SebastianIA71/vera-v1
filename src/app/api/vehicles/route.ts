import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vehicles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const rows = await db.select().from(vehicles).where(eq(vehicles.active, true));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [row] = await db.insert(vehicles).values({
    name:              body.name,
    brand:             body.brand             ?? null,
    model:             body.model             ?? null,
    plate:             body.plate             ?? null,
    color:             body.color             ?? '#5ba8e8',
    contractKmTotal:   body.contractKmTotal   ?? null,
    contractMonths:    body.contractMonths     ?? null,
    contractStartDate: body.contractStartDate  ? new Date(body.contractStartDate) : null,
    contractEndDate:   body.contractEndDate    ? new Date(body.contractEndDate)   : null,
    contractId:        body.contractId        ?? null,
    notes:             body.notes             ?? null,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
