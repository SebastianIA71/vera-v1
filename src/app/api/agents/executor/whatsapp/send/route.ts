import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsApp } from '@/lib/agents/ExecutorAgent';

export async function POST(req: NextRequest) {
  const draft = await req.json();
  const result = await sendWhatsApp(draft);
  return NextResponse.json(result);
}
