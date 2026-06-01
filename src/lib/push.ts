import { db } from '@/lib/db';
import { pushSubscriptions, notifications } from '@/lib/db/schema';
import { capabilities } from '@/lib/capabilities';
import { desc, eq } from 'drizzle-orm';
import webpush from 'web-push';

if (capabilities.push) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:vera@vera.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function sendPush(
  title: string,
  body: string,
  cooldownKey?: string,
  cooldownHours = 1,
): Promise<boolean> {
  if (!capabilities.push) return false;

  if (cooldownKey) {
    const recent = await db.select().from(notifications)
      .where(eq(notifications.cooldownKey, cooldownKey))
      .orderBy(desc(notifications.sentAt))
      .limit(1);
    if (recent.length > 0 && recent[0].sentAt) {
      const hoursAgo = (Date.now() - recent[0].sentAt.getTime()) / 3600000;
      if (hoursAgo < cooldownHours) return false;
    }
  }

  const subs = await db.select().from(pushSubscriptions);
  let sent = false;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, icon: '/icons/icon-192.png' }),
      );
      sent = true;
    } catch {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
    }
  }

  if (sent && cooldownKey) {
    await db.insert(notifications).values({
      cooldownKey, title, body, sentAt: new Date(),
    }).catch(() => {});
  }

  return sent;
}
