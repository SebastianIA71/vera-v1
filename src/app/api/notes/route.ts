import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const KEY = 'notas_text';

export async function GET() {
  const row = await db.select().from(memory).where(eq(memory.key, KEY)).limit(1);
  return NextResponse.json({ text: row[0]?.value ?? '' });
}

export async function PUT(req: NextRequest) {
  const { text } = await req.json();
  await db.insert(memory).values({ key: KEY, value: text ?? '' })
    .onConflictDoUpdate({ target: memory.key, set: { value: text ?? '', updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
