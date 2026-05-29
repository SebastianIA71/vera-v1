import { NextRequest, NextResponse } from 'next/server';
import { runAlertAgent } from '@/lib/agents/AlertAgent';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const result = await runAlertAgent();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[Cron AlertAgent]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
