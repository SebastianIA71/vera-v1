import FAB from '@/components/capture/FAB';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FAB />
    </>
  );
}
