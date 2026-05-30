import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, memory } from '@/lib/db/schema';
import { ne, and, eq } from 'drizzle-orm';
import { runSearchAgent } from '@/lib/agents/SearchAgent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const key = `daily_insight_${today}`;

  // Devolver cached si ya existe hoy
  const [cached] = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
  if (cached?.value) {
    return NextResponse.json(JSON.parse(cached.value));
  }

  // Candidatas: filtrar nulls en JS (lte falla con NULL en libSQL)
  const allActive = await db.select({ id: tasks.id, title: tasks.title, prioFinal: tasks.prioFinal })
    .from(tasks)
    .where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived')))
    .limit(50);

  const candidates = allActive.filter(t => (t.prioFinal ?? 0) >= 1 && (t.prioFinal ?? 0) <= 6);

  if (candidates.length === 0) return NextResponse.json({ insight: null });

  // Misma tarea todo el día (seed por fecha)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const task = candidates[dayOfYear % candidates.length];

  const query = `alternativa solución "${task.title}" DIY o low cost`;
  const result = await runSearchAgent(query);

  const insight = {
    taskTitle: task.title,
    taskPrio: task.prioFinal ?? 0,
    query,
    result,
    date: today,
  };

  await db.insert(memory).values({ key, value: JSON.stringify(insight), updatedAt: new Date() })
    .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(insight), updatedAt: new Date() } });

  return NextResponse.json(insight);
}
