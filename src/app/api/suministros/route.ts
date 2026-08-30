import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { utilityMeters, meterReadings, utilityBills } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { DEFAULT_WATER_TARIFF_CONFIG } from '@/lib/utilities/tariff';

export const dynamic = 'force-dynamic';

export async function GET() {
  const meters = await db.select().from(utilityMeters).where(eq(utilityMeters.active, true));
  const ids = meters.map(m => m.id);
  const [readings, bills] = ids.length
    ? await Promise.all([
        db.select().from(meterReadings).where(inArray(meterReadings.meterId, ids)).orderBy(desc(meterReadings.date)),
        db.select().from(utilityBills).where(inArray(utilityBills.meterId, ids)).orderBy(desc(utilityBills.periodEnd)),
      ])
    : [[], []];
  return NextResponse.json({ meters, readings, bills });
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b?.name?.trim()) return NextResponse.json({ error: 'name requerido' }, { status: 400 });
  const [row] = await db.insert(utilityMeters).values({
    propertyId:    b.propertyId    ?? null,
    type:          b.type          ?? 'agua',
    name:          b.name.trim(),
    provider:      b.provider      ?? null,
    serial:        b.serial        ?? null,
    polizaRef:     b.polizaRef     ?? null,
    unit:          b.unit          ?? 'm3',
    billingMonths: b.billingMonths ?? 2,
    cycleAnchor:   b.cycleAnchor   ?? 'ene',
    tariffConfig:  b.tariffConfig ? JSON.stringify(b.tariffConfig) : JSON.stringify(DEFAULT_WATER_TARIFF_CONFIG),
    notes:         b.notes         ?? null,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
