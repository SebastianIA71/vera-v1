import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(expenses).where(eq(expenses.id, Number(id)));
  return NextResponse.json({ ok: true });
}
