import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, desc, and, ne } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get('propertyId');
  const status = searchParams.get('status');

  const conditions = [ne(tasks.status, 'archived')];
  if (propertyId) conditions.push(eq(tasks.propertyId, propertyId));
  if (status) conditions.push(eq(tasks.status, status));

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.prioFinal), desc(tasks.createdAt))
    .limit(100);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, detail, propertyId, prio, type, tags, dueDate } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
  }

  const prioNum = Number(prio ?? 5);
  const [row] = await db
    .insert(tasks)
    .values({
      title: title.trim(),
      detail: detail ?? null,
      propertyId: propertyId ?? null,
      prio: prioNum,
      prioFinal: prioNum,
      type: type ?? 'task',
      tags: tags ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'wait',
      source: 'manual',
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
