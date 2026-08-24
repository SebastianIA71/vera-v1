// Constantes de periodicidad de objetivos — sin dependencias de servidor,
// seguro para importar tanto en componentes cliente como en server.

export type ObjectiveTier = 'semanal' | 'quincenal' | 'mensual' | 'trimestral';

export const OBJECTIVE_TIERS: ObjectiveTier[] = ['semanal', 'quincenal', 'mensual', 'trimestral'];

export const TIER_DAYS: Record<ObjectiveTier, number> = {
  semanal: 7,
  quincenal: 14,
  mensual: 30,
  trimestral: 90,
};

export const TIER_LABEL: Record<ObjectiveTier, string> = {
  semanal: 'SEMANAL',
  quincenal: 'QUINCENAL',
  mensual: 'MENSUAL',
  trimestral: 'TRIMESTRAL',
};
