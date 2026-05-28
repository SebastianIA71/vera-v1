/**
 * VERA — Datos iniciales de seed
 * Versión: 0.2
 *
 * Ejecutar: npx ts-node src/lib/db/seed-manual.ts
 *
 * Este archivo contiene todos los datos conocidos de Sebastián
 * para poblar la base de datos inicial sin depender del Excel.
 * Complementar con el import del SandLife.xlsx para datos completos.
 *
 * ============================================================
 * CAMBIOS RESPECTO A v0.1
 * ============================================================
 * - El campo `monthlyAmount` ha sido renombrado a `monthlyAmountPlaintext`
 *   en SEED_CONTRACTS. Sigue siendo un número en este fichero porque
 *   es el "manifest" que mantiene Sebastián.
 *
 *   El runner del seed (src/lib/db/seed.ts) DEBE cifrar este valor
 *   con AES-GCM usando la clave derivada del PIN antes de insertarlo
 *   en la columna `monthlyAmountEnc` de la tabla `contracts`.
 *
 *   Si el seed se ejecuta sin PIN configurado (primera vez del sistema),
 *   las filas de contracts se insertan SIN importe y se completan
 *   después desde un formulario asistido en /settings/finance/import,
 *   que se ejecuta tras el setup del PIN y cifra en cliente.
 *
 * - Nuevas claves en SEED_MEMORY relacionadas con la nueva arquitectura.
 * - system.version actualizado a 0.2.
 *
 * NOTA DE SEGURIDAD: este fichero contiene importes en claro.
 * NO subirlo al repositorio público. Añadirlo a .gitignore o
 * mantenerlo fuera del repo. Considerar leerlo desde una ruta
 * fuera del proyecto (ej. ~/.vera-seed/seed-data.ts).
 */

// ============================================================
// PROPIEDADES
// ============================================================

export const SEED_PROPERTIES = [
  {
    id: 'flat',
    name: 'Flat',
    location: 'Palma de Mallorca',
    color: '#5ba8e8',
    icon: '🏙',
  },
  {
    id: 'sarapita',
    name: 'Sarapita',
    location: 'Campos, Mallorca',
    color: '#9b7fe8',
    icon: '🌿',
  },
  {
    id: 'willys',
    name: "Willy's",
    location: 'Marratxí, Mallorca',
    color: '#4ecb8d',
    icon: '🎪',
  },
];

// ============================================================
// EVENTOS / VIAJES
// ============================================================

export const SEED_EVENTS = [
  {
    title: 'Madrid · Bruno Mars',
    startDate: '2026-07-11',
    endDate: '2026-07-12',
    type: 'viaje',
    who: 'pareja',
    status: 'refining',
    transport: JSON.stringify({ vuelos: 'ok' }),
    accommodation: JSON.stringify({ hotel: 'reservado' }),
    notes: 'Concierto Bruno Mars el 12. Solo Sebastián y su mujer.',
    approx: false,
  },
  {
    title: 'Escandinavia',
    startDate: '2026-07-15',
    endDate: '2026-07-27',
    type: 'viaje',
    who: 'familia',
    status: 'refining',
    transport: JSON.stringify({
      vuelos: 'ok — PMI→STO→CPH→OSL→BER→PMI (KLM)',
      tren_flam: 'PENDIENTE — 23 jul 13:45',
      coche_sogndal: 'PENDIENTE — reservar urgente'
    }),
    accommodation: JSON.stringify({
      estocolmo_1: 'Queen\'s Hotel by First Hotels — jul 16 — desayuno inc',
      estocolmo_2: 'Gamla Stan — jul 17 — sin desayuno',
      copenhagen: 'Scandic CPH Strandpark — jul 20 — desayuno inc',
      oslo: 'Comfort Hotel Grand Central — jul 21 — desayuno inc',
      bergen: 'PENDIENTE',
      duplicados: 'REVISAR — hay duplicados en Booking/Airbnb'
    }),
    notes: '13 días. Ruta: Estocolmo → Karlstad → Oslo → Copenhagen → Oslo → Sogndal/Flåm → Bergen → Berlín (escala) → PMI',
    approx: false,
  },
  {
    title: 'Alcudia / Pto. Pollença',
    startDate: '2026-08-07',
    endDate: '2026-08-09',
    type: 'viaje',
    who: 'familia',
    status: 'planning',
    transport: JSON.stringify({ nota: 'PMI→Alcudia por definir' }),
    accommodation: JSON.stringify({ estado: 'reservado' }),
    approx: false,
  },
  {
    title: 'Cofrentes',
    startDate: '2026-08-14',
    endDate: '2026-08-17',
    type: 'viaje',
    who: 'familia',
    status: 'planning',
    transport: JSON.stringify({ barco: 'ok' }),
    accommodation: JSON.stringify({ estado: 'reservado' }),
    notes: 'Destino conocido — parque acuático / aventura',
    approx: false,
  },
  {
    title: 'Zaragoza',
    startDate: '2026-10-10',
    endDate: '2026-10-12',
    type: 'viaje',
    who: 'amigos',
    status: 'planning',
    transport: JSON.stringify({ vuelos: 'ok' }),
    accommodation: JSON.stringify({ estado: 'reservado' }),
    approx: false,
  },
  {
    title: 'Como + Milán · Navidad',
    startDate: '2026-12-28',
    endDate: '2027-01-01',
    type: 'viaje',
    who: 'familia',
    status: 'planning',
    transport: JSON.stringify({ vuelos: 'ok' }),
    accommodation: JSON.stringify({ estado: 'reservado' }),
    notes: 'Fin de año en norte Italia. Navidad. Reservar restaurantes con antelación (alert: septiembre)',
    approx: false,
  },
  {
    title: 'Fiestas Willy\'s',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    type: 'evento',
    who: 'familia+amigos',
    propertyId: 'willys',
    status: 'planning',
    notes: 'Evento grande en la parcela. Escenario, barra, sonido. Preparación activa.',
    approx: true,
  },
];

// ============================================================
// TAREAS GENERALES (NoW)
// ============================================================

export const SEED_NOW_TASKS = [
  {
    title: 'Guille hair — buscar centros en Palma',
    prio: 9, prioManual: 9,
    status: 'active',
    inNow: true,
    type: 'gestión',
    detail: 'Buscar al menos 2-3 centros, comparar',
  },
  {
    title: 'XAVI Starlink — baja IBRED + solicitar llaves',
    prio: 8, prioManual: 8,
    status: 'active',
    inNow: true,
    type: 'gestión',
    detail: 'Primer mail a IBRED esta semana. Seguimiento en 7 días.',
    propertyId: 'sarapita',
    context: 'Servicio de internet en Sarapita a nombre de Xavi. Hay que dar de baja en IBRED y solicitar las llaves.',
  },
  {
    title: 'Reservar tren Oslo→Flåm',
    prio: 9, prioManual: 8,
    status: 'active',
    inNow: true,
    type: 'gestión',
    detail: '23 jul 13:45 · rail.no o trainline · precio sube en verano',
    context: 'Parte del viaje Escandinavia. Tren de Oslo a Flåm el 23 de julio a las 13:45. Pendiente de reservar. Los precios de los trenes noruegos en julio son altos.',
    dueDate: '2026-06-15',
  },
  {
    title: 'Coche de alquiler en Sogndal',
    prio: 8, prioManual: 8,
    status: 'active',
    inNow: true,
    type: 'gestión',
    detail: 'Zona fiordos · julio se llena rápido · Rentalcars/local',
    context: 'Escandinavia: necesitan coche para moverse por la zona de Sogndal y los fiordos. Verano en Noruega = disponibilidad limitada.',
    dueDate: '2026-06-10',
  },
  {
    title: 'Dermatólogo — comentar winx',
    prio: 4, prioManual: 4,
    status: 'wait',
    inNow: false,
    type: 'médico',
    detail: 'Pedir cita · Adeslas · preparar lista de temas',
    lastActionAt: new Date(Date.now() - 19 * 86400000), // 19 días sin mover
  },
  {
    title: 'Corte Inglés — chaqueta + camisetas',
    prio: 5, prioManual: 5,
    status: 'wait',
    inNow: false,
    type: 'compra',
  },
  {
    title: 'IAfont — definir slot y lanzar',
    prio: 7, prioManual: 6,
    status: 'active',
    inNow: true,
    type: 'creativo',
    detail: 'Deadline máximo junio · slot pendiente de bloquear',
    context: 'Proyecto Substack sobre IA. Casi listo técnicamente. El problema no es técnico sino de decisión y energía de lanzamiento. Deadline autoimpuesto: junio 2026.',
    dueDate: '2026-06-30',
  },
  {
    title: 'IAxLabs — preparar lanzamiento',
    prio: 7, prioManual: 6,
    status: 'active',
    inNow: true,
    type: 'creativo',
    detail: 'Mismo slot que IAfont · junio máximo',
    dueDate: '2026-06-30',
  },
  {
    title: 'Revisar duplicados alojamiento Escandinavia',
    prio: 7, prioManual: 7,
    status: 'week',
    inNow: true,
    type: 'gestión',
    detail: 'Booking + Airbnb · identificar duplicados · cancelar con margen',
    context: 'Hay alojamientos duplicados reservados en algunos destinos del viaje. Revisar en Booking.com y Airbnb. Todavía hay margen para cancelar sin penalización.',
  },
  {
    title: 'Física / alimentación — rutina post-pausa',
    prio: 3, prioManual: 3,
    status: 'wait',
    inNow: false,
    detail: 'PT pausa hasta junio · retomar lunes-miércoles',
  },
  {
    title: 'AEAT — gestión fiscal pendiente',
    prio: 3, prioManual: 3,
    status: 'wait',
    inNow: false,
    type: 'gestión',
  },
];

// ============================================================
// TAREAS FLAT · PALMA
// ============================================================

export const SEED_FLAT_TASKS = [
  {
    title: 'Revestimiento lateral habitación',
    prio: 9, prioManual: 9,
    status: 'active',
    propertyId: 'flat',
    detail: 'Comprar un paquete a ver cómo queda',
  },
  {
    title: 'Esquinero cuarto baño niños',
    prio: 7, prioManual: 7,
    status: 'week',
    propertyId: 'flat',
    detail: 'Amazon · formato 4-4-3 o 3-3-3 · si es bueno, comprar más',
  },
  {
    title: 'Revisar techo Guille + pared',
    prio: 6, prioManual: 6,
    status: 'week',
    propertyId: 'flat',
    detail: 'Adeslas → primero ver físicamente, luego email',
  },
  {
    title: 'Sillas exterior + telas + tumbonas',
    prio: 3, prioManual: 3,
    status: 'week',
    propertyId: 'flat',
    detail: 'Silla 60×70 h67 · medidas Leroy Merlin',
  },
  {
    title: 'Cargador inalámbrico iPhones',
    prio: 2, prioManual: 2,
    status: 'week',
    propertyId: 'flat',
    detail: 'Amazon',
    type: 'compra',
  },
  {
    title: 'Zona desayunos cocina',
    prio: 2, prioManual: 2,
    status: 'wait',
    propertyId: 'flat',
    detail: 'VP — pendiente de definir',
  },
  {
    title: 'Bajo del fregadero',
    prio: 2, prioManual: 2,
    status: 'wait',
    propertyId: 'flat',
  },
  {
    title: 'Esquina mampara baño nuestro',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'flat',
    detail: '¿Qué hay que hacer exactamente? Pendiente de evaluar',
  },
  {
    title: 'Cortinas cuarto nuestro',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'flat',
    detail: 'VP · quitar las actuales primero, ver opciones',
  },
  {
    title: 'Stores comedor',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'flat',
    detail: '2× 140×190/200',
    type: 'compra',
  },
  {
    title: 'Cuadros cuarto nuestro',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'flat',
    detail: 'Medidas pared: 270×320 cm',
  },
  {
    title: 'Cama nuestra (bajo)',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'flat',
    detail: '200×150 o 190? Decidir primero',
  },
];

// ============================================================
// TAREAS SARAPITA · CAMPOS
// ============================================================

export const SEED_SARAPITA_TASKS = [
  {
    title: 'Barra · Plastonda · Pegatina fiestas',
    prio: 6, prioManual: 6,
    status: 'week',
    propertyId: 'sarapita',
    detail: 'Comprar plastonda en Leroy Merlin · usar pegatina fiestas años anteriores',
    type: 'compra',
  },
  {
    title: 'Inscripción fiestas en barra',
    prio: 4, prioManual: 4,
    status: 'design',
    propertyId: 'sarapita',
    detail: 'Buscar logos años anteriores · app para generar PDF',
  },
  {
    title: 'Árboles casa — planificar corte',
    prio: 2, prioManual: 2,
    status: 'week',
    propertyId: 'sarapita',
    detail: 'Ojo con la altura · planificar antes de actuar',
  },
  {
    title: 'Baldosas detrás setos',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'sarapita',
    detail: 'Localizar · revisar zona trasera',
  },
];

// ============================================================
// TAREAS WILLY'S · MARRATXÍ
// ============================================================

export const SEED_WILLYS_TASKS = [
  {
    title: 'Sonido escenario vmicro',
    prio: 7, prioManual: 7,
    status: 'recover',
    propertyId: 'willys',
    detail: 'Descartar amplificador viejo. Esconder o tirar. Revisar inalámbricos.',
    context: 'El escenario de Willy\'s tiene problemas de sonido. El amplificador actual no funciona bien. Hay micrófonos inalámbricos que hay que revisar. Antes de contratar técnico, agotar opciones propias.',
  },
  {
    title: 'Caseta madera — centrar',
    prio: 6, prioManual: 6,
    status: 'week',
    propertyId: 'willys',
    detail: 'Probar con un trozo primero',
  },
  {
    title: 'Paellaworld — materiales',
    prio: 4, prioManual: 4,
    status: 'recover',
    propertyId: 'willys',
    detail: '¿Qué falta exactamente? · Leroy Merlin, Bauhaus, Alcampo',
  },
  {
    title: 'Food Truck — puesta a punto',
    prio: 2, prioManual: 2,
    status: 'active',
    propertyId: 'willys',
    detail: 'Ruedas, faros, retrovisor, limpiaparabrisas · mirar planchas negras',
  },
  {
    title: 'Gresite piscina',
    prio: 1, prioManual: 1,
    status: 'wait',
    propertyId: 'willys',
    detail: 'TotalTech CEYS · se puede pegar sin vaciar · resiste cloro y sal',
    context: 'Visto en Instagram. TotalTech de CEYS permite pegar gresite sin vaciar la piscina. Resiste cloro, sal y cambios de temperatura. ~8€ en Amazon. Aprovechar tarde libre en agosto.',
    type: 'inspiración',
  },
  {
    title: 'Toldo escenario',
    prio: 0, prioManual: 0,
    status: 'wait',
    propertyId: 'willys',
    detail: '~24€ · comprar antes de fiestas',
    type: 'compra',
  },
];

// ============================================================
// CONTRATOS / GASTOS FIJOS
// ============================================================
//
// IMPORTANTE — CIFRADO DE IMPORTES (v0.2)
// ----------------------------------------
// El campo `monthlyAmountPlaintext` es el importe en claro, declarado
// aquí para que Sebastián lo mantenga legible. NUNCA llega a la base
// de datos con este nombre.
//
// El runner del seed (src/lib/db/seed.ts) hace:
//   1. Pide PIN (interactivo) o lo recibe del setup recién hecho
//   2. Deriva la clave AES con PBKDF2(pin, PIN_KDF_SALT)
//   3. Por cada contrato: cifra `monthlyAmountPlaintext` → string base64
//   4. Inserta en la columna `monthlyAmountEnc`
//
// Si el seed se ejecuta sin PIN (caso normal en primer arranque):
//   - Inserta el contrato con `monthlyAmountEnc = null`
//   - Sebastián completa los importes después desde
//     /settings/finance/import (cifrado en cliente con el PIN activo)
//
// Este fichero (vera-seed-data.ts) debe estar en .gitignore o vivir
// fuera del repositorio público. Contiene datos sensibles en claro.
// ============================================================

export const SEED_CONTRACTS = [
  // AGUA
  { name: 'Agua Sarapita',   provider: 'Aj. Campos', propertyId: 'sarapita', category: 'agua', monthlyAmountPlaintext: 151.83, active: true },
  { name: 'Agua Flat',       provider: 'EMAYA',      propertyId: 'flat',     category: 'agua', monthlyAmountPlaintext: 78.33,  active: true },
  { name: 'Agua Willy\'s',   provider: 'Junta SRN',  propertyId: 'willys',   category: 'agua', monthlyAmountPlaintext: 49.12,  active: true },
  // ELECTRICIDAD
  { name: 'Luz Sarapita',    provider: 'REPSOL', propertyId: 'sarapita', category: 'luz', monthlyAmountPlaintext: 144.69, active: true },
  { name: 'Luz Flat',        provider: 'REPSOL', propertyId: 'flat',     category: 'luz', monthlyAmountPlaintext: 109.50, active: true },
  { name: 'Luz Willy\'s',    provider: 'ENDESA', propertyId: 'willys',   category: 'luz', monthlyAmountPlaintext: 193.06, active: true },
  // TELECOMUNICACIONES
  { name: 'Internet Sarapita', provider: 'IBRED',    propertyId: 'sarapita', category: 'telecom', monthlyAmountPlaintext: 31.99,  active: true, notes: 'Pendiente de dar de baja (gestión Xavi Starlink)' },
  { name: 'Internet Flat',     provider: 'Vodafone', propertyId: 'flat',     category: 'telecom', monthlyAmountPlaintext: 81.89,  active: true },
  { name: 'Internet Willy\'s', provider: 'Jazztel',  propertyId: 'willys',   category: 'telecom', monthlyAmountPlaintext: 156.76, active: true, notes: 'Bajará ~15€/mes a partir de agosto 2026' },
  // RENTING COCHES
  { name: 'Renting Porsche', provider: 'Renting', category: 'renting', monthlyAmountPlaintext: 291.50, active: true, endDate: '2029-12-31', notes: '19/60 cuotas. Valor tabla: 21.900€. Fin dic 2029.' },
  { name: 'Renting BMW',     provider: 'Renting', category: 'renting', monthlyAmountPlaintext: 0,      active: true, notes: 'Datos pendientes de completar' },
  // DISPOSITIVOS
  { name: 'iPhone 15 128GB',         provider: 'Operadora', category: 'dispositivo', monthlyAmountPlaintext: 35.50, active: true, endDate: '2026-08-31', alertDaysBefore: 60, notes: 'Cuota termina agosto 2026. Evaluar renegociación.' },
  { name: 'iPhone 17 Pro Max 256GB', provider: 'Operadora', category: 'dispositivo', monthlyAmountPlaintext: 59.00, active: true, endDate: '2027-11-30', notes: 'Cuota 5/24' },
];

// ============================================================
// MEMORIA INICIAL
// ============================================================

export const SEED_MEMORY = {
  // Datos personales
  'user.name': 'Sebastián',
  'user.wakeup_time': '07:00',
  'user.pt_days': ['lunes', 'miercoles'],
  'user.pt_paused_until': '2026-06-01',
  'user.no_interrupt_after': '22:00',
  'user.weight_method': 'SNM',
  'user.weight_target': '76.5',
  'user.weight_range': '77-80',
  'user.principle_cost': 'agotar_opciones_propias',
  'user.caprichos_ok': true,
  'user.max_daily_notifications': 3,

  // Sistema (v0.2)
  'system.version': '0.2',
  'system.created': new Date().toISOString(),
  'system.storage': 'turso',
  'system.hosting': 'vercel',
  'system.auth': 'pin_6_digits',
  'system.finance_encryption': 'aes_gcm_pbkdf2_pin',
  'system.finance_mobile_mask': 'reversible_formula',

  // Alertas activas
  'alerts.iafont_deadline': '2026-06-30',
  'alerts.escandinavia_date': '2026-07-15',

  // Preferencias aprendidas
  'preferences.leroy_merlin': 'prefiere_ir_a_ver_antes_de_comprar_online',
  'preferences.travel_booking': 'Booking.com + Airbnb',
  'preferences.voice_language': 'es-ES',
};
