import { NextRequest, NextResponse } from 'next/server';
import { runSearchAgent } from '@/lib/agents/SearchAgent';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 });
  const result = await runSearchAgent(query);
  return NextResponse.json(result);
}
