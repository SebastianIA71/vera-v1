import { NextRequest, NextResponse } from 'next/server';
import { runPrioAgent } from '@/lib/agents/PrioAgent';
import { runAlertAgent } from '@/lib/agents/AlertAgent';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/run-agent
//
// Ejecuta un agente manualmente (reemplaza /api/cron/* para requests desde UI).
// Protegido por proxy — requiere sesión válida.
//
// Parámetros:
//   agent: 'prio' | 'alerts' (query param)
//
// Respuesta:
//   { ok: true, updated?: number, alerts?: number, ... }
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const agent = searchParams.get('agent');

  if (!agent) {
    return NextResponse.json(
      { error: 'agent query param required (prio|alerts)' },
      { status: 400 }
    );
  }

  try {
    if (agent === 'prio') {
      const result = await runPrioAgent();
      return NextResponse.json({ ok: true, ...result });
    }

    if (agent === 'alerts') {
      const result = await runAlertAgent();
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json(
      { error: `Unknown agent: ${agent}` },
      { status: 400 }
    );
  } catch (err) {
    console.error(`[Admin RunAgent ${agent}]`, err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Redirige POST para que sea más fácil de debuggear en navegador
  return POST(req);
}
