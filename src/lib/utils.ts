// ── Greeting ────────────────────────────────────────────
export function getGreeting(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 19 ? 'afternoon' : 'evening';
}

// ── Persona search URL ───────────────────────────────────
export function personaSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`"${name}" fictional character`)}`;
}

// ── Task border color ────────────────────────────────────
export function taskBorderColor(prioFinal: number, lastActionAt?: Date | string | null): string {
  if (prioFinal === 10) return '#ff0040';
  if (prioFinal >= 8)  return 'var(--red)';
  if (lastActionAt) {
    const days = Math.floor((Date.now() - new Date(lastActionAt).getTime()) / 86400000);
    if (days >= 14 && prioFinal >= 4) return 'var(--amber)';
  }
  return 'transparent';
}

// ── Base64url → Uint8Array (Web Push) ───────────────────
export function urlB64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

// ── Days between two dates ───────────────────────────────
export function daysTo(date: Date | string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

// ── Format time difference (relative or date) ────────────
export function fmtTime(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  let date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
