import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { utilityMeters, meterReadings, utilityBills } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { DEFAULT_WATER_TARIFF_CONFIG, AGUA_CAMPOS_2025 } from '@/lib/utilities/tariff';
import { computeBill } from '@/lib/utilities/water-campos';
import { HISTORIC_READINGS, BILL_ORACLE, METER_SEED } from '@/lib/utilities/fixtures';

export const dynamic = 'force-dynamic';

async function seed() {
  // 1. Medidor (idempotente por propiedad + nombre)
  const found = await db.select().from(utilityMeters)
    .where(and(eq(utilityMeters.propertyId, METER_SEED.propertyId), eq(utilityMeters.name, METER_SEED.name)))
    .limit(1);
  let meter = found[0];
  if (!meter) {
    const inserted = await db.insert(utilityMeters).values({
      ...METER_SEED,
      tariffConfig: JSON.stringify(DEFAULT_WATER_TARIFF_CONFIG),
    }).returning();
    meter = inserted[0];
  }
  if (!meter) throw new Error('No se pudo crear el medidor');

  // 2. Lecturas históricas (idempotente por fecha)
  const existing = await db.select().from(meterReadings).where(eq(meterReadings.meterId, meter.id));
  const haveDates = new Set(existing.map(r => r.date));
  const newReadings = HISTORIC_READINGS.filter(r => !haveDates.has(r.date))
    .map(r => ({ meterId: meter.id, date: r.date, value: r.value, origin: 'manual' as const }));
  if (newReadings.length) await db.insert(meterReadings).values(newReadings);

  // 3. Facturas de verificación (consumo → total). Periodo sin confirmar.
  const haveBills = await db.select().from(utilityBills).where(eq(utilityBills.meterId, meter.id));
  let insertedBills = 0;
  if (haveBills.length === 0) {
    const rows = BILL_ORACLE.map(({ consumo, total }) => {
      const bd = computeBill(consumo, AGUA_CAMPOS_2025);
      return {
        meterId: meter.id,
        source: 'municipal' as const,
        consumption: consumo,
        amountTotal: total,
        breakdown: JSON.stringify(bd),
        estimateAtClose: bd.total,
        notes: 'Seed de verificación — periodo y lecturas por confirmar.',
      };
    });
    await db.insert(utilityBills).values(rows);
    insertedBills = rows.length;
  }

  return { meterId: meter.id, readings: newReadings.length, bills: insertedBills };
}

export async function POST() {
  return NextResponse.json({ ok: true, ...(await seed()) });
}
export async function GET() {
  return NextResponse.json({ ok: true, ...(await seed()) });
}
