import { db } from '@/lib/db';
import { weightLog } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import WeightClient from './WeightClient';

export const dynamic = 'force-dynamic';

export default async function WeightPage() {
  const logs = await db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(90);
  return <WeightClient initialLogs={logs} />;
}
