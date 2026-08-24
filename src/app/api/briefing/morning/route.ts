import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 20;
import { rateLimit } from '@/lib/rateLimit';
import { generateMorningBriefing } from '@/lib/briefing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const force = req.nextUrl.searchParams.get('force') === '1';
  const result = await generateMorningBriefing(force);
  return NextResponse.json(result);
}
