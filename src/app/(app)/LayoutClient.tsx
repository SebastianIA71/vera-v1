'use client';

import UpdateBanner from '@/components/UpdateBanner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NavCountsProvider } from '@/components/NavCountsContext';

export default function LayoutClient({ children, tasksCount = 0, inboxCount = 0 }: { children: React.ReactNode; tasksCount?: number; inboxCount?: number }) {
  return (
    <ThemeProvider>
      <NavCountsProvider tasksCount={tasksCount} inboxCount={inboxCount}>
        <UpdateBanner />
        {children}
      </NavCountsProvider>
    </ThemeProvider>
  );
}
