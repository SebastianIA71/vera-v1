import { callClaude } from '@/lib/claude';
import { capabilities } from '@/lib/capabilities';

export type PostFormat = 'substack' | 'linkedin' | 'thread';

export type PostDraft = {
  title: string;
  hook: string;
  sections: { heading: string; content: string }[];
  cta: string;
  format: PostFormat;
};

export async function draftPost(input: {
  idea: string;
  format?: PostFormat;
  context?: string;
}): Promise<{ draft: PostDraft } | { notice: string }> {
  if (!capabilities.ai.available) {
    return { notice: 'Sin IA — redacta manualmente.' };
  }

  const format = input.format ?? 'substack';

  const formatGuide =
    format === 'substack'
      ? 'Un artículo Substack: título atractivo, hook de 2-3 frases que engancha, 3-4 secciones con heading + contenido de 80-120 palabras cada una, CTA final. Tono: cercano, inteligente, sin jerga corporativa.'
      : format === 'linkedin'
      ? 'Un post LinkedIn: sin título (empieza directo con el hook), 5-7 párrafos cortos (1-3 líneas), bullet points si aplica, CTA final con pregunta. Tono: profesional pero humano.'
      : 'Un hilo de Twitter/X: 6-8 tweets. El primero es el hook (máx 280 chars). Los siguientes desarrollan. El último es CTA. Formato: cada sección = 1 tweet.';

  const SYSTEM = `Eres Vera, asistente de Sebastián. Él tiene un Substack de IA llamado IAfont y un laboratorio IAxLabs.
Genera un borrador de contenido. ${formatGuide}
Devuelve JSON válido con esta estructura exacta:
{
  "title": "...",
  "hook": "...",
  "sections": [{"heading": "...", "content": "..."}],
  "cta": "..."
}
Sin texto fuera del JSON.`;

  const userMsg = `Idea: ${input.idea}${input.context ? `\nContexto adicional: ${input.context}` : ''}`;
  const result = await callClaude(userMsg, SYSTEM, 1200, 'claude-sonnet-4-6');

  if (!result.ok) return { notice: 'Error generando borrador. Reintenta.' };

  try {
    const json = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
    return {
      draft: {
        title: json.title ?? '',
        hook: json.hook ?? '',
        sections: Array.isArray(json.sections) ? json.sections : [],
        cta: json.cta ?? '',
        format,
      },
    };
  } catch {
    return { notice: 'Error parseando respuesta. Reintenta.' };
  }
}
