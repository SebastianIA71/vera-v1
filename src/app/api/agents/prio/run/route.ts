import { NextResponse } from 'next/server';
import { runPrioAgent } from '@/lib/agents/PrioAgent';

export async function POST() {
  try {
    const result = await runPrioAgent();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[PrioAgent]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
