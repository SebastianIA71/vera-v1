'use client';

import UpdateBanner from '@/components/UpdateBanner';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UpdateBanner />
      {children}
    </ThemeProvider>
  );
}
