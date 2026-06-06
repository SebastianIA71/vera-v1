import { callClaude } from '@/lib/claude';
import { capabilities } from '@/lib/capabilities';

export type PackingCategory = {
  name: string;
  items: string[];
};

export type PackingResult =
  | { categories: PackingCategory[] }
  | { notice: string };

export async function generatePackingList(trip: {
  title: string;
  destination?: string;
  startDate?: string | null;
  endDate?: string | null;
  who?: string | null;
  notes?: string | null;
}): Promise<PackingResult> {
  if (!capabilities.ai.available) {
    return { notice: 'Sin IA — no se puede generar la lista.' };
  }

  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end   = trip.endDate   ? new Date(trip.endDate)   : null;
  const nights = start && end
    ? Math.ceil((end.getTime() - start.getTime()) / 86400000)
    : null;

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : null;

  const SYSTEM = `Eres Vera, asistente personal de Sebastián. Genera una lista de equipaje personalizada y concisa.
Devuelve SOLO JSON válido con esta estructura:
{"categories":[{"name":"ROPA","items":["..."]},{"name":"HIGIENE","items":["..."]},{"name":"ELECTRÓNICA","items":["..."]},{"name":"DOCUMENTOS","items":["..."]},{"name":"OTROS","items":["..."]}]}
- Máximo 8 ítems por categoría. Sé específico para el viaje, no genérico.
- Si es familia: incluye lo de los niños. Si es pareja: más ligero. Si es amigos: ocio.
- Si es Escandinavia o norte: ropa de abrigo. Si es sur/playa: ropa ligera + protector solar.
- Sin explicaciones fuera del JSON.`;

  const userMsg = [
    `Viaje: ${trip.title}`,
    trip.destination ? `Destino: ${trip.destination}` : null,
    start ? `Fechas: ${fmtDate(start)}${end ? ` — ${fmtDate(end)}` : ''}` : null,
    nights ? `Duración: ${nights} noches` : null,
    trip.who ? `Compañía: ${trip.who}` : null,
    trip.notes ? `Notas: ${trip.notes}` : null,
  ].filter(Boolean).join('\n');

  const result = await callClaude(userMsg, SYSTEM, 800, 'claude-sonnet-4-6');
  if (!result.ok) return { notice: 'Error generando lista. Reintenta.' };

  try {
    const json = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
    return { categories: json.categories ?? [] };
  } catch {
    return { notice: 'Error parseando respuesta. Reintenta.' };
  }
}
