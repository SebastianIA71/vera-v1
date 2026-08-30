/**
 * Ciclos de facturación (bimestres). Puro, en UTC, sobre fechas 'YYYY-MM-DD'.
 *
 * Bimestres de agua Campos (anchor = enero):
 *   B1 ene-feb · B2 mar-abr · B3 may-jun · B4 jul-ago · B5 sep-oct · B6 nov-dic
 */

const MONTHS: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

export function anchorToIndex(anchor: string | null | undefined): number {
  if (!anchor) return 0;
  return MONTHS[anchor.slice(0, 3).toLowerCase()] ?? 0;
}

export type Cycle = {
  index: number;      // 1..N dentro del año (B1, B2, …)
  year: number;
  startISO: string;   // YYYY-MM-DD (inclusive)
  endISO: string;     // YYYY-MM-DD (inclusive, último día del ciclo)
  label: string;      // 'B4 2026 · jul–ago'
  lengthDays: number;
};

const MONTH_ABBR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function iso(y: number, m0: number, d: number): string {
  return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function daysInMonth(y: number, m0: number): number {
  return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
}
function parse(dateISO: string): { y: number; m0: number; d: number } {
  const [y, m, d] = dateISO.split('-').map(Number);
  return { y, m0: m - 1, d };
}
function diffDays(aISO: string, bISO: string): number {
  const a = parse(aISO), b = parse(bISO);
  return Math.round((Date.UTC(b.y, b.m0, b.d) - Date.UTC(a.y, a.m0, a.d)) / 86400000);
}

/** Ciclo de facturación que contiene `dateISO`. */
export function cycleOf(dateISO: string, billingMonths = 2, anchorIdx = 0): Cycle {
  const { y, m0 } = parse(dateISO);
  // meses desde el anchor de enero-del-año-base
  const monthsFromAnchor = (y * 12 + m0) - anchorIdx;
  const cycleNo = Math.floor(monthsFromAnchor / billingMonths);
  const startMonthAbs = cycleNo * billingMonths + anchorIdx;
  const startY = Math.floor(startMonthAbs / 12);
  const startM0 = startMonthAbs % 12;
  const endMonthAbs = startMonthAbs + billingMonths - 1;
  const endY = Math.floor(endMonthAbs / 12);
  const endM0 = endMonthAbs % 12;

  const startISO = iso(startY, startM0, 1);
  const endISO = iso(endY, endM0, daysInMonth(endY, endM0));
  const index = Math.round(((startM0 - anchorIdx + 12) % 12) / billingMonths) + 1;
  const label = `B${index} ${startY}${startY !== endY ? `–${endY}` : ''} · ${MONTH_ABBR[startM0]}–${MONTH_ABBR[endM0]}`;

  return {
    index,
    year: startY,
    startISO,
    endISO,
    label,
    lengthDays: diffDays(startISO, endISO) + 1,
  };
}

/** Días transcurridos dentro del ciclo hasta `dateISO` (1 = primer día). */
export function dayOfCycle(dateISO: string, cycle: Cycle): number {
  return Math.min(cycle.lengthDays, Math.max(1, diffDays(cycle.startISO, dateISO) + 1));
}

/** Ciclo inmediatamente anterior. */
export function prevCycle(cycle: Cycle, billingMonths = 2, anchorIdx = 0): Cycle {
  const prevDay = addDays(cycle.startISO, -1);
  return cycleOf(prevDay, billingMonths, anchorIdx);
}

export function addDays(dateISO: string, n: number): string {
  const { y, m0, d } = parse(dateISO);
  const t = new Date(Date.UTC(y, m0, d + n));
  return iso(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

export { diffDays };
