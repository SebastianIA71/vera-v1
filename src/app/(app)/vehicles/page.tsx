import { db } from '@/lib/db';
import { vehicles, kmLogs, memory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import VehiclesClient from './VehiclesClient';
import { getUrgentAndStaleCounts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage() {
  const [allVehicles, allKmLogs, counts, widgetRow] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.active, true)),
    db.select().from(kmLogs).orderBy(desc(kmLogs.date)),
    getUrgentAndStaleCounts(),
    db.select().from(memory).where(eq(memory.key, 'widget_vehicle_id')).limit(1),
  ]);

  const widgetVehicleId = widgetRow[0]?.value ? parseInt(widgetRow[0].value) : null;

  return (
    <VehiclesClient
      vehicles={allVehicles}
      kmLogs={allKmLogs}
      urgentCount={counts.urgentCount}
      staleCount={counts.staleCount}
      inboxCount={counts.inboxCount}
      widgetVehicleId={widgetVehicleId}
    />
  );
}
