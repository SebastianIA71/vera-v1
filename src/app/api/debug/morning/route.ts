import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { ne, desc } from 'drizzle-orm';

// Endpoint temporal de diagnóstico — ver /api/debug/morning
export async function GET() {
  const allTasks = await db
    .select()
    .from(tasks)
    .where(ne(tasks.status, 'archived'))
    .orderBy(desc(tasks.prio))
    .limit(50);

  const sample = allTasks.slice(0, 10).map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    prio: t.prio,
    prioFinal: t.prioFinal,
    prioFinalType: typeof t.prioFinal,
    prioType: typeof t.prio,
    effectivePrio: Math.max(t.prioFinal ?? 0, t.prio ?? 0),
    effectivePrioOr: (t.prioFinal || t.prio || 0),
    passesFilter: Math.max(t.prioFinal ?? 0, t.prio ?? 0) >= 6,
  }));

  const urgent = allTasks.filter(t =>
    t.status !== 'done' && t.status !== 'archived' &&
    Math.max(t.prioFinal ?? 0, t.prio ?? 0) >= 6
  );

  return NextResponse.json({
    totalRows: allTasks.length,
    urgentCount: urgent.length,
    sample,
  });
}
