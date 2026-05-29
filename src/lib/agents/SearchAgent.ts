import { capabilities } from '@/lib/capabilities';
import { callClaude } from '@/lib/claude';
import axios from 'axios';

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
  if (!capabilities.search) {
    return { mode: 'no_search', notice: 'Configura BRAVE_SEARCH_API_KEY para activar búsquedas.' };
  }

  // Brave Search
  let rawResults: SearchResult[] = [];
  try {
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: { q: query, count: 5, search_lang: 'es', country: 'ES' },
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY },
    });
    rawResults = (res.data.web?.results ?? []).slice(0, 3).map((r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch {
    return { mode: 'no_search', notice: 'Error en la búsqueda. Inténtalo de nuevo.' };
  }

  if (!capabilities.ai.available) {
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

  if (!result.ok) return { mode: 'results', results: rawResults, query };

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
    return { mode: 'results', results: parsed, query };
  } catch {
    return { mode: 'results', results: rawResults, query };
  }
}
