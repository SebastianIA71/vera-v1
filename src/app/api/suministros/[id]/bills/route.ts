import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { utilityMeters, utilityBills, meterReadings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { computeBill } from '@/lib/utilities/water-campos';
import { parseTariffConfig, resolveTariff } from '@/lib/utilities/tariff';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meterId = Number(id);
  const b = await req.json();

  const [meter] = await db.select().from(utilityMeters).where(eq(utilityMeters.id, meterId)).limit(1);
  if (!meter) return NextResponse.json({ error: 'medidor no encontrado' }, { status: 404 });

  const open = b.readingOpen != null ? Number(b.readingOpen) : null;
  const close = b.readingClose != null ? Number(b.readingClose) : null;
  const consumption = b.consumption != null
    ? Math.floor(Number(b.consumption))
    : (open != null && close != null ? Math.floor(close - open) : null);

  // Número que el motor calcula para ese consumo → delta de verificación
  let estimateAtClose: number | null = null;
  if (consumption != null && Number.isFinite(consumption)) {
    const tariff = resolveTariff(parseTariffConfig(meter.tariffConfig), b.periodEnd ?? b.issueDate ?? '2999-01-01');
    estimateAtClose = computeBill(consumption, tariff).total;
  }

  const [bill] = await db.insert(utilityBills).values({
    meterId,
    source:          b.source === 'atib' ? 'atib' : 'municipal',
    issueDate:       b.issueDate   ?? null,
    periodStart:     b.periodStart ?? null,
    periodEnd:       b.periodEnd   ?? null,
    readingOpen:     open,
    readingClose:    close,
    consumption:     consumption ?? null,
    amountTotal:     b.amountTotal != null ? Number(b.amountTotal) : null,
    breakdown:       b.breakdown ? JSON.stringify(b.breakdown) : null,
    estimateAtClose,
    notes:           b.notes ?? null,
  }).returning();

  // La lectura de cierre real pasa a ser la referencia del siguiente ciclo.
  if (close != null && b.periodEnd) {
    await db.insert(meterReadings).values({
      meterId,
      date:         String(b.periodEnd),
      value:        close,
      origin:       'factura',
      isCycleClose: true,
      billId:       bill.id,
      notes:        `Cierre factura ${b.source === 'atib' ? 'ATIB' : 'municipal'}`,
    });
  }

  return NextResponse.json(bill, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const billId = new URL(req.url).searchParams.get('billId');
  if (!billId) return NextResponse.json({ error: 'billId requerido' }, { status: 400 });
  await db.delete(meterReadings).where(eq(meterReadings.billId, Number(billId)));
  await db.delete(utilityBills).where(eq(utilityBills.id, Number(billId)));
  return NextResponse.json({ ok: true });
}
