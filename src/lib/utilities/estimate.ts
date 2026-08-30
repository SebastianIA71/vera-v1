/**
 * Estimación de factura de agua — actual y proyectada.
 * Puro: recibe medidor + lecturas + fecha; no toca DB ni Date.now().
 */
import { computeBill, type BillBreakdown } from './water-campos';
import { parseTariffConfig, resolveTariff } from './tariff';
import { cycleOf, dayOfCycle, anchorToIndex, type Cycle } from './cycle';

export type MeterLike = {
  tariffConfig?: string | null;
  billingMonths?: number | null;
  cycleAnchor?: string | null;
};
export type ReadingLike = {
  date: string;                 // YYYY-MM-DD
  value: number;
  isCycleClose?: boolean | null;
};

export type CurrentEstimate =
  | { available: false; reason: string; cycle: Cycle }
  | {
      available: true;
      cycle: Cycle;
      dayOfCycle: number;
      cycleLength: number;
      consumo: number;
      bill: BillBreakdown;
      baseDate: string;
      baseConfident: boolean;   // true si la base viene de una factura real
      asOfDate: string;
    };

export type ProjectedEstimate = {
  method: 'seasonal' | 'linear' | 'none';
  provisional: boolean;
  projectedConsumo: number;
  bill: BillBreakdown | null;
  note: string;
};

function cfg(meter: MeterLike) {
  return {
    tariff: parseTariffConfig(meter.tariffConfig),
    months: meter.billingMonths ?? 2,
    anchor: anchorToIndex(meter.cycleAnchor),
  };
}

export function currentEstimate(
  meter: MeterLike,
  readings: ReadingLike[],
  todayISO: string,
): CurrentEstimate {
  const { tariff, months, anchor } = cfg(meter);
  const cycle = cycleOf(todayISO, months, anchor);

  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const upToToday = sorted.filter(r => r.date <= todayISO);
  const latest = upToToday[upToToday.length - 1];
  if (!latest) return { available: false, reason: 'Sin lecturas registradas.', cycle };

  // Base = cierre de ciclo anterior. Preferencia: factura real anterior al ciclo.
  const closesBefore = sorted.filter(r => r.isCycleClose && r.date < cycle.startISO);
  let base = closesBefore[closesBefore.length - 1];
  let baseConfident = !!base;
  if (!base) {
    const anyBefore = sorted.filter(r => r.date < cycle.startISO);
    base = anyBefore[anyBefore.length - 1];
  }
  if (!base) {
    base = sorted[0];
    baseConfident = false;
  }
  if (base.date === latest.date) {
    return {
      available: false,
      reason: 'La última lectura es la de referencia — registra una lectura nueva del ciclo en curso.',
      cycle,
    };
  }

  const consumo = Math.max(0, Math.floor(latest.value - base.value));
  const bill = computeBill(consumo, resolveTariff(tariff, todayISO));

  return {
    available: true,
    cycle,
    dayOfCycle: dayOfCycle(latest.date, cycle),
    cycleLength: cycle.lengthDays,
    consumo,
    bill,
    baseDate: base.date,
    baseConfident,
    asOfDate: latest.date,
  };
}

/** Interpola el valor de contador en `targetISO` entre lecturas que lo rodean. */
function interp(readings: ReadingLike[], targetISO: string): number | null {
  const before = readings.filter(r => r.date <= targetISO).pop();
  const after = readings.find(r => r.date >= targetISO);
  if (!before) return null;
  if (!after || before.date === after.date) return before.value;
  const span = new Date(after.date).getTime() - new Date(before.date).getTime();
  const pos = new Date(targetISO).getTime() - new Date(before.date).getTime();
  return before.value + (after.value - before.value) * (span ? pos / span : 0);
}

export function projectedEstimate(
  meter: MeterLike,
  readings: ReadingLike[],
  current: CurrentEstimate,
  todayISO: string,
): ProjectedEstimate {
  if (!current.available) {
    return { method: 'none', provisional: true, projectedConsumo: 0, bill: null, note: current.reason };
  }
  const { tariff, months, anchor } = cfg(meter);
  const { consumo, dayOfCycle: dOc, cycleLength } = current;

  if (dOc <= 1 || consumo <= 0) {
    return {
      method: 'none', provisional: true, projectedConsumo: consumo,
      bill: computeBill(consumo, resolveTariff(tariff, todayISO)),
      note: 'Muy pronto en el ciclo para proyectar.',
    };
  }

  // ── Intento estacional: fracción histórica consumida a este día-de-ciclo ──
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const byCycle = new Map<string, ReadingLike[]>();
  for (const r of sorted) {
    const c = cycleOf(r.date, months, anchor);
    const key = `${c.year}-${c.index}`;
    if (!byCycle.has(key)) byCycle.set(key, []);
    byCycle.get(key)!.push(r);
  }
  const fractions: number[] = [];
  for (const [, rs] of byCycle) {
    if (rs.length < 3) continue;
    const c = cycleOf(rs[0].date, months, anchor);
    if (c.endISO >= todayISO) continue;                // sólo ciclos ya cerrados
    const vStart = interp(rs, c.startISO);
    const vEnd = interp(rs, c.endISO);
    if (vStart === null || vEnd === null) continue;
    const totalC = vEnd - vStart;
    if (totalC <= 0) continue;
    const targetDay = new Date(c.startISO).getTime() + (dOc - 1) * 86400000;
    const targetISO = new Date(targetDay).toISOString().slice(0, 10);
    const vDay = interp(rs, targetISO);
    if (vDay === null) continue;
    const f = (vDay - vStart) / totalC;
    if (f > 0.02 && f <= 1) fractions.push(f);
  }

  let method: ProjectedEstimate['method'];
  let projectedConsumo: number;
  if (fractions.length >= 1) {
    const avg = fractions.reduce((s, x) => s + x, 0) / fractions.length;
    projectedConsumo = Math.ceil(consumo / avg);
    method = 'seasonal';
  } else {
    projectedConsumo = Math.ceil((consumo / dOc) * cycleLength);
    method = 'linear';
  }
  const provisional = method === 'linear' || fractions.length < 2;

  return {
    method,
    provisional,
    projectedConsumo,
    bill: computeBill(projectedConsumo, resolveTariff(tariff, todayISO)),
    note:
      method === 'seasonal'
        ? `Ajustado por ${fractions.length} ciclo(s) histórico(s).${provisional ? ' Poco histórico — provisional.' : ''}`
        : 'Proyección lineal — sin histórico suficiente, provisional.',
  };
}
