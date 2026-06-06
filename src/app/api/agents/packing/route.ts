import { NextRequest, NextResponse } from 'next/server';
import { generatePackingList } from '@/lib/agents/PackingAgent';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await generatePackingList(body);
  return NextResponse.json(result);
}
