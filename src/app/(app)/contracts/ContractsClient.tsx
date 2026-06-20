'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';

type Contract = {
  id: number; name: string; provider: string | null; propertyId: string | null;
  category: string | null; monthlyAmountEnc: string | null;
  startDate: Date | null; endDate: Date | null;
  active: boolean | null; alertDaysBefore: number | null;
  paymentDay: number | null; billingCycle: string | null; notes: string | null;
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

const CATEGORIES: Record<string, { icon: string; color: string }> = {
  agua:      { icon: '💧', color: 'var(--blue)'   },
  luz:       { icon: '⚡', color: 'var(--amber)'  },
  gas:       { icon: '🔥', color: 'var(--red)'    },
  seguro:    { icon: '🛡️', color: 'var(--green)'  },
  coche:     { icon: '🚗', color: 'var(--blue)'   },
  impuesto:  { icon: '📋', color: 'var(--text2)'  },
  internet:  { icon: '📡', color: 'var(--purple)' },
  telefono:  { icon: '📱', color: 'var(--green)'  },
  streaming: { icon: '📺', color: 'var(--purple)' },
  comunidad: { icon: '🏘️', color: 'var(--gold2)'  },
  hipoteca:  { icon: '🏠', color: 'var(--gold)'   },
  otro:      { icon: '📄', color: 'var(--text3)'  },
};

const BILLING_CYCLES: { id: string; label: string }[] = [
  { id: 'monthly',   label: 'MENSUAL'   },
  { id: 'quarterly', label: 'TRIMESTRAL' },
  { id: 'biannual',  label: 'SEMESTRAL'  },
  { id: 'annual',    label: 'ANUAL'      },
];

const PROPERTIES = [
  { id: '',         label: 'General'   },
  { id: 'flat',     label: 'Flat'      },
  { id: 'sarapita', label: 'Sarapita'  },
  { id: 'willys',   label: "Willy's"   },
];

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function nextPaymentDate(paymentDay: number | null, billingCycle: string | null): Date | null {
  if (!paymentDay) return null;
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), paymentDay);
  if (candidate < now) {
    if (!billingCycle || billingCycle === 'monthly') {
      candidate.setMonth(candidate.getMonth() + 1);
    } else if (billingCycle === 'quarterly') {
      candidate.setMonth(candidate.getMonth() + 3);
    } else if (billingCycle === 'biannual') {
      candidate.setMonth(candidate.getMonth() + 6);
    } else if (billingCycle === 'annual') {
      candidate.setFullYear(candidate.getFullYear() + 1);
    }
  }
  return candidate;
}

function getCatMeta(cat: string | null): { icon: string; color: string } {
  return CATEGORIES[cat ?? 'otro'] ?? CATEGORIES.otro;
}

function ContractForm({ contract, onClose, onSaved }: { contract?: Contract; onClose: () => void; onSaved: () => void }) {
  const router = useRouter();
  const isEdit = !!contract;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:            contract?.name         ?? '',
    provider:        contract?.provider     ?? '',
    propertyId:      contract?.propertyId   ?? '',
    category:        contract?.category     ?? 'otro',
    startDate:       contract?.startDate    ? new Date(contract.startDate).toISOString().slice(0,10)  : '',
    endDate:         contract?.endDate      ? new Date(contract.endDate).toISOString().slice(0,10)    : '',
    alertDaysBefore: String(contract?.alertDaysBefore ?? 45),
    paymentDay:      String(contract?.paymentDay ?? ''),
    billingCycle:    contract?.billingCycle  ?? 'monthly',
    notes:           contract?.notes        ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const url    = isEdit ? `/api/contracts/${contract!.id}` : '/api/contracts';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      ...form,
      paymentDay:       form.paymentDay      ? Number(form.paymentDay)      : null,
      alertDaysBefore:  form.alertDaysBefore ? Number(form.alertDaysBefore) : 45,
      propertyId:       form.propertyId || null,
      startDate:        form.startDate || null,
      endDate:          form.endDate   || null,
    }) });
    setSaving(false);
    router.refresh();
    onSaved();
  };

  const catMeta = getCatMeta(form.category);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '92dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', marginBottom: 22 }}>
          {isEdit ? 'Editar' : 'Nuevo'} <em style={{ fontStyle: 'italic', color: catMeta.color }}>{isEdit ? 'contrato' : 'contrato'}</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>NOMBRE</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Agua Palma, Seguro Hogar..." style={INPUT} autoFocus /></div>
            <div><label style={LABEL}>PROVEEDOR</label><input value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="Empresa S.L., Mapfre..." style={INPUT} /></div>
          </div>

          <div>
            <label style={LABEL}>CATEGORÍA</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(CATEGORIES).map(([id, meta]) => (
                <button key={id} onClick={() => set('category', id)} style={{
                  padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                  border: `.5px solid ${form.category === id ? meta.color : 'var(--bg4)'}`,
                  background: form.category === id ? `${meta.color}18` : 'transparent',
                  color: form.category === id ? meta.color : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span>{meta.icon}</span> {id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={LABEL}>PROPIEDAD</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PROPERTIES.map(p => (
                <button key={p.id} onClick={() => set('propertyId', p.id)} style={{
                  padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                  border: `.5px solid ${form.propertyId === p.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                  background: form.propertyId === p.id ? 'var(--gold-subtle)' : 'transparent',
                  color: form.propertyId === p.id ? 'var(--gold2)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em',
                }}>
                  {p.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: .5, background: 'var(--bg4)' }} />
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)' }}>FECHAS Y PAGOS</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>INICIO</label><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
            <div><label style={LABEL}>VENCIMIENTO</label><input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={LABEL}>DÍA DE PAGO (1-31)</label><input type="number" min={1} max={31} value={form.paymentDay} onChange={e => set('paymentDay', e.target.value)} placeholder="5" style={INPUT} /></div>
            <div><label style={LABEL}>AVISAR (días antes)</label><input type="number" value={form.alertDaysBefore} onChange={e => set('alertDaysBefore', e.target.value)} placeholder="45" style={INPUT} /></div>
          </div>

          <div>
            <label style={LABEL}>PERIODICIDAD</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BILLING_CYCLES.map(c => (
                <button key={c.id} onClick={() => set('billingCycle', c.id)} style={{
                  padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                  border: `.5px solid ${form.billingCycle === c.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                  background: form.billingCycle === c.id ? 'var(--gold-subtle)' : 'transparent',
                  color: form.billingCycle === c.id ? 'var(--gold2)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em',
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          <div><label style={LABEL}>NOTAS</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Número de contrato, condiciones..." style={{ ...INPUT, resize: 'none', lineHeight: 1.5 } as React.CSSProperties} /></div>

          <button onClick={save} disabled={!form.name.trim() || saving} style={{ width: '100%', padding: '13px', borderRadius: 10, background: form.name.trim() ? catMeta.color : 'var(--bg3)', border: 'none', color: form.name.trim() ? '#fff' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em', cursor: form.name.trim() ? 'pointer' : 'default' }}>
            {saving ? 'GUARDANDO...' : isEdit ? 'GUARDAR CAMBIOS' : 'CREAR CONTRATO'}
          </button>

          {isEdit && (
            <button onClick={async () => {
              if (!confirm('¿Archivar este contrato?')) return;
              await fetch(`/api/contracts/${contract!.id}`, { method: 'DELETE' });
              router.refresh();
              onClose();
            }} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'transparent', border: '.5px solid var(--bg4)', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', cursor: 'pointer' }}>
              ARCHIVAR
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function ContractDetail({ contract, onEdit }: { contract: Contract; onEdit: () => void }) {
  const catMeta  = getCatMeta(contract.category);
  const daysEnd  = daysUntil(contract.endDate);
  const nextPay  = nextPaymentDate(contract.paymentDay, contract.billingCycle);
  const daysNext = nextPay ? daysUntil(nextPay) : null;
  const cycle    = BILLING_CYCLES.find(c => c.id === contract.billingCycle)?.label ?? 'MENSUAL';

  const urgentRenewal = daysEnd !== null && daysEnd <= (contract.alertDaysBefore ?? 45);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{catMeta.icon}</span>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)' }}>{contract.name}</span>
              {urgentRenewal && (
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.14em', padding: '3px 8px', borderRadius: 999, border: '.5px solid var(--red)44', color: 'var(--red)', background: 'var(--red)11' }}>
                  VENCE PRONTO
                </span>
              )}
            </div>
            {contract.provider && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', paddingLeft: 32 }}>
                {contract.provider}
              </div>
            )}
          </div>
          <button onClick={onEdit} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '6px 12px', borderRadius: 8, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer' }}>
            EDITAR
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 80px' }}>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'PERIODICIDAD',  value: cycle,                         color: 'var(--gold2)' },
            { label: 'DÍA DE PAGO',   value: contract.paymentDay ? `Día ${contract.paymentDay}` : '—', color: 'var(--text)' },
            { label: 'IMPORTE',       value: contract.monthlyAmountEnc ? '••••' : '—',  color: 'var(--text3)' },
            { label: 'PROPIEDAD',     value: contract.propertyId?.toUpperCase() ?? 'GENERAL', color: 'var(--gold2)' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Next payment */}
        {nextPay && daysNext !== null && (
          <div style={{ background: 'var(--bg2)', border: `.5px solid ${daysNext <= 7 ? 'var(--amber)44' : 'var(--bg4)'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 6 }}>PRÓXIMO PAGO</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 28, color: daysNext <= 7 ? 'var(--amber)' : 'var(--text)', lineHeight: 1 }}>
                {daysNext === 0 ? 'HOY' : daysNext === 1 ? 'MAÑANA' : `${daysNext} días`}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>
                {nextPay.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        )}

        {/* Contract duration */}
        {(contract.startDate || contract.endDate) && (
          <div style={{ background: 'var(--bg2)', border: `.5px solid ${urgentRenewal ? 'var(--red)33' : 'var(--bg4)'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 10 }}>CONTRATO</div>
            <div style={{ display: 'flex', gap: 20 }}>
              {contract.startDate && (
                <div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.12em', marginBottom: 2 }}>INICIO</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)' }}>
                    {new Date(contract.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )}
              {contract.endDate && (
                <div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.12em', marginBottom: 2 }}>VENCIMIENTO</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: urgentRenewal ? 'var(--red)' : 'var(--text)' }}>
                    {new Date(contract.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {daysEnd !== null && ` · ${daysEnd > 0 ? `en ${daysEnd} días` : 'VENCIDO'}`}
                  </div>
                  {urgentRenewal && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--amber)', marginTop: 4, letterSpacing: '.1em' }}>
                      Renegociar antes del {new Date(new Date(contract.endDate).getTime() - (contract.alertDaysBefore ?? 45) * 86400000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {contract.notes && (
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: 'var(--text2)' }}>{contract.notes}</div>
        )}
      </div>
    </div>
  );
}

export default function ContractsClient({ contracts: initialContracts, urgentCount, staleCount, inboxCount }: {
  contracts: Contract[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
}) {
  const [contracts, setContracts]   = useState<Contract[]>(initialContracts);
  const [selected,  setSelected]    = useState<Contract | null>(initialContracts[0] ?? null);
  const [showNew,   setShowNew]     = useState(false);
  const [editing,   setEditing]     = useState<Contract | null>(null);
  const [filter,    setFilter]      = useState('');
  const [isMobile,  setIsMobile]    = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Upcoming payments (next 30 days)
  const upcoming = contracts
    .map(c => ({ contract: c, next: nextPaymentDate(c.paymentDay, c.billingCycle) }))
    .filter(x => x.next && daysUntil(x.next) !== null && (daysUntil(x.next) ?? 99) <= 30)
    .sort((a, b) => (a.next!.getTime() - b.next!.getTime()));

  // Expiring soon
  const expiring = contracts.filter(c => {
    const d = daysUntil(c.endDate);
    return d !== null && d <= (c.alertDaysBefore ?? 45) && d >= 0;
  });

  const filtered = filter
    ? contracts.filter(c => c.propertyId === filter)
    : contracts;

  // Mobile: full-screen detail when a contract is selected
  if (isMobile && selected) {
    return (
      <>
        <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
              <button onClick={() => setSelected(null)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ← CONTRATOS
              </button>
            </div>
            <ContractDetail
              key={selected.id}
              contract={selected}
              onEdit={() => setEditing(selected)}
            />
          </div>
        </DesktopShell>
        {editing && (
          <ContractForm
            contract={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); router.refresh(); }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

          {/* List panel */}
          <div style={isMobile
            ? { flexShrink: 0, borderBottom: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', maxHeight: '50vh', overflow: 'hidden' }
            : { width: 340, flexShrink: 0, borderRight: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
          }>
            <div style={{ padding: '14px 18px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)' }}>
                  Contratos <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>y pagos</em>
                </div>
                <button onClick={() => setShowNew(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', padding: '5px 10px', border: '.5px solid var(--gold2)44', borderRadius: 8, background: 'var(--gold-subtle)', color: 'var(--gold2)', cursor: 'pointer' }}>
                  + NUEVO
                </button>
              </div>
              {/* Property filter */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {PROPERTIES.map(p => (
                  <button key={p.id} onClick={() => setFilter(p.id)} style={{ padding: '3px 9px', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', border: `.5px solid ${filter === p.id ? 'var(--gold2)' : 'var(--bg4)'}`, background: filter === p.id ? 'var(--gold-subtle)' : 'transparent', color: filter === p.id ? 'var(--gold2)' : 'var(--text3)' }}>
                    {p.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming payments banner */}
            {upcoming.length > 0 && (
              <div style={{ padding: '10px 18px', borderBottom: '.5px solid var(--bg4)', background: 'var(--amber)08', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--amber)', marginBottom: 6 }}>PAGOS PRÓXIMOS 30 DÍAS</div>
                {upcoming.slice(0, 5).map(({ contract, next }) => {
                  const d = daysUntil(next);
                  const cm = getCatMeta(contract.category);
                  return (
                    <div key={contract.id} onClick={() => setSelected(contract)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' }}>
                      <span style={{ fontSize: 12 }}>{cm.icon}</span>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{contract.name}</span>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: d! <= 7 ? 'var(--amber)' : 'var(--text3)', flexShrink: 0 }}>
                        {d === 0 ? 'HOY' : d === 1 ? 'MAÑANA' : `${d}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expiring soon banner */}
            {expiring.length > 0 && (
              <div style={{ padding: '10px 18px', borderBottom: '.5px solid var(--bg4)', background: 'var(--red)08', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--red)', marginBottom: 6 }}>CONTRATOS QUE VENCEN</div>
                {expiring.map(c => {
                  const d = daysUntil(c.endDate);
                  const cm = getCatMeta(c.category);
                  return (
                    <div key={c.id} onClick={() => setSelected(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' }}>
                      <span style={{ fontSize: 12 }}>{cm.icon}</span>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{c.name}</span>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--red)', flexShrink: 0 }}>
                        {d! > 0 ? `${d}d` : 'VENCIDO'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contract list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 28, color: 'var(--gold)', opacity: 0.3 }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SIN CONTRATOS</div>
                </div>
              ) : filtered.map(c => {
                const cm      = getCatMeta(c.category);
                const isSel   = selected?.id === c.id;
                const dEnd    = daysUntil(c.endDate);
                const urgent  = dEnd !== null && dEnd <= (c.alertDaysBefore ?? 45) && dEnd >= 0;
                return (
                  <div key={c.id} onClick={() => setSelected(c)} style={{
                    padding: '11px 18px', cursor: 'pointer', borderBottom: '.5px solid var(--bg2)',
                    borderLeft: isSel ? `2px solid ${cm.color}` : '2px solid transparent',
                    background: isSel ? 'var(--bg2)' : 'transparent', transition: 'background .1s',
                  }}
                    onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
                    onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{cm.icon}</span>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      {urgent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, paddingLeft: 22, fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.06em' }}>
                      {c.provider && <span>{c.provider}</span>}
                      {c.paymentDay && <span>· Día {c.paymentDay}</span>}
                      {c.endDate && <span style={{ color: urgent ? 'var(--red)' : 'var(--text3)' }}>· vence {new Date(c.endDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — desktop only */}
          {!isMobile && (selected ? (
            <ContractDetail
              key={selected.id}
              contract={selected}
              onEdit={() => setEditing(selected)}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 36, color: 'var(--gold)', opacity: 0.3 }}>✦</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SELECCIONA UN CONTRATO</div>
              <button onClick={() => setShowNew(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', padding: '8px 16px', borderRadius: 10, border: '.5px solid var(--gold2)44', background: 'transparent', color: 'var(--gold2)', cursor: 'pointer', marginTop: 8 }}>
                + NUEVO CONTRATO
              </button>
            </div>
          ))}
        </div>
      </DesktopShell>

      {showNew && (
        <ContractForm
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); router.refresh(); }}
        />
      )}
      {editing && (
        <ContractForm
          contract={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </>
  );
}
