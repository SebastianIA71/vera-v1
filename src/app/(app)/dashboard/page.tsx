import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tasks, events, inbox } from '@/lib/db/schema';
import { ne, desc, lte } from 'drizzle-orm';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const headersList = await headers();
  const ua = headersList.get('user-agent') ?? '';
  const isMobile = /iPhone|Android|Mobile|iPad/i.test(ua);
  if (isMobile) redirect('/');
  const now = new Date();

  const [allTasks, allEvents, inboxItems] = await Promise.all([
    db.select().from(tasks).where(ne(tasks.status, 'archived')).orderBy(desc(tasks.prioFinal)).limit(50),
    db.select().from(events).orderBy(desc(events.startDate)).limit(10),
    db.select({ id: inbox.id }).from(inbox).limit(1),
  ]);

  const urgentTasks = allTasks.filter(t => (t.prioFinal ?? 0) >= 7).slice(0, 5);
  const staleTasks = allTasks.filter(t => {
    if (!t.lastActionAt || (t.prioFinal ?? 0) < 4) return false;
    const days = Math.floor((now.getTime() - t.lastActionAt.getTime()) / 86400000);
    return days >= 14;
  });

  const upcomingTrips = allEvents
    .filter(e => e.type === 'viaje' && e.startDate && e.startDate > now)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));

  const nextTrip = upcomingTrips[0] ?? null;
  const daysToNextTrip = nextTrip?.startDate
    ? Math.ceil((nextTrip.startDate.getTime() - now.getTime()) / 86400000)
    : null;

  const inboxCount = await db.$count(inbox);

  return (
    <DashboardClient
      initialTasks={allTasks}
      urgentCount={urgentTasks.length}
      staleCount={staleTasks.length}
      inboxCount={inboxCount}
      nextTrip={nextTrip ? { title: nextTrip.title, daysTo: daysToNextTrip ?? 0 } : null}
    />
  );
}
