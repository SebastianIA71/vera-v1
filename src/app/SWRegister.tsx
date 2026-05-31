'use client';

import { useEffect } from 'react';
import { urlB64ToUint8Array } from '@/lib/utils';

export default function SWRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then(async reg => {
      if (!('PushManager' in window)) return;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      // Solicitar permiso
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Suscribir
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vapidKey),
        });
      }

      // Registrar en servidor
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  return null;
}
