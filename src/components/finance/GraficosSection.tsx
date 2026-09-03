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

function deltaPct(vals: number[], idx: number, back: number): number | null {
  const j = idx - back;
  if (j < 0) return null;
  const prev = vals[j];
  if (prev === 0) return null;
  return ((vals[idx] - prev) / Math.abs(prev)) * 100;
}

function DeltaChip({ label, value }: { label: string; value: number | null }) {
  const color = value === null ? 'var(--text3)' : value > 0 ? 'var(--green)' : value < 0 ? 'var(--red)' : 'var(--text3)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 62 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--text3)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 16, fontWeight: 600, color }}>
        {value === null ? '—' : `${value > 0 ? '↑' : value < 0 ? '↓' : '·'} ${Math.abs(value).toFixed(1)}%`}
      </div>
    </div>
  );
}

function BigMetricCard({ label, sub, value, deltas, color, big = false }: {
  label: string; sub?: string; value: number;
  deltas: { m1: number | null; m6: number | null; y1: number | null };
  color: string; big?: boolean;
}) {
  return (
    <div style={{
      flex: big ? '1 1 340px' : '1 1 230px',
      background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14,
      padding: big ? '24px 28px' : '18px 20px',
    }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: big ? 12 : 11, letterSpacing: '.22em', color, marginBottom: sub ? 2 : 12 }}>
        {label}
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginBottom: 12 }}>{sub}</div>}
      <div style={{
        fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900,
        fontSize: big ? 56 : 36, color: 'var(--text)', lineHeight: 1, marginBottom: 18, letterSpacing: '-.02em',
      }}>
        {fmtBig(value)}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <DeltaChip label="MENSUAL" value={deltas.m1} />
        <DeltaChip label="6 MESES" value={deltas.m6} />
        <DeltaChip label="ANUAL" value={deltas.y1} />
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
  const i = asc.length - 1;

  const viviendaValues = asc.map(r => n(r.lf) + n(r.rs) + n(r.gh) + n(r.mh));
  const mortgages = asc.map(r => n(r.x1));
  const equities = asc.map((_, idx) => viviendaValues[idx] - mortgages[idx]);
  const pensionValues = asc.map(r => n(r.ps) + n(r.pm));
  const patrimonioNeto = asc.map((_, idx) => equities[idx] + pensionValues[idx]);

  const deltasFor = (vals: number[]) => ({
    m1: deltaPct(vals, i, 1),
    m6: deltaPct(vals, i, 6),
    y1: deltaPct(vals, i, 12),
  });

  return (
    <div style={{ padding: '28px 32px 100px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <BigMetricCard label="PATRIMONIO NETO" value={patrimonioNeto[i]} deltas={deltasFor(patrimonioNeto)} color="var(--gold)" big />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <BigMetricCard label="EQUITY VIVIENDA" value={equities[i]} deltas={deltasFor(equities)} color="var(--blue)" />
        <BigMetricCard label="PENSIÓN" value={pensionValues[i]} deltas={deltasFor(pensionValues)} color="var(--cyan)" />
      </div>

      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 12 }}>
        INMUEBLES
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {PROP_META.map(p => {
          const vals = asc.map(r => n((r as unknown as Record<string, number | null>)[p.key]) - n(r.x1) * p.mortgageShare);
          return (
            <BigMetricCard key={p.key} label={p.label} sub={p.location} value={vals[i]} deltas={deltasFor(vals)} color={p.color} />
          );
        })}
      </div>
    </div>
  );
}
