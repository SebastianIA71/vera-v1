import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, inbox } from '@/lib/db/schema';
import { callClaude } from '@/lib/claude';

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = req.headers.get('resend-signature') ?? '';
  const [, sigValue] = sig.split('=');
  if (!sigValue) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sigBuf = Uint8Array.from(atob(sigValue), c => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBuf, encoder.encode(body));
}

const CLASSIFY_PROMPT = `Eres Vera. Ha llegado un email de Sebastián para convertir en tarea o nota.

Devuelve JSON exacto:
{
  "title": "título limpio máx 80 chars",
  "detail": "detalle adicional o null",
  "prio": número 1-9 según urgencia detectada (default 5),
  "propertyId": "flat" | "sarapita" | "willys" | null,
  "type": "task" | "note" | "idea",
  "saveAs": "task" | "inbox"
}

Reglas:
- "urgente", "hoy", "importante", "asap" → prio 7-8
- Menciona propiedad → propertyId
- Idea/reflexión → type "idea", saveAs "inbox"
- Accionable → type "task", saveAs "task"
- Solo JSON, sin texto adicional.`;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const valid = await verifySignature(req, rawBody);
  if (!valid) return new NextResponse('Unauthorized', { status: 401 });

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const fromEmail = (payload.from as string ?? '').toLowerCase();
  const allowed   = (process.env.INBOUND_ALLOWED_FROM ?? '').toLowerCase();
  if (allowed && !fromEmail.includes(allowed)) {
    return NextResponse.json({ error: 'Sender not allowed' }, { status: 403 });
  }

  const subject = (payload.subject as string ?? '').trim();
  const body    = (payload.text as string ?? payload.html as string ?? '').trim();
  if (!subject) return NextResponse.json({ error: 'No subject' }, { status: 400 });

  const result = await callClaude(
    `Asunto: ${subject}\n\nCuerpo: ${body.slice(0, 500)}`,
    CLASSIFY_PROMPT,
    300,
  );

  let parsed = {
    title:      subject,
    detail:     body.slice(0, 300) || null as string | null,
    prio:       5,
    propertyId: null as string | null,
    type:       'task',
    saveAs:     'task',
  };

  if (result.ok) {
    try {
      const json = JSON.parse(result.text.replace(/```json\n?|\n?```/g, '').trim());
      parsed = { ...parsed, ...json };
    } catch { /* usar defaults */ }
  }

  if (parsed.saveAs === 'task') {
    await db.insert(tasks).values({
      title:      parsed.title,
      detail:     parsed.detail,
      propertyId: parsed.propertyId,
      prio:       parsed.prio,
      prioFinal:  parsed.prio,
      status:     'wait',
      source:     'email',
      type:       parsed.type ?? 'task',
    });
  } else {
    await db.insert(inbox).values({
      content:   parsed.title,
      source:    'email',
      type:      parsed.type ?? 'raw',
      processed: false,
    });
  }

  return NextResponse.json({ ok: true, saved: parsed.saveAs, title: parsed.title });
}
