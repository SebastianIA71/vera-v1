const KEY = 'vera_snm';

export type SnmState = {
  date: string;    // 'YYYY-MM-DD'
  active: string[]; // ['snmAgua', 'snmCaminar', ...]
};

export function getTodaySnm(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const state: SnmState = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (state.date !== today) return [];
    return state.active;
  } catch { return []; }
}

export function toggleSnm(key: string): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const current = getTodaySnm();
  const next = current.includes(key)
    ? current.filter(k => k !== key)
    : [...current, key];
  localStorage.setItem(KEY, JSON.stringify({ date: today, active: next }));
  return next;
}

export function setSnmActiveForToday(keys: string[]): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify({ date: today, active: keys }));
  } catch {}
}
