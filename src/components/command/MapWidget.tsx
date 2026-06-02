'use client';

import { useEffect, useRef, useState } from 'react';

type Trip = { id: number; title: string; startDate: string | null; type: string | null };

const geoCache: Record<string, [number, number]> = {};

function extractCity(title: string): string {
  return title.split(/[·+,]/)[0].replace(/\(.*?\)/g, '').replace(/\d{4}/g, '').trim();
}

async function geocode(name: string): Promise<[number, number] | null> {
  if (geoCache[name]) return geoCache[name];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Vera-PersonalOS/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    geoCache[name] = coords;
    return coords;
  } catch { return null; }
}

// Carga Leaflet desde CDN (sin npm) — idempotente
async function loadLeaflet(): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).L) return (window as any).L;

  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css'; link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  await new Promise<void>((res, rej) => {
    if (document.getElementById('leaflet-js')) { res(); return; }
    const s = document.createElement('script');
    s.id = 'leaflet-js';
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => res();
    s.onerror = rej;
    document.head.appendChild(s);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).L;
}

export default function MapWidget({ trips }: { trips: Trip[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef      = useRef<any>(null);
  const didInit     = useRef(false);
  const [loading, setLoading] = useState(true);
  const [count,   setCount]   = useState(0);

  useEffect(() => {
    if (!containerRef.current || didInit.current) return;
    didInit.current = true;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = await loadLeaflet() as any;

      // Evitar doble inicialización si el contenedor ya tiene un mapa
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(containerRef.current, {
        zoomControl: false, attributionControl: false,
        scrollWheelZoom: false, dragging: true,
      });

      // CartoDB Dark Matter — sin API key
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Icono circular gold
      const goldIcon = L.divIcon({
        className: '',
        html: `<div style="width:10px;height:10px;border-radius:50%;background:#c4a86a;border:2px solid #e8d5a3;box-shadow:0 0 6px #c4a86a99"></div>`,
        iconSize: [10, 10], iconAnchor: [5, 5],
      });

      const now = new Date();
      const upcoming = trips
        .filter(t => t.startDate && new Date(t.startDate) > now)
        .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

      const coords: [number, number][] = [];

      for (const trip of upcoming) {
        const city = extractCity(trip.title);
        const pos  = await geocode(city);
        if (!pos) continue;
        coords.push(pos);
        L.marker(pos, { icon: goldIcon })
          .bindTooltip(trip.title, { direction: 'top', offset: [0, -6] })
          .addTo(map);
      }

      if (coords.length > 0) {
        map.fitBounds(L.latLngBounds(coords), { padding: [18, 18], maxZoom: 7 });
      } else {
        map.setView([40.4, -3.7], 4);
      }

      setCount(coords.length);
      setLoading(false);
    })().catch(() => setLoading(false));

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      didInit.current = false;
    };
  }, [trips]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: 'var(--bg3)' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 2, background: 'var(--bg3)' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color: 'var(--text3)' }}>CARGANDO···</div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!loading && count > 0 && (
        <div style={{ position: 'absolute', bottom: 6, left: 8, zIndex: 10, fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.14em', color: 'var(--gold2)', background: 'rgba(7,8,10,.8)', padding: '2px 6px', borderRadius: 4 }}>
          {count} DESTINO{count !== 1 ? 'S' : ''} · 2026
        </div>
      )}
      <style>{`.leaflet-tooltip{background:rgba(7,8,10,.88)!important;border:.5px solid #c4a86a55!important;border-radius:6px!important;color:#eceae2!important;font-family:monospace;font-size:10px;box-shadow:none!important}.leaflet-tooltip::before{display:none!important}`}</style>
    </div>
  );
}
