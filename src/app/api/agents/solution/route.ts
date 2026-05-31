import { NextRequest, NextResponse } from 'next/server';
import { runSolutionAgent } from '@/lib/agents/SolutionAgent';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { problem } = await req.json();
  if (!problem?.trim()) return NextResponse.json({ error: 'problem required' }, { status: 400 });
  const result = await runSolutionAgent(problem);
  return NextResponse.json(result);
}
