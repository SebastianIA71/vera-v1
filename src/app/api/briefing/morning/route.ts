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

  // Devolver el briefing cacheado si ya existe hoy (salvo force=1)
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
    db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(2),
    db.select({ id: inbox.id, processed: inbox.processed }).from(inbox).limit(100),
  ]);

  const urgentTasks = allTasks
    .filter(t => (t.prioFinal ?? 0) >= 7)
    .slice(0, 5)
    .map(t => ({ title: t.title, detail: t.detail, prio: t.prioFinal ?? 0 }));

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  const lastWeight = weights[0]?.value ?? null;
  const prevWeight = weights[1]?.value ?? null;
  const weightTrend = lastWeight && prevWeight
    ? lastWeight > prevWeight ? 'subiendo' : lastWeight < prevWeight ? 'bajando' : 'estable'
    : 'sin datos';

  const ctx = {
    today: `${DAYS_ES[now.getDay()]} ${now.getDate()} ${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`,
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    daysToNextTrip,
    nextTrip: nextTrip?.title ?? null,
    lastWeight,
    weightTrend,
    urgentTasks,
    inboxCount: inboxItems.filter(i => !i.processed).length,
    memory: '',
  };

  const result = await callClaude(
    'Genera el briefing matutino de hoy. Un párrafo corto (3-4 frases). Concreto, accionable. Menciona lo más urgente y cualquier patrón que notes. Sin listas, solo párrafo.',
    buildSystemPrompt(ctx),
    400,
  );

  if (!result.ok) {
    return NextResponse.json({ briefing: null, cached: false });
  }

  // Guardar en memory para reutilizar todo el día
  await db.insert(memory)
    .values({ key, value: result.text, updatedAt: new Date() })
    .onConflictDoUpdate({ target: memory.key, set: { value: result.text, updatedAt: new Date() } });

  return NextResponse.json({ briefing: result.text, cached: false });
}
