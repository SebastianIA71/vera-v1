import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  await db.delete(memory).where(eq(memory.key, 'google_tokens')).catch(() => {});
  return NextResponse.json({ ok: true });
}
