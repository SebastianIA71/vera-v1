import { NextRequest, NextResponse } from 'next/server';
import { draftEmail } from '@/lib/agents/ExecutorAgent';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await draftEmail(body);
  return NextResponse.json(result);
}
