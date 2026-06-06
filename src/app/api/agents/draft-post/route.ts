import { NextRequest, NextResponse } from 'next/server';
import { draftPost } from '@/lib/agents/DraftAgent';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await draftPost(body);
  return NextResponse.json(result);
}
