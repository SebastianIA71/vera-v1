import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inbox, tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Si viene con datos de tarea → crear tarea + marcar procesado
  if (body.createTask) {
    const [task] = await db.insert(tasks).values({
      title: body.title,
      propertyId: body.propertyId ?? null,
      prio: body.prio ?? 5,
      prioFinal: body.prio ?? 5,
      status: 'wait',
      source: 'inbox',
      type: body.type ?? 'task',
    }).returning();

    await db.update(inbox)
      .set({ processed: true, suggestedTaskId: task.id })
      .where(eq(inbox.id, Number(id)));

    return NextResponse.json({ ok: true, task });
  }

  // Si viene con discarded → solo marcar procesado
  await db.update(inbox)
    .set({ processed: body.processed ?? true })
    .where(eq(inbox.id, Number(id)));

  return NextResponse.json({ ok: true });
}
