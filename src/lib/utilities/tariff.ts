/**
 * Tarifas de suministro — datos versionados, NO código.
 *
 * Cada medidor guarda en `utility_meters.tariff_config` un JSON con un array
 * de versiones (la más reciente cuya `vigenteDesde <= fecha` es la que aplica).
 * Un cambio de tarifa del BOIB / ATIB = editar ese registro, no un deploy.
 *
 * Fórmula (verificada al céntimo contra 4 facturas reales de Porrassa 60):
 *
 *   TOTAL = round(A) + round(IVA_A·A) + round(B) + round(IVA_B·B) + round(C) + round(D)
 *   (redondeo a 2 decimales POR LÍNEA, antes de sumar)
 *
 *   A = preu de l'aigua (municipal) — NO marginal: un único €/m³, el del tramo
 *       donde cae el consumo TOTAL, aplicado a todos los m³.
 *   B = cuota de manteniment (municipal, fija) + IVA_B
 *   C = cànon de quota fixa (ATIB, fija, sin IVA)
 *   D = cànon de quota variable (ATIB) — marginal real por bloques.
 */

export type PriceBand = {
  /** Límite superior del tramo en m³/ciclo, inclusive. `null` = sin límite. */
  upTo: number | null;
  /** €/m³ */
  price: number;
};

export type WaterTariff = {
  vigenteDesde: string;          // 'YYYY-MM-DD'
  fuente: string;
  /** Tramo A (no marginal): precio único según el consumo total. */
  priceA: PriceBand[];
  ivaA: number;                  // 0.10
  cuotaB: number;                // €/ciclo fijos
  ivaB: number;                  // 0.21
  cuotaC: number;                // €/ciclo fijos (sin IVA)
  /** Bloques D (marginal): cada tramo paga su precio sólo por su parte. */
  blocksD: PriceBand[];
  /** Notas / pendientes de confirmar contra fuente primaria. */
  pendiente?: string;
};

/**
 * Tarifa por defecto — Aigua Porrassa 60, Dalt de Sa Rápita (Campos).
 * Ciclo bimestral. Los tramos D oficiales son mensuales → aquí van duplicados
 * (verificado exactamente contra las 4 facturas).
 */
export const AGUA_CAMPOS_2025: WaterTariff = {
  vigenteDesde: '2024-01-01',
  fuente:
    'BOIB — ordenança fiscal Ajuntament de Campos (tram A) + ATIB cànon de sanejament (C y D). ' +
    'https://www.caib.es/eboibfront/ · https://www.atib.es/TA/contenido.aspx?Id=9858',
  priceA: [
    { upTo: 15,   price: 0.85 },
    { upTo: 30,   price: 1.25 },
    { upTo: 45,   price: 1.80 },
    { upTo: 60,   price: 2.50 },
    { upTo: 75,   price: 3.40 },
    { upTo: 90,   price: 4.50 },
    { upTo: 105,  price: 5.60 },
    { upTo: null, price: 6.00 },
  ],
  ivaA: 0.10,
  cuotaB: 7.50,
  ivaB: 0.21,
  cuotaC: 8.00,
  blocksD: [
    { upTo: 12,   price: 0.285924 },
    { upTo: 20,   price: 0.428835 },
    { upTo: 40,   price: 0.571848 },
    { upTo: 80,   price: 1.143696 },
    { upTo: null, price: 1.714516 },
  ],
  pendiente:
    'Anclar el BOIB concreto de la ordenanza vigente de Campos y la fecha de vigencia ' +
    'exacta de los importes del cànon de sanejament antes de darlo por definitivo.',
};

/** Config tal cual se guarda en la columna `tariff_config` (array de versiones). */
export const DEFAULT_WATER_TARIFF_CONFIG: WaterTariff[] = [AGUA_CAMPOS_2025];

/** Devuelve la versión de tarifa aplicable a `dateISO` (o la más antigua si ninguna). */
export function resolveTariff(config: WaterTariff[], dateISO: string): WaterTariff {
  const sorted = [...config].sort((a, b) => a.vigenteDesde.localeCompare(b.vigenteDesde));
  let chosen = sorted[0];
  for (const t of sorted) {
    if (t.vigenteDesde <= dateISO) chosen = t;
  }
  return chosen;
}

/** Parsea `utility_meters.tariff_config`; cae al default si está vacío o corrupto. */
export function parseTariffConfig(raw: string | null | undefined): WaterTariff[] {
  if (!raw) return DEFAULT_WATER_TARIFF_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as WaterTariff[];
    return DEFAULT_WATER_TARIFF_CONFIG;
  } catch {
    return DEFAULT_WATER_TARIFF_CONFIG;
  }
}
