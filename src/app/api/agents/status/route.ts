import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agentLog, inbox } from '@/lib/db/schema';
import { desc, inArray, gte } from 'drizzle-orm';

const AGENT_IDS = ['voice', 'prio', 'alert', 'search', 'executor', 'solution', 'jarvis'] as const;

export type AgentStats = {
  status: 'running' | 'active' | 'idle' | 'error';
  lastRun?: string;
  lastOutput?: string;
  todayCount: number;
  weekCount: number;
  weekActivity: number[];   // últimos 7 días, índice 0 = hace 6 días, 6 = hoy
  durationMs?: number;
};

export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(todayStart.getTime() - 6 * 86400000);

  // Todos los logs de los últimos 7 días
  const logs = await db
    .select()
    .from(agentLog)
    .where(inArray(agentLog.agentId, [...AGENT_IDS]))
    .orderBy(desc(agentLog.createdAt))
    .limit(500);

  // Capturas de voz del inbox (source='voice' o 'jarvis') desde hoy
  const voiceLogs = await db
    .select({ id: inbox.id, source: inbox.source, createdAt: inbox.createdAt })
    .from(inbox)
    .where(gte(inbox.createdAt, weekStart))
    .limit(200);

  // Construye stats por agente
  const statsMap: Record<string, AgentStats> = Object.fromEntries(
    AGENT_IDS.map(id => [id, {
      status: 'idle' as const,
      todayCount: 0,
      weekCount: 0,
      weekActivity: [0, 0, 0, 0, 0, 0, 0],
    }])
  );

  // Función para obtener índice de día (0=hace 6 días … 6=hoy)
  const dayIdx = (date: Date) => {
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    return 6 - Math.min(6, Math.max(0, diff));
  };

  for (const log of logs) {
    const id = log.agentId as string;
    if (!(id in statsMap)) continue;
    const s = statsMap[id];
    const createdAt = log.createdAt ? new Date(log.createdAt) : null;
    if (!createdAt) continue;

    if (createdAt >= weekStart) {
      s.weekCount++;
      s.weekActivity[dayIdx(createdAt)]++;
      if (createdAt >= todayStart) s.todayCount++;
    }

    // Primera entrada más reciente = estado actual
    if (!s.lastRun) {
      s.lastRun    = createdAt.toISOString();
      s.lastOutput = log.output?.slice(0, 120) ?? undefined;
      s.durationMs = log.durationMs ?? undefined;
      s.status     = (log.status === 'error' ? 'error' : 'active') as AgentStats['status'];
    }
  }

  // Stats especiales para voice/jarvis desde inbox
  for (const item of voiceLogs) {
    const src = item.source;
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;
    if (!createdAt || createdAt < weekStart) continue;

    const id = src === 'jarvis' ? 'jarvis' : src === 'voice' ? 'voice' : null;
    if (!id || !(id in statsMap)) continue;

    const s = statsMap[id];
    s.weekCount++;
    s.weekActivity[dayIdx(createdAt)]++;
    if (createdAt >= todayStart) s.todayCount++;
  }

  return NextResponse.json(statsMap);
}
