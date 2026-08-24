import { db } from './db';
import { projects } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { TIER_DAYS, type ObjectiveTier } from './objectiveTiers';

export * from './objectiveTiers';

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

export type ObjectiveDisplay = {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  iconUrl: string | null;
  daysTo: number;
  tier: ObjectiveTier;
};

type ProjectRow = {
  id: number; name: string; color: string | null; icon: string | null; iconUrl: string | null;
  isObjective: boolean | null; objectiveTier: string | null; dueDate: Date | null;
};

/**
 * A partir de proyectos activos, construye la lista de objetivos a mostrar:
 * hasta 2 semanales, 1 quincenal, 1 mensual, 1 trimestral — en ese orden
 * (usado tanto en el ritual matutino como en el Command Centre).
 */
export function buildObjectivesList(activeProjects: ProjectRow[], now: Date = new Date()): ObjectiveDisplay[] {
  const withTier = activeProjects
    .filter(p => p.isObjective && p.objectiveTier && p.dueDate)
    .map(p => {
      const daysTo = Math.ceil((p.dueDate!.getTime() - now.getTime()) / 86400000);
      return { id: p.id, name: p.name, color: p.color, icon: p.icon, iconUrl: p.iconUrl, daysTo, tier: p.objectiveTier as ObjectiveTier };
    });

  const byTier = (tier: ObjectiveTier, limit: number) =>
    withTier.filter(o => o.tier === tier).sort((a, b) => a.daysTo - b.daysTo).slice(0, limit);

  return [
    ...byTier('semanal', 2),
    ...byTier('quincenal', 1),
    ...byTier('mensual', 1),
    ...byTier('trimestral', 1),
  ];
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
