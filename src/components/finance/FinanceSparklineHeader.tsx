'use client';

type FinanceEntry = { calcD: number|null; calcB: number|null; calcA: number|null; calcE: number|null };

function Sparkline({ values, color, height = 28 }: { values: number[]; color: string; height?: number }) {
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

type MetricRowProps = {
  label: string;
  value: number;
  values: number[];
  color: string;
  fontSize?: number;
  decimals?: number;
  sparklineHeight?: number;
  border?: boolean;
};

function MetricRow({ label, value, values, color, fontSize = 28, decimals = 2, sparklineHeight = 28, border = true }: MetricRowProps) {
  return (
    <div style={{
      paddingBottom: border ? 10 : 0,
      marginBottom: border ? 10 : 0,
      borderBottom: border ? '.5px solid var(--bg4)' : 'none',
    }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontWeight: 900,
        fontSize,
        color,
        lineHeight: 1,
        letterSpacing: '-.02em',
        marginBottom: 5,
      }}>
        {value.toFixed(decimals)}
      </div>
      <Sparkline values={values} color={color} height={sparklineHeight} />
    </div>
  );
}

export function FinanceSparklineHeader({ records }: { records: FinanceEntry[] }) {
  if (records.length === 0) return null;

  const last12 = records.slice(0, 12).reverse();
  const dVals = last12.map(r => r.calcD ?? 0);
  const bVals = last12.map(r => r.calcB ?? 0);
  const aVals = last12.map(r => r.calcA ?? 0);
  const eVals = last12.map(r => r.calcE ?? 0);
  const lastD = records[0]?.calcD ?? 0;
  const lastB = records[0]?.calcB ?? 0;
  const lastA = records[0]?.calcA ?? 0;
  const lastE = records[0]?.calcE ?? 0;

  return (
    <div style={{ width: '100%' }}>
      <MetricRow label="D · 12M" value={lastD} values={dVals} color="var(--gold)"  fontSize={34} decimals={2} sparklineHeight={36} />
      <MetricRow label="B · 12M" value={lastB} values={bVals} color="var(--gold2)" fontSize={26} decimals={1} sparklineHeight={28} />
      <MetricRow label="A · 12M" value={lastA} values={aVals} color="var(--amber)" fontSize={26} decimals={1} sparklineHeight={28} />
      <MetricRow label="E · 12M" value={lastE} values={eVals} color="var(--green)" fontSize={22} decimals={2} sparklineHeight={26} border={false} />
    </div>
  );
}
