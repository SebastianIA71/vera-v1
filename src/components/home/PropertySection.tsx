'use client';

import { useRouter } from 'next/navigation';
import SectionLabel from './SectionLabel';
import type { PropTask, ProjTask } from './types';

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export function RealEstateSection({
  topTaskByProperty, onNewTask,
}: { topTaskByProperty: PropTask[]; onNewTask: (propId: string) => void }) {
  const router = useRouter();
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Real Estate" link="→" onLinkClick={() => router.push('/properties')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {topTaskByProperty.map(({ prop, task }) => (
          <div key={prop.id} onClick={() => router.push(`/tasks/${task.id}`)} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderLeft: `2px solid ${prop.color ?? 'var(--text3)'}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{prop.icon ?? '🏠'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: prop.color ?? 'var(--text3)', letterSpacing: '.12em', marginBottom: 2 }}>{prop.name.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>{task.prioFinal ?? 0}</span>
            <button onClick={(e) => { e.stopPropagation(); onNewTask(prop.id); }} style={{ width: 44, height: 44, borderRadius: 8, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title={`Nueva tarea en ${prop.name}`}>
              <span style={{ width: 26, height: 26, borderRadius: 8, border: `.5px solid ${prop.color ?? 'var(--bg4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: prop.color ?? 'var(--text3)' }}><PlusIcon /></span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsSection({
  topTaskByProject, onNewTask,
}: { topTaskByProject: ProjTask[]; onNewTask: (projId: number) => void }) {
  const router = useRouter();
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Projects" link="→" onLinkClick={() => router.push('/projects')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {topTaskByProject.map(({ proj, task }) => (
          <div key={proj.id} onClick={() => router.push(`/tasks/${task.id}`)} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderLeft: `2px solid ${proj.color ?? 'var(--text3)'}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{proj.icon ?? '◆'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: proj.color ?? 'var(--text3)', letterSpacing: '.12em', marginBottom: 2 }}>{proj.name.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>{task.prioFinal ?? 0}</span>
            <button onClick={(e) => { e.stopPropagation(); onNewTask(proj.id); }} style={{ width: 44, height: 44, borderRadius: 8, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title={`Nueva tarea en ${proj.name}`}>
              <span style={{ width: 26, height: 26, borderRadius: 8, border: `.5px solid ${proj.color ?? 'var(--bg4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: proj.color ?? 'var(--text3)' }}><PlusIcon /></span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
