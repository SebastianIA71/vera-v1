import { callClaude } from '@/lib/claude';
import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox, projects, contacts, notifications } from '@/lib/db/schema';
import { ne, desc, eq, and, gte } from 'drizzle-orm';
import { sendPush } from '@/lib/push';
import { runSearchAgent } from '@/lib/agents/SearchAgent';

/**
 * Devuelve la query posterior al trigger "JARVIS", o null si no aparece.
 * Acepta variantes: "jarvis," "¡jarvis" "jarvis:" y combinaciones similares.
 */
export function extractAmiVeraQuery(text: string): string | null {
  // Acepta "jarvis", "harvis", "jarbi" con cualquier separador o sin él
  const m = text.match(/\b(?:jarvis|harvis|jarbi)[,!:.\s¿¡]*([\s\S]+)/i);
  if (m && m[1].trim()) return m[1].trim();
  // Fallback: si el texto empieza por jarvis sin nada después, ignorar
  return null;
}

/* ─── Construcción de contexto vital (2a) ───────────────── */

interface JarvisContext {
  today:           string;
  urgentTasks:     string;
  nextTrip:        string;
  lastWeight:      string;
  inboxPending:    number;
  activeProjects:  string;
  overdueContacts: string;
}

async function buildContext(): Promise<JarvisContext> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const DAYS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  const today = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} · ${hh}:${mm}h`;

  // Consultas en paralelo
  const [urgentRows, allEvents, weightRows, inboxRows, projectRows, contactRows] = await Promise.all([
    db.select({ title: tasks.title, prioFinal: tasks.prioFinal, propertyId: tasks.propertyId })
      .from(tasks)
      .where(and(ne(tasks.status, 'archived'), ne(tasks.status, 'done'), gte(tasks.prioFinal, 7)))
      .orderBy(desc(tasks.prioFinal))
      .limit(5),
    db.select({ title: events.title, type: events.type, startDate: events.startDate })
      .from(events)
      .where(gte(events.startDate, now))
      .orderBy(events.startDate)
      .limit(3),
    db.select({ value: weightLog.value, date: weightLog.date })
      .from(weightLog)
      .orderBy(desc(weightLog.date))
      .limit(2),
    db.select({ id: inbox.id })
      .from(inbox)
      .where(and(eq(inbox.processed, false)))
      .limit(100),
    db.select({ name: projects.name })
      .from(projects)
      .where(eq(projects.status, 'active'))
      .limit(5),
    db.select({ name: contacts.name, lastContactAt: contacts.lastContactAt, frequencyDays: contacts.frequencyDays })
      .from(contacts)
      .limit(20),
  ]);

  // Tareas urgentes
  const urgentTasks = urgentRows.length === 0
    ? 'ninguna urgente'
    : urgentRows.map(t => `"${t.title}" [p${t.prioFinal}${t.propertyId ? ` · ${t.propertyId}` : ''}]`).join(', ');

  // Próximo viaje/evento
  const nextTripEvent = allEvents.find(e => e.type === 'viaje');
  const nextSocial    = allEvents.find(e => e.type !== 'viaje');
  const tripLines: string[] = [];
  if (nextTripEvent?.startDate) {
    const d = Math.ceil((new Date(nextTripEvent.startDate).getTime() - now.getTime()) / 86400000);
    tripLines.push(`viaje: "${nextTripEvent.title}" en ${d} días`);
  }
  if (nextSocial?.startDate) {
    const d = Math.ceil((new Date(nextSocial.startDate).getTime() - now.getTime()) / 86400000);
    tripLines.push(`evento: "${nextSocial.title}" en ${d} días`);
  }
  const nextTrip = tripLines.join(' · ') || 'ninguno próximo';

  // Peso
  const w0 = weightRows[0]; const w1 = weightRows[1];
  const trend = w0 && w1
    ? w0.value > w1.value ? '↑ subiendo' : w0.value < w1.value ? '↓ bajando' : '→ estable'
    : '';
  const lastWeight = w0 ? `${w0.value} kg ${trend}`.trim() : 'sin datos recientes';

  // Proyectos
  const activeProjects = projectRows.length === 0
    ? 'ninguno'
    : projectRows.map(p => p.name).join(', ');

  // Contactos vencidos
  const overdue = contactRows.filter(c => {
    const freq = c.frequencyDays ?? 30;
    const days = c.lastContactAt
      ? Math.floor((now.getTime() - new Date(c.lastContactAt).getTime()) / 86400000)
      : freq + 1;
    return days >= freq;
  });
  const overdueContacts = overdue.length === 0
    ? 'ninguno pendiente'
    : overdue.slice(0, 3).map(c => c.name).join(', ');

  return {
    today, urgentTasks, nextTrip, lastWeight,
    inboxPending: inboxRows.length,
    activeProjects, overdueContacts,
  };
}

/* ─── Detección de intent de búsqueda (2b) ──────────────── */

const SEARCH_KEYWORDS = [
  'precio', 'coste', 'cuánto cuesta', 'cuanto cuesta', 'presupuesto', 'tarifa',
  'vuelo', 'tren', 'ave', 'hotel', 'alojamiento', 'reserva', 'billete',
  'mejor', 'comparar', 'alternativa', 'opciones', 'recomendación',
  'dónde comprar', 'donde comprar', 'amazon', 'leroy', 'bauhaus',
  'disponible', 'stock', 'tienda', 'noticias', 'actualidad', 'hoy',
  'cómo llegar', 'como llegar', 'distancia', 'ruta',
];

function needsWebSearch(query: string): boolean {
  const q = query.toLowerCase();
  return SEARCH_KEYWORDS.some(kw => q.includes(kw));
}

/* ─── System prompt dinámico ────────────────────────────── */

function buildSystemPrompt(ctx: JarvisContext, searchSnippet: string): string {
  return `Eres Vera, asistente personal de Sebastián (activado via trigger "JARVIS").
Pipeline autónomo activo. Investiga y responde con total autonomía.
Decide formato, profundidad y estructura — no hay restricciones.

## Contexto vital de Sebastián ahora mismo
Fecha: ${ctx.today}
Peso: ${ctx.lastWeight}
Próximos eventos: ${ctx.nextTrip}
Tareas urgentes (prio ≥7): ${ctx.urgentTasks}
Inbox sin procesar: ${ctx.inboxPending} capturas
Proyectos activos: ${ctx.activeProjects}
Contactos sociales pendientes: ${ctx.overdueContacts}
${searchSnippet ? `\n## Resultados de búsqueda relevantes\n${searchSnippet}` : ''}
## Principio de Sebastián
Antes de gastar, agotar opciones propias: gratis → propio → conocido → búsqueda → profesional.

## Respuesta
Usa el contexto para dar respuestas específicas a SU vida, no genéricas.
Si puedes cruzar la pregunta con su contexto actual (tareas, viajes, propiedades), hazlo.

Al terminar añade exactamente estas dos líneas (obligatorio):
TASK_TITLE: [título de 3-8 palabras para la tarea creada en Vera]
NOTIF_SUMMARY: [1-3 frases de resumen para la push notification]`;
}

/* ─── Pipeline principal ────────────────────────────────── */

export async function runAmiVeraPipeline(rawQuery: string): Promise<void> {

  // 2a: Construir contexto + 2b: búsqueda en paralelo si aplica
  const searchNeeded = needsWebSearch(rawQuery);
  const [ctx, searchResult] = await Promise.all([
    buildContext(),
    searchNeeded ? runSearchAgent(rawQuery).catch(() => null) : Promise.resolve(null),
  ]);

  // Formatear snippet de búsqueda para el prompt
  let searchSnippet = '';
  if (searchResult && searchResult.mode === 'results' && searchResult.results.length > 0) {
    searchSnippet = searchResult.results.slice(0, 3).map((r, i) =>
      `${i + 1}. ${r.title}\n   ${r.summary ?? r.description ?? ''}\n   ${r.url}`
    ).join('\n');
  }

  const systemPrompt = buildSystemPrompt(ctx, searchSnippet);
  const result = await callClaude(rawQuery, systemPrompt, 2000, 'claude-sonnet-4-6');

  const partial  = !result.ok;
  const rawText  = result.ok ? result.text : `No se pudo completar la investigación para: ${rawQuery}`;

  const taskTitleMatch    = rawText.match(/^TASK_TITLE:\s*(.+)$/im);
  const notifSummaryMatch = rawText.match(/^NOTIF_SUMMARY:\s*(.+)$/im);

  const taskTitle    = (taskTitleMatch?.[1]    ?? rawQuery.slice(0, 60)).trim();
  const notifSummary = (notifSummaryMatch?.[1] ?? (partial ? `Info parcial: ${rawQuery.slice(0, 40)}` : rawText.slice(0, 150))).trim();

  const bodyClean = rawText
    .replace(/^TASK_TITLE:.*$/im, '')
    .replace(/^NOTIF_SUMMARY:.*$/im, '')
    .trim();

  // Metadatos de contexto al inicio de las notas
  const contextHeader = [
    `**Consulta:** ${rawQuery}`,
    `**Fecha:** ${ctx.today}`,
    searchSnippet ? `**Búsqueda web:** ${searchNeeded ? 'sí' : 'no'}` : null,
  ].filter(Boolean).join('\n');

  const notes = `${contextHeader}\n\n---\n\n${partial ? '[Información parcial]\n\n' : ''}${bodyClean}`;

  // Notificación push
  const notifTitle = `Jarvis: ${taskTitle}`;
  await db.insert(notifications).values({
    type: 'jarvis', title: notifTitle.slice(0, 100), body: notifSummary.slice(0, 300),
    channel: 'push', sentAt: new Date(), agentId: 'jarvis',
    cooldownKey: `jarvis_${Date.now()}`,
  }).catch(() => {});
  await sendPush(notifTitle.slice(0, 50), notifSummary.slice(0, 100)).catch(() => {});

  // Inbox — siempre visible aunque push no llegue
  await db.insert(inbox).values({
    content: `[JARVIS] ${taskTitle}: ${notifSummary}`,
    source: 'jarvis', type: 'note', processed: false,
  }).catch(() => {});

  // Tarea con notas completas
  await db.insert(tasks).values({
    title: taskTitle.slice(0, 80), detail: rawQuery.slice(0, 200),
    notes: notes.slice(0, 3000), prio: 7, prioFinal: 7,
    status: 'wait', source: 'vera+', propertyId: null, inNow: false,
  }).catch(() => {});
}
