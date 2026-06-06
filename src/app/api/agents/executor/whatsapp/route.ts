import { NextRequest, NextResponse } from 'next/server';
import { draftWhatsApp } from '@/lib/agents/ExecutorAgent';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await draftWhatsApp(body);
  return NextResponse.json(result);
}
