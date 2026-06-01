import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = [
    'title','startDate','endDate','type','who','transport',
    'accommodation','status','notes','approx','meta',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = (key === 'startDate' || key === 'endDate')
        ? (body[key] ? new Date(body[key]) : null)
        : body[key];
    }
  }

  const [row] = await db.update(events).set(updates).where(eq(events.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(events).where(eq(events.id, Number(id)));
  return NextResponse.json({ ok: true });
}
