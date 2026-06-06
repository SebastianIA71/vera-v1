import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const KEY = 'focus_until';

export async function GET() {
  const row = await db.select().from(memory).where(eq(memory.key, KEY)).limit(1);
  const val = row[0]?.value ?? null;
  const until = val ? new Date(val) : null;
  const active = !!until && until > new Date();
  return NextResponse.json({ active, until: active ? until!.toISOString() : null });
}

export async function POST(req: NextRequest) {
  const { hours } = await req.json();
  const until = new Date(Date.now() + hours * 3600000);
  await db.insert(memory).values({ key: KEY, value: until.toISOString() })
    .onConflictDoUpdate({ target: memory.key, set: { value: until.toISOString(), updatedAt: new Date() } });
  return NextResponse.json({ active: true, until: until.toISOString() });
}

export async function DELETE() {
  await db.insert(memory).values({ key: KEY, value: null })
    .onConflictDoUpdate({ target: memory.key, set: { value: null, updatedAt: new Date() } });
  return NextResponse.json({ active: false, until: null });
}
