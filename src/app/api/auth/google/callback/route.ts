import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/googleCalendar';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/settings?gcal=error', req.url));
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    await db.insert(memory)
      .values({ key: 'google_tokens', value: JSON.stringify(tokens) })
      .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(tokens), updatedAt: new Date() } });

    return NextResponse.redirect(new URL('/settings?gcal=ok', req.url));
  } catch {
    return NextResponse.redirect(new URL('/settings?gcal=error', req.url));
  }
}
