'use client';

type Rec = {
  date: string;
  lf: number | null; rs: number | null; gh: number | null; mh: number | null;
  x1: number | null; ps: number | null; pm: number | null;
};

const n = (v: number | null | undefined) => v ?? 0;

const PROP_META = [
  { key: 'lf' as const, label: 'LF', location: 'Palma de Mallorca', mortgageShare: 0.30, color: 'var(--gold2)' },
  { key: 'rs' as const, label: 'RS', location: 'Campos · Sa Ràpita', mortgageShare: 0.70, color: 'var(--blue)' },
  { key: 'gh' as const, label: 'GH', location: 'Marratxí', mortgageShare: 0, color: 'var(--green)' },
  { key: 'mh' as const, label: 'MH', location: 'Palma de Mallorca', mortgageShare: 0, color: 'var(--purple)' },
];

function fmtBig(v: number): string {
  const sign = v < 0 ? '-' : '';
  const abs = Math.round(Math.abs(v));
  return sign + abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* valor en miles de € — "5,7% (72,4M€)" (M = mil, no millón).
   Los campos ya se guardan en miles de €, así que no hay que dividir de nuevo. */
function fmtThousands(v: number): string {
  const s = Math.abs(v).toFixed(1).replace('.', ',');
  return `${v < 0 ? '-' : ''}${s}M€`;
}

function delta(vals: number[], idx: number, back: number): { pct: number | null; abs: number | null } {
  const j = idx - back;
  if (j < 0) return { pct: null, abs: null };
  const prev = vals[j];
  const abs = vals[idx] - prev;
  const pct = prev === 0 ? null : (abs / Math.abs(prev)) * 100;
  return { pct, abs };
}

function computeDeltas(vals: number[]) {
  const idx = vals.length - 1;
  return { m1: delta(vals, idx, 1), m6: delta(vals, idx, 6), y1: delta(vals, idx, 12) };
}

/* ─── sparkline de crecimiento ───────────────────────── */
function Sparkline({ values, color, height = 34 }: { values: number[]; color: string; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  const pad = 3;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastY = height - pad - ((values[values.length - 1] - min) / range) * (height - pad * 2);
  return (
    <svg viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block', marginBottom: 14, overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.75" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy={lastY} r="2.6" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DeltaChip({ label, pct, abs }: { label: string; pct: number | null; abs: number | null }) {
  const color = pct === null ? 'var(--text3)' : pct > 0 ? 'var(--green)' : pct < 0 ? 'var(--red)' : 'var(--text3)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 68 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--text3)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 14, fontWeight: 600, color, whiteSpace: 'nowrap' }}>
        {pct === null ? '—' : `${pct > 0 ? '↑' : pct < 0 ? '↓' : '·'} ${Math.abs(pct).toFixed(1)}%`}
      </div>
      {abs !== null && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, fontWeight: 600, color }}>
          ({fmtThousands(abs)})
        </div>
      )}
    </div>
  );
}

/* ─── gráfico de tarta ───────────────────────────────── */
type PieSlice = { label: string; value: number; color: string };

function PieChart({ slices, size = 128 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2;
  let angle = -90;
  const toXY = (a: number) => {
    const rad = (a * Math.PI) / 180;
    return [r + r * Math.cos(rad), r + r * Math.sin(rad)];
  };
  const arcs = slices.map(s => {
    const frac = s.value / total;
    const startAngle = angle;
    const endAngle = angle + frac * 360;
    angle = endAngle;
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const [x1, y1] = toXY(startAngle);
    const [x2, y2] = toXY(endAngle);
    const d = frac >= 0.999
      ? `M ${r} ${0} A ${r} ${r} 0 1 1 ${r - 0.01} 0 Z`
      : `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { d, color: s.color, label: s.label, pct: frac * 100, value: s.value };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} stroke="var(--bg2)" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.08em', color: 'var(--text2)', minWidth: 32 }}>{a.label}</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 12, fontWeight: 700, color: a.color }}>{a.pct.toFixed(1)}%</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)' }}>{fmtThousands(a.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieCard({ title, slices }: { title: string; slices: PieSlice[] }) {
  return (
    <div style={{ flex: '1 1 300px', minWidth: 280, background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)', marginBottom: 16 }}>
        {title}
      </div>
      <PieChart slices={slices} />
    </div>
  );
}

function BigMetricCard({ label, sub, vals, color, big = false }: {
  label: string; sub?: string; vals: number[]; color: string; big?: boolean;
}) {
  const value = vals[vals.length - 1];
  const deltas = computeDeltas(vals);
  return (
    <div style={{
      flex: big ? '1 1 340px' : '1 1 0',
      minWidth: big ? 340 : 200,
      background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14,
      padding: big ? '24px 28px' : '18px 20px',
    }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: big ? 12 : 11, letterSpacing: '.22em', color, marginBottom: sub ? 2 : 12 }}>
        {label}
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginBottom: 12 }}>{sub}</div>}
      <div style={{
        fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
        fontSize: big ? 56 : 36, color: 'var(--text)', lineHeight: 1, marginBottom: 14, letterSpacing: '-.02em',
      }}>
        {fmtBig(value)}
      </div>
      <Sparkline values={vals.slice(-24)} color={color} height={big ? 44 : 34} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <DeltaChip label="MENSUAL" {...deltas.m1} />
        <DeltaChip label="6 MESES" {...deltas.m6} />
        <DeltaChip label="ANUAL" {...deltas.y1} />
      </div>
    </div>
  );
}

export function GraficosSection({ records }: { records: Rec[] }) {
  if (records.length < 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 40, color: 'var(--gold)' }}>✦</div>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, color: 'var(--text)' }}>Sin datos suficientes</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)' }}>
          HACEN FALTA AL MENOS 2 REGISTROS
        </div>
      </div>
    );
  }

  const asc = [...records].sort((a, b) => a.date.localeCompare(b.date));

  const viviendaValues = asc.map(r => n(r.lf) + n(r.rs) + n(r.gh) + n(r.mh));
  const mortgages = asc.map(r => n(r.x1));
  const equities = asc.map((_, idx) => viviendaValues[idx] - mortgages[idx]);
  const pensionValues = asc.map(r => n(r.ps) + n(r.pm));
  const patrimonioNeto = asc.map((_, idx) => equities[idx] + pensionValues[idx]);

  const propRawVals = (key: 'lf' | 'rs' | 'gh' | 'mh') =>
    asc.map(r => n((r as unknown as Record<string, number | null>)[key]));

  const propEquityVals = (key: 'lf' | 'rs', share: number) =>
    asc.map(r => n((r as unknown as Record<string, number | null>)[key]) - n(r.x1) * share);

  const last = asc[asc.length - 1];
  const lastLN = n(last.x1);
  const lfValue = n(last.lf), rsValue = n(last.rs);
  const lfLoan = lastLN * 0.30, rsLoan = lastLN * 0.70;

  return (
    <div style={{ padding: '28px 32px 100px', maxWidth: 1160, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <BigMetricCard label="PATRIMONIO NETO" vals={patrimonioNeto} color="var(--gold)" big />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <BigMetricCard label="EQUITY VIVIENDA" vals={equities} color="var(--blue)" />
        <BigMetricCard label="PENSIÓN" vals={pensionValues} color="var(--cyan)" />
      </div>

      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 12 }}>
        INMUEBLES — VALOR TOTAL (SIN DESCONTAR HIPOTECA)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: 16, marginBottom: 12, overflowX: 'auto' }}>
        {PROP_META.map(p => (
          <BigMetricCard key={p.key} label={p.label} sub={p.location} vals={propRawVals(p.key)} color={p.color} />
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 12, marginTop: 16 }}>
        EQUITY — CON HIPOTECA DESCONTADA (LF 30% · RS 70% de LN)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(200px, 1fr))', gap: 16 }}>
        <BigMetricCard label="LF · EQUITY" sub="Palma de Mallorca" vals={propEquityVals('lf', 0.30)} color="var(--gold2)" />
        <BigMetricCard label="RS · EQUITY" sub="Campos · Sa Ràpita" vals={propEquityVals('rs', 0.70)} color="var(--blue)" />
      </div>

      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 12, marginTop: 28 }}>
        COMPOSICIÓN
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <PieCard
          title="INMUEBLES — % DEL VALOR TOTAL"
          slices={PROP_META.map(p => ({
            label: p.label,
            value: n((last as unknown as Record<string, number | null>)[p.key]),
            color: p.color,
          }))}
        />
        <PieCard
          title="LF — HIPOTECA VS. EQUITY"
          slices={[
            { label: 'LOAN', value: lfLoan, color: 'var(--red)' },
            { label: 'EQUITY', value: lfValue - lfLoan, color: 'var(--gold2)' },
          ]}
        />
        <PieCard
          title="RS — HIPOTECA VS. EQUITY"
          slices={[
            { label: 'LOAN', value: rsLoan, color: 'var(--red)' },
            { label: 'EQUITY', value: rsValue - rsLoan, color: 'var(--blue)' },
          ]}
        />
      </div>
    </div>
  );
}
