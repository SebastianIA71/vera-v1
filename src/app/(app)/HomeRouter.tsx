'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import MobileHome from './MobileHome';

type Props = ComponentProps<typeof MobileHome>;

export default function HomeRouter(props: Props) {
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth >= 900) {
      router.replace('/dashboard');
    }
  }, [router]);

  return <MobileHome {...props} />;
}
