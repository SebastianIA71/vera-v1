import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, memory } from '@/lib/db/schema';
import { ne, and, eq } from 'drizzle-orm';
import { runSearchAgent } from '@/lib/agents/SearchAgent';
import { callClaude } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const key = `daily_insight_${today}`;

  // Devolver cached si ya existe hoy
  const [cached] = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
  if (cached?.value) {
    return NextResponse.json(JSON.parse(cached.value));
  }

  // Candidatas: activas, filtrar nulls y prio > 6 en JS (lte falla con NULL en libSQL)
  const allActive = await db.select({ id: tasks.id, title: tasks.title, prioFinal: tasks.prioFinal })
    .from(tasks)
    .where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived')))
    .limit(50);

  const candidates = allActive.filter(t => (t.prioFinal ?? 0) >= 1 && (t.prioFinal ?? 0) <= 6);

  if (candidates.length === 0) {
    return NextResponse.json({ taskTitle: null, taskPrio: 0, mode: 'no_tasks', ideas: [], date: today });
  }

  // Misma tarea todo el día (seed por fecha)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const task = candidates[dayOfYear % candidates.length];

  // Intentar Brave Search primero
  const searchResult = await runSearchAgent(`alternativa "${task.title}" DIY low cost`);

  let ideas: { title: string; url?: string; description: string }[] = [];
  let mode = 'search';

  if (searchResult.mode === 'results' && searchResult.results && searchResult.results.length > 0) {
    ideas = searchResult.results.slice(0, 3).map(r => ({
      title: r.title,
      url: r.url,
      description: r.summary ?? r.description,
    }));
  } else {
    // Sin Brave Search → Claude genera ideas directamente
    mode = 'ai';
    const prompt = `La tarea es: "${task.title}".
Dame 3 alternativas concretas para resolverlo de forma más barata, rápida o DIY.
Responde SOLO con JSON array: [{"title": "...", "description": "..."}]
Máximo 15 palabras por description. Sin markdown, solo JSON.`;

    const claudeResult = await callClaude(prompt, 'Eres Vera. Responde solo JSON.', 400);

    if (claudeResult.ok) {
      try {
        const parsed = JSON.parse(claudeResult.text.replace(/```json\n?|\n?```/g, '').trim());
        ideas = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
      } catch {
        ideas = [];
      }
    }
  }

  const insight = { taskTitle: task.title, taskPrio: task.prioFinal ?? 0, mode, ideas, date: today };

  await db.insert(memory).values({ key, value: JSON.stringify(insight), updatedAt: new Date() })
    .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(insight), updatedAt: new Date() } });

  return NextResponse.json(insight);
}
