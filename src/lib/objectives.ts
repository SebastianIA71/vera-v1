import { db } from './db';
import { projects } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { TIER_DAYS, type ObjectiveTier } from './objectiveTiers';

export * from './objectiveTiers';

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

/**
 * Prorroga automáticamente los objetivos cuyo periodo actual ya venció.
 * No hay cron dedicado: se llama en cada lectura (página de proyectos,
 * ritual matutino) para que las fechas estén siempre al día.
 */
export async function renewOverdueObjectives(): Promise<void> {
  const now = new Date();
  const active = await db.select().from(projects)
    .where(and(eq(projects.isObjective, true), eq(projects.status, 'active')));

  for (const p of active) {
    if (!p.objectiveTier || !p.dueDate) continue;
    const periodDays = TIER_DAYS[p.objectiveTier as ObjectiveTier];
    if (!periodDays) continue;
    if (p.dueDate.getTime() > now.getTime()) continue;

    let start = p.objectiveStartedAt ?? p.dueDate;
    let end = p.dueDate;
    let renewals = p.objectiveRenewals ?? 0;
    while (end.getTime() <= now.getTime()) {
      start = end;
      end = addDays(start, periodDays);
      renewals += 1;
    }

    await db.update(projects).set({
      objectiveStartedAt: start,
      dueDate: end,
      objectiveRenewals: renewals,
      updatedAt: now,
    }).where(eq(projects.id, p.id));
  }
}
