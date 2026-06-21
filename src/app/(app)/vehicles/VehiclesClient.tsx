'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';

type Vehicle = {
  id: number; name: string; brand: string | null; model: string | null;
  plate: string | null; color: string | null;
  contractKmTotal: number | null; contractMonths: number | null;
  contractStartDate: Date | null; contractEndDate: Date | null;
  contractId: number | null; active: boolean | null; notes: string | null;
};

type KmLog = {
  id: number; vehicleId: number; date: string; km: number; notes: string | null;
};

const INPUT: React.CSSProperties = {
  background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8,
  padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)',
  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em',
  color: 'var(--text3)', marginBottom: 6, display: 'block',
};

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function calcPace(vehicle: Vehicle, logs: KmLog[]) {
  if (!vehicle.contractKmTotal || !vehicle.contractStartDate) return null;
  const start = new Date(vehicle.contractStartDate);
  const now   = new Date();
  const end   = vehicle.contractEndDate ? new Date(vehicle.contractEndDate) : new Date(start.getTime() + (vehicle.contractMonths ?? 48) * 30 * 24 * 3600 * 1000);
  const totalMonths  = monthsBetween(start, end) || 1;
  const elapsed      = Math.max(1, monthsBetween(start, now));
  const monthlyTarget = vehicle.contractKmTotal / totalMonths;
  const expectedNow   = Math.round(monthlyTarget * elapsed);

  const vehicleLogs = logs.filter(l => l.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date));
  const latestKm    = vehicleLogs[0]?.km ?? 0;
  const firstKm     = vehicleLogs[vehicleLogs.length - 1]?.km ?? 0;
  const actualKmDriven = latestKm - firstKm; // km driven since first log (approximation)

  // For pace we compare actual odometer vs expected odometer from contract start
  // Assume contract starts at 0 km driven (relative)
  const diff   = latestKm - expectedNow;
  const pct    = expectedNow > 0 ? (latestKm / expectedNow) * 100 : 100;

  let status: 'en_ritmo' | 'pasado' | 'corto' = 'en_ritmo';
  if (pct > 110) status = 'pasado';
  else if (pct < 90) status = 'corto';

  // Monthly pace from logs
  const currentMonthlyPace = elapsed > 0 ? latestKm / elapsed : monthlyTarget;
  const projected = Math.round(currentMonthlyPace * totalMonths);
  const remaining = vehicle.contractKmTotal - latestKm;
  const monthsLeft = Math.max(0, monthsBetween(now, end));

  return {
    monthlyTarget: Math.round(monthlyTarget),
    expectedNow,
    latestKm,
    diff,
    pct: Math.round(pct),
    status,
    projected,
    remaining,
    monthsLeft,
    totalMonths,
    elapsed,
    end,
  };
}

function StatusChip({ status }: { status: 'en_ritmo' | 'pasado' | 'corto' }) {
  const cfg = {
    en_ritmo: { label: 'EN RITMO',  color: 'var(--green)', border: '#1a3328' },
    pasado:   { label: 'PASADO',    color: 'var(--red)',   border: '#3a1818' },
    corto:    { label: 'CORTO',     color: 'var(--amber)', border: '#2a2010' },
  }[status];
  return (
    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', padding: '3px 8px', borderRadius: 999, border: `.5px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function VehicleForm({ vehicle, onClose, onSaved }: { vehicle?: Vehicle; onClose: () => void; onSaved: (updated: Vehicle) => void }) {
  const isEdit = !!vehicle;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:              vehicle?.name              ?? '',
    brand:             vehicle?.brand             ?? '',
    model:             vehicle?.model             ?? '',
    plate:             vehicle?.plate             ?? '',
    color:             vehicle?.color             ?? '#5ba8e8',
    contractKmTotal:   vehicle?.contractKmTotal   ?? '',
    contractMonths:    vehicle?.contractMonths    ?? '',
    contractStartDate: vehicle?.contractStartDate ? new Date(vehicle.contractStartDate).toISOString().slice(0,10) : '',
    contractEndDate:   vehicle?.contractEndDate   ? new Date(vehicle.contractEndDate).toISOString().slice(0,10)   : '',
    notes:             vehicle?.notes             ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const url    = isEdit ? `/api/vehicles/${vehicle!.id}` : '/api/vehicles';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      ...form,
      contractKmTotal:  form.contractKmTotal   ? Number(form.contractKmTotal)  : null,
      contractMonths:   form.contractMonths     ? Number(form.contractMonths)   : null,
      contractStartDate: form.contractStartDate || null,
      contractEndDate:   form.contractEndDate   || null,
    }) });
    const saved = await res.json();
    setSaving(false);
    onSaved(saved);
  };

  const COLORS = ['#5ba8e8','#9b7fe8','#4ecb8d','#e8a020','#e05c5c','#3ecfcf','#e8d5a3'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', marginBottom: 22 }}>
          {isEdit ? 'Editar' : 'Nuevo'} <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>vehículo</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>NOMBRE</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Porsche Taycan" style={INPUT} autoFocus /></div>
            <div><label style={LABEL}>MATRÍCULA</label><input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())} placeholder="1234 ABC" style={INPUT} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>MARCA</label><input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Porsche" style={INPUT} /></div>
            <div><label style={LABEL}>MODELO</label><input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Taycan" style={INPUT} /></div>
          </div>
          <div>
            <label style={LABEL}>COLOR</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ height: .5, background: 'var(--bg4)' }} />
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)' }}>CONTRATO DE RENTING</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>KM TOTALES CONTRATO</label><input type="number" value={form.contractKmTotal} onChange={e => set('contractKmTotal', e.target.value)} placeholder="90000" style={INPUT} /></div>
            <div><label style={LABEL}>DURACIÓN (meses)</label><input type="number" value={form.contractMonths} onChange={e => set('contractMonths', e.target.value)} placeholder="48" style={INPUT} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>INICIO CONTRATO</label><input type="date" value={form.contractStartDate} onChange={e => set('contractStartDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
            <div><label style={LABEL}>FIN CONTRATO</label><input type="date" value={form.contractEndDate} onChange={e => set('contractEndDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
          </div>
          <div><label style={LABEL}>NOTAS</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Concesionario, condiciones especiales..." style={{ ...INPUT, resize: 'none', lineHeight: 1.5 } as React.CSSProperties} /></div>
          <button onClick={save} disabled={!form.name.trim() || saving} style={{ width: '100%', padding: '13px', borderRadius: 10, background: form.name.trim() ? form.color : 'var(--bg3)', border: 'none', color: form.name.trim() ? '#fff' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em', cursor: form.name.trim() ? 'pointer' : 'default' }}>
            {saving ? 'GUARDANDO...' : isEdit ? 'GUARDAR CAMBIOS' : 'CREAR VEHÍCULO'}
          </button>
        </div>
      </div>
    </>
  );
}

function KmDetail({ vehicle, logs, onLogAdded, onLogDeleted, onEdit, onDeactivate, isWidget, onWidgetToggle }: {
  vehicle: Vehicle;
  logs: KmLog[];
  onLogAdded: (log: KmLog) => void;
  onLogDeleted: (id: number) => void;
  onEdit: () => void;
  onDeactivate: () => void;
  isWidget: boolean;
  onWidgetToggle: () => void;
}) {
  const color  = vehicle.color ?? '#5ba8e8';
  const pace   = calcPace(vehicle, logs);
  const vLogs  = logs.filter(l => l.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date));

  const [date,  setDate]  = useState(new Date().toISOString().slice(0,10));
  const [km,    setKm]    = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addLog = async () => {
    if (!km || saving) return;
    setSaving(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}/km`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, km: Number(km), notes: notes || null }),
    });
    const log = await res.json();
    onLogAdded(log);
    setKm('');
    setNotes('');
    setSaving(false);
  };

  const delLog = async (id: number) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await fetch(`/api/vehicles/${vehicle.id}/km?kmId=${id}`, { method: 'DELETE' });
    onLogDeleted(id);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)', flex: 1 }}>{vehicle.name}</span>
          {pace && <StatusChip status={pace.status} />}
          <button
            onClick={onWidgetToggle}
            title={isWidget ? 'Quitar del widget' : 'Mostrar en widget'}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', padding: '4px 10px', border: `.5px solid ${isWidget ? 'var(--gold2)' : 'var(--bg4)'}`, borderRadius: 7, background: isWidget ? 'rgba(196,168,106,.12)' : 'transparent', color: isWidget ? 'var(--gold2)' : 'var(--text3)', cursor: 'pointer' }}
          >
            {isWidget ? '★ WIDGET' : '☆ WIDGET'}
          </button>
          <button onClick={onEdit} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', padding: '4px 10px', border: '.5px solid var(--blue)44', borderRadius: 7, background: 'var(--blue)12', color: 'var(--blue)', cursor: 'pointer' }}>
            EDITAR
          </button>
          <button onClick={onDeactivate} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', padding: '4px 10px', border: '.5px solid var(--red)44', borderRadius: 7, background: 'transparent', color: 'var(--red)', cursor: 'pointer', opacity: 0.7 }}>
            DAR DE BAJA
          </button>
        </div>
        {vehicle.plate && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', color: 'var(--text3)', padding: '2px 8px', borderRadius: 6, border: '.5px solid var(--bg4)', background: 'var(--bg3)' }}>
            {vehicle.plate}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 80px' }}>

        {/* Pace cards */}
        {pace ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'KM ACTUALES',   value: pace.latestKm.toLocaleString('es'),    color },
              { label: 'OBJETIVO HOY',  value: pace.expectedNow.toLocaleString('es'), color: 'var(--text2)' },
              { label: `${pace.monthlyTarget.toLocaleString('es')} KM/MES`, value: pace.diff >= 0 ? `+${pace.diff.toLocaleString('es')}` : pace.diff.toLocaleString('es'), color: pace.status === 'pasado' ? 'var(--red)' : pace.status === 'corto' ? 'var(--amber)' : 'var(--green)' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 20, color: card.color, lineHeight: 1, marginBottom: 4 }}>{card.value}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.14em', color: 'var(--text3)' }}>{card.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', marginBottom: 24 }}>
            Configura los datos del contrato para ver el análisis de km.
          </div>
        )}

        {/* Proyección */}
        {pace && (
          <div style={{ background: 'var(--bg2)', border: `.5px solid ${pace.status === 'en_ritmo' ? 'var(--green)33' : pace.status === 'pasado' ? 'var(--red)33' : 'var(--amber)33'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 8 }}>PROYECCIÓN AL FIN DE CONTRATO</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)' }}>
                A ritmo actual acabarás con <strong style={{ color: pace.status === 'pasado' ? 'var(--red)' : pace.status === 'corto' ? 'var(--amber)' : 'var(--green)' }}>{pace.projected.toLocaleString('es')} km</strong>
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)' }}>objetivo {vehicle.contractKmTotal?.toLocaleString('es')}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text3)' }}>
              <span>RESTANTES: <span style={{ color: 'var(--text2)' }}>{pace.remaining.toLocaleString('es')} KM</span></span>
              <span>MESES: <span style={{ color: 'var(--text2)' }}>{pace.monthsLeft}</span></span>
              <span>CONTRATO FIN: <span style={{ color: 'var(--text2)' }}>{pace.end.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}</span></span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 12, background: 'var(--bg4)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: pace.status === 'pasado' ? 'var(--red)' : pace.status === 'corto' ? 'var(--amber)' : 'var(--green)',
                width: `${Math.min(100, (pace.latestKm / (vehicle.contractKmTotal ?? 1)) * 100)}%`,
                transition: 'width .4s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)' }}>
              <span>0</span>
              <span>{Math.round((pace.latestKm / (vehicle.contractKmTotal ?? 1)) * 100)}% usado</span>
              <span>{vehicle.contractKmTotal?.toLocaleString('es')}</span>
            </div>
          </div>
        )}

        {/* Añadir registro */}
        <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 12 }}>REGISTRAR KILOMETRAJE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, marginBottom: 8 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...INPUT, colorScheme: 'dark', fontSize: 12 } as React.CSSProperties} />
            <input type="number" value={km} onChange={e => setKm(e.target.value)}
              placeholder="Km del odómetro (ej: 23450)" style={INPUT}
              onKeyDown={e => e.key === 'Enter' && addLog()} />
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Nota opcional (ej: revisión, viaje Madrid)" style={{ ...INPUT, marginBottom: 8 }} />
          <button onClick={addLog} disabled={!km || saving} style={{
            width: '100%', padding: '10px', borderRadius: 8, cursor: km ? 'pointer' : 'default',
            background: 'transparent', border: `.5px solid ${km ? color : 'var(--bg4)'}`,
            color: km ? color : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em',
          }}>
            {saving ? '···' : '+ AÑADIR REGISTRO'}
          </button>
        </div>

        {/* Historial */}
        {vLogs.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 10 }}>
              HISTORIAL · {vLogs.length} REGISTROS
            </div>
            {vLogs.map((log, i) => {
              const prev = vLogs[i + 1];
              const diff = prev ? log.km - prev.km : null;
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '.5px solid var(--bg4)' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.06em', flexShrink: 0, width: 70 }}>
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)', lineHeight: 1 }}>
                      {log.km.toLocaleString('es')} km
                    </div>
                    {log.notes && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{log.notes}</div>}
                  </div>
                  {diff !== null && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--blue)', flexShrink: 0 }}>
                      +{diff.toLocaleString('es')}
                    </div>
                  )}
                  <button onClick={() => delLog(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '2px 4px', opacity: 0.5 }}>×</button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default function VehiclesClient({ vehicles: initialVehicles, kmLogs: initialLogs, urgentCount, staleCount, inboxCount, widgetVehicleId: initialWidgetId }: {
  vehicles: Vehicle[];
  kmLogs: KmLog[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
  widgetVehicleId: number | null;
}) {
  const router     = useRouter();
  const [vehicles, setVehicles]       = useState<Vehicle[]>(initialVehicles);
  const [logs,     setLogs]           = useState<KmLog[]>(initialLogs);
  const [selected, setSelected]       = useState<Vehicle | null>(initialVehicles[0] ?? null);
  const [showForm, setShowForm]       = useState(false);
  const [editing,  setEditing]        = useState<Vehicle | null>(null);
  const [isMobile, setIsMobile]       = useState(false);
  const [widgetId, setWidgetId]       = useState<number | null>(initialWidgetId);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSaved = (updated: Vehicle) => {
    setVehicles(prev => {
      const exists = prev.find(v => v.id === updated.id);
      return exists ? prev.map(v => v.id === updated.id ? updated : v) : [updated, ...prev];
    });
    if (selected?.id === updated.id) setSelected(updated);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  };

  const handleDeactivate = async (vehicle: Vehicle) => {
    if (!confirm(`¿Dar de baja "${vehicle.name}"? Se archivará y dejará de aparecer.`)) return;
    await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' });
    setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    setSelected(prev => prev?.id === vehicle.id ? null : prev);
    router.refresh();
  };

  const handleWidgetToggle = async (vehicle: Vehicle) => {
    if (widgetId === vehicle.id) {
      await fetch(`/api/vehicles/${vehicle.id}/widget`, { method: 'DELETE' });
      setWidgetId(null);
    } else {
      await fetch(`/api/vehicles/${vehicle.id}/widget`, { method: 'POST' });
      setWidgetId(vehicle.id);
    }
  };

  // Mobile: fullscreen detail when vehicle selected
  if (isMobile && selected) {
    return (
      <>
        <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
              <button onClick={() => setSelected(null)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ← VEHÍCULOS
              </button>
            </div>
            <KmDetail
              key={selected.id}
              vehicle={selected}
              logs={logs}
              onLogAdded={log => setLogs(prev => [log, ...prev])}
              onLogDeleted={id => setLogs(prev => prev.filter(l => l.id !== id))}
              onEdit={() => setEditing(selected)}
              onDeactivate={() => handleDeactivate(selected)}
              isWidget={widgetId === selected.id}
              onWidgetToggle={() => handleWidgetToggle(selected)}
            />
          </div>
        </DesktopShell>
        {editing && (
          <VehicleForm
            vehicle={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </>
    );
  }

  return (
    <>
      <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left — vehicle list */}
          <div style={{ width: 300, flexShrink: 0, borderRight: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)' }}>
                  Vehículos <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>renting</em>
                </div>
                <button onClick={() => setShowForm(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', padding: '5px 10px', border: '.5px solid var(--blue)44', borderRadius: 8, background: 'var(--blue)12', color: 'var(--blue)', cursor: 'pointer' }}>
                  + NUEVO
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {vehicles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--blue)', opacity: 0.4 }}>🚗</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SIN VEHÍCULOS</div>
                  <button onClick={() => setShowForm(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', padding: '6px 14px', border: '.5px solid var(--blue)44', borderRadius: 8, background: 'transparent', color: 'var(--blue)', cursor: 'pointer', marginTop: 6 }}>
                    + AÑADIR VEHÍCULO
                  </button>
                </div>
              ) : vehicles.map(v => {
                const color = v.color ?? '#5ba8e8';
                const pace  = calcPace(v, logs);
                const isSel = selected?.id === v.id;
                return (
                  <div key={v.id}
                    onClick={() => setSelected(v)}
                    style={{ padding: '12px 18px', cursor: 'pointer', borderBottom: '.5px solid var(--bg2)', borderLeft: isSel ? `2px solid ${color}` : '2px solid transparent', background: isSel ? 'var(--bg2)' : 'transparent', transition: 'background .1s' }}
                    onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
                    onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>🚗</span>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                      {widgetId === v.id && (
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--gold2)', letterSpacing: '.1em' }}>★</span>
                      )}
                      {pace && <StatusChip status={pace.status} />}
                    </div>
                    <div style={{ display: 'flex', gap: 10, paddingLeft: 24, fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.08em' }}>
                      {v.plate && <span>{v.plate}</span>}
                      {pace && <span>{pace.latestKm > 0 ? `${pace.latestKm.toLocaleString('es')} km` : 'sin km'}</span>}
                      {v.contractEndDate && <span>{new Date(v.contractEndDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — detail (desktop only) */}
          {selected ? (
            <KmDetail
              key={selected.id}
              vehicle={selected}
              logs={logs}
              onLogAdded={log => setLogs(prev => [log, ...prev])}
              onLogDeleted={id => setLogs(prev => prev.filter(l => l.id !== id))}
              onEdit={() => setEditing(selected)}
              onDeactivate={() => handleDeactivate(selected)}
              isWidget={widgetId === selected.id}
              onWidgetToggle={() => handleWidgetToggle(selected)}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 36, color: 'var(--blue)', opacity: 0.4 }}>🚗</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SELECCIONA UN VEHÍCULO</div>
            </div>
          )}
        </div>
      </DesktopShell>

      {(showForm || editing) && (
        <VehicleForm
          vehicle={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
