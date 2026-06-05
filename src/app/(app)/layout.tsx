import { db } from '@/lib/db';
import { inbox, tasks } from '@/lib/db/schema';
import { inArray, ne, and } from 'drizzle-orm';
import FAB from '@/components/capture/FAB';
import { MobileNav } from '@/components/MobileNav';
import LayoutClient from './LayoutClient';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [inboxItems, taskItems] = await Promise.all([
    db.select({ id: inbox.id, processed: inbox.processed, createdAt: inbox.createdAt }).from(inbox).limit(200),
    db.select({ id: tasks.id }).from(tasks).where(and(ne(tasks.status, 'done'), ne(tasks.status, 'archived'))),
  ]);
  const inboxCount = inboxItems.filter(i => !i.processed).length;
  const tasksCount = taskItems.length;

  // Auto-cleanup: borrar items procesados con más de 48h de antigüedad
  const cutoff = new Date(Date.now() - 48 * 3600000);
  const toDelete = inboxItems
    .filter(i => i.processed && i.createdAt && new Date(i.createdAt) < cutoff)
    .map(i => i.id);
  if (toDelete.length > 0) {
    db.delete(inbox).where(inArray(inbox.id, toDelete)).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <LayoutClient tasksCount={tasksCount} inboxCount={inboxCount}>
        <main className="main-content">
          {children}
        </main>
      </LayoutClient>

      {/* Nav móvil — siempre presente, CSS la oculta en desktop */}
      <MobileNav inboxCount={inboxCount} />

      {/* FAB de voz — una sola instancia aquí */}
      <FAB />
    </div>
  );
}
