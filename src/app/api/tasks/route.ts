import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, desc, and, ne, gte, lt, isNull, or, lte } from 'drizzle-orm';
import { validateRequest } from '@/lib/validation/validate';
import { createTaskSchema } from '@/lib/validation/schemas';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const propertyId  = searchParams.get('propertyId');
  const status      = searchParams.get('status');
  const doneToday   = searchParams.get('doneToday');
  const dormant     = searchParams.get('dormant'); // 'true' = only dormant, 'all' = include dormant

  const now = new Date();
  const conditions = [ne(tasks.status, 'archived')];
  if (propertyId) conditions.push(eq(tasks.propertyId, propertyId));
  if (status)     conditions.push(eq(tasks.status, status));
  if (doneToday) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    conditions.push(gte(tasks.updatedAt, start));
    conditions.push(lt(tasks.updatedAt, end));
  }

  if (dormant === 'true') {
    // Only dormant: snoozedUntil is set and in the future
    conditions.push(gte(tasks.snoozedUntil, now));
  } else if (dormant !== 'all') {
    // Default: exclude dormant (snoozedUntil is null OR in the past)
    conditions.push(or(isNull(tasks.snoozedUntil), lte(tasks.snoozedUntil, now))!);
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.prioFinal), desc(tasks.createdAt))
    .limit(200);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await validateRequest(req, createTaskSchema);
  if (body instanceof NextResponse) return body;

  const { title, detail, propertyId, projectId, prio, type, tags, dueDate, snoozedUntil } = body;

  const now = new Date();
  const [row] = await db
    .insert(tasks)
    .values({
      title: title.trim(),
      detail: detail ?? null,
      propertyId: propertyId ?? null,
      projectId: projectId ? Number(projectId) : null,
      prio,
      prioFinal: prio,
      type: type ?? 'task',
      tags: tags ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : null,
      status: 'wait',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
