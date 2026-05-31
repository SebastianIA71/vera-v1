import { capabilities } from '@/lib/capabilities';
import { callClaude } from '@/lib/claude';
import { db } from '@/lib/db';
import { agentLog } from '@/lib/db/schema';

export type SearchResult = {
  title: string;
  url: string;
  description: string;
  summary?: string;
};

export type SearchAgentResult =
  | { mode: 'results'; results: SearchResult[]; query: string }
  | { mode: 'no_search'; notice: string }
  | { mode: 'no_ai'; results: SearchResult[]; query: string };

export async function runSearchAgent(query: string): Promise<SearchAgentResult> {
  const startTime = Date.now();

  if (!capabilities.search) {
    return { mode: 'no_search', notice: 'Configura BRAVE_SEARCH_API_KEY para activar búsquedas.' };
  }

  // Brave Search
  let rawResults: SearchResult[] = [];
  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', '5');
    url.searchParams.set('search_lang', 'es');
    url.searchParams.set('country', 'ES');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY ?? '',
      },
    });
    if (!res.ok) throw new Error(`Brave ${res.status}`);
    const data = await res.json();
    rawResults = (data.web?.results ?? []).slice(0, 3).map((r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch {
    return { mode: 'no_search', notice: 'Error en la búsqueda. Inténtalo de nuevo.' };
  }

  if (!capabilities.ai.available) {
    await db.insert(agentLog).values({
      agentId: 'search', action: 'search',
      input: query.slice(0, 200),
      output: JSON.stringify(rawResults).slice(0, 300),
      status: 'ok', durationMs: Date.now() - startTime,
    }).catch(() => {});
    return { mode: 'no_ai', results: rawResults, query };
  }

  // Claude resume los resultados
  const SYSTEM = `Eres Vera. El usuario busca: "${query}".
Tienes 3 resultados de búsqueda. Añade a cada uno un campo "summary" con 1-2 frases que expliquen POR QUÉ es relevante para Sebastián (principio: gratis → propio → conocido → búsqueda → profesional).
Devuelve JSON array: [{ "title", "url", "description", "summary" }]. Solo JSON.`;

  const result = await callClaude(
    JSON.stringify(rawResults),
    SYSTEM,
    400,
  );

  if (!result.ok) {
    await db.insert(agentLog).values({
      agentId: 'search', action: 'search',
      input: query.slice(0, 200),
      output: JSON.stringify(rawResults).slice(0, 300),
      status: 'ok', durationMs: Date.now() - startTime,
    }).catch(() => {});
    return { mode: 'results', results: rawResults, query };
  }

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
    await db.insert(agentLog).values({
      agentId: 'search', action: 'search',
      input: query.slice(0, 200),
      output: JSON.stringify(parsed).slice(0, 300),
      status: 'ok', durationMs: Date.now() - startTime,
    }).catch(() => {});
    return { mode: 'results', results: parsed, query };
  } catch {
    await db.insert(agentLog).values({
      agentId: 'search', action: 'search',
      input: query.slice(0, 200),
      output: JSON.stringify(rawResults).slice(0, 300),
      status: 'ok', durationMs: Date.now() - startTime,
    }).catch(() => {});
    return { mode: 'results', results: rawResults, query };
  }
}
