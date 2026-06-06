import { db } from '@/lib/db';
import { contacts, agentLog } from '@/lib/db/schema';
import { sendPush } from '@/lib/push';

export type ContactStatus = {
  id: number;
  name: string;
  daysSince: number | null;   // null = nunca contactado
  frequencyDays: number;
  isOverdue: boolean;
  notes: string | null;
  lastContactAt: Date | null;
};

export async function getContactStatuses(): Promise<ContactStatus[]> {
  const now = new Date();
  const all = await db.select().from(contacts);

  return all.map(c => {
    const freq = c.frequencyDays ?? 30;
    const daysSince = c.lastContactAt
      ? Math.floor((now.getTime() - new Date(c.lastContactAt).getTime()) / 86400000)
      : null;
    const isOverdue = daysSince === null ? true : daysSince >= freq;
    return {
      id: c.id,
      name: c.name,
      daysSince,
      frequencyDays: freq,
      isOverdue,
      notes: c.notes ?? null,
      lastContactAt: c.lastContactAt ? new Date(c.lastContactAt) : null,
    };
  }).sort((a, b) => {
    // Más urgentes primero (más días relativos a frecuencia)
    const ratioA = a.daysSince === null ? 999 : a.daysSince / a.frequencyDays;
    const ratioB = b.daysSince === null ? 999 : b.daysSince / b.frequencyDays;
    return ratioB - ratioA;
  });
}

export async function runContactAgent(): Promise<{ alerts: number }> {
  const startTime = Date.now();
  const statuses = await getContactStatuses();
  const overdue = statuses.filter(c => c.isOverdue).slice(0, 3);

  let alertCount = 0;
  for (const c of overdue) {
    const msg = c.daysSince !== null
      ? `Llevas ${c.daysSince} días sin quedar con ${c.name}.`
      : `Aún no has registrado contacto con ${c.name}.`;

    const sent = await sendPush(
      `Vera · ${c.name}`,
      msg,
      `contact_${c.id}`,
      72, // cooldown 3 días
    );
    if (sent) alertCount++;
  }

  await db.insert(agentLog).values({
    agentId: 'contacts',
    action: 'check',
    input: `${statuses.length} contactos`,
    output: `${overdue.length} pendientes, ${alertCount} alertas`,
    status: 'ok',
    durationMs: Date.now() - startTime,
  }).catch(() => {});

  return { alerts: alertCount };
}
