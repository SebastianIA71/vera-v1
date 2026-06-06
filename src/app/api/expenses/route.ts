import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const rows = propertyId
    ? await db.select().from(expenses).where(eq(expenses.propertyId, propertyId)).orderBy(desc(expenses.date)).limit(100)
    : await db.select().from(expenses).orderBy(desc(expenses.date)).limit(200);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [row] = await db.insert(expenses).values({
    propertyId:  body.propertyId ?? null,
    projectId:   body.projectId ?? null,
    amount:      Number(body.amount),
    description: body.description,
    category:    body.category ?? 'otro',
    date:        body.date ?? new Date().toISOString().slice(0, 10),
    createdAt:   new Date(),
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
