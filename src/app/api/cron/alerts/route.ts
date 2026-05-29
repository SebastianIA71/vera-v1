import { NextRequest, NextResponse } from 'next/server';

// Phase 3: AlertAgent. For now just acknowledges the cron call.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  return NextResponse.json({ ok: true, message: 'AlertAgent pending Phase 3' });
}
