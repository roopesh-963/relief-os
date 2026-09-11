import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { GoogleEarthCrisisGlobe } from '../components/GoogleEarthCrisisGlobe';
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

export default function CrisisMap() {
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
          type:
            data.summary.criticalEarthquakes > previousCriticalCount.current
              ? 'critical'
              : 'info',
          title: 'Seismic Telemetry Updated',
          message: `${data.summary.criticalEarthquakes} critical seismic events detected on 3D globe.`,
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
    if (categoryFilter === 'critical') {
      return list.filter((m) => m.type === 'critical');
    }
    if (categoryFilter === 'earthquake') {
      return list.filter((m) => m.category === 'earthquake' || Boolean(m.magnitude));
    }
    if (categoryFilter === 'flood') {
      return list.filter((m) => m.category === 'flood' || m.category === 'cyclone');
    }
    if (categoryFilter === 'warehouse') {
      return list.filter((m) => m.category === 'warehouse' || m.role === 'warehouse');
    }
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

      {/* ── Fullscreen 3D Google Earth Style Interactive Crisis Globe ── */}
      <main className="w-full h-full">
        <GoogleEarthCrisisGlobe
          markers={filteredMarkers}
          selectedMarkerId={selectedMarkerId}
          onMarkerSelect={handleMarkerSelect}
          isDetailsOpen={Boolean(selectedMarker)}
        />
      </main>
    </div>
  );
}
