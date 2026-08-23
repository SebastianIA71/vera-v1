'use client';

type FinanceEntry = { calcD: number|null; calcB: number|null; calcA: number|null; calcE: number|null };

function Sparkline({ values, compareValues, color, height = 28 }: { values: number[]; compareValues?: number[]; color: string; height?: number }) {
  if (values.length < 2) return null;
  const hasCompare = !!compareValues && compareValues.length >= 2;
  const all = hasCompare ? [...values, ...compareValues!] : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const W = 100, pad = 3;
  const toPts = (vals: number[]) => vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const pts = toPts(values);
  const lastY = height - pad - ((values[values.length - 1] - min) / range) * (height - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height}
      preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {hasCompare && (
        <polyline points={toPts(compareValues!)} fill="none" stroke="var(--text3)" strokeWidth="1.3"
          strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4"
          vectorEffect="non-scaling-stroke" />
      )}
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
  prevValue?: number;
  values: number[];
  compareValues?: number[];
  color: string;
  fontSize?: number;
  decimals?: number;
  sparklineHeight?: number;
  border?: boolean;
};

function MetricRow({ label, value, prevValue, values, compareValues, color, fontSize = 28, decimals = 2, sparklineHeight = 28, border = true }: MetricRowProps) {
  const diff = prevValue !== undefined ? value - prevValue : null;
  const value12mAgo = values.length >= 12 ? values[values.length - 12] : undefined;
  const diff12m = value12mAgo !== undefined ? value - value12mAgo : null;
  return (
    <div style={{
      paddingBottom: border ? 10 : 0,
      marginBottom: border ? 10 : 0,
      borderBottom: border ? '.5px solid var(--bg4)' : 'none',
    }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
        <div style={{
          fontFamily: '"Arial Black", Arial, sans-serif',
          fontWeight: 900,
          fontSize,
          color,
          lineHeight: 1,
          letterSpacing: '-.02em',
        }}>
          {value.toFixed(decimals)}
        </div>
        {prevValue !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.06em', lineHeight: 1.3 }}>
              last: {prevValue.toFixed(decimals)}
              {diff !== null && (
                <span style={{ color: diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text3)' }}>
                  {' '}{diff > 0 ? '+' : ''}{diff.toFixed(decimals)}
                </span>
              )}
            </div>
            {value12mAgo !== undefined && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.06em', lineHeight: 1.3 }}>
                12m: {value12mAgo.toFixed(decimals)}
                {diff12m !== null && (
                  <span style={{ color: diff12m > 0 ? 'var(--green)' : diff12m < 0 ? 'var(--red)' : 'var(--text4)' }}>
                    {', '}{diff12m > 0 ? '+' : ''}{diff12m.toFixed(decimals)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Sparkline values={values} compareValues={compareValues} color={color} height={sparklineHeight} />
    </div>
  );
}

export function FinanceSparklineHeader({ records }: { records: FinanceEntry[] }) {
  if (records.length === 0) return null;

  const last24 = records.slice(0, 24).reverse();
  const pick = (key: keyof FinanceEntry) => last24.map(r => r[key] ?? 0);
  const dAll = pick('calcD'), bAll = pick('calcB'), aAll = pick('calcA'), eAll = pick('calcE');

  // últimos 12 meses = periodo actual; los 12 anteriores a esos = mismo periodo, año pasado
  const splitCompare = (all: number[]) => {
    const current = all.slice(-12);
    const compare = all.length >= 24 ? all.slice(0, 12) : undefined;
    return { current, compare };
  };
  const dVals = splitCompare(dAll), bVals = splitCompare(bAll), aVals = splitCompare(aAll), eVals = splitCompare(eAll);

  const lastD = records[0]?.calcD ?? 0;
  const lastB = records[0]?.calcB ?? 0;
  const lastA = records[0]?.calcA ?? 0;
  const lastE = records[0]?.calcE ?? 0;

  const prevD = dVals.current.length >= 2 ? dVals.current[dVals.current.length - 2] : undefined;
  const prevB = bVals.current.length >= 2 ? bVals.current[bVals.current.length - 2] : undefined;
  const prevA = aVals.current.length >= 2 ? aVals.current[aVals.current.length - 2] : undefined;
  const prevE = eVals.current.length >= 2 ? eVals.current[eVals.current.length - 2] : undefined;

  return (
    <div style={{ width: '100%' }}>
      <MetricRow label="D · PT" value={lastD} prevValue={prevD} values={dVals.current} compareValues={dVals.compare} color="var(--gold)"  fontSize={34} decimals={2} sparklineHeight={36} />
      <MetricRow label="B · PS" value={lastB} prevValue={prevB} values={bVals.current} compareValues={bVals.compare} color="var(--gold2)" fontSize={26} decimals={1} sparklineHeight={28} />
      <MetricRow label="A · CF" value={lastA} prevValue={prevA} values={aVals.current} compareValues={aVals.compare} color="var(--amber)" fontSize={26} decimals={1} sparklineHeight={28} />
      <MetricRow label="E · LI" value={lastE} prevValue={prevE} values={eVals.current} compareValues={eVals.compare} color="var(--green)" fontSize={22} decimals={2} sparklineHeight={26} border={false} />
    </div>
  );
}
