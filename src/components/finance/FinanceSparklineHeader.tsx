'use client';

type FinanceEntry = { calcD: number|null; calcB: number|null; calcE: number|null };

function Sparkline({ values, color, height = 32 }: { values: number[]; color: string; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, pad = 3;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastY = height - pad - ((values[values.length - 1] - min) / range) * (height - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height}
      preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55"
        vectorEffect="non-scaling-stroke" />
      <circle cx={W} cy={lastY} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function FinanceSparklineHeader({ records }: { records: FinanceEntry[] }) {
  if (records.length === 0) return null;

  // records llegan en orden desc (más reciente primero)
  const last12 = records.slice(0, 12).reverse();
  const dVals = last12.map(r => r.calcD ?? 0);
  const bVals = last12.map(r => r.calcB ?? 0);
  const eVals = last12.map(r => r.calcE ?? 0);
  const lastD = records[0]?.calcD ?? 0;
  const lastB = records[0]?.calcB ?? 0;
  const lastE = records[0]?.calcE ?? 0;

  return (
    <>
      {/* D — protagonista */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, paddingBottom: 10, borderBottom: '.5px solid var(--bg4)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 2 }}>D · 12M</div>
          <div style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900, fontSize: 46, color: 'var(--gold)', lineHeight: 1, letterSpacing: '-.03em' }}>
            {lastD.toFixed(2)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Sparkline values={dVals} color="var(--gold)" height={48} />
        </div>
      </div>

      {/* B y E — lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 2 }}>B · 12M</div>
          <div style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900, fontSize: 30, color: 'var(--gold2)', lineHeight: 1, letterSpacing: '-.02em', marginBottom: 4 }}>
            {lastB.toFixed(1)}
          </div>
          <Sparkline values={bVals} color="var(--gold2)" height={32} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 2 }}>E · 12M</div>
          <div style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900, fontSize: 24, color: 'var(--green)', lineHeight: 1, letterSpacing: '-.02em', marginBottom: 4 }}>
            {lastE.toFixed(2)}
          </div>
          <Sparkline values={eVals} color="var(--green)" height={32} />
        </div>
      </div>
    </>
  );
}
