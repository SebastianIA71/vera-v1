import { capabilities } from '@/lib/capabilities';
import { callClaude } from '@/lib/claude';

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
