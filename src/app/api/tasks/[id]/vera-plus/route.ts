import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, properties as propertiesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { callClaude } from '@/lib/claude';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(id))).limit(1);
  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

  const propList = await db.select().from(propertiesTable);
  const propName = task.propertyId ? propList.find(p => p.id === task.propertyId)?.name : null;

  const prompt = `Analiza esta tarea de Sebastián y proporciona sugerencias concretas y accionables.

Tarea: "${task.title}"
${task.detail ? `Detalle: ${task.detail}` : ''}
${propName ? `Propiedad: ${propName}` : ''}
Prioridad: ${task.prioFinal ?? 0}/10
Estado: ${task.status}
${task.notes ? `Notas existentes:\n${task.notes}` : ''}

Proporciona 2-3 sugerencias o pasos concretos para avanzar en esta tarea. Sé directo y práctico. No uses markdown, escribe en texto plano.`;

  const result = await callClaude(prompt, '', 500, 'claude-sonnet-4-6');

  if (!result.ok) {
    return NextResponse.json({ error: 'No se pudo generar sugerencias' }, { status: 500 });
  }

  const vera_plus_text = result.text.trim();
  const timestamp = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const existingNotes = task.notes ?? '';
  const newNotes = existingNotes
    ? `${existingNotes}\n\nVERA+ ${timestamp}\n${vera_plus_text}`
    : `VERA+ ${timestamp}\n${vera_plus_text}`;

  const [updated] = await db
    .update(tasks)
    .set({ notes: newNotes.slice(0, 3000), updatedAt: new Date() })
    .where(eq(tasks.id, Number(id)))
    .returning();

  return NextResponse.json(updated);
}
