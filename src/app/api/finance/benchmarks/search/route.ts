import { NextRequest, NextResponse } from 'next/server';
import { runSearchAgent } from '@/lib/agents/SearchAgent';
import { capabilities } from '@/lib/capabilities';
import { callClaude } from '@/lib/claude';

const QUERIES: Record<string, string> = {
  vivienda: 'índice precio vivienda Baleares Mallorca variación mensual último dato Idealista INE',
  pension:  'MSCI World rentabilidad variación mensual último dato índice',
};

const LABELS: Record<string, string> = {
  vivienda: 'variación mensual del precio de la vivienda en Baleares/Mallorca (Idealista, Fotocasa o INE)',
  pension:  'rentabilidad mensual del índice MSCI World (o equivalente)',
};

export async function POST(req: NextRequest) {
  const { category } = await req.json();
  if (category !== 'vivienda' && category !== 'pension') {
    return NextResponse.json({ error: 'category debe ser vivienda o pension' }, { status: 400 });
  }

  const searchResult = await runSearchAgent(QUERIES[category]);

  if (searchResult.mode === 'no_search') {
    return NextResponse.json({ mode: 'no_search', notice: searchResult.notice });
  }

  if (!capabilities.ai.available) {
    return NextResponse.json({
      mode: 'no_ai',
      results: searchResult.results,
      notice: 'Sin IA disponible — revisa los resultados y añade el valor a mano.',
    });
  }

  const SYSTEM = `Eres Vera. Sebastián necesita el dato de ${LABELS[category]} para comparar contra su propio patrimonio.
Tienes resultados de búsqueda web. Extrae el número de variación % mensual más reciente y fiable que encuentres.
Si ningún resultado trae un número % mensual claro, responde con "value": null.
Devuelve SOLO JSON: { "value": number|null, "source": "url o nombre de la fuente", "summary": "1 frase explicando el dato y su fecha" }`;

  const result = await callClaude(JSON.stringify(searchResult.results), SYSTEM, 300);

  if (!result.ok) {
    return NextResponse.json({ mode: 'no_ai', results: searchResult.results, notice: 'Fallo al interpretar los resultados.' });
  }

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
    if (typeof parsed.value !== 'number') {
      return NextResponse.json({ mode: 'no_value', results: searchResult.results, notice: 'No se encontró un valor % claro. Añádelo a mano.' });
    }
    return NextResponse.json({ mode: 'draft', value: parsed.value, source: parsed.source ?? '', summary: parsed.summary ?? '' });
  } catch {
    return NextResponse.json({ mode: 'no_value', results: searchResult.results, notice: 'No se pudo interpretar la respuesta. Añade el valor a mano.' });
  }
}
