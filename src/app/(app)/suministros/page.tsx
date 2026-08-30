import { db } from '@/lib/db';
import { utilityMeters, meterReadings, utilityBills, properties } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { getUrgentAndStaleCounts } from '@/lib/queries';
import SuministrosClient from './SuministrosClient';

export const dynamic = 'force-dynamic';

export default async function SuministrosPage() {
  const [meters, counts, props] = await Promise.all([
    db.select().from(utilityMeters).where(eq(utilityMeters.active, true)),
    getUrgentAndStaleCounts(),
    db.select().from(properties),
  ]);

  const ids = meters.map(m => m.id);
  const [readings, bills] = ids.length
    ? await Promise.all([
        db.select().from(meterReadings).where(inArray(meterReadings.meterId, ids)).orderBy(desc(meterReadings.date)),
        db.select().from(utilityBills).where(inArray(utilityBills.meterId, ids)).orderBy(desc(utilityBills.periodEnd)),
      ])
    : [[], []];

  return (
    <SuministrosClient
      meters={meters}
      readings={readings}
      bills={bills}
      properties={props}
      urgentCount={counts.urgentCount}
      staleCount={counts.staleCount}
      inboxCount={counts.inboxCount}
      todayISO={new Date().toISOString().slice(0, 10)}
    />
  );
}
