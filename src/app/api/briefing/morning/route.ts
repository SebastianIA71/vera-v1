import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 20;
import { rateLimit } from '@/lib/rateLimit';
import { db } from '@/lib/db';
import { tasks, events, weightLog, inbox, memory } from '@/lib/db/schema';
import { ne, desc, eq, and } from 'drizzle-orm';
import { buildSystemPrompt, callClaude } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const force = req.nextUrl.searchParams.get('force') === '1';
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const key = `morning_briefing_${today}`;

  if (!force) {
    const [cached] = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
    if (cached?.value) {
      return NextResponse.json({ briefing: cached.value, cached: true });
    }
  }

  const DAYS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  const [allTasks, allEvents, weights, inboxItems] = await Promise.all([
    db.select().from(tasks).where(and(ne(tasks.status, 'archived'), ne(tasks.status, 'done'))).orderBy(desc(tasks.prioFinal)).limit(30),
    db.select().from(events).orderBy(desc(events.startDate)).limit(10),
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(7),
    db.select({ id: inbox.id, processed: inbox.processed, createdAt: inbox.createdAt }).from(inbox).limit(100),
  ]);

  // Tareas urgentes con antigüedad real
  const urgentTasks = allTasks
    .filter(t => (t.prioFinal ?? 0) >= 7)
    .slice(0, 5)
    .map(t => {
      const daysSinceAction = t.lastActionAt
        ? Math.floor((now.getTime() - new Date(t.lastActionAt).getTime()) / 86400000)
        : null;
      const daysSinceCreated = t.createdAt
        ? Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / 86400000)
        : null;
      return {
        title: t.title,
        detail: t.detail,
        prio: t.prioFinal ?? 0,
        daysSinceAction,
        daysSinceCreated,
      };
    });

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  // Tendencia de peso: último vs hace 7 días
  const lastWeight = weights[0]?.value ?? null;
  const prevWeight = weights[weights.length - 1]?.value ?? null;
  const weightTrend = lastWeight && prevWeight && weights.length >= 2
    ? lastWeight > prevWeight
      ? `subiendo ${(lastWeight - prevWeight).toFixed(1)} kg en ${weights.length} días`
      : lastWeight < prevWeight
        ? `bajando ${(prevWeight - lastWeight).toFixed(1)} kg en ${weights.length} días`
        : 'estable'
    : 'sin datos suficientes';

  // Inbox: edad de los items sin procesar
  const pendingInbox = inboxItems.filter(i => !i.processed);
  const inboxAges = pendingInbox.map(i => {
    if (!i.createdAt) return 0;
    return Math.floor((now.getTime() - new Date(i.createdAt).getTime()) / 86400000);
  });
  const oldestInboxDays = inboxAges.length > 0 ? Math.max(...inboxAges) : 0;
  const newestInboxDays = inboxAges.length > 0 ? Math.min(...inboxAges) : 0;

  // Construir descripción de tareas urgentes con antigüedad real
  const urgentTasksDesc = urgentTasks.length > 0
    ? urgentTasks.map(t => {
        const age = t.daysSinceAction !== null
          ? (t.daysSinceAction === 0 ? 'movida hoy' : `sin tocar hace ${t.daysSinceAction} día${t.daysSinceAction === 1 ? '' : 's'}`)
          : (t.daysSinceCreated !== null
              ? `creada hace ${t.daysSinceCreated} día${t.daysSinceCreated === 1 ? '' : 's'}`
              : 'nueva');
        return `[prio ${t.prio}] "${t.title}" — ${age}`;
      }).join('\n')
    : 'ninguna urgente hoy';

  // Descripción del inbox con antigüedad real
  const inboxDesc = pendingInbox.length === 0
    ? 'inbox vacío'
    : `${pendingInbox.length} captura${pendingInbox.length === 1 ? '' : 's'} pendiente${pendingInbox.length === 1 ? '' : 's'}` +
      (oldestInboxDays === 0
        ? ' (todas de hoy)'
        : oldestInboxDays === newestInboxDays
          ? ` (de hace ${oldestInboxDays} día${oldestInboxDays === 1 ? '' : 's'})`
          : ` (entre hoy y hace ${oldestInboxDays} día${oldestInboxDays === 1 ? '' : 's'})`);

  const ctx = {
    today: `${DAYS_ES[now.getDay()]} ${now.getDate()} ${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`,
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    daysToNextTrip,
    nextTrip: nextTrip?.title ?? null,
    lastWeight,
    weightTrend,
    urgentTasks: urgentTasks.map(t => ({ title: t.title, detail: t.detail, prio: t.prio })),
    inboxCount: pendingInbox.length,
    memory: '',
  };

  const extraContext = `
## Contexto detallado para el briefing

### Tareas urgentes (con antigüedad real)
${urgentTasksDesc}

### Tendencia de peso
${lastWeight ? `Último peso: ${lastWeight} kg · Tendencia: ${weightTrend}` : 'Sin registros recientes'}

### Inbox
${inboxDesc}

### Próximo viaje
${nextTrip ? `${nextTrip.title} en ${daysToNextTrip} días` : 'Ninguno en los próximos días'}
`;

  const prompt = `Genera el briefing matutino de hoy. Un párrafo corto (3-4 frases). Sé muy concreto y específico:
- Usa las antigüedades EXACTAS que te doy (si una tarea lleva 3 días, di "3 días", no "días" ni "semanas")
- Si el inbox tiene capturas de hoy, di "tienes X capturas de hoy en el inbox", no que llevan semanas
- Menciona patrones reales del peso si los hay
- No repitas frases genéricas como "esta tarea desbloquea cosas" — usa los datos reales
- Sin listas, solo párrafo fluido en español

${extraContext}`;

  const result = await callClaude(prompt, buildSystemPrompt(ctx), 400);

  if (!result.ok) {
    return NextResponse.json({ briefing: null, cached: false });
  }

  await db.insert(memory)
    .values({ key, value: result.text, updatedAt: new Date() })
    .onConflictDoUpdate({ target: memory.key, set: { value: result.text, updatedAt: new Date() } });

  return NextResponse.json({ briefing: result.text, cached: false });
}
