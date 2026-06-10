import { db } from '@/lib/db';
import { contracts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ContractsClient from './ContractsClient';
import { getUrgentAndStaleCounts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ContractsPage() {
  const [allContracts, counts] = await Promise.all([
    db.select().from(contracts).where(eq(contracts.active, true)),
    getUrgentAndStaleCounts(),
  ]);

  return (
    <ContractsClient
      contracts={allContracts}
      urgentCount={counts.urgentCount}
      staleCount={counts.staleCount}
      inboxCount={counts.inboxCount}
    />
  );
}
