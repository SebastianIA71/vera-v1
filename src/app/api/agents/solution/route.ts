import { NextRequest, NextResponse } from 'next/server';
import { runSolutionAgent } from '@/lib/agents/SolutionAgent';

export async function POST(req: NextRequest) {
  const { problem } = await req.json();
  if (!problem?.trim()) return NextResponse.json({ error: 'problem required' }, { status: 400 });
  const result = await runSolutionAgent(problem);
  return NextResponse.json(result);
}
