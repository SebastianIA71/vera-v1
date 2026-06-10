import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kmLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const rows = await db
    .select()
    .from(kmLogs)
    .where(eq(kmLogs.vehicleId, Number(params.id)))
    .orderBy(desc(kmLogs.date));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [row] = await db.insert(kmLogs).values({
    vehicleId: Number(params.id),
    date:      body.date,
    km:        Number(body.km),
    notes:     body.notes ?? null,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const kmId = searchParams.get('kmId');
  if (!kmId) return NextResponse.json({ error: 'Missing kmId' }, { status: 400 });
  await db.delete(kmLogs).where(eq(kmLogs.id, Number(kmId)));
  return NextResponse.json({ ok: true });
}
