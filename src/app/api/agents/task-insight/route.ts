import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { callClaude } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId || !Number.isInteger(Number(taskId))) {
    return Response.json({ error: 'taskId required' }, { status: 400 });
  }

  const task = await db.select().from(tasks).where(eq(tasks.id, Number(taskId))).limit(1);
  if (!task || !task[0]) {
    return Response.json({ error: 'task not found' }, { status: 404 });
  }

  const t = task[0];
  const prompt = `Necesito 2-3 perspectivas sobre esta tarea para ayudar a decidir cómo abordarla.

Tarea: "${t.title}"
${t.detail ? `Detalle: "${t.detail}"` : ''}
Prioridad: ${t.prioFinal ?? t.prio ?? 0}/9

Devuelve exactamente en JSON:
{
  "perspectives": [
    { "title": "Perspectiva 1", "description": "Descripción breve (1-2 líneas)" },
    { "title": "Perspectiva 2", "description": "Descripción breve (1-2 líneas)" }
  ]
}`;

  try {
    const result = await callClaude(prompt, '', 500);

    if (!result.ok || !result.text) {
      return Response.json({
        perspectives: [
          { title: 'Análisis no disponible', description: 'Intenta de nuevo más tarde.' }
        ]
      });
    }

    try {
      const parsed = JSON.parse(result.text);
      return Response.json(parsed);
    } catch {
      return Response.json({
        perspectives: [
          { title: 'Reflexión', description: result.text.substring(0, 150) }
        ]
      });
    }
  } catch (err) {
    return Response.json({
      perspectives: [
        { title: 'Error', description: 'No se pudo generar análisis.' }
      ]
    }, { status: 500 });
  }
}
