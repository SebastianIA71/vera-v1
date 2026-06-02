import { db } from '@/lib/db';
import { inbox } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import FAB from '@/components/capture/FAB';
import { MobileNav } from '@/components/MobileNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const inboxItems = await db.select({ id: inbox.id, processed: inbox.processed }).from(inbox).limit(200);
  const inboxCount = inboxItems.filter(i => !i.processed).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Contenido principal */}
      <main className="main-content">
        {children}
      </main>

      {/* Nav móvil — siempre presente, CSS la oculta en desktop */}
      <MobileNav inboxCount={inboxCount} />

      {/* FAB de voz — una sola instancia aquí */}
      <FAB />
    </div>
  );
}
