import React, { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CrisisMarker } from '../services/api';

interface CyberTacticalMapProps {
  center?: [number, number];
  zoom?: number;
  markers: CrisisMarker[];
  selectedMarkerId: string | null;
  onMarkerSelect: (marker: CrisisMarker) => void;
  showFaultLines?: boolean;
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

// Helper to center the map when selectedMarkerId changes
function MapCameraController({
  selectedMarker,
}: {
  selectedMarker: CrisisMarker | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedMarker) {
      map.flyTo(selectedMarker.position, Math.max(map.getZoom(), 5), {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [selectedMarker, map]);

  return null;
}

export function CyberTacticalMap({
  center = [20, 0],
  zoom = 3,
  markers = [],
  selectedMarkerId,
  onMarkerSelect,
  showFaultLines = true,
}: CyberTacticalMapProps) {
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  const getMarkerIcon = (marker: CrisisMarker, isSelected: boolean) => {
    const isCritical = marker.type === 'critical';
    const isWarning = marker.type === 'warning';
    const scale = isSelected ? 'scale(1.3)' : 'scale(1)';

    let innerIcon = '⚠️';
    if (marker.category === 'flood') innerIcon = '🌊';
    else if (marker.category === 'building_collapse') innerIcon = '🏢';
    else if (marker.category === 'cyclone') innerIcon = '🌀';
    else if (marker.category === 'warehouse') innerIcon = '📦';
    else if (marker.category === 'earthquake' || marker.magnitude) innerIcon = '⚡';

    const colorClass = isCritical
      ? 'border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_20px_#ef4444]'
      : isWarning
      ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_20px_#f59e0b]'
      : 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_20px_#06b6d4]';

    const pingClass = isCritical
      ? 'bg-red-500/40'
      : isWarning
      ? 'bg-amber-500/40'
      : 'bg-cyan-400/40';

    return L.divIcon({
      className: 'custom-cyber-marker',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group" style="transform: ${scale}; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
          <div class="absolute w-9 h-9 rounded-full ${pingClass} animate-ping"></div>
          ${
            isSelected
              ? '<div class="absolute w-12 h-12 rounded-full border border-cyan-400/80 animate-pulse"></div>'
              : ''
          }
          <div class="relative w-8 h-8 rounded-xl bg-[#060b18] border-2 ${colorClass} flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110">
            ${innerIcon}
          </div>
          ${
            marker.magnitude
              ? `<div class="absolute -bottom-4 font-mono text-[9px] font-bold px-1 rounded bg-black/80 text-white border border-white/10 whitespace-nowrap">M${marker.magnitude.toFixed(1)}</div>`
              : ''
          }
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full bg-[#030712]"
        minZoom={2}
        maxZoom={18}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={20}
        />

        <MapCameraController selectedMarker={selectedMarker} />

        {/* Fault Lines */}
        {showFaultLines &&
          FAULT_LINE_PATHS.map((line, index) => (
            <Polyline
              key={`fault-${index}`}
              positions={line}
              pathOptions={{
                color: '#22d3ee',
                weight: 1.5,
                opacity: 0.35,
                dashArray: '6 8',
              }}
            />
          ))}

        {/* Supply Corridor to Selected Marker */}
        {selectedMarker?.nearestWarehouse && (
          <Polyline
            positions={[
              [selectedMarker.position[0] + 1.2, selectedMarker.position[1] - 1.5],
              selectedMarker.position,
            ]}
            pathOptions={{
              color: '#06b6d4',
              weight: 2,
              opacity: 0.7,
              dashArray: '4 4',
            }}
          />
        )}

        {/* Dynamic Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getMarkerIcon(marker, marker.id === selectedMarkerId)}
            eventHandlers={{
              click: () => onMarkerSelect(marker),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
