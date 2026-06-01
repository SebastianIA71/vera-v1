import { NextRequest, NextResponse, after } from 'next/server';
import { db } from '@/lib/db';
import { inbox } from '@/lib/db/schema';
import { callClaude } from '@/lib/claude';
import { rateLimit } from '@/lib/rateLimit';
import { extractAmiVeraQuery, runAmiVeraPipeline } from '@/lib/amivera';

const CLASSIFY_PROMPT = `Eres Vera. El usuario acaba de dictar una captura de voz.

Extrae la información en JSON con este formato exacto:
{
  "title": "texto limpio de la tarea (sin meta-instrucciones como 'añade' o 'prio 7')",
  "propertyId": "flat" | "sarapita" | "willys" | null,
  "prio": número del 1 al 9 si se menciona, si no null,
  "type": "task" | "note" | "idea",
  "chips": ["WILLY'S", "PRIO 7", "TAREA"] // chips para mostrar en confirmación
}

Reglas:
- title: la tarea real, sin meta-instrucciones. "Añade en Willy's revisar el generador prio 7" → "Revisar el generador"
- propertyId: detecta menciones de Willy's/willys → "willys", Flat/palma → "flat", Sarapita/campos → "sarapita"
- Solo JSON, sin texto adicional.`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { transcript } = await req.json();
  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'transcript required' }, { status: 400 });
  }

  // --- Amivera fast path ---
  const amiQuery = extractAmiVeraQuery(transcript.trim());
  if (amiQuery) {
    after(() => runAmiVeraPipeline(amiQuery).catch(() => {}));
    return NextResponse.json({
      amivera:    true,
      id:         0,
      title:      'Pipeline amivera activado',
      propertyId: null,
      prio:       null,
      chips:      ['AMIVERA ✦'],
      classified: true,
    });
  }

  let parsed: {
    title: string;
    propertyId: string | null;
    prio: number | null;
    type: string;
    chips: string[];
  } = {
    title: transcript.trim(),
    propertyId: null,
    prio: null,
    type: 'task',
    chips: ['TAREA'],
  };

  const result = await callClaude(transcript, CLASSIFY_PROMPT, 300);
  if (result.ok) {
    try {
      const json = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
      parsed = { ...parsed, ...json };
    } catch {
      // Claude returned non-JSON, use raw transcript
    }
  }

  const [item] = await db
    .insert(inbox)
    .values({
      content: parsed.title,
      source: 'voice',
      type: parsed.type ?? 'raw',
      processed: false,
      suggestedPropertyId: parsed.propertyId ?? undefined,
    })
    .returning();

  return NextResponse.json({
    id: item.id,
    title: parsed.title,
    propertyId: parsed.propertyId,
    prio: parsed.prio,
    chips: parsed.chips,
    classified: result.ok,
  });
}
