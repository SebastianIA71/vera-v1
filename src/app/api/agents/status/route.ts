import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agentLog } from '@/lib/db/schema';
import { desc, inArray } from 'drizzle-orm';

const AGENT_IDS = ['voice', 'prio', 'alert', 'search', 'executor', 'solution'] as const;

export async function GET() {
  const logs = await db
    .select()
    .from(agentLog)
    .where(inArray(agentLog.agentId, [...AGENT_IDS]))
    .orderBy(desc(agentLog.createdAt))
    .limit(20);

  const statusMap: Record<string, { status: string; lastRun?: string; message?: string }> =
    Object.fromEntries(AGENT_IDS.map(id => [id, { status: 'idle' }]));

  for (const log of logs) {
    const id = log.agentId;
    if (id in statusMap && statusMap[id].status === 'idle') {
      statusMap[id] = {
        status: log.status ?? 'idle',
        lastRun: log.createdAt?.toISOString(),
        message: log.output?.slice(0, 80),
      };
    }
  }

  return NextResponse.json(statusMap);
}
