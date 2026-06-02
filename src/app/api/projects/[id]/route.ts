import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, description, color, icon, status, dueDate } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [row] = await db.update(projects).set({
    name:        name.trim(),
    description: description ?? null,
    color:       color       ?? null,
    icon:        icon        ?? null,
    status:      status      ?? 'active',
    dueDate:     dueDate ? new Date(dueDate) : null,
    updatedAt:   new Date(),
  }).where(eq(projects.id, Number(id))).returning();

  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(projects).set({ status: 'archived', updatedAt: new Date() }).where(eq(projects.id, Number(id)));
  return NextResponse.json({ ok: true });
}
