import { getUrgentAndStaleCounts } from '@/lib/queries';
import AgentsClient from './AgentsClient';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const { urgentCount, staleCount, inboxCount } = await getUrgentAndStaleCounts();

  return (
    <AgentsClient
      urgentCount={urgentCount}
      staleCount={staleCount}
      inboxCount={inboxCount}
    />
  );
}
