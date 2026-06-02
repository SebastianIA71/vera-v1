/**
 * Travel Search — SerpAPI (Google Flights) + smart deep-links.
 * Flujo completamente asíncrono: el usuario recibe notificación cuando hay resultados.
 *
 * Env vars:
 *   SERPAPI_KEY  → API key de serpapi.com (100 búsquedas/mes gratis)
 *
 * Sin SERPAPI_KEY el pipeline funciona con smart links solamente.
 */

import { callClaude } from '@/lib/claude';
import { db } from '@/lib/db';
import { tasks, notifications } from '@/lib/db/schema';
import { sendPush } from '@/lib/push';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type TravelType = 'flight' | 'hotel' | 'train' | 'ferry' | 'car' | 'travel';

export type TravelIntent = {
  type:        TravelType;
  origin:      string | null;
  destination: string | null;
  dateFrom:    string | null;
  dateTo:      string | null;
  passengers:  number;
  guests:      number;
};

export type TravelResult = {
  title:       string;
  url:         string;
  description: string;
  badge?:      string;
  price?:      string;
};

// ─── Detección de intent ──────────────────────────────────────────────────────

const TRAVEL_RE = /\b(vuelo|vuelos?|volar|fly|flights?|avi[oó]n|aeropuerto|hotel|hoteles?|hostal|alojamiento|hospedaje|airbnb|booking|tren|ave|cercan[íi]as|renfe|ferrocarril|ferry|ferri|barco|crucero|alquiler.*coche|rent.*car|car\s+rental|transfer|traslado|transporte)\b/i;

export function isTravelQuery(query: string): boolean {
  return TRAVEL_RE.test(query);
}

// ─── IATA map ─────────────────────────────────────────────────────────────────

const IATA: Record<string, string> = {
  madrid: 'MAD', barcelona: 'BCN',
  palma: 'PMI', 'palma de mallorca': 'PMI', mallorca: 'PMI',
  menorca: 'MAH', ibiza: 'IBZ', eivissa: 'IBZ',
  valencia: 'VLC', sevilla: 'SVQ', bilbao: 'BIO',
  'málaga': 'AGP', malaga: 'AGP', alicante: 'ALC',
  'gran canaria': 'LPA', 'las palmas': 'LPA',
  tenerife: 'TFS', murcia: 'MJV',
  'santiago de compostela': 'SCQ', asturias: 'OVD',
  santander: 'SDR', zaragoza: 'ZAZ',
  lisboa: 'LIS', oporto: 'OPO', porto: 'OPO',
  paris: 'CDG', 'París': 'CDG',
  london: 'LHR', londres: 'LHR',
  roma: 'FCO', rome: 'FCO',
  milan: 'MXP', 'milán': 'MXP', milano: 'MXP', como: 'MXP',
  amsterdam: 'AMS', 'ámsterdam': 'AMS',
  'berlín': 'BER', berlin: 'BER',
  oslo: 'OSL', copenhague: 'CPH',
  estocolmo: 'ARN', stockholm: 'ARN',
  helsinki: 'HEL', viena: 'VIE', vienna: 'VIE',
  bruselas: 'BRU', praga: 'PRG', budapest: 'BUD', varsovia: 'WAW',
  // Destinos 2026 de Sebastián
  bergen: 'BGO', flam: 'BGO', sogndal: 'SOG',
  cofrentes: 'VLC', alcudia: 'PMI',
};

function toIata(name: string | null): string | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (IATA[key]) return IATA[key];
  if (/^[A-Z]{3}$/.test(name)) return name;
  return null;
}

// ─── Extracción de entidades via Claude haiku ─────────────────────────────────

const EXTRACT_SYSTEM = `Extrae las entidades de viaje. Devuelve solo JSON:
{
  "type": "flight"|"hotel"|"train"|"ferry"|"car"|"travel",
  "origin": "ciudad o código IATA, o null",
  "destination": "ciudad o código IATA, o null",
  "dateFrom": "YYYY-MM-DD o null",
  "dateTo": "YYYY-MM-DD o null",
  "passengers": 1,
  "guests": 1
}
Hoy: ${new Date().toISOString().slice(0, 10)}.`;

export async function extractTravelEntities(query: string): Promise<TravelIntent> {
  const fb: TravelIntent = { type: 'travel', origin: null, destination: null, dateFrom: null, dateTo: null, passengers: 1, guests: 1 };
  const res = await callClaude(query, EXTRACT_SYSTEM, 180);
  if (!res.ok) return fb;
  try {
    return { ...fb, ...JSON.parse(res.text.replace(/```json\n?|\n?```/g, '').trim()) };
  } catch { return fb; }
}

// ─── SerpAPI — Google Flights ──────────────────────────────────────────────────

async function searchFlightsSerpAPI(intent: TravelIntent): Promise<TravelResult[]> {
  const key  = process.env.SERPAPI_KEY;
  const org  = toIata(intent.origin);
  const dest = toIata(intent.destination);
  if (!key || !org || !dest) return [];

  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine',       'google_flights');
    url.searchParams.set('departure_id', org);
    url.searchParams.set('arrival_id',   dest);
    url.searchParams.set('adults',       String(intent.passengers));
    url.searchParams.set('currency',     'EUR');
    url.searchParams.set('hl',           'es');
    url.searchParams.set('api_key',      key);
    if (intent.dateFrom) url.searchParams.set('outbound_date', intent.dateFrom);

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = await res.json();

    type FlightLeg = { departure_airport?: { time?: string }; arrival_airport?: { time?: string }; airline?: string };
    type FlightOffer = { flights?: FlightLeg[]; total_duration?: number; price?: number; booking_token?: string };

    const offers: FlightOffer[] = [
      ...((data.best_flights  ?? []) as FlightOffer[]),
      ...((data.other_flights ?? []) as FlightOffer[]),
    ].slice(0, 3);

    const datePart = intent.dateFrom?.replace(/-/g, '').slice(2) ?? '';

    return offers.map((offer) => {
      const legs     = offer.flights ?? [];
      const first    = legs[0] ?? {};
      const last     = legs[legs.length - 1] ?? {};
      const depTime  = first.departure_airport?.time?.slice(-5) ?? '';
      const arrTime  = last.arrival_airport?.time?.slice(-5)   ?? '';
      const airline  = first.airline ?? '';
      const mins     = offer.total_duration ?? 0;
      const durStr   = mins ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}min` : ''}` : '';
      const price    = offer.price ?? 0;
      const stops    = legs.length - 1;
      const stopStr  = stops === 0 ? 'directo' : `${stops} escala${stops > 1 ? 's' : ''}`;
      const token    = offer.booking_token ?? '';
      const deepLink = token
        ? `https://www.google.com/flights?hl=es#flt=${token}`
        : `https://www.skyscanner.es/vuelos/${org.toLowerCase()}/${dest.toLowerCase()}/${datePart}/`;

      return {
        title:       `${org} → ${dest} · ${depTime}–${arrTime} · ${stopStr}`,
        url:         deepLink,
        description: `${airline} · ${durStr} · ${stopStr}`,
        badge:       'GOOGLE FLIGHTS',
        price:       `€ ${price} · ${airline}${durStr ? ` · ${durStr}` : ''}`,
      };
    });
  } catch {
    return [];
  }
}

// ─── Smart deep-links (siempre disponibles) ───────────────────────────────────

export function buildSmartLinks(intent: TravelIntent): TravelResult[] {
  const results: TravelResult[] = [];
  const org  = intent.origin?.trim()      ?? '';
  const dest = intent.destination?.trim() ?? '';
  const iOrg  = toIata(org)  ?? org.slice(0, 3).toLowerCase();
  const iDest = toIata(dest) ?? dest.slice(0, 3).toLowerCase();
  const datePart = intent.dateFrom?.replace(/-/g, '').slice(2) ?? '';

  if (intent.type === 'flight' || intent.type === 'travel') {
    const skyUrl = iOrg && iDest
      ? datePart
        ? `https://www.skyscanner.es/vuelos/${iOrg.toLowerCase()}/${iDest.toLowerCase()}/${datePart}/`
        : `https://www.skyscanner.es/vuelos/${iOrg.toLowerCase()}/${iDest.toLowerCase()}/`
      : iDest ? `https://www.skyscanner.es/vuelos/${iDest.toLowerCase()}/` : 'https://www.skyscanner.es';

    results.push({ title: `Skyscanner · ${org || 'origen'} → ${dest || 'destino'}`, url: skyUrl, description: 'Todos los vuelos incluyendo Ryanair, Vueling y low-cost.', badge: 'SKYSCANNER' });

    const gq = ['Flights', org ? `from ${org}` : '', dest ? `to ${dest}` : '', intent.dateFrom ? `on ${intent.dateFrom}` : ''].filter(Boolean).join(' ');
    results.push({ title: `Google Flights · ${org || 'origen'} → ${dest || 'destino'}`, url: `https://www.google.com/flights?q=${encodeURIComponent(gq)}`, description: 'Comparador con calendario de precios.', badge: 'GOOGLE FLIGHTS' });
  }

  if (intent.type === 'hotel' || intent.type === 'travel') {
    const bu = new URL('https://www.booking.com/searchresults.html');
    if (dest) bu.searchParams.set('ss', dest);
    if (intent.dateFrom) { bu.searchParams.set('checkin', intent.dateFrom); bu.searchParams.set('checkout', intent.dateTo ?? intent.dateFrom); }
    bu.searchParams.set('group_adults', String(intent.guests));
    results.push({ title: `Booking · ${dest || 'destino'}`, url: bu.toString(), description: 'Hoteles y apartamentos con cancelación gratuita.', badge: 'BOOKING' });
  }

  if (intent.type === 'train') {
    const ru = new URL('https://www.renfe.com/es/es/viajar/informacion-al-viajero/horarios');
    if (org)  ru.searchParams.set('origen',  org);
    if (dest) ru.searchParams.set('destino', dest);
    results.push({ title: `Renfe · ${org || 'origen'} → ${dest || 'destino'}`, url: ru.toString(), description: 'AVE y Alvia con tarifas Promo.', badge: 'RENFE' });
    results.push({ title: `Trainline · ${org || 'origen'} → ${dest || 'destino'}`, url: `https://www.thetrainline.com/es/billete-tren/${encodeURIComponent(org)}/${encodeURIComponent(dest)}`, description: 'Trenes europeos incluyendo AVE e Interrail.', badge: 'TRAINLINE' });
  }

  if (intent.type === 'ferry') {
    results.push({ title: `Direct Ferries · ${dest || 'destino'}`, url: 'https://www.directferries.es/', description: 'Comparador de ferries y travesías en España y Europa.', badge: 'FERRIES' });
    results.push({ title: `Trasmediterranea · Baleares`, url: 'https://www.trasmediterranea.es/es', description: 'Ferries a Mallorca, Menorca e Ibiza.', badge: 'TRASMEDI' });
  }

  if (intent.type === 'car') {
    const ku = new URL('https://www.kayak.es/cars');
    if (dest)             ku.searchParams.set('location', dest);
    if (intent.dateFrom)  ku.searchParams.set('d1', intent.dateFrom);
    results.push({ title: `Kayak Cars · ${dest || 'destino'}`, url: ku.toString(), description: 'Compara Hertz, Avis, Europcar y más.', badge: 'KAYAK' });
  }

  return results;
}

// ─── Pipeline asíncrono completo ──────────────────────────────────────────────

export async function runTravelPipeline(rawQuery: string): Promise<void> {
  const intent = await extractTravelEntities(rawQuery);
  const org    = intent.origin      ?? '?';
  const dest   = intent.destination ?? '?';

  // Búsqueda real + smart links en paralelo
  const [serpResults, smartLinks] = await Promise.all([
    searchFlightsSerpAPI(intent),
    Promise.resolve(buildSmartLinks(intent)),
  ]);

  const hasReal = serpResults.length > 0;

  // Título de notificación y tarea
  const subject = dest !== '?' ? `${org} → ${dest}` : rawQuery.slice(0, 40);
  const notifTitle = `Vera · ${subject}`.slice(0, 50);

  // Cuerpo de la notificación push (≤100 chars)
  const notifBody = hasReal
    ? `${serpResults[0].price ?? ''} · ${serpResults.length} opción${serpResults.length > 1 ? 'es' : ''} encontrada${serpResults.length > 1 ? 's' : ''}`.slice(0, 100)
    : `${smartLinks.length} links directos listos. Sin precios en tiempo real.`.slice(0, 100);

  // Notas completas para la tarea
  const flightLines = hasReal
    ? serpResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.price ?? ''}\n   ${r.url}`).join('\n\n')
    : '(SERPAPI_KEY no configurada — sin precios en tiempo real)';

  const linkLines = smartLinks.slice(0, 4).map(l => `${l.badge ?? 'LINK'}: ${l.url}`).join('\n');

  const taskNotes = [
    `Búsqueda: ${rawQuery}`,
    '',
    hasReal ? '── VUELOS (Google Flights via SerpAPI) ──' : '── SIN RESULTADOS REALES ──',
    flightLines,
    '',
    '── LINKS DIRECTOS ──',
    linkLines,
  ].join('\n').slice(0, 3000);

  const taskTitle = [
    intent.type === 'flight' ? 'Vuelos' : intent.type === 'hotel' ? 'Hoteles' : 'Transporte',
    dest !== '?' ? dest : rawQuery.slice(0, 30),
    intent.dateFrom ?? '',
  ].filter(Boolean).join(' · ').slice(0, 80);

  // Guardar notificación en DB + push
  await db.insert(notifications).values({
    type:        'search_travel',
    title:       notifTitle,
    body:        notifBody,
    channel:     'push',
    sentAt:      new Date(),
    agentId:     'search',
    cooldownKey: `travel_${dest}_${Date.now()}`,
  }).catch(() => {});

  await sendPush(notifTitle, notifBody).catch(() => {});

  // Guardar tarea con todos los detalles
  await db.insert(tasks).values({
    title:      taskTitle,
    detail:     rawQuery.slice(0, 200),
    notes:      taskNotes,
    prio:       5,
    prioFinal:  5,
    status:     'wait',
    source:     'search_travel',
    propertyId: null,
    inNow:      false,
  }).catch(() => {});
}
