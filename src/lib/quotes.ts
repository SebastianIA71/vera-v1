/**
 * VERA — Frases para la pantalla de bloqueo
 *
 * Cada frase tiene UNA palabra (a veces dos contiguas) marcada con
 * asteriscos *así*. Esa es la "palabra ancla" — se renderiza en
 * cursiva gold (#e8d5a3) mientras el resto va en color de texto principal.
 *
 * Renderizado sugerido en el componente:
 *
 *   function renderQuote(raw: string): React.ReactNode {
 *     const parts = raw.split(/\*([^*]+)\*\/);
 *     return parts.map((part, i) =>
 *       i % 2 === 1 ? <em key={i}>{part}</em> : part
 *     );
 *   }
 *
 * Selección aleatoria en cada montaje del componente:
 *
 *   const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
 *
 * Si quieres que sea estable por día en vez de aleatoria por carga,
 * usar el día del año como seed (ver getDailyQuote() abajo).
 */

export const QUOTES: string[] = [
  // ── Quietas — observación serena ────────────────────────────
  "The room is *quiet*. Begin.",
  "Morning, *as it is*.",
  "*Light* before noise.",
  "The world is *waiting*, not demanding.",
  "Nothing is *urgent* until you decide it is.",
  "*Silence* is also a starting point.",
  "The day has not *spoken* yet.",
  "*Stillness* first.",
  "Outside, the same *sky*.",
  "Begin where you *are*.",
  "*Slow* down to start.",
  "Nothing is *missing* yet.",
  "The hour is *small* and yours.",
  "*Less* is already enough.",
  "The morning *owes* nothing.",
  "*Empty* hands, full mind.",
  "Pause is also *progress*.",
  "*Calm* is a skill.",
  "Listen *before* moving.",
  "The mind is *clearer* when unhurried.",

  // ── Acción — empuje suave ───────────────────────────────────
  "Begin *anyway*.",
  "Move, *then* think.",
  "Small *step*, then another.",
  "Do the *next* thing.",
  "*Start* badly. Start.",
  "One *honest* move.",
  "Better *now* than perfect.",
  "Half *done* beats half thought.",
  "The day rewards *motion*.",
  "*Try*, then revise.",
  "Begin *before* you feel ready.",
  "Doing is *thinking* in motion.",
  "*Show up*. The rest follows.",
  "Action *clarifies*.",
  "One *true* sentence today.",
  "Choose, *then* commit.",
  "Begin *imperfect*.",
  "*Today* is workable.",
  "Make the *first* move.",
  "*Forward* counts.",

  // ── Tiempo — sobre el momento, las horas ────────────────────
  "*This* day, only this day.",
  "*Hours* are honest.",
  "The morning is *short*. The day is long.",
  "*Now* is the only currency.",
  "*Tomorrow* is a rumor.",
  "Time is not a *race*.",
  "The day is *new*. It has no opinions.",
  "Yesterday is *done*. Let it be done.",
  "Today *fits* exactly today.",
  "An hour, *honestly* spent.",
  "*Morning* light is forgiving.",
  "The clock is *neutral*.",
  "Hours don't *accumulate*. They pass.",
  "Use the *quiet* hour first.",
  "*Pace* over speed.",
  "Days *compound*. Show up.",
  "*Begin* the day before it begins you.",
  "Mornings *belong* to the unhurried.",
  "Each day a *small* life.",
  "The morning *is yours*. Begin.",

  // ── Internas — atención, foco, presencia ────────────────────
  "*Attention* is the first gift.",
  "What you *notice* shapes the day.",
  "Focus is a kind of *kindness*.",
  "*One* thing at a time.",
  "Notice *what* matters.",
  "*Presence* is the work.",
  "*Listen* inward first.",
  "*Choose* what to carry today.",
  "The mind follows what you *feed* it.",
  "*Less* input, more thought.",
  "What you *repeat*, you become.",
  "*Curiosity* outlives discipline.",
  "Pay attention. It *adds up*.",
  "*Notice* before you decide.",
  "Awareness *before* action.",
  "Be *here*, briefly and well.",
  "*Patience* is also work.",
  "The mind is *yours* to direct.",
  "Choose the *narrow* path.",
  "Hold *one* thought lightly.",

  // ── Físicas — cuerpo, respiración, manos ────────────────────
  "*Breathe*. Then proceed.",
  "*Stand* before you speak.",
  "The body *knows* something first.",
  "*Water*, light, motion.",
  "Hands *steady*. Mind clear.",
  "*Move*. The mind will follow.",
  "*Drink* water. Begin.",
  "Stretch *once*. It counts.",
  "*Walk* into the day.",
  "Rest is *also* practice.",
  "*Eat* like you mean it.",
  "*Posture* changes thought.",
  "The body is *honest*.",
  "*Sleep* well, work well.",
  "*Slow* breath, slow morning.",
  "*Feet* on the ground.",
  "Care for the *vessel*.",
  "*Strong* body, soft mind.",
  "Move *gently* into the day.",
  "*Begin* with the breath.",
];

/**
 * Selección aleatoria — distinta en cada carga de la pantalla.
 */
export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/**
 * Selección estable por día — la misma frase durante todo un día,
 * cambia a las 00:00. Útil si prefieres que el "mensaje del día"
 * tenga continuidad si abres la app varias veces.
 */
export function getDailyQuote(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

/**
 * Helper para parsear la frase y separar la palabra ancla.
 * Devuelve un array de segmentos { text, anchor } para que el
 * componente los renderice diferenciados (gold + cursiva para anchor).
 */
export function parseQuote(raw: string): Array<{ text: string; anchor: boolean }> {
  const parts = raw.split(/\*([^*]+)\*/);
  return parts.map((text, i) => ({ text, anchor: i % 2 === 1 }));
}
