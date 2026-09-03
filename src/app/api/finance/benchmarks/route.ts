import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { benchmarks } from '@/lib/db/schema';
import { and, asc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');
  const rows = await db
    .select()
    .from(benchmarks)
    .where(category ? eq(benchmarks.category, category) : undefined)
    .orderBy(asc(benchmarks.date));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, date, value, source } = body;
  if (!category || !date || typeof value !== 'number') {
    return NextResponse.json({ error: 'category, date y value son obligatorios' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(benchmarks)
    .where(and(eq(benchmarks.category, category), eq(benchmarks.date, date)))
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(benchmarks)
      .set({ value, source: source ?? existing.source })
      .where(eq(benchmarks.id, existing.id))
      .returning();
    return NextResponse.json(row);
  }

  const [row] = await db.insert(benchmarks).values({ category, date, value, source }).returning();
  return NextResponse.json(row, { status: 201 });
}
