import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

export async function GET() {
  const rows = await db.select().from(projects).orderBy(projects.createdAt);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, description, color, icon, dueDate } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [row] = await db.insert(projects).values({
    name: name.trim(),
    description: description ?? null,
    color: color ?? null,
    icon: icon ?? null,
    status: 'active',
    dueDate: dueDate ? new Date(dueDate) : null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
