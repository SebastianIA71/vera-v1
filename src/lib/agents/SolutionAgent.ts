import { capabilities } from '@/lib/capabilities';
import { callClaude } from '@/lib/claude';

export type SolutionOption = {
  type: 'diy' | 'mixed' | 'pro';
  label: string;
  steps: string[];
  materials?: string;
  cost: string;
  time: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
};

export type SolutionResult =
  | { mode: 'solutions'; options: SolutionOption[]; problem: string }
  | { mode: 'no_ai'; notice: string };

export async function runSolutionAgent(problem: string): Promise<SolutionResult> {
  if (!capabilities.ai.available) {
    return { mode: 'no_ai', notice: 'Sin IA disponible. Inténtalo más tarde.' };
  }

  const SYSTEM = `Eres Vera, asistente de Sebastián. Propón 3 soluciones para este problema.
Principio de Sebastián: antes de gastar, agotar opciones propias. Orden: gratis → propio → conocido → búsqueda → profesional.

Devuelve JSON con este formato exacto:
[
  { "type": "diy", "label": "Opción DIY", "steps": ["paso 1", "paso 2"], "materials": "qué necesitas y dónde conseguirlo", "cost": "0€–5€", "time": "30 min", "difficulty": "fácil" },
  { "type": "mixed", "label": "Opción mixta", "steps": ["paso 1", "paso 2"], "materials": "...", "cost": "15€–30€", "time": "2h", "difficulty": "medio" },
  { "type": "pro", "label": "Profesional", "steps": ["paso 1"], "materials": null, "cost": "~80€", "time": "1h", "difficulty": "fácil" }
]

Solo JSON. Pasos concretos. Coste realista en euros. Siempre las 3 opciones.`;

  const result = await callClaude(problem, SYSTEM, 800);

  if (!result.ok) return { mode: 'no_ai', notice: 'No se pudo generar respuesta. Reintenta.' };

  try {
    const parsed: SolutionOption[] = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
    return { mode: 'solutions', options: parsed, problem };
  } catch {
    return { mode: 'no_ai', notice: 'Error procesando la respuesta. Reintenta.' };
  }
}
