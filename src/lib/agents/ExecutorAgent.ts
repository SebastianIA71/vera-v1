import { capabilities } from '@/lib/capabilities';
import { callClaude } from '@/lib/claude';

export type WhatsAppDraft = {
  to: string;
  body: string;
};

export type WhatsAppResult =
  | { mode: 'ready'; draft: WhatsAppDraft }
  | { mode: 'copy'; draft: WhatsAppDraft; notice: string }
  | { mode: 'no_ai'; notice: string };

export async function draftWhatsApp(input: {
  to: string;
  context: string;
  tone?: string;
}): Promise<WhatsAppResult> {
  if (!capabilities.ai.available) {
    return { mode: 'no_ai', notice: 'Sin IA — redacta manualmente.' };
  }

  const tone = input.tone ?? 'natural';
  const toneDesc = tone === 'formal' ? 'formal y profesional' : tone === 'casual' ? 'casual y cercano' : 'natural y directo';

  const SYSTEM = `Eres Vera, asistente de Sebastián. Redacta un mensaje de WhatsApp ${toneDesc}.
Devuelve SOLO el cuerpo del mensaje en español. Máximo 300 caracteres. Conciso, sin saludos genéricos ni firmas.`;

  const result = await callClaude(
    `Destinatario: ${input.to}\nContexto: ${input.context}`,
    SYSTEM,
    200,
  );

  const body = result.ok ? result.text : input.context.slice(0, 300);
  const draft: WhatsAppDraft = { to: input.to, body };

  if (!capabilities.whatsapp) {
    return { mode: 'copy', draft, notice: 'Twilio no configurado — copia y envía manualmente.' };
  }

  return { mode: 'ready', draft };
}

export async function sendWhatsApp(draft: WhatsAppDraft): Promise<{ ok: boolean; sid?: string }> {
  if (!capabilities.whatsapp) return { ok: false };

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
      to: `whatsapp:${draft.to}`,
      body: draft.body,
    });
    return { ok: true, sid: msg.sid };
  } catch {
    return { ok: false };
  }
}

export type EmailDraft = {
  to: string;
  subject: string;
  body: string;
  tone: 'formal' | 'natural' | 'casual';
};

export type ExecutorResult =
  | { mode: 'ready'; draft: EmailDraft }
  | { mode: 'copy'; draft: EmailDraft; notice: string }
  | { mode: 'no_ai'; notice: string };

export async function draftEmail(input: {
  to: string;
  subject: string;
  context: string;
  tone?: string;
}): Promise<ExecutorResult> {
  if (!capabilities.ai.available) {
    return {
      mode: 'no_ai',
      notice: 'Sin IA — redacta manualmente.',
    };
  }

  const tone = (input.tone ?? 'natural') as EmailDraft['tone'];
  const toneDesc = tone === 'formal' ? 'formal y profesional' : tone === 'casual' ? 'casual y cercano' : 'natural y directo';

  const SYSTEM = `Eres Vera, asistente de Sebastián. Redacta un email ${toneDesc}.
Devuelve SOLO el cuerpo del email en español (sin asunto, sin "De:", sin saludos genéricos al principio si el tono es casual).
Máximo 150 palabras. Concreto y sin relleno.`;

  const result = await callClaude(
    `Destinatario: ${input.to}\nAsunto: ${input.subject}\nContexto: ${input.context}`,
    SYSTEM,
    400,
  );

  const body = result.ok ? result.text : `${input.context}\n\nSaludos,\nSebastián`;

  const draft: EmailDraft = {
    to: input.to,
    subject: input.subject,
    body,
    tone,
  };

  if (!capabilities.email) {
    return { mode: 'copy', draft, notice: 'Sin Resend configurado — copia el texto y envía manualmente.' };
  }

  return { mode: 'ready', draft };
}

export async function sendEmail(draft: EmailDraft): Promise<{ ok: boolean; messageId?: string }> {
  if (!capabilities.email) return { ok: false };

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL ?? 'Vera <vera@vera.app>',
      to: [draft.to],
      subject: draft.subject,
      text: draft.body,
    });
    if (error) return { ok: false };
    return { ok: true, messageId: data?.id };
  } catch {
    return { ok: false };
  }
}
