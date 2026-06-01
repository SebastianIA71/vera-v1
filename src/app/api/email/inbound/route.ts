import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { tasks, inbox } from '@/lib/db/schema';
import { callClaude } from '@/lib/claude';

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

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const wh = new Webhook(secret);
    try {
      wh.verify(rawBody, {
        'svix-id':        req.headers.get('svix-id') ?? '',
        'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
        'svix-signature': req.headers.get('svix-signature') ?? '',
      });
    } catch {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const event = JSON.parse(rawBody);
  if (event.type !== 'email.received') {
    return NextResponse.json({ ok: true });
  }

  const { email_id, from, subject } = event.data;

  const allowed = (process.env.INBOUND_ALLOWED_FROM ?? '').toLowerCase();
  if (allowed && !from.toLowerCase().includes(allowed)) {
    return NextResponse.json({ error: 'Sender not allowed' }, { status: 403 });
  }

  if (!subject) return NextResponse.json({ error: 'No subject' }, { status: 400 });

  let emailBody = '';
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && email_id) {
    try {
      const res = await fetch(`https://api.resend.com/emails/${email_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        emailBody = data.text ?? data.html ?? '';
      }
    } catch { /* continuar sin body */ }
  }

  const result = await callClaude(
    `Asunto: ${subject}\n\nCuerpo: ${emailBody.slice(0, 500)}`,
    CLASSIFY_PROMPT,
    300,
  );

  let parsed = {
    title:      subject,
    detail:     emailBody.slice(0, 300) || null as string | null,
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
