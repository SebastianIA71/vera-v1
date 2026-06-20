import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';

const KEY = 'widget_vehicle_id';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.insert(memory)
    .values({ key: KEY, value: id })
    .onConflictDoUpdate({ target: memory.key, set: { value: id, updatedAt: new Date() } });
  return NextResponse.json({ ok: true, vehicleId: Number(id) });
}

export async function DELETE() {
  await db.insert(memory)
    .values({ key: KEY, value: null })
    .onConflictDoUpdate({ target: memory.key, set: { value: null, updatedAt: new Date() } });
  return NextResponse.json({ ok: true, vehicleId: null });
}
