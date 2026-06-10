'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import DesktopShell from '@/components/layout/DesktopShell';
import TaskDetailPanel, { TaskDetail } from '@/components/tasks/TaskDetailPanel';

const NewProjectSheet = dynamic(() => import('@/components/projects/NewProjectSheet'), { ssr: false });
const NewTaskModal    = dynamic(() => import('@/components/tasks/NewTaskModal'),        { ssr: false });

type Project = { id: number; name: string; description: string | null; color: string | null; icon: string | null; status: string | null; dueDate: Date | null; createdAt: Date | null };
type Task    = TaskDetail & { projectId?: number | null };

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:   { label: 'ACTIVO',     color: 'var(--green)' },
  paused:   { label: 'PAUSADO',    color: 'var(--amber)' },
  done:     { label: 'FINALIZADO', color: 'var(--blue)'  },
  archived: { label: 'ARCHIVADO',  color: 'var(--text3)' },
};

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function ProjectCard({ project, selected, tasks, onClick }: { project: Project; selected: boolean; tasks: Task[]; onClick: () => void }) {
  const color = project.color ?? '#9b7fe8';
  const sm    = STATUS_META[project.status ?? 'active'] ?? STATUS_META.active;
  const count = tasks.filter(t => t.projectId === project.id && t.status !== 'done').length;

  return (
    <div onClick={onClick} style={{
      padding: '11px 18px', cursor: 'pointer',
      background: selected ? 'var(--bg2)' : 'transparent',
      borderBottom: '.5px solid var(--bg2)',
      borderLeft: selected ? `2px solid ${color}` : '2px solid transparent',
      transition: 'background .1s',
    }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {project.icon
          ? <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{project.icon}</span>
          : <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />}
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', color: sm.color, flexShrink: 0 }}>{sm.label}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingLeft: 16 }}>
        {project.description && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.06em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.description}
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em', color: count > 0 ? 'var(--gold2)' : 'var(--text4)', flexShrink: 0 }}>
          {count} tarea{count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function ProjectDetail({ project, tasks, onEdit, onTaskCreated, onTaskUpdate, onMarkDone, isMobile }: {
  project: Project;
  tasks: Task[];
  onEdit: () => void;
  onTaskCreated: (t: Task) => void;
  onTaskUpdate: (id: number, d: Partial<Task>) => void;
  onMarkDone: (id: number) => void;
  isMobile?: boolean;
}) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask]   = useState(false);
  const color = project.color ?? '#9b7fe8';
  const sm    = STATUS_META[project.status ?? 'active'] ?? STATUS_META.active;
  const due   = daysUntil(project.dueDate);
  const projTasks = tasks.filter(t => t.projectId === project.id && t.status !== 'done');
  const doneTasks = tasks.filter(t => t.projectId === project.id && t.status === 'done');

  if (selectedTask) {
    return (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
          <button onClick={() => setSelectedTask(null)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, padding: 0 }}>
            ← {project.name.toUpperCase()}
          </button>
        </div>
        <TaskDetailPanel
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMarkDone={id => { onMarkDone(id); setSelectedTask(null); }}
          onUpdate={onTaskUpdate}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {project.icon
                ? <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{project.icon}</span>
                : <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />}
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)', letterSpacing: '-.01em' }}>
                {project.name}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: sm.color, padding: '2px 7px', borderRadius: 999, border: `.5px solid ${sm.color}44` }}>
                {sm.label}
              </span>
            </div>
            {project.description && (
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: '#c8c6be', lineHeight: 1.5, marginBottom: 6, paddingLeft: 22 }}>
                {project.description}
              </div>
            )}
            {due !== null && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: due <= 14 ? 'var(--red)' : due <= 30 ? 'var(--amber)' : 'var(--text3)', paddingLeft: 22 }}>
                DEADLINE: {due > 0 ? `${due}D` : due === 0 ? 'HOY' : 'VENCIDO'}
                {project.dueDate && ` · ${new Date(project.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}`}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={onEdit} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '6px 12px', borderRadius: 8, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer' }}>
              EDITAR
            </button>
            <button onClick={() => setShowNewTask(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '6px 12px', borderRadius: 8, border: `.5px solid ${color}55`, background: `${color}12`, color, cursor: 'pointer' }}>
              + TAREA
            </button>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {projTasks.length === 0 && doneTasks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 28, color: `${color}66` }}>✦</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SIN TAREAS · AÑADE LA PRIMERA</div>
          </div>
        ) : (
          <>
            {projTasks.length > 0 && (
              <>
                <div style={{ padding: '10px 24px 4px', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                  ACTIVAS · {projTasks.length}
                </div>
                {projTasks.map(t => (
                  <div key={t.id} onClick={() => isMobile ? router.push(`/tasks/${t.id}`) : setSelectedTask(t)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px',
                    cursor: 'pointer', borderBottom: '.5px solid var(--bg2)',
                    transition: 'background .1s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 12, color, minWidth: 16, textAlign: 'right', flexShrink: 0 }}>{t.prioFinal ?? 0}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      {t.propertyId && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--gold2)', marginTop: 2 }}>{t.propertyId.toUpperCase()}</div>}
                    </div>
                  </div>
                ))}
              </>
            )}
            {doneTasks.length > 0 && (
              <>
                <div style={{ padding: '10px 24px 4px', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                  HECHAS · {doneTasks.length}
                </div>
                {doneTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 24px', borderBottom: '.5px solid var(--bg2)', opacity: 0.4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {showNewTask && (
        <NewTaskModal
          defaultProjectId={project.id}
          onClose={() => setShowNewTask(false)}
          onCreated={t => { onTaskCreated(t as Task); setShowNewTask(false); }}
        />
      )}
    </div>
  );
}

export default function ProjectsClient({ projects: initialProjects, allTasks: initialTasks, urgentCount, staleCount, inboxCount }: {
  projects: Project[];
  allTasks: Task[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
}) {
  const [projects, setProjects]     = useState<Project[]>(initialProjects);
  const [tasks,    setTasks]        = useState<Task[]>(initialTasks);
  const [selected, setSelected]     = useState<Project | null>(initialProjects[0] ?? null);
  const [showNew,  setShowNew]      = useState(false);
  const [editing,  setEditing]      = useState<Project | null>(null);
  const [tab,      setTab]          = useState<'active' | 'done'>('active');
  const [isMobile, setIsMobile]     = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filteredProjects = projects.filter(p =>
    tab === 'active'
      ? (p.status === 'active' || p.status === 'paused')
      : (p.status === 'done'   || p.status === 'archived')
  );

  return (
    <>
      <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left — project list */}
          <div style={{ width: 300, flexShrink: 0, borderRight: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em' }}>
                  Proyectos <em style={{ fontStyle: 'italic', color: 'var(--purple)' }}>activos</em>
                </div>
                <button onClick={() => setShowNew(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', padding: '5px 10px', border: '.5px solid var(--purple-border)', borderRadius: 8, background: 'var(--purple-subtle)', color: 'var(--purple)', cursor: 'pointer' }}>
                  + NUEVO
                </button>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, background: 'var(--bg3)', borderRadius: 8, padding: 2 }}>
                {(['active','done'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', background: tab === t ? 'var(--bg4)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text3)', transition: 'all .15s' }}>
                    {t === 'active' ? 'ACTIVOS' : 'FINALIZADOS'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredProjects.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 28, color: 'var(--purple-border)' }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)' }}>SIN PROYECTOS</div>
                </div>
              ) : (
                filteredProjects.map(p => (
                  <ProjectCard key={p.id} project={p} selected={selected?.id === p.id} tasks={tasks} onClick={() => setSelected(p)} />
                ))
              )}
            </div>
          </div>

          {/* Right — detail */}
          {selected ? (
            <ProjectDetail
              key={selected.id}
              project={selected}
              tasks={tasks}
              onEdit={() => setEditing(selected)}
              onTaskCreated={t => setTasks(prev => [t, ...prev])}
              onTaskUpdate={(id, d) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...d } : t))}
              onMarkDone={id => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))}
              isMobile={isMobile}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 36, color: 'var(--purple-border)' }}>✦</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--text3)' }}>SELECCIONA UN PROYECTO</div>
              <button onClick={() => setShowNew(true)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', padding: '8px 16px', borderRadius: 10, border: '.5px solid var(--purple-border)', background: 'transparent', color: 'var(--purple)', cursor: 'pointer', marginTop: 8 }}>
                + NUEVO PROYECTO
              </button>
            </div>
          )}
        </div>
      </DesktopShell>

      {showNew && (
        <NewProjectSheet
          onClose={() => setShowNew(false)}
          onSaved={p => setProjects(prev => [p as Project, ...prev])}
        />
      )}
      {editing && (
        <NewProjectSheet
          editProject={editing}
          onClose={() => setEditing(null)}
          onSaved={p => {
            setProjects(prev => prev.map(x => x.id === p.id ? p as Project : x));
            setSelected(p as Project);
          }}
        />
      )}
    </>
  );
}
