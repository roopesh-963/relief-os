/**
 * GlobalSupplyMap
 * ----------------
 * Leaflet map showing every global warehouse, all rescue zones and
 * the primary + alternate route corridors between them.
 */
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Warehouse, AlertTriangle, Navigation } from 'lucide-react';
import { getGlobalMapData, GlobalMapData } from '../../services/supply';

/* ── Custom icons ──────────────────────────────────────────────────────── */
const warehouseIcon = (fillPct: number) => {
  const color = fillPct >= 85 ? '#ef4444' : fillPct >= 60 ? '#f97316' : '#22d3ee';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:32px;height:32px;border-radius:8px;background:${color};border:3px solid #fff;box-shadow:0 0 14px ${color}88;"></div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const rescueIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 16px #ef444488;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* ── Legend pill ───────────────────────────────────────────────────────── */
function Legend() {
  return (
    <div className="absolute bottom-8 left-4 z-[1000] flex flex-col gap-2 rounded-xl border-2 border-white/20 bg-[#0a1628]/90 p-3 backdrop-blur-sm text-white text-xs font-bold">
      <div className="font-[var(--font-mouse)] text-base uppercase mb-1 text-cyan-300">Map Legend</div>
      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#22d3ee] border-2 border-white shrink-0"/><span>Warehouse — Available</span></div>
      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#f97316] border-2 border-white shrink-0"/><span>Warehouse — Filling</span></div>
      <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#ef4444] border-2 border-white shrink-0"/><span>Warehouse — Near Capacity / Rescue Zone</span></div>
      <div className="flex items-center gap-2"><span className="w-8 h-0.5 bg-[#22d3ee] shrink-0"/><span>Primary Route</span></div>
      <div className="flex items-center gap-2"><span className="w-8 h-0.5 bg-[#f97316] border-dashed shrink-0" style={{borderTop:'2px dashed #f97316'}}/><span>Alternate Route</span></div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */
interface GlobalSupplyMapProps {
  height?: string;
  /** If provided, highlight routes involving this warehouse name */
  focusWarehouse?: string;
}

export function GlobalSupplyMap({ height = '520px', focusWarehouse }: GlobalSupplyMapProps) {
  const [data, setData] = useState<GlobalMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getGlobalMapData()
      .then(d => { if (mounted) setData(d); })
      .catch(err => console.error('GlobalSupplyMap fetch failed:', err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 font-[var(--font-mouse)] text-2xl uppercase" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-crav-red)]" />
        LOADING GLOBAL SUPPLY MAP...
      </div>
    );
  }

  if (!data) return null;

  const { warehouses, routes, rescueZones } = data;

  const visibleRoutes = focusWarehouse
    ? routes.filter(r => r.from === focusWarehouse || r.to === focusWarehouse)
    : routes;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-4 border-[var(--color-crav-black)]" style={{ height }}>
      <MapContainer
        center={[20, 20]}
        zoom={2}
        scrollWheelZoom
        zoomControl={false}
        className="w-full h-full"
        style={{ background: '#030d1e' }}
        minZoom={2}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />

        {/* ── Routes ── */}
        {visibleRoutes.map(route => {
          const isPrimary = route.type === 'primary';
          const isActive = activeRoute === route.id;
          return (
            <Polyline
              key={route.id}
              positions={route.positions}
              eventHandlers={{ click: () => setActiveRoute(isActive ? null : route.id) }}
              pathOptions={{
                color: isPrimary ? '#22d3ee' : '#f97316',
                weight: isActive ? 5 : isPrimary ? 3 : 2,
                opacity: isActive ? 1 : 0.65,
                dashArray: isPrimary ? undefined : '8 6',
              }}
            />
          );
        })}

        {/* ── Warehouses ── */}
        {warehouses.map(wh => (
          <Marker
            key={wh.id}
            position={[wh.location.lat, wh.location.lng]}
            icon={warehouseIcon(wh.fillPercent)}
          >
            <Popup className="tactical-popup">
              <div className="p-3 bg-[#1c222d] text-white rounded-xl min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="h-4 w-4 text-cyan-400" />
                  <span className="font-[var(--font-mouse)] text-lg uppercase text-cyan-300">{wh.name}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2 uppercase font-bold">{wh.region}</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${wh.fillPercent}%`,
                        background: wh.fillPercent >= 85 ? '#ef4444' : wh.fillPercent >= 60 ? '#f97316' : '#22d3ee',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white">{wh.fillPercent}%</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {Object.entries(wh.stockLevels).map(([type, qty]) => (
                    <div key={type} className="flex justify-between gap-2">
                      <span className="text-gray-400">{type}</span>
                      <span className="font-bold text-white">{qty}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-gray-500">Capacity: {wh.capacity} units</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ── Rescue zones ── */}
        {rescueZones.map(zone => (
          <Marker
            key={zone.id}
            position={[zone.lat, zone.lng]}
            icon={rescueIcon}
          >
            <Popup className="tactical-popup">
              <div className="p-3 bg-[#1c222d] text-white rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="font-[var(--font-mouse)] text-lg uppercase text-red-300">{zone.name}</span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                </div>
                <div className="mt-2 text-xs font-bold text-red-300 uppercase">Active Rescue Zone</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <ZoomControl position="topright" />
      </MapContainer>

      <Legend />

      {/* Stats bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2">
        <div className="rounded-full border-2 border-cyan-400/40 bg-[#0a1628]/90 px-3 py-1 text-xs font-bold text-cyan-300 backdrop-blur-sm">
          <Navigation className="inline h-3 w-3 mr-1" />
          {warehouses.length} Warehouses
        </div>
        <div className="rounded-full border-2 border-red-400/40 bg-[#0a1628]/90 px-3 py-1 text-xs font-bold text-red-300 backdrop-blur-sm">
          <AlertTriangle className="inline h-3 w-3 mr-1" />
          {rescueZones.length} Rescue Zones
        </div>
        <div className="rounded-full border-2 border-orange-400/40 bg-[#0a1628]/90 px-3 py-1 text-xs font-bold text-orange-300 backdrop-blur-sm">
          {routes.filter(r => r.type === 'primary').length} Primary +{' '}
          {routes.filter(r => r.type === 'alternate').length} Alternate Routes
        </div>
      </div>
    </div>
  );
}
