import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { properties, events, tasks } from '@/lib/db/schema';

const SEED_PROPERTIES = [
  { id: 'flat',     name: 'Flat',     location: 'Palma',    color: '#5ba8e8', icon: '🏙' },
  { id: 'sarapita', name: 'Sarapita', location: 'Campos',   color: '#9b7fe8', icon: '🌿' },
  { id: 'willys',   name: "Willy's",  location: 'Marratxí', color: '#4ecb8d', icon: '🎪' },
];

const SEED_EVENTS = [
  { title: 'Madrid · Bruno Mars',     startDate: new Date('2026-07-11'), endDate: new Date('2026-07-12'), type: 'viaje', who: 'pareja',  status: 'refining' },
  { title: 'Escandinavia',            startDate: new Date('2026-07-15'), endDate: new Date('2026-07-27'), type: 'viaje', who: 'familia', status: 'refining' },
  { title: 'Alcudia / Pto. Pollença', startDate: new Date('2026-08-07'), endDate: new Date('2026-08-09'), type: 'viaje', who: 'familia', status: 'planning' },
  { title: 'Cofrentes',               startDate: new Date('2026-08-14'), endDate: new Date('2026-08-17'), type: 'viaje', who: 'familia', status: 'planning' },
  { title: 'Zaragoza',                startDate: new Date('2026-10-10'), endDate: new Date('2026-10-12'), type: 'viaje', who: 'amigos',  status: 'planning' },
  { title: 'Como + Milán',            startDate: new Date('2026-12-28'), endDate: new Date('2027-01-01'), type: 'viaje', who: 'familia', status: 'planning' },
];

const SEED_TASKS = [
  { title: 'Reservar tren Oslo→Flåm',        propertyId: null, prio: 9, prioFinal: 9, detail: 'Escandinavia · pendiente de reserva', tags: 'viaje,escandinavia', dueDate: new Date('2026-07-15') },
  { title: 'Coche de alquiler en Sogndal',   propertyId: null, prio: 8, prioFinal: 8, detail: 'Buscar en Europcar/Hertz', tags: 'viaje,escandinavia', dueDate: new Date('2026-07-15') },
  { title: 'IAfont — definir slot',           propertyId: null, prio: 7, prioFinal: 7, detail: 'Slot máximo junio 2026', tags: 'creativo,iafont', lastActionAt: new Date(Date.now() - 11 * 86400000) },
  { title: 'IAxLabs — definir slot',          propertyId: null, prio: 7, prioFinal: 7, detail: 'Laboratorio experimental, deadline junio', tags: 'creativo,iaxlabs' },
  { title: 'Barra Sarapita · Plastonda',     propertyId: 'sarapita', prio: 6, prioFinal: 6, detail: 'Comprar plastonda para la barra exterior', type: 'compra' },
  { title: 'Revisar duplicados alojamiento Escandinavia', propertyId: null, prio: 6, prioFinal: 6, detail: 'Posibles duplicados en reservas Escandinavia', tags: 'viaje' },
  { title: 'Dermatólogo — revisión anual',   propertyId: null, prio: 5, prioFinal: 5, detail: 'Pedir cita revisión anual', type: 'gestión', lastActionAt: new Date(Date.now() - 19 * 86400000) },
  { title: 'Porsche — km actual',            propertyId: null, prio: 4, prioFinal: 4, detail: 'Registrar km actuales para control de contrato', type: 'gestión' },
  { title: 'Gresite piscina Willy\'s',       propertyId: 'willys', prio: 5, prioFinal: 5, detail: 'Valorar renovación gresite zona interior', type: 'proyecto' },
  { title: 'Generador Willy\'s — revisar',   propertyId: 'willys', prio: 6, prioFinal: 6, detail: 'Mantenimiento preventivo generador', type: 'tarea' },
  { title: 'Cuadro eléctrico Flat',          propertyId: 'flat', prio: 5, prioFinal: 5, detail: 'Revisar estado diferencial', type: 'gestión' },
  { title: 'Confirmación entradas Bruno Mars', propertyId: null, prio: 7, prioFinal: 7, detail: 'Confirmar entradas Madrid julio', tags: 'viaje' },
];

async function runSeed(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  if (searchParams.get('secret') !== process.env.SESSION_SECRET?.slice(0, 8)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Insert properties (ignore if already exist)
  for (const p of SEED_PROPERTIES) {
    await db.insert(properties).values(p).onConflictDoNothing();
  }

  // Insert events
  await db.insert(events).values(SEED_EVENTS).onConflictDoNothing();

  // Insert tasks
  await db.insert(tasks).values(
    SEED_TASKS.map(t => ({ ...t, status: 'wait' as const, source: 'seed' as const }))
  );

  return NextResponse.json({ ok: true, properties: SEED_PROPERTIES.length, events: SEED_EVENTS.length, tasks: SEED_TASKS.length });
}

export async function GET(req: NextRequest) {
  return runSeed(req);
}

export async function POST(req: NextRequest) {
  return runSeed(req);
}
