'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';
import { currentEstimate, projectedEstimate } from '@/lib/utilities/estimate';

type Meter = {
  id: number; propertyId: string | null; type: string | null; name: string;
  provider: string | null; serial: string | null; polizaRef: string | null;
  unit: string | null; billingMonths: number | null; cycleAnchor: string | null;
  tariffConfig: string | null; active: boolean | null; notes: string | null;
};
type Reading = {
  id: number; meterId: number; date: string; value: number;
  origin: string | null; isCycleClose: boolean | null; billId: number | null;
  photoUrl: string | null; notes: string | null;
};
type Bill = {
  id: number; meterId: number; source: string | null; issueDate: string | null;
  periodStart: string | null; periodEnd: string | null; readingOpen: number | null;
  readingClose: number | null; consumption: number | null; amountTotal: number | null;
  breakdown: string | null; estimateAtClose: number | null; notes: string | null;
};
type Property = { id: string; name: string; icon: string | null; color: string | null };

const INPUT: React.CSSProperties = {
  background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8,
  padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)',
  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em',
  color: 'var(--text3)', marginBottom: 6, display: 'block',
};
const CYAN = 'var(--cyan)';
const eur = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const shortDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }).toUpperCase();

function Card({ label, children, accent }: { label: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: `.5px solid ${accent ?? 'var(--bg4)'}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function Detail({ meter, readings, bills, todayISO, onReading, onDelReading, onBill, onDelBill }: {
  meter: Meter;
  readings: Reading[];
  bills: Bill[];
  todayISO: string;
  onReading: (r: Reading) => void;
  onDelReading: (id: number) => void;
  onBill: (b: Bill) => void;
  onDelBill: (id: number) => void;
}) {
  const mReadings = useMemo(
    () => readings.filter(r => r.meterId === meter.id).sort((a, b) => b.date.localeCompare(a.date)),
    [readings, meter.id],
  );
  const mBills = bills.filter(b => b.meterId === meter.id);

  const cur = useMemo(() => currentEstimate(meter, mReadings, todayISO), [meter, mReadings, todayISO]);
  const proj = useMemo(() => projectedEstimate(meter, mReadings, cur, todayISO), [meter, mReadings, cur, todayISO]);

  const [date, setDate] = useState(todayISO);
  const [value, setValue] = useState('');
  const [rNotes, setRNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBill, setShowBill] = useState(false);

  const addReading = async () => {
    if (!value || saving) return;
    setSaving(true);
    const res = await fetch(`/api/suministros/${meter.id}/readings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, value: Number(value), notes: rNotes || null }),
    });
    if (res.ok) { onReading(await res.json()); setValue(''); setRNotes(''); }
    setSaving(false);
  };

  const delReading = async (id: number) => {
    if (!confirm('¿Eliminar esta lectura?')) return;
    await fetch(`/api/suministros/${meter.id}/readings?readingId=${id}`, { method: 'DELETE' });
    onDelReading(id);
  };

  // ── Bill form ──
  const [bf, setBf] = useState({ source: 'municipal', issueDate: '', periodStart: '', periodEnd: '', readingOpen: '', readingClose: '', consumption: '', amountTotal: '' });
  const setB = (k: keyof typeof bf, v: string) => setBf(p => ({ ...p, [k]: v }));
  const addBill = async () => {
    if (saving) return;
    setSaving(true);
    const res = await fetch(`/api/suministros/${meter.id}/bills`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: bf.source,
        issueDate: bf.issueDate || null,
        periodStart: bf.periodStart || null,
        periodEnd: bf.periodEnd || null,
        readingOpen: bf.readingOpen ? Number(bf.readingOpen) : null,
        readingClose: bf.readingClose ? Number(bf.readingClose) : null,
        consumption: bf.consumption ? Number(bf.consumption) : null,
        amountTotal: bf.amountTotal ? Number(bf.amountTotal) : null,
      }),
    });
    if (res.ok) {
      onBill(await res.json());
      setBf({ source: 'municipal', issueDate: '', periodStart: '', periodEnd: '', readingOpen: '', readingClose: '', consumption: '', amountTotal: '' });
      setShowBill(false);
    }
    setSaving(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>💧</span>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)', flex: 1 }}>{meter.name}</span>
          {meter.serial && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text3)', padding: '2px 8px', borderRadius: 6, border: '.5px solid var(--bg4)', background: 'var(--bg3)' }}>
              {meter.serial}
            </span>
          )}
        </div>
        {meter.provider && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.06em', color: 'var(--text3)', marginTop: 6 }}>{meter.provider}</div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 80px' }}>

        {/* Estimaciones */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
          <Card label={`ESTIMACIÓN ACTUAL · ${cur.cycle.label}`} accent={`${CYAN}44`}>
            {cur.available ? (
              <>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 26, color: CYAN, lineHeight: 1 }}>{eur(cur.bill.total)}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', marginTop: 6, lineHeight: 1.6 }}>
                  {cur.consumo} m³ · día {cur.dayOfCycle}/{cur.cycleLength} del ciclo<br />
                  base {shortDate(cur.baseDate)}{!cur.baseConfident && ' (sin factura de referencia)'} · lectura {shortDate(cur.asOfDate)}
                </div>
                <BreakdownRow bd={cur.bill} />
              </>
            ) : (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{cur.reason}</div>
            )}
          </Card>

          <Card label="PROYECCIÓN AL CIERRE" accent={proj.provisional ? 'var(--amber)44' : `${CYAN}44`}>
            {proj.bill ? (
              <>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 26, color: proj.provisional ? 'var(--amber)' : CYAN, lineHeight: 1 }}>{eur(proj.bill.total)}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', marginTop: 6, lineHeight: 1.6 }}>
                  ~{proj.projectedConsumo} m³ proyectados · {proj.method === 'seasonal' ? 'estacional' : proj.method === 'linear' ? 'lineal' : '—'}<br />
                  {proj.note}
                </div>
              </>
            ) : (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{proj.note}</div>
            )}
          </Card>
        </div>

        {/* Registrar lectura */}
        <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 12 }}>REGISTRAR LECTURA</div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 8 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...INPUT, colorScheme: 'dark', fontSize: 12 } as React.CSSProperties} />
            <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="Lectura del contador (m³, ej: 375)" style={INPUT} onKeyDown={e => e.key === 'Enter' && addReading()} />
          </div>
          <input value={rNotes} onChange={e => setRNotes(e.target.value)} placeholder="Nota opcional" style={{ ...INPUT, marginBottom: 8 }} />
          <button onClick={addReading} disabled={!value || saving} style={{
            width: '100%', padding: 10, borderRadius: 8, cursor: value ? 'pointer' : 'default',
            background: 'transparent', border: `.5px solid ${value ? CYAN : 'var(--bg4)'}`,
            color: value ? CYAN : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em',
          }}>
            {saving ? '···' : '+ AÑADIR LECTURA'}
          </button>
        </div>

        {/* Registrar factura real */}
        <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <button onClick={() => setShowBill(v => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)' }}>REGISTRAR FACTURA REAL</span>
            <span style={{ color: 'var(--text3)', fontSize: 14 }}>{showBill ? '−' : '+'}</span>
          </button>
          {showBill && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={LABEL}>ORIGEN</label>
                  <select value={bf.source} onChange={e => setB('source', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties}>
                    <option value="municipal">Municipal (Ajuntament)</option>
                    <option value="atib">ATIB (cànon sanejament)</option>
                  </select>
                </div>
                <div><label style={LABEL}>EMISIÓN</label><input type="date" value={bf.issueDate} onChange={e => setB('issueDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={LABEL}>PERIODO DESDE</label><input type="date" value={bf.periodStart} onChange={e => setB('periodStart', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
                <div><label style={LABEL}>PERIODO HASTA</label><input type="date" value={bf.periodEnd} onChange={e => setB('periodEnd', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={LABEL}>LECT. ANTERIOR</label><input type="number" value={bf.readingOpen} onChange={e => setB('readingOpen', e.target.value)} style={INPUT} /></div>
                <div><label style={LABEL}>LECT. ACTUAL</label><input type="number" value={bf.readingClose} onChange={e => setB('readingClose', e.target.value)} style={INPUT} /></div>
                <div><label style={LABEL}>CONSUMO m³</label><input type="number" value={bf.consumption} onChange={e => setB('consumption', e.target.value)} placeholder="auto" style={INPUT} /></div>
              </div>
              <div><label style={LABEL}>IMPORTE TOTAL €</label><input type="number" step="0.01" value={bf.amountTotal} onChange={e => setB('amountTotal', e.target.value)} style={INPUT} /></div>
              <button onClick={addBill} disabled={saving} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'transparent', border: `.5px solid ${CYAN}`, color: CYAN, fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', cursor: 'pointer' }}>
                {saving ? '···' : 'GUARDAR FACTURA'}
              </button>
            </div>
          )}
        </div>

        {/* Facturas */}
        {mBills.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 10 }}>
              FACTURAS · {mBills.length}
            </div>
            {mBills.map(b => {
              const delta = b.amountTotal != null && b.estimateAtClose != null ? Math.round((b.estimateAtClose - b.amountTotal) * 100) / 100 : null;
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '.5px solid var(--bg4)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, color: 'var(--text)' }}>
                      {eur(b.amountTotal)} <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>· {b.consumption ?? '—'} m³ · {b.source === 'atib' ? 'ATIB' : 'MUNICIPAL'}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>
                      {b.periodStart && b.periodEnd ? `${shortDate(b.periodStart)}–${shortDate(b.periodEnd)}` : (b.notes ?? '')}
                    </div>
                  </div>
                  {delta !== null && (
                    <div title="motor − real" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: Math.abs(delta) < 0.02 ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }}>
                      {delta === 0 ? '✓' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
                    </div>
                  )}
                  <button onClick={() => { if (confirm('¿Eliminar factura?')) { fetch(`/api/suministros/${meter.id}/bills?billId=${b.id}`, { method: 'DELETE' }); onDelBill(b.id); } }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, opacity: 0.5 }}>×</button>
                </div>
              );
            })}
            <div style={{ height: 20 }} />
          </>
        )}

        {/* Historial de lecturas */}
        {mReadings.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 10 }}>
              LECTURAS · {mReadings.length}
            </div>
            {mReadings.map((r, i) => {
              const prev = mReadings[i + 1];
              const diff = prev ? r.value - prev.value : null;
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '.5px solid var(--bg4)' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', flexShrink: 0, width: 78 }}>{shortDate(r.date)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, color: 'var(--text)', lineHeight: 1 }}>
                      {r.value.toLocaleString('es')} m³
                      {r.isCycleClose && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', color: CYAN, marginLeft: 6 }}>CIERRE</span>}
                    </div>
                    {(r.notes || (r.origin && r.origin !== 'manual')) && (
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>
                        {r.origin && r.origin !== 'manual' ? `[${r.origin}] ` : ''}{r.notes ?? ''}
                      </div>
                    )}
                  </div>
                  {diff !== null && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--blue)', flexShrink: 0 }}>
                      {diff >= 0 ? '+' : ''}{diff.toLocaleString('es')}
                    </div>
                  )}
                  <button onClick={() => delReading(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, opacity: 0.5 }}>×</button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function BreakdownRow({ bd }: { bd: { A: number; ivaA: number; B: number; ivaB: number; C: number; D: number } }) {
  const parts: [string, number][] = [['Agua', bd.A + bd.ivaA], ['Manten.', bd.B + bd.ivaB], ['Cànon fijo', bd.C], ['Cànon var.', bd.D]];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '.5px solid var(--bg4)' }}>
      {parts.map(([k, v]) => (
        <span key={k} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)' }}>
          {k} <span style={{ color: 'var(--text2)' }}>{v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </span>
      ))}
    </div>
  );
}

export default function SuministrosClient({
  meters: initialMeters, readings: initialReadings, bills: initialBills,
  urgentCount, staleCount, inboxCount, todayISO,
}: {
  meters: Meter[]; readings: Reading[]; bills: Bill[]; properties: Property[];
  urgentCount: number; staleCount: number; inboxCount: number; todayISO: string;
}) {
  const router = useRouter();
  const [meters] = useState<Meter[]>(initialMeters);
  const [readings, setReadings] = useState<Reading[]>(initialReadings);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [selected, setSelected] = useState<Meter | null>(initialMeters[0] ?? null);
  const [isMobile, setIsMobile] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const seed = async () => {
    setSeeding(true);
    await fetch('/api/suministros/seed', { method: 'POST' });
    setSeeding(false);
    router.refresh();
  };

  const detailProps = selected && {
    meter: selected, readings, bills, todayISO,
    onReading: (r: Reading) => setReadings(p => [r, ...p]),
    onDelReading: (id: number) => setReadings(p => p.filter(x => x.id !== id)),
    onBill: (b: Bill) => { setBills(p => [b, ...p]); router.refresh(); },
    onDelBill: (id: number) => { setBills(p => p.filter(x => x.id !== id)); setReadings(p => p.filter(x => x.billId !== id)); },
  };

  const empty = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 40, opacity: 0.4 }}>💧</div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SIN SUMINISTROS</div>
      <button onClick={seed} disabled={seeding} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', padding: '8px 16px', border: `.5px solid ${CYAN}55`, borderRadius: 8, background: 'transparent', color: CYAN, cursor: 'pointer' }}>
        {seeding ? '···' : 'SEMBRAR DATOS (SARAPITA · AGUA)'}
      </button>
    </div>
  );

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {(!isMobile || !selected) && (
          <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, borderRight: isMobile ? 'none' : '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)' }}>
                Suministros <em style={{ fontStyle: 'italic', color: CYAN }}>agua · luz · gas</em>
              </div>
              {meters.length > 0 && (
                <button onClick={seed} disabled={seeding} title="Re-sembrar datos base" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', padding: '5px 9px', border: '.5px solid var(--bg4)', borderRadius: 8, background: 'transparent', color: 'var(--text3)', cursor: 'pointer' }}>
                  {seeding ? '···' : 'SEED'}
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {meters.length === 0 ? empty : meters.map(m => {
                const mr = readings.filter(r => r.meterId === m.id).sort((a, b) => b.date.localeCompare(a.date));
                const cur = currentEstimate(m, mr, todayISO);
                const isSel = selected?.id === m.id;
                return (
                  <div key={m.id} onClick={() => setSelected(m)} style={{
                    padding: '12px 18px', cursor: 'pointer', borderBottom: '.5px solid var(--bg2)',
                    borderLeft: isSel ? `2px solid ${CYAN}` : '2px solid transparent',
                    background: isSel ? 'var(--bg2)' : 'transparent',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15 }}>{m.type === 'luz' ? '⚡' : m.type === 'gas' ? '🔥' : '💧'}</span>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                    </div>
                    <div style={{ paddingLeft: 23, fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.06em' }}>
                      {cur.available ? `~${eur(cur.bill.total)} · ${cur.consumo} m³` : (m.propertyId?.toUpperCase() ?? 'sin lecturas')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selected && (!isMobile || selected) && detailProps && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {isMobile && (
              <div style={{ padding: '10px 16px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
                <button onClick={() => setSelected(null)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ← SUMINISTROS
                </button>
              </div>
            )}
            <Detail key={selected.id} {...detailProps} />
          </div>
        )}

        {!selected && !isMobile && meters.length > 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 36, opacity: 0.4 }}>💧</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SELECCIONA UN SUMINISTRO</div>
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
