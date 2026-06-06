import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/contacts/:id/ping — marca "acabo de hablar con esta persona"
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .update(contacts)
    .set({ lastContactAt: new Date() })
    .where(eq(contacts.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}
