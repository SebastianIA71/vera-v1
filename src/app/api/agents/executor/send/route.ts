import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/agents/ExecutorAgent';

export async function POST(req: NextRequest) {
  const draft = await req.json();
  const result = await sendEmail(draft);
  return NextResponse.json(result);
}
