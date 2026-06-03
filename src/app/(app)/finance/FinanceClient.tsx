'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';
import MobilePageHeader from '@/components/layout/MobilePageHeader';

type FinanceRecord = {
  id: number; date: string;
  vb: number|null; xc: number|null; ps: number|null; pm: number|null;
  lf: number|null; rs: number|null; gh: number|null; mh: number|null;
  doo: number|null; mo: number|null; so: number|null;
  x1: number|null; x2: number|null; x3: number|null;
  x4: number|null; x5: number|null; x6: number|null;
  calcA: number|null; calcB: number|null; calcC: number|null;
  calcD: number|null; calcE: number|null;
};

type FormState = Omit<FinanceRecord, 'id'|'calcA'|'calcB'|'calcC'|'calcD'|'calcE'>;

const MONTHS_ES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function fmtDate(d: string): string {
  const [y, m] = d.split('-');
  return `${MONTHS_ES[Number(m)-1]} ${y}`;
}

function computeCalcs(f: FormState) {
  const vb=f.vb??0, xc=f.xc??0, ps=f.ps??0, pm=f.pm??0;
  const lf=f.lf??0, rs=f.rs??0, gh=f.gh??0, mh=f.mh??0;
  const doo=f.doo??0, mo=f.mo??0, so=f.so??0;
  const A = vb + xc;
  const B = vb + xc + ps + pm;
  const C = lf + rs + gh + mh / 2;
  const D = (A + B + C) / 1000;
  const E = doo + mo + so;
  return { A, B, C, D, E };
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().slice(0,10),
  vb:0, xc:0, ps:0, pm:0,
  lf:0, rs:0, gh:0, mh:0,
  doo:0, mo:0, so:0,
  x1:0, x2:0, x3:0, x4:0, x5:0, x6:0,
};

function n(v: number|null|undefined): number { return v ?? 0; }
function fmt(v: number): string { return v.toFixed(2); }
function fmtD(v: number): string { return v.toFixed(4); }

/* ─── NumInput ────────────────────────────────────── */
function NumInput({ label, value, onChange, color = 'var(--gold2)' }: {
  label: string; value: number|null; onChange: (v: number) => void; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>
        {label}
      </div>
      <input
        type="number"
        step="0.01"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        style={{
          background: 'var(--bg3)', border: '.5px solid var(--bg4)',
          borderRadius: 8, padding: '7px 10px', color: 'var(--text)',
          fontFamily: 'var(--font-dm-mono)', fontSize: 13, outline: 'none',
          width: '100%', boxSizing: 'border-box',
          WebkitAppearance: 'none', MozAppearance: 'textfield',
        } as React.CSSProperties}
        onFocus={e => (e.target.style.borderColor = color)}
        onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
      />
    </div>
  );
}

/* ─── Group ───────────────────────────────────────── */
function Group({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.26em',
        color, borderBottom: `.5px solid ${color}33`, paddingBottom: 5, marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── CalcDisplay ─────────────────────────────────── */
function CalcDisplay({ calcs }: { calcs: { A:number; B:number; C:number; D:number; E:number } }) {
  const { A, B, C, D, E } = calcs;
  return (
    <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.26em', color: 'var(--text4)', marginBottom: 12 }}>
        CALCULADOS — SÓLO LECTURA
      </div>

      {/* A B C en una fila */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[['A', fmt(A), 'VB+XC', 'var(--gold2)'], ['B', fmt(B), 'VB+XC+PS+PM', 'var(--gold)'], ['C', fmt(C), 'LF+RS+GH+MH/2', 'var(--amber)']].map(([lbl, val, hint, col]) => (
          <div key={lbl} style={{ textAlign: 'center', padding: '8px 6px', borderRadius: 8, background: 'var(--bg3)', border: `.5px solid ${col}22` }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: col as string, letterSpacing: '.2em', marginBottom: 3 }}>{lbl}</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 22, color: col as string, lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, color: 'var(--text3)', marginTop: 3 }}>{hint}</div>
          </div>
        ))}
      </div>

      {/* D — protagonista */}
      <div style={{ textAlign: 'center', padding: '14px 12px', borderRadius: 10, background: 'rgba(196,168,106,0.06)', border: '.5px solid rgba(196,168,106,0.25)', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.2em', marginBottom: 4 }}>
          D · (A+B+C) / 1000
        </div>
        <div style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900, fontSize: 52, color: 'var(--gold)', lineHeight: 1, letterSpacing: '-.03em' }}>
          {fmtD(D)}
        </div>
      </div>

      {/* E */}
      <div style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', border: '.5px solid var(--green)22' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--green)', letterSpacing: '.2em', marginBottom: 3 }}>E · DO+MO+SO</div>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 26, color: 'var(--green)', lineHeight: 1 }}>{fmt(E)}</div>
      </div>
    </div>
  );
}

/* ─── Form ────────────────────────────────────────── */
function FinanceForm({ initial, onSave, onDelete, onCancel, saving }: {
  initial: (FinanceRecord & { isNew?: boolean }) | null;
  onSave: (f: FormState) => void;
  onDelete?: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isNew = !initial || initial.isNew;
  const [form, setForm] = useState<FormState>(() =>
    initial && !initial.isNew ? {
      date: initial.date,
      vb: n(initial.vb), xc: n(initial.xc), ps: n(initial.ps), pm: n(initial.pm),
      lf: n(initial.lf), rs: n(initial.rs), gh: n(initial.gh), mh: n(initial.mh),
      doo: n(initial.doo), mo: n(initial.mo), so: n(initial.so),
      x1: n(initial.x1), x2: n(initial.x2), x3: n(initial.x3),
      x4: n(initial.x4), x5: n(initial.x5), x6: n(initial.x6),
    } : { ...EMPTY_FORM }
  );

  useEffect(() => {
    if (!initial) return;
    setForm(initial.isNew ? { ...EMPTY_FORM } : {
      date: initial.date,
      vb: n(initial.vb), xc: n(initial.xc), ps: n(initial.ps), pm: n(initial.pm),
      lf: n(initial.lf), rs: n(initial.rs), gh: n(initial.gh), mh: n(initial.mh),
      doo: n(initial.doo), mo: n(initial.mo), so: n(initial.so),
      x1: n(initial.x1), x2: n(initial.x2), x3: n(initial.x3),
      x4: n(initial.x4), x5: n(initial.x5), x6: n(initial.x6),
    });
  }, [initial?.id]);

  const set = (field: keyof FormState, val: number) => setForm(f => ({ ...f, [field]: val }));
  const calcs = computeCalcs(form);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)' }}>
          {isNew ? <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Nuevo</em> : fmtDate(form.date)}
        </div>
        <button onClick={onCancel} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← LISTA
        </button>
      </div>

      {/* Fecha */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 5 }}>FECHA</div>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, outline: 'none', colorScheme: 'dark' }}
          onFocus={e => (e.target.style.borderColor = 'var(--gold2)')}
          onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
        />
      </div>

      {/* Grupo 1 */}
      <Group label="GRUPO 1 — VB · XC · PS · PM" color="var(--gold2)">
        <NumInput label="VB"  value={form.vb}  onChange={v => set('vb',  v)} color="var(--gold2)" />
        <NumInput label="XC"  value={form.xc}  onChange={v => set('xc',  v)} color="var(--gold2)" />
        <NumInput label="PS"  value={form.ps}  onChange={v => set('ps',  v)} color="var(--gold2)" />
        <NumInput label="PM"  value={form.pm}  onChange={v => set('pm',  v)} color="var(--gold2)" />
      </Group>

      {/* Grupo 2 */}
      <Group label="GRUPO 2 — LF · RS · GH · MH" color="var(--blue)">
        <NumInput label="LF"  value={form.lf}  onChange={v => set('lf',  v)} color="var(--blue)" />
        <NumInput label="RS"  value={form.rs}  onChange={v => set('rs',  v)} color="var(--blue)" />
        <NumInput label="GH"  value={form.gh}  onChange={v => set('gh',  v)} color="var(--blue)" />
        <NumInput label="MH"  value={form.mh}  onChange={v => set('mh',  v)} color="var(--blue)" />
      </Group>

      {/* Grupo 3 */}
      <Group label="GRUPO 3 — DO · MO · SO" color="var(--green)">
        <NumInput label="DO"  value={form.doo} onChange={v => set('doo', v)} color="var(--green)" />
        <NumInput label="MO"  value={form.mo}  onChange={v => set('mo',  v)} color="var(--green)" />
        <NumInput label="SO"  value={form.so}  onChange={v => set('so',  v)} color="var(--green)" />
        <div /> {/* spacer */}
      </Group>

      {/* Libre */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.26em', color: 'var(--amber)', borderBottom: '.5px solid var(--amber)33', paddingBottom: 5, marginBottom: 8 }}>
          LIBRE — X1 · X2 · X3 · X4 · X5 · X6
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <NumInput label="X1" value={form.x1} onChange={v => set('x1', v)} color="var(--amber)" />
          <NumInput label="X2" value={form.x2} onChange={v => set('x2', v)} color="var(--amber)" />
          <NumInput label="X3" value={form.x3} onChange={v => set('x3', v)} color="var(--amber)" />
          <NumInput label="X4" value={form.x4} onChange={v => set('x4', v)} color="var(--amber)" />
          <NumInput label="X5" value={form.x5} onChange={v => set('x5', v)} color="var(--amber)" />
          <NumInput label="X6" value={form.x6} onChange={v => set('x6', v)} color="var(--amber)" />
        </div>
      </div>

      {/* Calculados */}
      <CalcDisplay calcs={calcs} />

      {/* Botones */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {onDelete && (
          <button onClick={onDelete} style={{ padding: '10px 14px', borderRadius: 10, border: '.5px solid var(--red)', background: 'transparent', color: 'var(--red)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', cursor: 'pointer' }}>
            BORRAR
          </button>
        )}
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.date}
          style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.2em', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
        >
          {saving ? '···' : isNew ? 'GUARDAR REGISTRO ✓' : 'ACTUALIZAR ✓'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────── */
export default function FinanceClient({ initialRecords }: { initialRecords: FinanceRecord[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [selected, setSelected] = useState<(FinanceRecord & { isNew?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleNew = () => setSelected({ ...EMPTY_FORM as unknown as FinanceRecord, id: -1, isNew: true, calcA: null, calcB: null, calcC: null, calcD: null, calcE: null });

  const handleSave = useCallback(async (form: FormState) => {
    setSaving(true);
    try {
      if (selected && !selected.isNew) {
        const res = await fetch(`/api/finance/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setRecords(prev => prev.map(r => r.id === updated.id ? updated : r).sort((a,b) => b.date.localeCompare(a.date)));
        setSelected(updated);
      } else {
        const res = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setRecords(prev => [created, ...prev].sort((a,b) => b.date.localeCompare(a.date)));
        setSelected(created);
      }
    } finally {
      setSaving(false);
    }
  }, [selected]);

  const handleDelete = useCallback(async () => {
    if (!selected || selected.isNew) return;
    await fetch(`/api/finance/${selected.id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== selected.id));
    setSelected(null);
  }, [selected]);

  const handleSeed = async () => {
    setSeeding(true);
    const res = await fetch('/api/finance/seed', { method: 'POST' });
    const data = await res.json();
    if (data.inserted > 0) router.refresh();
    setSeeding(false);
  };

  /* ── List panel ── */
  const ListPanel = (
    <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, borderRight: isMobile ? 'none' : '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isMobile && <MobilePageHeader title="Finanzas" />}
      <div style={{ padding: '14px 18px 10px', flexShrink: 0 }}>
        {!isMobile && (
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 12 }}>
            Finanzas <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>mensuales</em>
          </div>
        )}
        <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
          <button onClick={handleNew} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', cursor: 'pointer' }}>
            + NUEVO
          </button>
          {records.length === 0 && (
            <button onClick={handleSeed} disabled={seeding} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '.5px solid var(--text3)', background: 'transparent', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', cursor: 'pointer', opacity: seeding ? 0.5 : 1 }}>
              {seeding ? '···' : 'CARGAR EXCEL'}
            </button>
          )}
        </div>
        <div style={{ height: .5, background: 'var(--bg4)' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 28, color: 'var(--gold)' }}>✦</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', textAlign: 'center' }}>SIN REGISTROS</div>
            <button onClick={handleSeed} disabled={seeding} style={{ marginTop: 6, padding: '7px 14px', borderRadius: 8, border: '.5px solid var(--text3)', background: 'transparent', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', cursor: 'pointer' }}>
              CARGAR DATOS DEL EXCEL →
            </button>
          </div>
        ) : records.map(r => {
          const D = r.calcD ?? 0;
          const isActive = selected?.id === r.id;
          const dColor = D >= 2.5 ? 'var(--amber)' : D >= 2.2 ? 'var(--green)' : 'var(--text2)';
          return (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              style={{
                padding: '10px 18px', borderBottom: '.5px solid var(--bg2)',
                cursor: 'pointer', transition: 'background .1s',
                background: isActive ? 'var(--bg2)' : 'transparent',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--gold2)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, fontWeight: 500, color: 'var(--text)', letterSpacing: '.06em' }}>
                  {fmtDate(r.date)}
                </div>
                <div style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontWeight: 900, fontSize: 18, color: dColor, lineHeight: 1, letterSpacing: '-.02em' }}>
                  {fmtD(D)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.08em' }}>
                <span>A <span style={{ color: 'var(--gold2)' }}>{(r.calcA??0).toFixed(1)}</span></span>
                <span>B <span style={{ color: 'var(--gold2)' }}>{(r.calcB??0).toFixed(1)}</span></span>
                <span>C <span style={{ color: 'var(--amber)' }}>{(r.calcC??0).toFixed(0)}</span></span>
                <span>E <span style={{ color: 'var(--green)' }}>{(r.calcE??0).toFixed(1)}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    if (selected) {
      return (
        <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
          <FinanceForm
            initial={selected}
            onSave={handleSave}
            onDelete={selected.isNew ? undefined : handleDelete}
            onCancel={() => setSelected(null)}
            saving={saving}
          />
        </div>
      );
    }
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
        {ListPanel}
      </div>
    );
  }

  return (
    <DesktopShell urgentCount={0} staleCount={0} inboxCount={0}>
      {ListPanel}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '.5px solid var(--bg4)' }}>
          <FinanceForm
            initial={selected}
            onSave={handleSave}
            onDelete={selected.isNew ? undefined : handleDelete}
            onCancel={() => setSelected(null)}
            saving={saving}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 36, color: 'var(--gold)', opacity: 0.4 }}>✦</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>
            SELECCIONA UN MES O CREA NUEVO
          </div>
          <button onClick={handleNew} style={{ marginTop: 6, padding: '8px 18px', borderRadius: 8, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}>
            + NUEVO REGISTRO
          </button>
        </div>
      )}
    </DesktopShell>
  );
}
