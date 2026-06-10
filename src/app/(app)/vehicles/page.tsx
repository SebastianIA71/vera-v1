import { db } from '@/lib/db';
import { vehicles, kmLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import VehiclesClient from './VehiclesClient';
import { getUrgentAndStaleCounts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage() {
  const [allVehicles, allKmLogs, counts] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.active, true)),
    db.select().from(kmLogs).orderBy(desc(kmLogs.date)),
    getUrgentAndStaleCounts(),
  ]);

  return (
    <VehiclesClient
      vehicles={allVehicles}
      kmLogs={allKmLogs}
      urgentCount={counts.urgentCount}
      staleCount={counts.staleCount}
      inboxCount={counts.inboxCount}
    />
  );
}
