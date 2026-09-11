import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { Warehouse, AlertTriangle, Radio } from 'lucide-react';

import { AppNavBar } from '../components/navigation/AppNavBar';
import { LeftCrisisIntelPanel } from '../components/LeftCrisisIntelPanel';
import {
  CrisisMarker,
  CrisisOverview,
  fetchCrisisOverview,
  fetchLocationIntel,
  LocationIntelReport,
} from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

type FilterCategory = 'all' | 'critical' | 'earthquake' | 'flood' | 'warehouse';

// Auto-center map to the selected marker
function MapFocus({ selectedMarkerId, markers }: { selectedMarkerId: string | null; markers: CrisisMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedMarkerId) {
      const marker = markers.find(m => m.id === selectedMarkerId);
      if (marker) {
        // Smoothly fly to the marker
        map.flyTo([marker.position[0], marker.position[1]], 6, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
  }, [selectedMarkerId, markers, map]);
  return null;
}

export default function GlobalCrisisDashboard() {
  const [overview, setOverview] = useState<CrisisOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<LocationIntelReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const previousCriticalCount = useRef<number | null>(null);
  const { addNotification } = useNotifications();

  // Fetch Live USGS feed & Crisis Overview
  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await fetchCrisisOverview();
      setOverview(data);

      if (
        previousCriticalCount.current !== null &&
        previousCriticalCount.current !== data.summary.criticalEarthquakes
      ) {
        addNotification({
          type: data.summary.criticalEarthquakes > previousCriticalCount.current ? 'critical' : 'info',
          title: 'Global Telemetry Updated',
          message: `${data.summary.criticalEarthquakes} critical events detected on realistic map.`,
        });
      }
      previousCriticalCount.current = data.summary.criticalEarthquakes;
    } catch (err) {
      console.error('Failed to load tactical feed:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(true);
    const interval = setInterval(() => void loadData(false), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter visible markers
  const filteredMarkers = useMemo(() => {
    const list = overview?.markers || [];
    if (categoryFilter === 'all') return list;
    if (categoryFilter === 'critical') return list.filter((m) => m.type === 'critical');
    if (categoryFilter === 'earthquake') return list.filter((m) => m.category === 'earthquake' || Boolean(m.magnitude));
    if (categoryFilter === 'flood') return list.filter((m) => m.category === 'flood' || m.category === 'cyclone');
    if (categoryFilter === 'warehouse') return list.filter((m) => m.category === 'warehouse' || m.role === 'warehouse');
    return list;
  }, [overview, categoryFilter]);

  const selectedMarker = useMemo(() => {
    return overview?.markers.find((m) => m.id === selectedMarkerId) || null;
  }, [overview, selectedMarkerId]);

  // Handle marker selection and fetch location intelligence
  const handleMarkerSelect = async (marker: CrisisMarker) => {
    setSelectedMarkerId(marker.id);
    setSelectedReport(null);
    setLoadingReport(true);
    try {
      const rep = await fetchLocationIntel({
        label: marker.label,
        lat: marker.position[0],
        lng: marker.position[1],
      });
      setSelectedReport(rep);
    } catch (error) {
      console.error('Failed to load marker intel report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMarkerId(null);
    setSelectedReport(null);
  };

  // Custom Icon Factory
  const getCustomIcon = (marker: CrisisMarker, isSelected: boolean) => {
    const isWarehouse = marker.category === 'warehouse' || marker.role === 'warehouse';
    
    if (isWarehouse) {
      const scale = isSelected ? 'scale-125' : 'scale-100 hover:scale-110';
      const htmlString = renderToString(
        <div className={`flex items-center justify-center w-8 h-8 bg-[#0a1828]/90 border border-cyan-400 rounded shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-300 ${scale}`}>
          <Warehouse className="w-4 h-4 text-cyan-400" />
        </div>
      );
      return L.divIcon({
        html: htmlString,
        className: 'custom-tactical-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    } else {
      const isCritical = marker.type === 'critical';
      const baseColor = isCritical ? 'bg-red-500' : 'bg-amber-500';
      const shadowColor = isCritical ? 'shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'shadow-[0_0_15px_rgba(245,158,11,0.6)]';
      const scale = isSelected ? 'scale-150' : 'scale-100 hover:scale-125';
      
      const htmlString = renderToString(
        <div className={`relative flex items-center justify-center w-6 h-6 transition-transform duration-300 ${scale}`}>
          <div className={`absolute inset-0 ${baseColor} rounded-full animate-ping opacity-60`} />
          <div className={`relative z-10 w-3 h-3 ${baseColor} border-[1.5px] border-white rounded-full ${shadowColor}`} />
        </div>
      );
      return L.divIcon({
        html: htmlString,
        className: 'custom-tactical-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] text-white">
      {/* Top Floating App Navbar */}
      <AppNavBar />

      {/* ── Left-Side Animated Crisis Intel Panel & Overview HUD ── */}
      <LeftCrisisIntelPanel
        markers={filteredMarkers}
        selectedMarker={selectedMarker}
        report={selectedReport}
        loadingReport={loadingReport}
        onMarkerSelect={handleMarkerSelect}
        onClose={handleCloseDetails}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        activeCount={overview?.summary?.activeEarthquakes ?? 0}
        criticalCount={overview?.summary?.criticalEarthquakes ?? 0}
        maxMagnitude={overview?.summary?.maxMagnitude ?? 6.8}
      />

      {/* ── Fullscreen Realistic Leaflet Map ── */}
      <main className="w-full h-full">
        <MapContainer
          center={[20, 0]}
          zoom={3}
          minZoom={2}
          maxZoom={18}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          {/* Esri World Imagery - Photorealistic Satellite Base Map */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={18}
          />
          
          <MapFocus selectedMarkerId={selectedMarkerId} markers={filteredMarkers} />

          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.position[0], marker.position[1]]}
              icon={getCustomIcon(marker, selectedMarkerId === marker.id)}
              eventHandlers={{
                click: () => handleMarkerSelect(marker),
              }}
            />
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
