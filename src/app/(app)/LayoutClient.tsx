'use client';

import UpdateBanner from '@/components/UpdateBanner';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UpdateBanner />
      {children}
    </>
  );
}
