import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, frequencyDays, notes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const [row] = await db.insert(contacts).values({
    name: name.trim(),
    frequencyDays: frequencyDays ?? 30,
    notes: notes ?? null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
