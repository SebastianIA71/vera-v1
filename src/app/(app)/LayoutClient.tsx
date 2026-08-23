'use client';

import UpdateBanner from '@/components/UpdateBanner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NavCountsProvider } from '@/components/NavCountsContext';
import { ToastProvider } from '@/components/ui/Toast';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { SearchProvider } from '@/components/ui/SearchModal';

export default function LayoutClient({ children, tasksCount = 0, urgentTasksCount = 0, inboxCount = 0 }: { children: React.ReactNode; tasksCount?: number; urgentTasksCount?: number; inboxCount?: number }) {
  return (
    <ThemeProvider>
      <NavCountsProvider tasksCount={tasksCount} urgentTasksCount={urgentTasksCount} inboxCount={inboxCount}>
        <ToastProvider>
          <SearchProvider>
            <OfflineBanner />
            <UpdateBanner />
            {children}
          </SearchProvider>
        </ToastProvider>
      </NavCountsProvider>
    </ThemeProvider>
  );
}
