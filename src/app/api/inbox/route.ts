import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inbox } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const items = await db
    .select()
    .from(inbox)
    .where(eq(inbox.processed, false))
    .orderBy(desc(inbox.createdAt))
    .limit(50);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [item] = await db
    .insert(inbox)
    .values({
      content: body.content,
      source: body.source ?? 'manual',
      type: body.type ?? 'raw',
      processed: false,
      suggestedPropertyId: body.suggestedPropertyId ?? null,
    })
    .returning();
  return NextResponse.json(item, { status: 201 });
}
