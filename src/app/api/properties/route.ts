import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { properties } from '@/lib/db/schema';

export async function GET() {
  const rows = await db.select().from(properties);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, location, color, icon } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const id = name.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const [row] = await db.insert(properties).values({
    id, name: name.trim(),
    location: location ?? null,
    color: color ?? null,
    icon: icon ?? null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
