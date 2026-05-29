import { NextRequest, NextResponse } from 'next/server';
import { runPrioAgent } from '@/lib/agents/PrioAgent';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const result = await runPrioAgent();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[Cron PrioAgent]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
