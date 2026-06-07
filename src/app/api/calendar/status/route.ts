import { NextResponse } from 'next/server';
import { isConnected } from '@/lib/googleCalendar';

export async function GET() {
  const connected = await isConnected().catch(() => false);
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return NextResponse.json({ connected, configured });
}
