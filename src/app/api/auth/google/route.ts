import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/googleCalendar';

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET no configurados' }, { status: 503 });
  }
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
