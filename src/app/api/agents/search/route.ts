import { NextRequest, NextResponse } from 'next/server';
import { runSearchAgent } from '@/lib/agents/SearchAgent';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 });
  const result = await runSearchAgent(query);
  return NextResponse.json(result);
}
