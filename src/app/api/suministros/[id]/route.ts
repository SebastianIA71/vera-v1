import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { utilityMeters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();

  const patch: Partial<typeof utilityMeters.$inferInsert> = {};
  if (b.propertyId !== undefined)    patch.propertyId = b.propertyId;
  if (b.type !== undefined)          patch.type = b.type;
  if (b.name !== undefined)          patch.name = b.name;
  if (b.provider !== undefined)      patch.provider = b.provider;
  if (b.serial !== undefined)        patch.serial = b.serial;
  if (b.polizaRef !== undefined)     patch.polizaRef = b.polizaRef;
  if (b.unit !== undefined)          patch.unit = b.unit;
  if (b.billingMonths !== undefined) patch.billingMonths = Number(b.billingMonths);
  if (b.cycleAnchor !== undefined)   patch.cycleAnchor = b.cycleAnchor;
  if (b.notes !== undefined)         patch.notes = b.notes;
  if (b.tariffConfig !== undefined) {
    patch.tariffConfig = typeof b.tariffConfig === 'string' ? b.tariffConfig : JSON.stringify(b.tariffConfig);
  }

  const [row] = await db.update(utilityMeters).set(patch).where(eq(utilityMeters.id, Number(id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(utilityMeters).set({ active: false }).where(eq(utilityMeters.id, Number(id)));
  return NextResponse.json({ ok: true });
}
