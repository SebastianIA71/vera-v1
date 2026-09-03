'use client';

import { useEffect, useState, useCallback } from 'react';
import { LineAreaChart, CompareBarChart, WaterfallChart, KpiCard } from './FinanceCharts';

type Rec = {
  date: string;
  lf: number | null; rs: number | null; gh: number | null; mh: number | null;
  x1: number | null; ps: number | null; pm: number | null;
};

type Benchmark = { id: number; category: string; date: string; value: number; source: string | null };

const MONTHS_SHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
function fmtShort(d: string): string {
  const [y, m] = d.split('-');
  return `${MONTHS_SHORT[Number(m) - 1]} ${y.slice(2)}`;
}
const n = (v: number | null | undefined) => v ?? 0;

const PROP_META = [
  { key: 'lf' as const, label: 'LF', location: 'Palma de Mallorca', mortgageShare: 0.30, color: 'var(--gold2)' },
  { key: 'rs' as const, label: 'RS', location: 'Campos · Sa Ràpita', mortgageShare: 0.70, color: 'var(--blue)' },
  { key: 'gh' as const, label: 'GH', location: 'Marratxí', mortgageShare: 0, color: 'var(--green)' },
  { key: 'mh' as const, label: 'MH', location: 'Palma de Mallorca', mortgageShare: 0, color: 'var(--purple)' },
];

/* ─── Panel de índice de referencia (buscar + manual) ───── */
function BenchmarkPanel({ category, label, onSaved }: { category: 'vivienda' | 'pension'; label: string; onSaved: () => void }) {
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{ value: number; source: string; summary: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  const search = async () => {
    setSearching(true); setNotice(null); setDraft(null);
    try {
      const res = await fetch('/api/finance/benchmarks/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }),
      }).then(r => r.json());
      if (res.mode === 'draft') setDraft({ value: res.value, source: res.source, summary: res.summary });
      else setNotice(res.notice ?? 'Sin resultado.');
    } catch {
      setNotice('Error al buscar. Inténtalo de nuevo.');
    } finally {
      setSearching(false);
    }
  };

  const save = async (value: number, source: string) => {
    setSaving(true);
    try {
      const date = new Date().toISOString().slice(0, 7) + '-01';
      await fetch('/api/finance/benchmarks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, date, value, source }),
      });
      setDraft(null); setManual(''); setNotice(null);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const btnStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', cursor: 'pointer' };
  const inpStyle: React.CSSProperties = { background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '6px 9px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, outline: 'none', width: 80 };

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--text3)', marginBottom: 8 }}>
        ÍNDICE DE REFERENCIA — {label}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={search} disabled={searching} style={{ ...btnStyle, opacity: searching ? 0.5 : 1 }}>
          {searching ? '···' : '🔍 BUSCAR ÍNDICE'}
        </button>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)' }}>o a mano:</span>
        <input value={manual} onChange={e => setManual(e.target.value)} type="number" step="0.01" placeholder="% mes" style={inpStyle} />
        <button onClick={() => manual && save(Number(manual), 'Manual')} disabled={!manual || saving} style={{ ...btnStyle, opacity: (!manual || saving) ? 0.4 : 1 }}>
          GUARDAR
        </button>
      </div>

      {draft && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, border: '.5px solid var(--gold-ring)' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, color: 'var(--gold)', marginBottom: 3 }}>{draft.value > 0 ? '+' : ''}{draft.value.toFixed(2)}%</div>
          {draft.summary && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{draft.summary}</div>}
          {draft.source && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginBottom: 6, wordBreak: 'break-all' }}>{draft.source}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => save(draft.value, draft.source)} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.5 : 1 }}>{saving ? '···' : 'CONFIRMAR ✓'}</button>
            <button onClick={() => setDraft(null)} style={{ ...btnStyle, borderColor: 'var(--text3)', color: 'var(--text3)' }}>DESCARTAR</button>
          </div>
        </div>
      )}
      {notice && <div style={{ marginTop: 6, fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--amber)' }}>{notice}</div>}
    </div>
  );
}

/* ─── Sección principal ──────────────────────────────── */
export function GraficosSection({ records }: { records: Rec[] }) {
  const [benchmarks, setBenchmarks] = useState<Record<string, Benchmark[]>>({ vivienda: [], pension: [] });

  const loadBenchmarks = useCallback(async () => {
    const [v, p] = await Promise.all([
      fetch('/api/finance/benchmarks?category=vivienda').then(r => r.json()).catch(() => []),
      fetch('/api/finance/benchmarks?category=pension').then(r => r.json()).catch(() => []),
    ]);
    setBenchmarks({ vivienda: v, pension: p });
  }, []);

  useEffect(() => { loadBenchmarks(); }, [loadBenchmarks]);

  if (records.length < 2) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text3)' }}>
        HACEN FALTA AL MENOS 2 REGISTROS PARA VER GRÁFICOS
      </div>
    );
  }

  const asc = [...records].sort((a, b) => a.date.localeCompare(b.date)).slice(-24);
  const labels = asc.map(r => fmtShort(r.date));

  const viviendaValues = asc.map(r => n(r.lf) + n(r.rs) + n(r.gh) + n(r.mh));
  const mortgages = asc.map(r => n(r.x1));
  const equities = asc.map((_, i) => viviendaValues[i] - mortgages[i]);
  const pensionValues = asc.map(r => n(r.ps) + n(r.pm));
  const patrimonioNeto = asc.map((_, i) => equities[i] + pensionValues[i]);

  const pctChange = (vals: number[]) => vals.map((v, i) => {
    if (i === 0 || vals[i - 1] === 0) return null;
    return ((v - vals[i - 1]) / Math.abs(vals[i - 1])) * 100;
  });
  const viviendaPct = pctChange(viviendaValues);
  const pensionPct = pctChange(pensionValues);

  const benchFor = (category: string) => asc.map(r => {
    const row = benchmarks[category]?.find(b => b.date.slice(0, 7) === r.date.slice(0, 7));
    return row ? row.value : null;
  });
  const viviendaBench = benchFor('vivienda');
  const pensionBench = benchFor('pension');

  const last = asc[asc.length - 1];
  const lastMortgage = mortgages[mortgages.length - 1];

  const waterfallSteps = (() => {
    if (asc.length < 2) return null;
    const i = asc.length - 1;
    const deltaEquity = equities[i] - equities[i - 1];
    const deltaPension = pensionValues[i] - pensionValues[i - 1];
    return [
      { label: labels[i - 1], value: patrimonioNeto[i - 1], kind: 'start' as const },
      { label: 'VIVIENDA', value: deltaEquity, kind: 'delta' as const },
      { label: 'PENSIÓN', value: deltaPension, kind: 'delta' as const },
      { label: labels[i], value: patrimonioNeto[i], kind: 'end' as const },
    ];
  })();

  const SectionCard = ({ title, hint, color, children }: { title: string; hint: string; color: string; children: React.ReactNode }) => (
    <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.24em', color, marginBottom: 3 }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>{hint}</div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '16px 20px 80px' }}>
      {/* Patrimonio neto — vista global primero */}
      <SectionCard title="PATRIMONIO NETO" hint="Equity vivienda + pensión, mes a mes." color="var(--gold)">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <KpiCard label="EQUITY VIVIENDA" value={equities[equities.length - 1]} values={equities} prevValue={equities.length >= 2 ? equities[equities.length - 2] : undefined} color="var(--blue)" />
          <KpiCard label="PENSIÓN" value={pensionValues[pensionValues.length - 1]} values={pensionValues} prevValue={pensionValues.length >= 2 ? pensionValues[pensionValues.length - 2] : undefined} color="var(--cyan)" />
          <KpiCard label="PATRIMONIO NETO" value={patrimonioNeto[patrimonioNeto.length - 1]} values={patrimonioNeto} prevValue={patrimonioNeto.length >= 2 ? patrimonioNeto[patrimonioNeto.length - 2] : undefined} color="var(--gold)" />
        </div>
        <LineAreaChart labels={labels} series={[{ name: 'PATRIMONIO NETO', color: 'var(--gold)', values: patrimonioNeto, area: true }]} />
        {waterfallSteps && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text3)', marginBottom: 4 }}>
              QUÉ APORTÓ CADA PATA ESTE MES
            </div>
            <WaterfallChart steps={waterfallSteps} />
          </div>
        )}
      </SectionCard>

      {/* Vivienda */}
      <SectionCard title="VIVIENDA" hint="Valor total vs. equity (valor − hipoteca pendiente)." color="var(--blue)">
        <LineAreaChart
          labels={labels}
          series={[
            { name: 'VALOR TOTAL', color: 'var(--blue)', values: viviendaValues, area: true },
            { name: 'EQUITY', color: 'var(--gold)', values: equities },
          ]}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {PROP_META.map(p => {
            const val = n((last as unknown as Record<string, number | null>)[p.key]);
            const debt = lastMortgage * p.mortgageShare;
            const eq = val - debt;
            return (
              <div key={p.key} style={{ flex: 1, minWidth: 110, background: 'var(--bg3)', border: `.5px solid ${p.color}33`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: p.color, marginBottom: 2 }}>{p.label}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', marginBottom: 5 }}>{p.location}</div>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{eq.toFixed(0)}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)' }}>equity {debt > 0 ? `· hip. ${debt.toFixed(0)}` : '· sin hipoteca'}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text3)', marginBottom: 4 }}>
            VARIACIÓN % MENSUAL VS. ÍNDICE DE ZONA
          </div>
          <CompareBarChart labels={labels} values={viviendaPct} compareValues={viviendaBench} color="var(--blue)" />
        </div>
        <BenchmarkPanel category="vivienda" label="precio vivienda Baleares" onSaved={loadBenchmarks} />
      </SectionCard>

      {/* Pensión */}
      <SectionCard title="PLAN DE PENSIONES" hint="Valor total PS+PM. Incluye aportaciones — sin desglosar aún." color="var(--cyan)">
        <LineAreaChart labels={labels} series={[{ name: 'VALOR TOTAL', color: 'var(--cyan)', values: pensionValues, area: true }]} />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text3)', marginBottom: 4 }}>
            VARIACIÓN % MENSUAL VS. MSCI WORLD
          </div>
          <CompareBarChart labels={labels} values={pensionPct} compareValues={pensionBench} color="var(--cyan)" />
        </div>
        <BenchmarkPanel category="pension" label="MSCI World" onSaved={loadBenchmarks} />
      </SectionCard>
    </div>
  );
}
