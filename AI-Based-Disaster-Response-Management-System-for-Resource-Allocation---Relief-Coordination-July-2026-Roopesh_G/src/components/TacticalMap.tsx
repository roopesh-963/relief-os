import React from 'react';
import { MapContainer, Marker, Popup, Polyline, ScaleControl, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface TacticalMarker {
  id: string;
  position: [number, number];
  label: string;
  type: 'critical' | 'warning' | 'stable';
  role?: 'city' | 'vehicle' | 'warehouse' | 'shelter' | 'camp' | 'depot';
  category?: string;
  magnitude?: number;
  depthKm?: number;
  occurredAt?: number;
  meta?: string;
  nearestWarehouse?: string;
  targetDispatchDestination?: string;
}

export interface TacticalRoute {
  id: string;
  positions: [number, number][];
  type?: 'critical' | 'warning' | 'stable';
  dashed?: boolean;
  label?: string;
}

interface TacticalMapProps {
  center?: [number, number];
  zoom?: number;
  onCityClick?: (marker: TacticalMarker) => void;
  markers?: TacticalMarker[];
  selectedMarkerId?: string | null;
  showFaultLines?: boolean;
  routes?: TacticalRoute[];
}

const FAULT_LINE_PATHS: [number, number][][] = [
  [
    [57, -160],
    [49, -145],
    [40, -130],
    [30, -120],
    [19, -107],
    [8, -92],
    [-3, -81],
    [-14, -75],
    [-23, -71],
    [-36, -73],
    [-46, -75],
  ],
  [
    [56, 162],
    [48, 150],
    [40, 146],
    [35, 141],
    [24, 124],
    [15, 122],
    [4, 126],
    [-6, 130],
    [-11, 143],
    [-22, 175],
    [-39, 179],
  ],
];

export function TacticalMap({
  center = [23, 80],
  zoom = 4,
  onCityClick,
  markers = [],
  selectedMarkerId = null,
  showFaultLines = true,
  routes = [],
}: TacticalMapProps) {
  const getIcon = (type: string, role: string = 'city', isSelected = false, category?: string) => {
    const color = type === 'critical' ? '#ef4444' : type === 'warning' ? '#f97316' : '#3b82f6';
    const haloColor = isSelected ? '#22d3ee' : color;
    const baseScale = isSelected ? 1.25 : 1;

    if (category === 'building_collapse') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-xl bg-red-600/30 rotate-45 animate-ping" style="transform: rotate(45deg) scale(${baseScale});"></div>
            <div class="relative w-8 h-8 rounded-lg bg-[#071225] border-2 border-red-500 shadow-[0_0_16px_#ef4444] flex items-center justify-center text-white font-bold text-sm" style="transform: scale(${baseScale});">
              🏢
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    }

    if (category === 'flood') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full bg-cyan-400/40 animate-ping" style="transform: scale(${baseScale});"></div>
            <div class="relative w-8 h-8 rounded-full bg-[#0369a1] border-2 border-cyan-300 shadow-[0_0_16px_#0284c7] flex items-center justify-center text-white text-sm" style="transform: scale(${baseScale});">
              🌊
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    }

    if (category === 'landslide') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-9 h-9 rounded-md bg-amber-500/35 animate-ping" style="transform: scale(${baseScale});"></div>
            <div class="relative w-7 h-7 rounded-md bg-[#78350f] border-2 border-amber-400 shadow-[0_0_16px_#d97706] flex items-center justify-center text-white text-xs" style="transform: scale(${baseScale});">
              ⛰️
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    if (category === 'cyclone') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full bg-purple-500/35 animate-ping" style="transform: scale(${baseScale});"></div>
            <div class="relative w-7 h-7 rounded-full bg-[#581c87] border-2 border-purple-300 shadow-[0_0_16px_#a855f7] flex items-center justify-center text-white text-xs" style="transform: scale(${baseScale});">
              🌀
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    if (role === 'warehouse' || role === 'depot' || category === 'warehouse') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-xl border-2 border-cyan-400/80 bg-cyan-400/10 ${isSelected ? 'animate-pulse' : ''}" style="opacity:${isSelected ? 1 : 0.75}; transform: scale(${baseScale});"></div>
            <div class="relative w-7 h-7 rounded-lg bg-[#071225] border-2 border-cyan-300 shadow-[0_0_16px_#22d3ee] flex items-center justify-center text-cyan-300 text-xs font-bold" style="transform: scale(${baseScale});">
              📦
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    }

    if (role === 'vehicle') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-lg bg-blue-500/20 rotate-45 animate-pulse" style="transform: rotate(45deg) scale(${baseScale});"></div>
            <div class="relative w-4 h-4 rounded bg-white shadow-[0_0_12px_${haloColor}] flex items-center justify-center overflow-hidden">
               <div class="w-full h-full bg-blue-600 rounded-sm"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    if (role === 'shelter' || role === 'camp') {
      return L.divIcon({
        className: 'custom-tactical-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full opacity-25" style="background:${haloColor};"></div>
            <div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid ${color}; filter: drop-shadow(0 0 10px ${haloColor}); transform: scale(${baseScale});"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 20],
      });
    }

    return L.divIcon({
      className: 'custom-tactical-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-7 h-7 rounded-full opacity-40 animate-ping" style="background: ${haloColor}; transform: scale(${baseScale});"></div>
          <div class="absolute w-9 h-9 rounded-full border border-cyan-300/40" style="opacity:${isSelected ? 1 : 0};"></div>
          <div class="relative w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_12px_${haloColor}]" style="background: ${color}"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);
  const warehouseMarker = selectedMarker?.nearestWarehouse
    ? markers.find(
        (m) =>
          (m.role === 'warehouse' || m.category === 'warehouse') &&
          m.label.toLowerCase().includes(selectedMarker.nearestWarehouse!.toLowerCase())
      )
    : null;

  const dynamicRoutes = [...routes];
  if (selectedMarker && warehouseMarker && selectedMarker.id !== warehouseMarker.id) {
    dynamicRoutes.push({
      id: `corridor-${warehouseMarker.id}-${selectedMarker.id}`,
      positions: [warehouseMarker.position, selectedMarker.position],
      type: selectedMarker.type === 'critical' ? 'critical' : 'warning',
      dashed: true,
      label: `Relief Corridor: ${warehouseMarker.label} -> ${selectedMarker.label}`,
    });
  }

  return (
    <div className="w-full h-full relative map-container-tactical">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={20}
        />

        {showFaultLines &&
          FAULT_LINE_PATHS.map((line, index) => (
            <Polyline
              key={`fault-${index}`}
              positions={line}
              pathOptions={{
                color: '#06b6d4',
                weight: 1,
                opacity: 0.35,
                dashArray: '6 6',
              }}
            />
          ))}

        {dynamicRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.positions}
            pathOptions={{
              color:
                route.type === 'critical'
                  ? '#ef4444'
                  : route.type === 'warning'
                    ? '#f97316'
                    : '#22d3ee',
              weight: route.type === 'critical' ? 4 : 3,
              opacity: 0.9,
              dashArray: route.dashed ? '6 6' : undefined,
            }}
          />
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getIcon(marker.type, marker.role, marker.id === selectedMarkerId, marker.category)}
            eventHandlers={{
              click: () => onCityClick?.(marker),
            }}
          >
            <Popup className="tactical-popup">
              <div className="p-2 bg-[#1c222d] text-white border border-white/10 rounded-lg">
                <div className="text-[9px] uppercase font-mono tracking-widest text-gray-400 mb-1">
                  {marker.role === 'vehicle' ? 'Unit Identified' : 'Target Identified'}
                </div>
                <div className="text-sm font-bold uppercase tracking-tight">{marker.label}</div>
                {typeof marker.magnitude === 'number' && (
                  <div className="mt-1 text-[10px] text-orange-300 font-semibold">
                    M{marker.magnitude.toFixed(1)}
                    {typeof marker.depthKm === 'number' ? ` | ${Math.round(marker.depthKm)} km` : ''}
                  </div>
                )}
                {marker.role === 'vehicle' && (
                  <div className="mt-1 text-[8px] font-mono text-blue-400 uppercase">Status: En Route</div>
                )}
                {marker.meta && (
                  <div className="mt-1 text-[8px] font-mono text-cyan-100/80 uppercase">{marker.meta}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <div className="absolute bottom-4 left-4 z-[1000]">
          <ScaleControl position="bottomleft" />
        </div>
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <ZoomControl position="topright" />
        </div>
      </MapContainer>

      <div className="absolute inset-0 pointer-events-none z-[400] opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute inset-0 pointer-events-none z-[400] bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-40"></div>
      <div className="absolute inset-0 pointer-events-none z-[400] bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-40"></div>
    </div>
  );
}
