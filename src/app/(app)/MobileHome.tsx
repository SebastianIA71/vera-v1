'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useHomeSections } from '@/hooks/useHomeSections';
import HomeHeader         from '@/components/home/HomeHeader';
import HomeGreeting       from '@/components/home/HomeGreeting';
import NowSection         from '@/components/home/NowSection';
import InboxSection       from '@/components/home/InboxSection';
import WeightSection      from '@/components/home/WeightSection';
import EventsSection      from '@/components/home/EventsSection';
import TripsSection       from '@/components/home/TripsSection';
import CalendarSection    from '@/components/home/CalendarSection';
import { RealEstateSection, ProjectsSection } from '@/components/home/PropertySection';
import type { Task, WeightLog, InboxItem, PropTask, ProjTask, Trip, EventItem } from '@/components/home/types';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const CaptureSheet        = dynamic(() => import('@/components/capture/CaptureSheet'), { ssr: false });
const InboxMobile         = dynamic(() => import('@/components/inbox/InboxMobile'), { ssr: false });
const NewEventSheet       = dynamic(() => import('@/components/events/NewEventSheet'), { ssr: false });
const NewTaskModal        = dynamic(() => import('@/components/tasks/NewTaskModal'), { ssr: false });
const VeraPick            = dynamic(() => import('@/components/VeraPick'), { ssr: false });
const FinanceSparklineHeader = dynamic(
  () => import('@/components/finance/FinanceSparklineHeader').then(m => ({ default: m.FinanceSparklineHeader })),
  { ssr: false }
);

type FinanceRecord = { calcD: number|null; calcB: number|null; calcA: number|null; calcE: number|null };

export default function MobileHome({
  urgentTasks, urgentTotal = 0, nextTrip, nextEvent, weightLogs,
  inboxCount, inboxItems = [], topTaskByProperty = [], topTaskByProject = [],
  allEvents = [], todaySnm = [], financeRecords, doneTodayCount = 0,
}: {
  urgentTasks: Task[]; urgentTotal?: number;
  nextTrip: Trip | null; nextEvent: EventItem | null;
  weightLogs: WeightLog[]; inboxCount: number;
  inboxItems?: InboxItem[]; topTaskByProperty?: PropTask[]; topTaskByProject?: ProjTask[];
  allEvents?: { startDate: string; type: string; title: string }[];
  todaySnm?: string[]; financeRecords?: FinanceRecord[];
  doneTodayCount?: number;
}) {
  const router = useRouter();
  const { isVisible } = useHomeSections();
  const [showCapture, setShowCapture]     = useState(false);
  const [showInbox, setShowInbox]         = useState(false);
  const [showNewEvent, setShowNewEvent]   = useState(false);
  const [newTaskPropId, setNewTaskPropId] = useState<string | null>(null);
  const [newTaskProjId, setNewTaskProjId] = useState<number | null>(null);

  return (
    <div className="mobile-home-root" style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ padding: '16px 22px 140px' }}>

        <HomeHeader />
        <HomeGreeting nextTrip={nextTrip} weightLogs={weightLogs} />

        {isVisible('now') && urgentTasks.length > 0 && (
          <NowSection urgentTasks={urgentTasks} urgentTotal={urgentTotal} doneTodayCount={isVisible('done') ? doneTodayCount : 0} />
        )}

        {isVisible('inbox')      && <InboxSection inboxCount={inboxCount} />}
        {isVisible('weight')     && weightLogs[0] && <WeightSection weightLogs={weightLogs} todaySnm={todaySnm} />}
        {isVisible('events')     && <EventsSection nextEvent={nextEvent} />}
        {isVisible('trips')      && nextTrip && <TripsSection nextTrip={nextTrip} />}
        {isVisible('calendar')   && <CalendarSection allEvents={allEvents} />}
        {isVisible('realestate') && topTaskByProperty.length > 0 && <RealEstateSection topTaskByProperty={topTaskByProperty} onNewTask={setNewTaskPropId} />}
        {isVisible('projects')   && topTaskByProject.length > 0 && <ProjectsSection topTaskByProject={topTaskByProject} onNewTask={setNewTaskProjId} />}

        {isVisible('finance') && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase' }}>Finance</span>
              <button onClick={() => router.push('/finance')} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.1em' }}>→</button>
            </div>
            <div onClick={() => router.push('/finance')} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }}>
              {financeRecords && financeRecords.length > 0
                ? <FinanceSparklineHeader records={financeRecords} />
                : <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>SIN DATOS · CARGA EL EXCEL EN /FINANCE</div>
              }
            </div>
          </div>
        )}

        {isVisible('pick') && <ErrorBoundary><VeraPick /></ErrorBoundary>}
      </div>

      {showCapture  && <CaptureSheet  onClose={() => setShowCapture(false)} />}
      {showInbox    && <InboxMobile   items={inboxItems} onClose={() => { setShowInbox(false); router.refresh(); }} />}
      {showNewEvent && <NewEventSheet onClose={() => setShowNewEvent(false)} onCreated={() => setShowNewEvent(false)} />}
      {newTaskPropId && <NewTaskModal defaultPropertyId={newTaskPropId} onClose={() => setNewTaskPropId(null)} onCreated={() => { setNewTaskPropId(null); router.refresh(); }} />}
      {newTaskProjId && <NewTaskModal defaultProjectId={newTaskProjId} onClose={() => setNewTaskProjId(null)} onCreated={() => { setNewTaskProjId(null); router.refresh(); }} />}
    </div>
  );
}
