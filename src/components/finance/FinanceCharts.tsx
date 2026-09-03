'use client';

/* ─── helpers ─────────────────────────────────────── */
function scaleY(values: number[], height: number, pad: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  return (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
}

export function EmptyChart({ label = 'Datos insuficientes' }: { label?: string }) {
  return (
    <div style={{ padding: '28px 12px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)' }}>
      {label}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: it.color, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text2)' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Sparkline (KPI cards) ───────────────────────── */
export function Sparkline({ values, color, height = 30, width = 100 }: { values: number[]; color: string; height?: number; width?: number }) {
  if (values.length < 2) return null;
  const pad = 3;
  const y = scaleY(values, height, pad);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${y(v)}`).join(' ');
  const lastY = y(values[values.length - 1]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" vectorEffect="non-scaling-stroke" />
      <circle cx={width} cy={lastY} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ─── KPI card ────────────────────────────────────── */
export function KpiCard({ label, value, values, prevValue, color, suffix = '' }: {
  label: string; value: number; values: number[]; prevValue?: number; color: string; suffix?: string;
}) {
  const diff = prevValue !== undefined ? value - prevValue : null;
  const pct = prevValue ? (diff! / Math.abs(prevValue)) * 100 : null;
  return (
    <div style={{ flex: 1, minWidth: 130, background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <div style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900, fontSize: 20, color, lineHeight: 1 }}>
          {value.toFixed(0)}{suffix}
        </div>
        {pct !== null && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: pct > 0 ? 'var(--green)' : pct < 0 ? 'var(--red)' : 'var(--text3)' }}>
            {pct > 0 ? '↑' : pct < 0 ? '↓' : '·'} {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
      <Sparkline values={values} color={color} height={24} />
    </div>
  );
}

/* ─── Overlay line/area chart ────────────────────────
   Varias series sobre la misma escala — para "dos líneas superpuestas" */
export type ChartSeries = { name: string; color: string; values: number[]; area?: boolean };

export function LineAreaChart({ labels, series, height = 150 }: { labels: string[]; series: ChartSeries[]; height?: number }) {
  const width = 640;
  if (labels.length < 2) return <EmptyChart />;
  const pad = 8;
  const all = series.flatMap(s => s.values);
  const y = scaleY(all, height, pad);
  const x = (i: number) => (i / (labels.length - 1)) * (width - pad * 2) + pad;

  return (
    <div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--bg4)" strokeWidth="1" />
          {series.map(s => {
            const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
            return (
              <g key={s.name}>
                {s.area && (
                  <polygon
                    points={`${pad},${height - pad} ${pts} ${width - pad},${height - pad}`}
                    fill={s.color} fillOpacity="0.14" stroke="none"
                  />
                )}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r="2.6" fill={s.color} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginTop: 3, letterSpacing: '.06em' }}>
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <Legend items={series.map(s => ({ label: s.name, color: s.color }))} />
    </div>
  );
}

/* ─── Comparación de barras (tú vs índice) ───────────── */
export function CompareBarChart({ labels, values, compareValues, color, compareColor = '#8a8a8a', height = 110 }: {
  labels: string[]; values: (number | null)[]; compareValues: (number | null)[]; color: string; compareColor?: string; height?: number;
}) {
  const width = 640;
  const nums = [...values, ...compareValues].filter((v): v is number => v !== null);
  if (nums.length < 2) return <EmptyChart label="Sin datos de índice todavía" />;
  const maxAbs = Math.max(...nums.map(Math.abs), 0.1);
  const pad = 8;
  const zeroY = height / 2;
  const scaleH = (height / 2 - pad) / maxAbs;
  const groupW = (width - pad * 2) / labels.length;
  const barW = Math.max(3, groupW * 0.32);

  return (
    <div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
          <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke="var(--bg4)" strokeWidth="1" />
          {labels.map((_, i) => {
            const gx = pad + i * groupW + groupW / 2;
            const v = values[i];
            const c = compareValues[i];
            return (
              <g key={i}>
                {v !== null && (
                  <rect x={gx - barW - 1} y={v >= 0 ? zeroY - v * scaleH : zeroY} width={barW} height={Math.abs(v) * scaleH} fill={color} rx="1.5" />
                )}
                {c !== null && (
                  <rect x={gx + 1} y={c >= 0 ? zeroY - c * scaleH : zeroY} width={barW} height={Math.abs(c) * scaleH} fill={compareColor} rx="1.5" fillOpacity="0.75" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginTop: 3, letterSpacing: '.06em' }}>
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <Legend items={[{ label: 'TÚ · % MENSUAL', color }, { label: 'ÍNDICE', color: compareColor }]} />
    </div>
  );
}

/* ─── Waterfall — qué aportó cada pata al cambio del mes ── */
export function WaterfallChart({ steps, height = 150 }: {
  steps: { label: string; value: number; kind: 'start' | 'delta' | 'end' }[]; height?: number;
}) {
  const width = 640;
  const pad = 10;
  if (steps.length < 2) return <EmptyChart />;

  let running = 0;
  const bars = steps.map(s => {
    if (s.kind === 'start' || s.kind === 'end') {
      const bar = { from: 0, to: s.value, ...s };
      running = s.value;
      return bar;
    }
    const from = running;
    running += s.value;
    return { from, to: running, ...s };
  });

  const allVals = bars.flatMap(b => [b.from, b.to]);
  const y = scaleY(allVals, height, pad);
  const n = bars.length;
  const groupW = (width - pad * 2) / n;
  const barW = groupW * 0.5;

  const colorFor = (b: typeof bars[number]) =>
    b.kind !== 'delta' ? 'var(--gold2)' : b.value >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height + 20}`} width="100%" height={height + 20} preserveAspectRatio="none">
          {bars.map((b, i) => {
            const gx = pad + i * groupW + groupW / 2;
            const yTop = y(Math.max(b.from, b.to));
            const yBot = y(Math.min(b.from, b.to));
            return (
              <g key={i}>
                <rect x={gx - barW / 2} y={yTop} width={barW} height={Math.max(2, yBot - yTop)} fill={colorFor(b)} rx="2" />
                <text x={gx} y={yTop - 6} textAnchor="middle" fontSize="10" fontFamily="var(--font-dm-mono)" fill={colorFor(b)}>
                  {b.kind === 'delta' && b.value > 0 ? '+' : ''}{b.value.toFixed(0)}
                </text>
                <text x={gx} y={height + 14} textAnchor="middle" fontSize="8" fontFamily="var(--font-dm-mono)" fill="var(--text3)" letterSpacing=".04em">
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
