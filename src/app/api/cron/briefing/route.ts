import { NextRequest, NextResponse } from 'next/server';
import { generateMorningBriefing } from '@/lib/briefing';

export const maxDuration = 20;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const result = await generateMorningBriefing(true);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[Cron Briefing]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
