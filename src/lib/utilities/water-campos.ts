/**
 * Motor de cálculo de la factura de agua (Campos / Porrassa 60).
 * Funciones PURAS — sin DB, sin fechas del sistema. Testeable contra fixtures.
 *
 * Verificado al céntimo contra 4 facturas reales:
 *   13 m³ → 33,10 €   ·   38 m³ → 109,48 €
 *  109 m³ → 850,25 €  ·  211 m³ → 1.698,33 €
 */
import type { PriceBand, WaterTariff } from './tariff';

export type BillBreakdown = {
  consumo: number;   // m³ enteros usados en el cálculo
  A: number;         // preu de l'aigua
  ivaA: number;      // IVA sobre A
  B: number;         // cuota manteniment
  ivaB: number;      // IVA sobre B
  C: number;         // cànon quota fixa
  D: number;         // cànon quota variable
  total: number;
};

/** Redondeo monetario estable (evita el error de coma flotante en x.xx5). */
export function round2(x: number): number {
  return Math.round((x + (x >= 0 ? 1e-9 : -1e-9)) * 100) / 100;
}

/** Precio único del tramo A donde cae el consumo total (no marginal). */
export function priceForTotal(bands: PriceBand[], m3: number): number {
  for (const b of bands) {
    if (b.upTo === null || m3 <= b.upTo) return b.price;
  }
  return bands[bands.length - 1].price;
}

/** Suma marginal por bloques (tramo D): cada bloque cobra sólo su porción. */
export function marginalSum(bands: PriceBand[], m3: number): number {
  let remaining = m3;
  let lower = 0;
  let acc = 0;
  for (const b of bands) {
    if (remaining <= 0) break;
    const upper = b.upTo === null ? Infinity : b.upTo;
    const span = Math.min(remaining, upper - lower);
    acc += span * b.price;
    remaining -= span;
    lower = upper;
  }
  return acc;
}

/**
 * Calcula la factura para un consumo dado (m³). Los decimales no se facturan:
 * se trunca a m³ enteros antes de aplicar tramos.
 */
export function computeBill(consumoRaw: number, tariff: WaterTariff): BillBreakdown {
  const consumo = Math.max(0, Math.floor(consumoRaw));

  const aRaw = consumo * priceForTotal(tariff.priceA, consumo);
  const A = round2(aRaw);
  const ivaA = round2(aRaw * tariff.ivaA);

  const B = round2(tariff.cuotaB);
  const ivaB = round2(tariff.cuotaB * tariff.ivaB);

  const C = round2(tariff.cuotaC);

  const D = round2(marginalSum(tariff.blocksD, consumo));

  const total = round2(A + ivaA + B + ivaB + C + D);

  return { consumo, A, ivaA, B, ivaB, C, D, total };
}
