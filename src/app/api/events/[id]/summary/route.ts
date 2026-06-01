import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { callClaude } from '@/lib/claude';
import type { EventMeta } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip] = await db.select().from(events).where(eq(events.id, Number(id))).limit(1);
  if (!trip) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const meta: EventMeta = trip.meta ? JSON.parse(trip.meta) : {};

  const fmtDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const transportLabels: Record<string, string> = {
    avion: 'avión', tren: 'tren', coche: 'coche', barco: 'barco', bus: 'autobús',
  };

  const context = [
    `Viaje: ${trip.title}`,
    trip.startDate && trip.endDate
      ? `Fechas: del ${fmtDate(trip.startDate)} al ${fmtDate(trip.endDate)}${trip.approx ? ' (aproximadas)' : ''}`
      : null,
    trip.who       ? `Compañía: ${trip.who}` : null,
    trip.transport ? `Transporte: ${transportLabels[trip.transport] ?? trip.transport}` : null,
    trip.accommodation ? `Alojamiento: ${trip.accommodation}` : null,
    meta.budget    ? `Presupuesto: ${meta.budget.total} ${meta.budget.currency}` : null,
    meta.documents?.length
      ? `Documentos: ${meta.documents.map(d => d.name + (d.notes ? ` (${d.notes})` : '')).join(', ')}`
      : null,
    meta.schedule?.length
      ? `Itinerario:\n${meta.schedule.map(s => `- ${s.day}: ${s.description}`).join('\n')}`
      : null,
    trip.notes     ? `Notas: ${trip.notes}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `Escribe un resumen claro y natural de este viaje para compartir con alguien.
Usa un tono informativo y amigable. Máximo 5 frases. En español.
No empieces con "Aquí tienes" ni similares. Ve directo al resumen.

Datos del viaje:
${context}`;

  const result = await callClaude(prompt, '', 300);
  const summary = result.ok ? result.text : context;

  return NextResponse.json({ summary, raw: context });
}
