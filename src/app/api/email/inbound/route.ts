import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { tasks, events, inbox, weightLog } from '@/lib/db/schema';
import { callClaude } from '@/lib/claude';

// ─── Verificación de firma Resend (svix) ───────────────────────────────────
async function verifyResend(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? process.env.INBOUND_WEBHOOK_SECRET;
  if (!secret) return true;
  try {
    const wh = new Webhook(secret);
    wh.verify(body, {
      'svix-id':        req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    });
    return true;
  } catch { return false; }
}

// ─── Obtener cuerpo del email vía API Resend ───────────────────────────────
async function fetchEmailBody(emailId: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !emailId) return '';
  try {
    const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return '';
    const data = await res.json();
    return (data.text ?? data.html ?? '').slice(0, 800);
  } catch { return ''; }
}

// ─── Detectar prefijos explícitos en asunto ────────────────────────────────
type Intent = 'task' | 'trip' | 'event' | 'property_note' | 'weight' | 'inbox';

function detectPrefix(subject: string): { intent: Intent | null; cleanSubject: string } {
  const prefixes: [RegExp, Intent][] = [
    [/^\[tarea\]\s*/i,    'task'],
    [/^\[viaje\]\s*/i,    'trip'],
    [/^\[evento\]\s*/i,   'event'],
    [/^\[flat\]\s*/i,     'task'],
    [/^\[sarapita\]\s*/i, 'task'],
    [/^\[willys\]\s*/i,   'task'],
    [/^\[peso\]\s*/i,     'weight'],
    [/^\[inbox\]\s*/i,    'inbox'],
  ];
  for (const [re, intent] of prefixes) {
    if (re.test(subject)) {
      return { intent, cleanSubject: subject.replace(re, '').trim() };
    }
  }
  return { intent: null, cleanSubject: subject };
}

// ─── Prompts por intención ─────────────────────────────────────────────────
const INTENT_PROMPT = `Eres Vera, asistente de Sebastián. Analiza este email y devuelve JSON:
{
  "intent": "task" | "trip" | "event" | "property_note" | "weight" | "inbox",
  "confidence": 0-100
}

Reglas:
- task: algo accionable, una tarea pendiente
- trip: viaje con fechas y destino
- event: evento puntual (cena, médico, reunión)
- property_note: anotación sobre flat/sarapita/willys
- weight: registro de peso corporal (número + kg)
- inbox: idea, reflexión, sin acción clara o ambiguo

Solo JSON, sin texto adicional.`;

const TODAY = new Date().toISOString().slice(0, 10);

const EXTRACT_PROMPTS: Record<Intent, string> = {
  task: `Extrae una tarea del email. JSON exacto:
{
  "title": "título limpio máx 80 chars",
  "detail": "detalle o null",
  "prio": 1-9 (urgente/hoy=7-8, importante=6, normal=5, algún día=3),
  "propertyId": "flat"|"sarapita"|"willys"|null,
  "tags": [],
  "type": "task"|"idea"|"note"
}
Solo JSON.`,

  trip: `Extrae un viaje del email. Fecha actual: ${TODAY}. JSON exacto:
{
  "title": "destino principal",
  "startDate": "YYYY-MM-DD o null",
  "endDate": "YYYY-MM-DD o null",
  "who": "solo"|"pareja"|"familia"|"trabajo"|"amigos"|null,
  "transport": "avion"|"tren"|"coche"|"barco"|"bus"|null,
  "accommodation": "texto libre o null",
  "approx": true|false,
  "notes": "resto de info relevante o null"
}
Fechas relativas conviértelas a YYYY-MM-DD.
Solo JSON.`,

  event: `Extrae un evento del email. Fecha actual: ${TODAY}. JSON exacto:
{
  "title": "título del evento",
  "startDate": "YYYY-MM-DD o null",
  "endDate": "YYYY-MM-DD o null",
  "type": "social"|"medical"|"personal"|"work",
  "who": "con quién o null",
  "notes": "detalles o null"
}
Solo JSON.`,

  property_note: `Extrae una anotación de propiedad del email. JSON exacto:
{
  "propertyId": "flat"|"sarapita"|"willys",
  "note": "texto de la anotación",
  "convertToTask": true|false,
  "prio": 1-9
}
Solo JSON.`,

  weight: `Extrae un registro de peso del email. Fecha actual: ${TODAY}. JSON exacto:
{
  "value": número decimal (ej. 82.3),
  "date": "YYYY-MM-DD",
  "notes": "texto adicional o null"
}
Solo JSON.`,

  inbox: `Extrae el contenido para guardar en inbox. JSON exacto:
{
  "content": "texto limpio del mensaje",
  "type": "idea"|"note"|"raw"
}
Solo JSON.`,
};

// ─── Guardar por intención ─────────────────────────────────────────────────
async function saveByIntent(intent: Intent, data: Record<string, unknown>): Promise<string> {
  switch (intent) {
    case 'task':
    case 'property_note': {
      const title      = String(data.title ?? data.note ?? '').trim();
      const propertyId = data.propertyId ? String(data.propertyId) : null;
      const prio       = Number(data.prio ?? 5);
      await db.insert(tasks).values({
        title,
        detail:     data.detail ? String(data.detail) : null,
        propertyId,
        prio,
        prioFinal:  prio,
        status:     'wait',
        source:     'email',
        type:       String(data.type ?? 'task'),
      });
      return `✓ Tarea creada: "${title}"${propertyId ? ` · ${propertyId}` : ''} · prio ${prio}`;
    }

    case 'trip': {
      const title = String(data.title ?? 'Viaje').trim();
      await db.insert(events).values({
        title,
        startDate:     data.startDate ? new Date(String(data.startDate)) : null,
        endDate:       data.endDate   ? new Date(String(data.endDate))   : null,
        type:          'viaje',
        who:           data.who           ? String(data.who)           : null,
        transport:     data.transport     ? String(data.transport)     : null,
        accommodation: data.accommodation ? String(data.accommodation) : null,
        approx:        Boolean(data.approx ?? false),
        notes:         data.notes ? String(data.notes) : null,
        status:        'planning',
      });
      const dates = data.startDate
        ? `${data.startDate}${data.endDate ? ` → ${data.endDate}` : ''}`
        : 'fechas por definir';
      return `✓ Viaje creado: "${title}" · ${dates}${data.who ? ` · ${data.who}` : ''}${data.transport ? ` · ${data.transport}` : ''}`;
    }

    case 'event': {
      const title = String(data.title ?? 'Evento').trim();
      await db.insert(events).values({
        title,
        startDate: data.startDate ? new Date(String(data.startDate)) : null,
        endDate:   data.endDate   ? new Date(String(data.endDate))   : null,
        type:      String(data.type ?? 'social'),
        who:       data.who   ? String(data.who)   : null,
        notes:     data.notes ? String(data.notes) : null,
        status:    'planning',
      });
      return `✓ Evento creado: "${title}"${data.startDate ? ` · ${data.startDate}` : ''}`;
    }

    case 'weight': {
      const value = Number(data.value);
      if (isNaN(value) || value < 30 || value > 300) return '⚠ Valor de peso inválido';
      const date = data.date ? String(data.date) : new Date().toISOString().slice(0, 10);
      await db.insert(weightLog).values({
        value,
        date,
        source: 'email',
        notes:  data.notes ? String(data.notes) : null,
      });
      return `✓ Peso registrado: ${value} kg · ${date}`;
    }

    case 'inbox':
    default: {
      const content = String(data.content ?? data.title ?? '').trim();
      await db.insert(inbox).values({
        content,
        source:    'email',
        type:      String(data.type ?? 'raw'),
        processed: false,
      });
      return `✓ Guardado en inbox: "${content.slice(0, 60)}"`;
    }
  }
}

// ─── Handler principal ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!await verifyResend(req, rawBody)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const eventType = event.type as string;
  if (eventType !== 'email.received') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const data       = event.data as Record<string, unknown> ?? {};
  const emailId    = String(data.email_id ?? '');
  const fromEmail  = String(data.from ?? '').toLowerCase();
  const rawSubject = String(data.subject ?? '').trim();

  const allowed = (process.env.INBOUND_ALLOWED_FROM ?? '').toLowerCase();
  if (allowed && !fromEmail.includes(allowed)) {
    return NextResponse.json({ error: 'Sender not allowed' }, { status: 403 });
  }

  if (!rawSubject) return NextResponse.json({ error: 'No subject' }, { status: 400 });

  const { intent: prefixIntent, cleanSubject } = detectPrefix(rawSubject);
  const body = await fetchEmailBody(emailId);
  const fullText = `Asunto: ${cleanSubject}\n\nCuerpo: ${body}`;

  let intent: Intent = prefixIntent ?? 'inbox';
  if (!prefixIntent) {
    const classifyResult = await callClaude(fullText, INTENT_PROMPT, 100);
    if (classifyResult.ok) {
      try {
        const json = JSON.parse(classifyResult.text.replace(/```json\n?|\n?```/g, '').trim());
        if (json.confidence >= 65) intent = json.intent as Intent;
      } catch { /* fallback inbox */ }
    }
  }

  const extractResult = await callClaude(fullText, EXTRACT_PROMPTS[intent], 400);
  let extracted: Record<string, unknown> = {};
  if (extractResult.ok) {
    try {
      extracted = JSON.parse(extractResult.text.replace(/```json\n?|\n?```/g, '').trim());
    } catch { extracted = { title: cleanSubject }; }
  } else {
    extracted = { title: cleanSubject };
  }

  const confirmation = await saveByIntent(intent, extracted);

  // Email de confirmación de vuelta
  const replyTo = String(data.from ?? '');
  const apiKey  = process.env.RESEND_API_KEY;
  if (apiKey && replyTo) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from:    process.env.FROM_EMAIL ?? `Vera <vera@${process.env.NEXT_PUBLIC_INBOUND_EMAIL?.split('@')[1] ?? 'resend.dev'}>`,
        to:      replyTo,
        subject: confirmation,
        text:    `${confirmation}\n\nVERA · ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
      });
    } catch { /* no romper si falla el reply */ }
  }

  return NextResponse.json({ ok: true, intent, confirmation });
}
