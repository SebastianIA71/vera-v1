'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskBorderColor } from '@/lib/utils';
import SectionLabel from './SectionLabel';
import type { Task } from './types';

export default function NowSection({
  urgentTasks, urgentTotal, doneTodayCount,
}: {
  urgentTasks: Task[]; urgentTotal: number; doneTodayCount: number;
}) {
  const router = useRouter();
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [loadingDone, setLoadingDone] = useState(false);

  const toggleDone = async () => {
    if (doneExpanded) { setDoneExpanded(false); return; }
    setLoadingDone(true);
    const today = new Date().toISOString().slice(0, 10);
    const r = await fetch(`/api/tasks?status=done&doneToday=1`).then(r => r.json()).catch(() => []);
    setDoneTasks(Array.isArray(r) ? r.slice(0, 10) : []);
    setDoneExpanded(true);
    setLoadingDone(false);
  };
  const shown = urgentTasks.slice(0, 3);
  const moreCount = urgentTotal - shown.length;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Now" meta={`${urgentTotal} URGENTES`} link="→" onLinkClick={() => router.push('/tasks')} />

      {shown.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg2)', border: '.5px solid var(--bg4)',
          borderLeft: `2px solid ${taskBorderColor(t.prioFinal ?? 0, t.lastActionAt)}`,
          borderRadius: 14, padding: '13px 13px 13px 14px', marginBottom: 7,
          display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
        }} onClick={() => router.push(`/tasks/${t.id}`)}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 13, color: 'var(--gold)', minWidth: 20, paddingTop: 1 }}>{t.prioFinal}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 15, lineHeight: 1.35, color: 'var(--text)' }}>{t.title}</div>
            {t.propertyId && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--gold2)', marginTop: 5 }}>{t.propertyId.toUpperCase()}</div>
            )}
          </div>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0, marginTop: 2 }} />
        </div>
      ))}

      {/* 5.4 — Ver X más → */}
      {moreCount > 0 && (
        <button onClick={() => router.push('/tasks?context=now')} style={{
          width: '100%', textAlign: 'center', padding: '8px', borderRadius: 10,
          background: 'transparent', border: '.5px solid var(--bg4)', cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', color: 'var(--text3)',
        }}>
          Ver {moreCount} más →
        </button>
      )}

      {/* Done today banner */}
      {doneTodayCount > 0 && (
        <div style={{ marginTop: 10 }}>
          <div onClick={toggleDone} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: doneExpanded ? '10px 10px 0 0' : 10, cursor: 'pointer',
            background: 'var(--bg2)', border: '.5px solid var(--green)',
            borderBottom: doneExpanded ? 'none' : undefined,
          }}>
            <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', color: 'var(--green)' }}>
              {loadingDone ? '···' : `${doneTodayCount} COMPLETADA${doneTodayCount !== 1 ? 'S' : ''} HOY`}
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 12 }}>{doneExpanded ? '▲' : '▼'}</span>
          </div>
          {doneExpanded && (
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--green)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '4px 0' }}>
              {doneTasks.map(t => (
                <div key={t.id} onClick={() => router.push(`/tasks/${t.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '.5px solid var(--bg4)' }}>
                  <span style={{ color: 'var(--green)', fontSize: 12, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text3)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
