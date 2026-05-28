import { redirect } from 'next/navigation';

// Morning ritual — Phase 1. For now, redirect to dashboard.
export default function MorningPage() {
  redirect('/dashboard');
}
