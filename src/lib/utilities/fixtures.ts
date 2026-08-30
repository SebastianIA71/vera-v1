/**
 * Datos de referencia para Sarapita / Aigua Porrassa 60 (contador ZA010655).
 * Se usan en el seed (/api/suministros/seed) y en el selftest del motor.
 */

/** Pares (consumo m³ → total € factura real) — oráculo de verificación del motor. */
export const BILL_ORACLE: { consumo: number; total: number }[] = [
  { consumo: 13,  total: 33.10 },
  { consumo: 38,  total: 109.48 },
  { consumo: 109, total: 850.25 },
  { consumo: 211, total: 1698.33 },
];

/**
 * Lecturas históricas aportadas (contador ZA010655). Formato DD/MM/YY → ISO.
 * Las 4 lecturas sin fecha del original (312, 314, 319, 321) quedan FUERA
 * hasta poder ordenarlas — no se siembran.
 */
export const HISTORIC_READINGS: { date: string; value: number }[] = [
  { date: '2024-08-11', value: 217 },
  { date: '2024-09-30', value: 275 },
  { date: '2024-10-11', value: 281 },
  { date: '2024-10-25', value: 284 },
  { date: '2024-11-04', value: 287 },
  { date: '2024-11-08', value: 288 },
  { date: '2024-11-12', value: 289 },
  { date: '2024-11-16', value: 290 },
  { date: '2024-11-23', value: 290 },
  { date: '2024-12-06', value: 292 },
  { date: '2024-12-11', value: 294 },
  { date: '2024-12-20', value: 299 },
  { date: '2025-01-12', value: 304 },
  { date: '2025-01-21', value: 305 },
  { date: '2025-02-07', value: 306 },
  { date: '2025-02-11', value: 307 },
  { date: '2025-02-24', value: 308 },
  { date: '2025-03-04', value: 308 },
  { date: '2025-03-06', value: 308 },
  { date: '2025-03-14', value: 308 },
  { date: '2025-03-31', value: 309 },
  { date: '2025-04-28', value: 311 },
  { date: '2025-06-22', value: 353 },
  { date: '2025-06-27', value: 368 },
  { date: '2025-06-30', value: 375 },
];

export const METER_SEED = {
  propertyId: 'sarapita',
  type: 'agua',
  name: 'Agua · Porrassa 60',
  provider: "Servei Municipal d'Aigua Potable — Ajuntament de Campos",
  serial: 'ZA010655',
  polizaRef: '101633',
  unit: 'm3',
  billingMonths: 2,
  cycleAnchor: 'ene',
  notes:
    'Contador Sagemcom S23ZA010655, instalado 05/2023. Ciclo bimestral. ' +
    'Doble facturación: municipal (Ajuntament) + cànon sanejament (ATIB). ' +
    'Lecturas sin fecha pendientes: 312, 314, 319, 321.',
};
