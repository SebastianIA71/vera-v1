import { db } from '@/lib/db';
import { financeRecords } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import FinanceClient from './FinanceClient';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const records = await db
    .select()
    .from(financeRecords)
    .orderBy(desc(financeRecords.date));

  return <FinanceClient initialRecords={records} />;
}
