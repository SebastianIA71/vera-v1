'use client';

import { useRouter } from 'next/navigation';
import TaskDetailPanel, { TaskDetail } from '@/components/tasks/TaskDetailPanel';

export default function TaskDetailClient({ task, inboxCount }: { task: TaskDetail; inboxCount: number }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '.5px solid var(--bg4)' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', padding: 0 }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          ATRÁS
        </button>
      </div>
      <TaskDetailPanel
        key={task.id}
        task={task}
        onClose={() => router.back()}
        onMarkDone={() => router.back()}
        onUpdate={() => router.refresh()}
      />
    </div>
  );
}
