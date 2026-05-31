import { NextResponse } from 'next/server';

export const maxDuration = 20;
import { db } from '@/lib/db';
import { tasks, memory } from '@/lib/db/schema';
import { ne, and, eq } from 'drizzle-orm';
import { runSearchAgent } from '@/lib/agents/SearchAgent';
import { callClaude } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
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

  if (candidates.length === 0) {
    return NextResponse.json({ taskTitle: null, taskPrio: 0, mode: 'no_tasks', ideas: [], date: today });
  }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const task = candidates[dayOfYear % candidates.length];

  const searchResult = await runSearchAgent(`alternativa "${task.title}" DIY low cost`);

  let ideas: { title: string; url?: string; description: string }[] = [];
  let mode = 'search';

  if (searchResult.mode === 'results' && searchResult.results && searchResult.results.length > 0) {
    ideas = searchResult.results.slice(0, 3).map(r => ({
      title: r.title, url: r.url, description: r.summary ?? r.description,
    }));
  } else {
    mode = 'ai';
    const claudeResult = await callClaude(
      `Tarea: "${task.title}". Dame 3 alternativas concretas DIY o low cost. Solo JSON array: [{"title":"...","description":"..."}]. Sin markdown.`,
      'Eres Vera. Responde solo JSON.',
      400,
    );
    if (claudeResult.ok) {
      try {
        ideas = JSON.parse(claudeResult.text.replace(/```json\n?|\n?```/g, '').trim());
        if (!Array.isArray(ideas)) ideas = [];
        ideas = ideas.slice(0, 3);
      } catch { ideas = []; }
    }
  }

  const insight = { taskTitle: task.title, taskPrio: task.prioFinal ?? 0, mode, ideas, date: today };

  await db.insert(memory).values({ key, value: JSON.stringify(insight), updatedAt: new Date() })
    .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(insight), updatedAt: new Date() } });

  return NextResponse.json(insight);
}
