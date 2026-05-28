import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ai: {
      primary: !!process.env.ANTHROPIC_API_KEY,
      fallback: !!process.env.OPENAI_API_KEY,
      available: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY),
    },
    voice: {
      clientSide: true,
      serverSide: !!process.env.OPENAI_API_KEY,
    },
    email: !!process.env.RESEND_API_KEY,
    whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    search: !!process.env.BRAVE_SEARCH_API_KEY,
    push: !!process.env.VAPID_PRIVATE_KEY,
  });
}
