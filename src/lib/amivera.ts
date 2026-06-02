import { callClaude } from '@/lib/claude';
import { db } from '@/lib/db';
import { tasks, notifications } from '@/lib/db/schema';
import { sendPush } from '@/lib/push';

/** Devuelve la query posterior a "vera go" (o "primavera"), o null si no aparece el trigger */
export function extractAmiVeraQuery(text: string): string | null {
  const m = text.match(/(?:vera\s+go|primavera)\s+([\s\S]+)/i);
  return m ? m[1].trim() : null;
}

const AMIVERA_SYSTEM = `Eres Vera, asistente personal de Sebastián.
Se ha activado el pipeline autónomo. Investiga y responde con total autonomía.
No hay restricciones de formato, longitud ni estructura — decide qué profundidad darle, cómo organizar la información y qué incluir.

Principio de Sebastián: antes de gastar, agotar opciones propias.
Orden: gratis → propio → conocido → búsqueda → profesional.

Al terminar tu respuesta principal, añade exactamente estas dos líneas (obligatorio):
TASK_TITLE: [título de 3-8 palabras para la tarea que se creará en Vera]
NOTIF_SUMMARY: [1-3 frases de resumen para la notificación push]`;

/**
 * Pipeline completo amivera:
 * 1. Investigación con Claude (autonomía total, Sonnet)
 * 2. El agente decide formato y profundidad
 * 3. Notificación en DB + push
 * 4. Tarea en lista general (sin propiedad)
 *
 * Si Claude falla, crea la tarea con información parcial y notifica.
 */
export async function runAmiVeraPipeline(rawQuery: string): Promise<void> {
  const result = await callClaude(rawQuery, AMIVERA_SYSTEM, 2000, 'claude-sonnet-4-6');
  const partial = !result.ok;
  const rawText = result.ok
    ? result.text
    : `No se pudo completar la investigación para: ${rawQuery}`;

  // Metadata que el agente debe incluir al final
  const taskTitleMatch  = rawText.match(/^TASK_TITLE:\s*(.+)$/im);
  const notifSummaryMatch = rawText.match(/^NOTIF_SUMMARY:\s*(.+)$/im);

  const taskTitle = (taskTitleMatch?.[1] ?? rawQuery.slice(0, 60)).trim();
  const notifSummary = (notifSummaryMatch?.[1]
    ?? (partial ? `Información parcial: ${rawQuery.slice(0, 40)}` : rawText.slice(0, 150))
  ).trim();

  const bodyClean = rawText
    .replace(/^TASK_TITLE:.*$/im, '')
    .replace(/^NOTIF_SUMMARY:.*$/im, '')
    .trim();

  const notes = partial ? `[Información parcial]\n\n${bodyClean}` : bodyClean;

  // Paso 3 — Notificación
  const notifTitle = `Solución lista: ${taskTitle}`;
  await db.insert(notifications).values({
    type:        'amivera',
    title:       notifTitle.slice(0, 100),
    body:        notifSummary.slice(0, 300),
    channel:     'push',
    sentAt:      new Date(),
    agentId:     'solution',
    cooldownKey: `amivera_${Date.now()}`,
  }).catch(() => {});

  await sendPush(notifTitle.slice(0, 50), notifSummary.slice(0, 100)).catch(() => {});

  // Paso 4 — Tarea general (sin propiedad, source 'amivera')
  await db.insert(tasks).values({
    title:      taskTitle.slice(0, 80),
    detail:     rawQuery.slice(0, 200),
    notes:      notes.slice(0, 3000),
    prio:       6,
    prioFinal:  6,
    status:     'wait',
    source:     'amivera',
    propertyId: null,
    inNow:      false,
  }).catch(() => {});
}
