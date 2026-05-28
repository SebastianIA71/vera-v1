import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(tasks).where(eq(tasks.id, Number(id))).limit(1);
  if (!row) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ['title', 'detail', 'propertyId', 'prio', 'prioManual', 'prioFinal',
    'status', 'inNow', 'type', 'tags', 'context', 'constraints', 'dueDate',
    'lastActionAt', 'notes', 'isCapricho', 'isException'];

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const [row] = await db.update(tasks).set(updates).where(eq(tasks.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(tasks).set({ status: 'archived', updatedAt: new Date() }).where(eq(tasks.id, Number(id)));
  return NextResponse.json({ ok: true });
}
