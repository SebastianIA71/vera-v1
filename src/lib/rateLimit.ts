const calls = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const times = (calls.get(key) ?? []).filter(t => now - t < windowMs);
  if (times.length >= max) return false;
  calls.set(key, [...times, now]);
  return true;
}
