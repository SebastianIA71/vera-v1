import { NextResponse } from 'next/server';
import { computeBill } from '@/lib/utilities/water-campos';
import { AGUA_CAMPOS_2025 } from '@/lib/utilities/tariff';
import { BILL_ORACLE } from '@/lib/utilities/fixtures';

export const dynamic = 'force-dynamic';

/**
 * Canario del motor de cálculo: valida computeBill() contra las 4 facturas
 * reales de Porrassa 60. Si algún día falla → ha cambiado una tarifa
 * (BOIB / ATIB) y hay que revisar src/lib/utilities/tariff.ts.
 */
export async function GET() {
  const results = BILL_ORACLE.map(({ consumo, total }) => {
    const got = computeBill(consumo, AGUA_CAMPOS_2025);
    const delta = Math.round((got.total - total) * 100) / 100;
    return { consumo, esperado: total, calculado: got.total, delta, ok: Math.abs(delta) < 0.005, breakdown: got };
  });
  const ok = results.every(r => r.ok);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 500 });
}
