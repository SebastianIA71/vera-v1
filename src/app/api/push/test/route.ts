import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { capabilities } from '@/lib/capabilities';
import webpush from 'web-push';
import { eq } from 'drizzle-orm';

export async function POST() {
  if (!capabilities.push) {
    return NextResponse.json({ ok: false, notice: 'VAPID no configurado.' });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:vera@vera.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const subs = await db.select().from(pushSubscriptions);
  if (subs.length === 0) {
    return NextResponse.json({ ok: false, notice: 'Sin suscripciones registradas.' });
  }

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: 'Vera · test', body: 'Push notifications funcionando ✓', icon: '/icons/icon-192.png' }),
      );
      sent++;
    } catch {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
    }
  }

  return NextResponse.json({ ok: sent > 0, sent });
}
