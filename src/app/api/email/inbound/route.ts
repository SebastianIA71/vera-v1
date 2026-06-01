import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { tasks, events, inbox, weightLog } from '@/lib/db/schema';
import { callClaude } from '@/lib/claude';
import { sendPush } from '@/lib/push';
import { extractAmiVeraQuery, runAmiVeraPipeline } from '@/lib/amivera';

// ─── Verificación firma Resend (svix) ──────────────────────────────────────
async function verifyResend(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? process.env.INBOUND_WEBHOOK_SECRET;
  if (!secret) return true;
  try {
    new Webhook(secret).verify(body, {
      'svix-id':        req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    });
    return true;
  } catch { return false; }
}

// ─── Obtener cuerpo del email via API Resend ───────────────────────────────
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

// ─── Prefijos explícitos en asunto ────────────────────────────────────────
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
    if (re.test(subject)) return { intent, cleanSubject: subject.replace(re, '').trim() };
  }
  return { intent: null, cleanSubject: subject };
}

// ─── Prompts ───────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

const INTENT_PROMPT = `Analiza este email de Sebastián y devuelve JSON:
{"intent":"task"|"trip"|"event"|"property_note"|"weight"|"inbox","confidence":0-100}

- task: algo accionable
- trip: viaje con destino y fechas
- event: evento puntual (cena, médico, reunión)
- property_note: nota sobre flat/sarapita/willys
- weight: número de peso corporal
- inbox: idea, reflexión o ambiguo

Solo JSON.`;

const EXTRACT_PROMPTS: Record<Intent, string> = {
  task: `Extrae una tarea. JSON:
{"title":"máx 80 chars","detail":"o null","prio":1-9,"propertyId":"flat"|"sarapita"|"willys"|null,"type":"task"|"idea"|"note"}
urgente/hoy→prio 7-8, importante→6, normal→5. Solo JSON.`,

  trip: `Fecha hoy: ${TODAY}. Extrae un viaje. JSON:
{"title":"destino","startDate":"YYYY-MM-DD|null","endDate":"YYYY-MM-DD|null","who":"solo"|"pareja"|"familia"|"trabajo"|"amigos"|null,"transport":"avion"|"tren"|"coche"|"barco"|"bus"|null,"accommodation":"texto|null","approx":bool,"notes":"texto|null"}
Convierte fechas relativas a YYYY-MM-DD. Solo JSON.`,

  event: `Fecha hoy: ${TODAY}. Extrae un evento. JSON:
{"title":"texto","startDate":"YYYY-MM-DD|null","endDate":"YYYY-MM-DD|null","type":"social"|"medical"|"personal"|"work","who":"texto|null","notes":"texto|null"}
Solo JSON.`,

  property_note: `Extrae nota de propiedad. JSON:
{"propertyId":"flat"|"sarapita"|"willys","note":"texto","prio":1-9,"convertToTask":bool}
Solo JSON.`,

  weight: `Fecha hoy: ${TODAY}. Extrae registro de peso. JSON:
{"value":número,"date":"YYYY-MM-DD","notes":"texto|null"}
Solo JSON.`,

  inbox: `Extrae contenido para inbox. JSON:
{"content":"texto limpio","type":"idea"|"note"|"raw"}
Solo JSON.`,
};

// ─── Guardar por intención → devuelve resumen ──────────────────────────────
async function saveByIntent(
  intent: Intent,
  data: Record<string, unknown>,
  rawSubject: string,
): Promise<{ summary: string; saved: boolean }> {
  try {
    switch (intent) {

      case 'task':
      case 'property_note': {
        const title      = String(data.title ?? data.note ?? rawSubject).trim().slice(0, 80);
        const propertyId = data.propertyId ? String(data.propertyId) : null;
        const prio       = Math.min(9, Math.max(1, Number(data.prio ?? 5)));
        await db.insert(tasks).values({
          title, detail: data.detail ? String(data.detail) : null,
          propertyId, prio, prioFinal: prio,
          status: 'wait', source: 'email',
          type: String(data.type ?? 'task'),
        });
        return {
          summary: `✓ Tarea creada: "${title}"${propertyId ? ` · ${propertyId}` : ''} · prio ${prio}`,
          saved: true,
        };
      }

      case 'trip': {
        const title = String(data.title ?? rawSubject).trim();
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
          ? ` · ${data.startDate}${data.endDate ? ` → ${data.endDate}` : ''}`
          : '';
        return {
          summary: `✓ Viaje: "${title}"${dates}${data.who ? ` · ${data.who}` : ''}${data.transport ? ` · ${data.transport}` : ''}`,
          saved: true,
        };
      }

      case 'event': {
        const title = String(data.title ?? rawSubject).trim();
        await db.insert(events).values({
          title,
          startDate: data.startDate ? new Date(String(data.startDate)) : null,
          endDate:   data.endDate   ? new Date(String(data.endDate))   : null,
          type:      String(data.type ?? 'social'),
          who:       data.who   ? String(data.who)   : null,
          notes:     data.notes ? String(data.notes) : null,
          status:    'planning',
        });
        return {
          summary: `✓ Evento: "${title}"${data.startDate ? ` · ${data.startDate}` : ''}`,
          saved: true,
        };
      }

      case 'weight': {
        const value = Number(data.value);
        if (isNaN(value) || value < 30 || value > 300) throw new Error('Peso inválido');
        const date = data.date ? String(data.date) : TODAY;
        await db.insert(weightLog).values({
          value, date, source: 'email',
          notes: data.notes ? String(data.notes) : null,
        });
        return { summary: `✓ Peso: ${value} kg · ${date}`, saved: true };
      }

      default:
        throw new Error('fallback inbox');
    }
  } catch {
    const content = String(data.content ?? data.title ?? rawSubject).trim();
    await db.insert(inbox).values({
      content, source: 'email',
      type: String(data.type ?? 'raw'),
      processed: false,
    });
    return {
      summary: `⚠ No pude clasificarlo con certeza — guardado en inbox: "${content.slice(0, 60)}"`,
      saved: false,
    };
  }
}

// ─── Enviar email de respuesta ─────────────────────────────────────────────
async function sendReply(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const domain = process.env.NEXT_PUBLIC_INBOUND_EMAIL?.split('@')[1] ?? 'ostbade.resend.app';
    await resend.emails.send({
      from: process.env.FROM_EMAIL ?? `Vera <vera@${domain}>`,
      to,
      subject,
      text,
    });
  } catch { /* no romper si falla el reply */ }
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

  if (event.type !== 'email.received') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const data       = event.data as Record<string, unknown> ?? {};
  const emailId    = String(data.email_id ?? '');
  const fromEmail  = String(data.from ?? '');
  const rawSubject = String(data.subject ?? '').trim();

  const allowed = (process.env.INBOUND_ALLOWED_FROM ?? '').toLowerCase();
  if (allowed && !fromEmail.toLowerCase().includes(allowed)) {
    return NextResponse.json({ error: 'Sender not allowed' }, { status: 403 });
  }
  if (!rawSubject) return NextResponse.json({ error: 'No subject' }, { status: 400 });

  // 1. Detectar prefijo + obtener cuerpo
  const { intent: prefixIntent, cleanSubject } = detectPrefix(rawSubject);
  const body = await fetchEmailBody(emailId);
  const fullText = `Asunto: ${cleanSubject}\n\nCuerpo: ${body}`;

  // --- Amivera fast path (nunca va al inbox) ---
  const amiQuery = extractAmiVeraQuery(`${rawSubject} ${body}`);
  if (amiQuery) {
    await runAmiVeraPipeline(amiQuery);
    await sendReply(
      fromEmail,
      'VERA · amivera activado',
      `Pipeline iniciado para: "${amiQuery.slice(0, 80)}"\nVera investigará y te notificará cuando esté listo.\n\nVERA · ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
    );
    return NextResponse.json({ ok: true, amivera: true });
  }

  // 2. Clasificar intención
  let intent: Intent = 'inbox';
  let confident = !!prefixIntent;

  if (prefixIntent) {
    intent = prefixIntent;
  } else {
    const classRes = await callClaude(fullText, INTENT_PROMPT, 80);
    if (classRes.ok) {
      try {
        const json = JSON.parse(classRes.text.replace(/```json\n?|\n?```/g, '').trim());
        if (json.confidence >= 70) {
          intent    = json.intent as Intent;
          confident = true;
        }
      } catch { /* fallback inbox */ }
    }
  }

  // 3. Extraer campos
  const extractRes = await callClaude(fullText, EXTRACT_PROMPTS[intent], 300);
  let extracted: Record<string, unknown> = {};
  if (extractRes.ok) {
    try {
      extracted = JSON.parse(extractRes.text.replace(/```json\n?|\n?```/g, '').trim());
    } catch { extracted = { title: cleanSubject }; }
  } else {
    extracted = { title: cleanSubject };
  }

  // Si no hay confianza → forzar inbox
  if (!confident) {
    intent    = 'inbox';
    extracted = { content: cleanSubject, type: 'raw' };
  }

  // 4. Guardar
  const { summary, saved } = await saveByIntent(intent, extracted, cleanSubject);

  // 5. Push al teléfono
  await sendPush(
    saved ? 'VERA · Email procesado' : 'VERA · Email en inbox',
    summary.replace(/^[✓⚠] /, ''),
  ).catch(() => {});

  // 6. Email de confirmación al remitente
  const replyText = saved
    ? `${summary}\n\nVERA · ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`
    : `${summary}\n\nPuedes revisarlo en Inbox y procesarlo manualmente.\n\nVERA · ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`;
  await sendReply(fromEmail, summary, replyText);

  return NextResponse.json({ ok: true, intent, confident, summary });
}
