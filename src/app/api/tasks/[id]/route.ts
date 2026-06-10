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

  const allowed = ['title', 'detail', 'propertyId', 'projectId', 'prio', 'prioManual', 'prioFinal',
    'status', 'inNow', 'type', 'tags', 'context', 'constraints', 'dueDate',
    'lastActionAt', 'notes', 'isCapricho', 'isException', 'recurrence', 'recurrenceInterval',
    'snoozedUntil'];

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.snoozedUntil !== undefined) updates.snoozedUntil = body.snoozedUntil ? new Date(body.snoozedUntil) : null;

  const [row] = await db.update(tasks).set(updates).where(eq(tasks.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  // Auto-crear siguiente ocurrencia si hay recurrencia y se marca done
  if (body.status === 'done' && row.recurrence) {
    const days =
      row.recurrence === 'daily'   ? 1  :
      row.recurrence === 'weekly'  ? 7  :
      row.recurrence === 'monthly' ? 30 :
      (row.recurrenceInterval ?? 7);
    const nextDue = new Date(Date.now() + days * 86400000);
    // Si la tarea original tenía snoozedUntil, la siguiente aparece 7 días antes del vencimiento
    const nextSnooze = row.snoozedUntil
      ? new Date(nextDue.getTime() - 7 * 86400000)
      : null;
    await db.insert(tasks).values({
      title: row.title, detail: row.detail,
      propertyId: row.propertyId, projectId: row.projectId,
      prio: row.prio, prioManual: row.prioManual, prioFinal: row.prioFinal,
      type: row.type, tags: row.tags, context: row.context,
      recurrence: row.recurrence, recurrenceInterval: row.recurrenceInterval,
      dueDate: nextDue, snoozedUntil: nextSnooze, status: 'wait', source: 'recurrence', inNow: false,
    }).catch(() => {});
  }

  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(tasks).set({ status: 'archived', updatedAt: new Date() }).where(eq(tasks.id, Number(id)));
  return NextResponse.json({ ok: true });
}
