import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  Droplets,
  Globe2,
  Loader2,
  Map,
  MapPin,
  Mountain,
  PackageOpen,
  Radio,
  ShieldAlert,
  Sparkles,
  Truck,
  Warehouse,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TacticalMap, TacticalMarker } from './TacticalMap';
import {
  CrisisMarker,
  CrisisOverview,
  GlobalCrisisCard,
  GlobalCrisisOverview,
  IntelSourceStatus,
  LocationIntelReport,
} from '../services/api';
import { CravTextAnimate } from './CravTextAnimate';
import { CravScrollReveal } from './CravScrollReveal';

const SeismicGlobe = lazy(() =>
  import('./SeismicGlobe').then((module) => ({ default: module.SeismicGlobe }))
);

interface LiveEarthquakeMonitoringPanelProps {
  title?: string;
  overview: CrisisOverview | null;
  globalOverview?: GlobalCrisisOverview | null;
  loadingOverview: boolean;
  markers: CrisisMarker[];
  selectedMarkerId: string | null;
  onMarkerSelect: (marker: CrisisMarker) => void;
  report: LocationIntelReport | null;
  loadingReport: boolean;
  sourceStatus?: IntelSourceStatus | null;
  mapOverlayControls?: React.ReactNode;
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const formatUpdatedAt = (timestamp?: string) => {
  if (!timestamp) {
    return 'Awaiting first sync';
  }
  return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const relativeFromNow = (timestamp?: number) => {
  if (!timestamp) return 'just now';
  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) return RELATIVE_TIME.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return RELATIVE_TIME.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return RELATIVE_TIME.format(diffDays, 'day');
};

const formatUtcTimestamp = (timestamp?: number) => {
  if (!timestamp) return 'UTC: --';
  return `UTC: ${new Date(timestamp).toUTCString()}`;
};

const markerTone = (type: CrisisMarker['type']) => {
  if (type === 'critical') return 'border-[var(--color-crav-black)] bg-[var(--color-crav-red)] text-white';
  if (type === 'warning') return 'border-[var(--color-crav-black)] bg-[var(--color-crav-orange)] text-white';
  return 'border-[var(--color-crav-black)] bg-[var(--color-crav-mustard)] text-[var(--color-crav-black)]';
};

const reportStatusTone = (status: string) => {
  if (status === 'Critical') return 'border-[var(--color-crav-black)] bg-[var(--color-crav-red)] text-white';
  if (status === 'Warning') return 'border-[var(--color-crav-black)] bg-[var(--color-crav-orange)] text-white';
  return 'border-[var(--color-crav-black)] bg-[var(--color-crav-green)] text-white';
};

export function LiveEarthquakeMonitoringPanel({
  title = 'CRISIS MAP LIVE',
  overview,
  globalOverview,
  loadingOverview,
  markers,
  selectedMarkerId,
  onMarkerSelect,
  report,
  loadingReport,
  mapOverlayControls,
}: LiveEarthquakeMonitoringPanelProps) {
  const [viewMode, setViewMode] = useState<'globe' | 'map'>('globe');
  const [showFaultLines, setShowFaultLines] = useState(true);
  const [speed, setSpeed] = useState(55);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'collapse' | 'flood' | 'seismic' | 'cyclone' | 'warehouse'>('all');

  const feedMarkers = useMemo(() => {
    return [...markers].sort((a, b) => {
      if (a.occurredAt && b.occurredAt) return b.occurredAt - a.occurredAt;
      return (b.magnitude || 0) - (a.magnitude || 0);
    });
  }, [markers]);

  const filteredMarkers = useMemo(() => {
    if (categoryFilter === 'all') return feedMarkers;
    if (categoryFilter === 'collapse') return feedMarkers.filter((m) => m.category === 'building_collapse');
    if (categoryFilter === 'flood') return feedMarkers.filter((m) => m.category === 'flood');
    if (categoryFilter === 'seismic') return feedMarkers.filter((m) => m.category === 'earthquake' || m.category === 'landslide');
    if (categoryFilter === 'cyclone') return feedMarkers.filter((m) => m.category === 'cyclone');
    if (categoryFilter === 'warehouse') return feedMarkers.filter((m) => m.role === 'warehouse' || m.category === 'warehouse');
    return feedMarkers;
  }, [feedMarkers, categoryFilter]);

  const getCategoryBadge = (event: CrisisMarker) => {
    if (event.category === 'building_collapse') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--color-crav-black)] bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_black]">
          <Building2 className="h-3 w-3" /> Collapse
        </span>
      );
    }
    if (event.category === 'flood') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--color-crav-black)] bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_black]">
          <Droplets className="h-3 w-3" /> Flood
        </span>
      );
    }
    if (event.category === 'landslide') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--color-crav-black)] bg-amber-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_black]">
          <Mountain className="h-3 w-3" /> Landslide
        </span>
      );
    }
    if (event.category === 'cyclone') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--color-crav-black)] bg-purple-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_black]">
          <Wind className="h-3 w-3" /> Cyclone
        </span>
      );
    }
    if (event.role === 'warehouse' || event.category === 'warehouse') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--color-crav-black)] bg-cyan-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_black]">
          <Warehouse className="h-3 w-3" /> Depot
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md border-2 border-[var(--color-crav-black)] bg-orange-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_black]">
        <Zap className="h-3 w-3" /> Seismic
      </span>
    );
  };

  useEffect(() => {
    if (viewMode !== 'map' || typeof window === 'undefined') return;
    const warmGlobe = () => void import('./SeismicGlobe');
    let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | null = null;
    let idleHandle: number | null = null;

    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(warmGlobe, { timeout: 2500 });
    } else {
      timeoutHandle = globalThis.setTimeout(warmGlobe, 1800);
    }

    return () => {
      if (timeoutHandle !== null) globalThis.clearTimeout(timeoutHandle);
      if (idleHandle !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
    };
  }, [viewMode]);

  const selectedEvent = useMemo(() => {
    if (!selectedMarkerId) return null;
    return feedMarkers.find((event) => event.id === selectedMarkerId) || null;
  }, [feedMarkers, selectedMarkerId]);

  const summary = useMemo(
    () => [
      { label: 'TRACKED', value: overview?.summary.activeEarthquakes ?? feedMarkers.length, bg: 'bg-[var(--color-crav-mustard)]' },
      { label: 'CRITICAL', value: feedMarkers.filter((marker) => marker.type === 'critical').length, bg: 'bg-[var(--color-crav-red)]' },
      { label: 'WARNING', value: feedMarkers.filter((marker) => marker.type === 'warning').length, bg: 'bg-[var(--color-crav-orange)]' },
    ],
    [feedMarkers, overview]
  );

  const handleMapSelect = (marker: TacticalMarker) => {
    const resolved = feedMarkers.find((event) => event.id === marker.id);
    if (resolved) onMarkerSelect(resolved);
  };

  const featureHeadline = overview?.headlines?.[0];
  const additionalHeadlines = overview?.headlines?.slice(1, 6) || [];
  const crossCrisisCards = useMemo(
    () => (globalOverview?.cards || []).filter((card) => card.type === 'financial_crisis' || card.type === 'war_conflict'),
    [globalOverview]
  );

  const crisisLaneIcon = (cardType: GlobalCrisisCard['type']) => cardType === 'financial_crisis' ? BadgeDollarSign : ShieldAlert;

  return (
    <div className="crav-page">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1340px] flex-col px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8">
          <CravScrollReveal direction="down">
            <section className="overflow-hidden">
              <div className="relative px-2 py-4">
                <div className="relative flex flex-col items-center gap-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 text-xl font-[var(--font-mouse)] uppercase text-[var(--color-crav-black)] bg-[var(--color-crav-mustard)] rounded-full border-4 border-[var(--color-crav-black)] shadow-[4px_4px_0px_var(--color-crav-black)] rotate-[-2deg]">
                    <Sparkles className="h-5 w-5" />
                    Global Seismic Relay
                  </div>

                  <CravTextAnimate
                    text={title.toUpperCase()}
                    className="font-[var(--font-modak)] text-6xl sm:text-7xl xl:text-8xl text-[var(--color-crav-black)] text-stroke-small tracking-wide"
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 font-[var(--font-mouse)] text-2xl uppercase bg-white border-4 border-[var(--color-crav-black)] rounded-full shadow-[4px_4px_0px_var(--color-crav-black)] rotate-2">
                      <Radio className="h-5 w-5 animate-pulse text-[var(--color-crav-red)]" />
                      LIVE FEED
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 font-[var(--font-mouse)] text-2xl uppercase bg-[var(--color-crav-beige)] border-4 border-[var(--color-crav-black)] rounded-full shadow-[4px_4px_0px_var(--color-crav-black)]">
                      {formatUpdatedAt(overview?.updatedAt)}
                    </div>
                  </div>

                  <div className="mt-6 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
                    {summary.map((item) => (
                      <div
                        key={item.label}
                        className={cn('crav-card p-4 flex flex-col items-center justify-center rotate-[-1deg] hover:rotate-2 text-[var(--color-crav-black)]', item.bg)}
                      >
                        <div className="font-[var(--font-mouse)] text-3xl uppercase text-[var(--color-crav-black)]">{item.label}</div>
                        <div className="font-[var(--font-modak)] text-5xl mt-2 text-[var(--color-crav-black)]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </CravScrollReveal>

          <section className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1.35fr)_300px] 2xl:grid-cols-[300px_minmax(0,1.5fr)_320px]">
            <aside className="flex min-h-[420px] flex-col gap-6">
              <CravScrollReveal direction="left" delay={0.1}>
                {featureHeadline ? (
                  <section className="crav-card overflow-hidden">
                    {featureHeadline.imageUrl ? (
                      <img
                        src={featureHeadline.imageUrl}
                        alt={featureHeadline.title}
                        className="h-40 w-full object-cover border-b-4 border-[var(--color-crav-black)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-40 w-full bg-[var(--color-crav-red)] border-b-4 border-[var(--color-crav-black)]" />
                    )}
                    <div className="space-y-4 p-5 bg-[var(--color-crav-beige)]">
                      <div className="font-[var(--font-mouse)] text-2xl uppercase text-[var(--color-crav-red)]">Top Headline</div>
                      <div className="font-bold text-lg text-[var(--color-crav-black)]">{featureHeadline.title}</div>
                      <p className="text-sm font-medium text-[var(--color-crav-black)] opacity-80">
                        {featureHeadline.description}
                      </p>
                      <a
                        href={featureHeadline.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 font-[var(--font-mouse)] text-2xl text-[var(--color-crav-orange)] hover:text-[var(--color-crav-red)] transition-colors"
                      >
                        OPEN SOURCE
                        <ArrowUpRight className="h-5 w-5 stroke-[3]" />
                      </a>
                    </div>
                  </section>
                ) : null}
              </CravScrollReveal>

              <CravScrollReveal direction="left" delay={0.2}>
                <section className="crav-card flex min-h-[300px] flex-col p-5 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b-4 border-[var(--color-crav-black)] pb-3 mb-2">
                    <div className="font-[var(--font-mouse)] text-3xl uppercase text-[var(--color-crav-black)]">Disaster & Depot Feed</div>
                    <div className="font-[var(--font-mouse)] text-xl text-[var(--color-crav-black)]">
                      {loadingOverview ? 'Syncing...' : `${filteredMarkers.length} TRACKED`}
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b-2 border-black/10">
                    {[
                      { id: 'all', label: 'All', icon: Zap },
                      { id: 'collapse', label: 'Collapse', icon: Building2 },
                      { id: 'flood', label: 'Floods', icon: Droplets },
                      { id: 'seismic', label: 'Seismic', icon: Mountain },
                      { id: 'cyclone', label: 'Cyclone', icon: Wind },
                      { id: 'warehouse', label: 'Depots', icon: Warehouse },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id as any)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono uppercase rounded-lg border transition-all',
                          categoryFilter === cat.id
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-900/10 dark:border-white/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        )}
                      >
                        <cat.icon className="h-3 w-3" />
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="h-[280px] overflow-y-auto pr-2 space-y-3">
                    {loadingOverview ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      </div>
                    ) : filteredMarkers.length === 0 ? (
                      <div className="p-4 text-lg font-[var(--font-mouse)] text-[var(--dm-card-text)] text-center">
                        No events available in this category.
                      </div>
                    ) : (
                      filteredMarkers.slice(0, 16).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => onMarkerSelect(event)}
                          className={cn(
                            'w-full text-left rounded-xl border p-3 transition-transform hover:-translate-y-1',
                            selectedMarkerId === event.id
                              ? 'bg-[var(--color-crav-mustard)] border-emerald-500 shadow-md'
                              : 'bg-[var(--color-crav-beige)] border-emerald-900/10 dark:border-white/10'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {getCategoryBadge(event)}
                                {event.nearestWarehouse && (
                                  <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 font-extrabold">
                                    Depot: {event.nearestWarehouse}
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-sm font-bold text-[var(--dm-card-text)]">{event.label}</div>
                              <div className="mt-1 font-[var(--font-mouse)] text-lg text-emerald-600 dark:text-emerald-400">{relativeFromNow(event.occurredAt)}</div>
                            </div>
                            <span className={cn('rounded-full border-2 font-bold px-2 py-1 text-xs shrink-0', markerTone(event.type))}>
                              {event.role === 'warehouse' ? 'DEPOT' : `M${(event.magnitude || 0).toFixed(1)}`}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </CravScrollReveal>
            </aside>

            <div className="flex min-h-[420px] flex-col gap-6">
              <CravScrollReveal direction="up" delay={0.1}>
                <div className="crav-card relative min-h-[600px] overflow-hidden bg-[var(--color-crav-black)]">
                  <div className="absolute inset-x-0 top-0 z-[450] flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-[#061812]/90 backdrop-blur-md border-b border-emerald-900/15 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-4">
                      {(['map', 'globe'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setViewMode(mode)}
                          className={cn(
                            'inline-flex h-12 items-center gap-2 rounded-full border-4 border-[var(--color-crav-black)] px-6 font-[var(--font-mouse)] text-2xl uppercase transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-crav-black)]',
                            viewMode === mode ? 'bg-[var(--color-crav-mustard)] shadow-[4px_4px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]' : 'bg-[var(--color-crav-beige)] text-[var(--color-crav-black)]'
                          )}
                        >
                          {mode === 'map' ? <Map className="h-5 w-5 stroke-[3]" /> : <Globe2 className="h-5 w-5 stroke-[3]" />}
                          {mode === 'map' ? 'MAP' : 'GLOBE'}
                        </button>
                      ))}

                      <div className="hidden sm:block ml-4">
                        <div className="font-[var(--font-mouse)] text-2xl uppercase text-[var(--color-crav-red)]">
                          {viewMode === 'map' ? 'MAP RELAY' : 'GLOBAL RELAY'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 pt-[80px]">
                    {viewMode === 'map' ? (
                      <TacticalMap
                        markers={filteredMarkers}
                        selectedMarkerId={selectedMarkerId}
                        onCityClick={handleMapSelect}
                        showFaultLines={showFaultLines}
                      />
                    ) : (
                      <Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center">
                            <div className="flex items-center gap-3 rounded-full border-4 border-[var(--color-crav-black)] bg-[var(--color-crav-mustard)] px-6 py-3 font-[var(--font-mouse)] text-3xl uppercase">
                              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-crav-black)]" />
                              LOADING GLOBE
                            </div>
                          </div>
                        }
                      >
                        <SeismicGlobe
                          markers={filteredMarkers}
                          selectedMarkerId={selectedMarkerId}
                          onMarkerSelect={onMarkerSelect}
                          speed={speed}
                        />
                      </Suspense>
                    )}
                  </div>

                  {selectedEvent && (
                    <div className="absolute bottom-6 left-6 z-[500] max-w-[320px] rounded-2xl border-4 border-[var(--color-crav-black)] bg-[var(--color-crav-mustard)] p-4 shadow-[8px_8px_0px_var(--color-crav-black)]">
                      <div className="text-lg font-bold text-[var(--color-crav-black)]">{selectedEvent.label}</div>
                      <div className="mt-2 font-[var(--font-mouse)] text-2xl text-[var(--color-crav-red)]">
                        MAGNITUDE {(selectedEvent.magnitude || 0).toFixed(1)} | DEPTH {Math.round(selectedEvent.depthKm || 0)} KM
                      </div>
                    </div>
                  )}

                  {mapOverlayControls}
                </div>
              </CravScrollReveal>

              <CravScrollReveal direction="up" delay={0.2}>
                <section className="crav-card p-5 bg-[var(--color-crav-beige)]">
                  <div className="flex items-center justify-between gap-3 border-b-4 border-[var(--color-crav-black)] pb-3 mb-4">
                    <div className="font-[var(--font-mouse)] text-3xl uppercase text-[var(--color-crav-black)]">Map Details</div>
                    <div className="font-[var(--font-mouse)] text-xl text-[var(--color-crav-red)]">
                      {crossCrisisCards.length > 0 ? 'CROSS-CRISIS' : 'SYNCING...'}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {crossCrisisCards.length === 0 ? (
                      <div className="rounded-xl border-[3px] border-[var(--color-crav-black)] bg-white p-4 font-[var(--font-mouse)] text-2xl text-[var(--color-crav-black)] text-center lg:col-span-2">
                        Details will appear here once the feed finishes syncing.
                      </div>
                    ) : (
                      crossCrisisCards.map((card) => {
                        const LaneIcon = crisisLaneIcon(card.type);
                        return (
                          <div key={card.type} className="rounded-xl border-[3px] border-[var(--color-crav-black)] bg-white p-4 shadow-[4px_4px_0px_var(--color-crav-black)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-crav-black)] transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 font-[var(--font-mouse)] text-2xl uppercase text-[var(--color-crav-orange)]">
                                  <LaneIcon className="h-5 w-5" />
                                  {card.label}
                                </div>
                                <div className="mt-1 text-sm font-bold text-[var(--color-crav-black)]">{card.executiveSummary}</div>
                              </div>
                              <span className={cn('rounded-full border-2 px-2 py-1 text-xs font-bold shrink-0', reportStatusTone(card.severity))}>
                                {card.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-3 text-sm font-medium opacity-80 text-[var(--color-crav-black)]">{card.summary}</div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {card.metrics.slice(0, 2).map((metric) => (
                                <div
                                  key={`${card.type}-${metric.label}`}
                                  className="rounded-lg border-[2px] border-[var(--color-crav-black)] bg-[var(--color-crav-mustard)] px-3 py-1 font-[var(--font-mouse)] text-xl text-[var(--color-crav-black)]"
                                >
                                  {metric.label}: {metric.value}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </CravScrollReveal>
            </div>

            <aside className="flex min-h-[420px] flex-col gap-6">
              <CravScrollReveal direction="right" delay={0.1}>
                <section className="crav-card min-h-[300px] flex-1 p-5 bg-[var(--color-crav-orange)]">
                  <div className="flex items-center justify-between gap-3 border-b-4 border-[var(--color-crav-black)] pb-3 mb-4">
                    <div className="font-[var(--font-mouse)] text-3xl uppercase text-[var(--color-crav-black)]">Location Intel</div>
                    <div className="inline-flex items-center gap-2 font-[var(--font-mouse)] text-xl text-white">
                      <Activity className="h-5 w-5" />
                      SELECTED EVENT
                    </div>
                  </div>

                  <div className="mt-4">
                    {loadingReport ? (
                      <div className="flex h-[200px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-crav-black)]" />
                      </div>
                    ) : selectedEvent ? (
                      <div className="space-y-4">
                        {/* Event Title and Category Header */}
                        <div className="bg-white border-4 border-[var(--color-crav-black)] rounded-xl p-4 shadow-[4px_4px_0px_var(--color-crav-black)]">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex flex-wrap gap-1">
                              {getCategoryBadge(selectedEvent)}
                            </div>
                            <span className={cn('px-2.5 py-0.5 text-xs font-bold border-2 rounded-full', reportStatusTone(selectedEvent.type === 'critical' ? 'Critical' : selectedEvent.type === 'warning' ? 'Warning' : 'Stable'))}>
                              {selectedEvent.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-base font-extrabold text-[var(--color-crav-black)] leading-snug">{selectedEvent.label}</div>
                          {report && (
                            <div className="font-[var(--font-mouse)] text-xl text-[var(--color-crav-red)] mt-0.5">
                              {report.city}, {report.country}
                            </div>
                          )}
                        </div>

                        {/* Incident Brief if description is present */}
                        {selectedEvent.description && (
                          <div className="bg-white border-4 border-[var(--color-crav-black)] rounded-xl p-3.5 shadow-[4px_4px_0px_var(--color-crav-black)]">
                            <div className="text-[10px] font-black uppercase font-mono text-[var(--color-crav-red)] mb-1 tracking-wider">
                              Incident & Casualty Brief
                            </div>
                            <p className="text-xs font-bold text-[var(--color-crav-black)] leading-relaxed">
                              {selectedEvent.description}
                            </p>
                          </div>
                        )}

                        {/* Threat Level & Weather Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border-4 border-[var(--color-crav-black)] rounded-xl p-3.5 shadow-[4px_4px_0px_var(--color-crav-black)]">
                            <div className="font-[var(--font-mouse)] text-xl text-[var(--color-crav-black)]">THREAT</div>
                            <div className="font-[var(--font-modak)] text-4xl text-[var(--color-crav-red)]">
                              {report?.threatLevel ?? Math.round((selectedEvent.magnitude || 5) * 15)}%
                            </div>
                          </div>
                          <div className="bg-white border-4 border-[var(--color-crav-black)] rounded-xl p-3.5 shadow-[4px_4px_0px_var(--color-crav-black)]">
                            <div className="font-[var(--font-mouse)] text-xl text-[var(--color-crav-black)]">
                              {selectedEvent.role === 'warehouse' ? 'CAPACITY' : 'MAGNITUDE'}
                            </div>
                            <div className="font-[var(--font-modak)] text-4xl text-[var(--color-crav-red)]">
                              {selectedEvent.role === 'warehouse' ? '100%' : `M${(selectedEvent.magnitude || 0).toFixed(1)}`}
                            </div>
                          </div>
                        </div>

                        {report && report.weather && (
                          <div className="bg-white border-4 border-[var(--color-crav-black)] rounded-xl p-3 text-xs font-bold shadow-[4px_4px_0px_var(--color-crav-black)]">
                            🌤️ {report.weather.condition}, {report.weather.temperature}, wind {report.weather.windSpeed} | AQI {report.weather.aqi}
                          </div>
                        )}

                        {/* Strategic Warehouse & Rapid Dispatch Section */}
                        {selectedEvent.nearestWarehouse && (
                          <div className="bg-[var(--color-crav-mustard)] border-4 border-[var(--color-crav-black)] rounded-xl p-4 shadow-[4px_4px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]">
                            <div className="flex items-center justify-between gap-2 border-b-2 border-[var(--color-crav-black)] pb-2 mb-2">
                              <div className="font-[var(--font-mouse)] text-2xl uppercase flex items-center gap-1.5">
                                <Warehouse className="h-5 w-5" />
                                Nearest Logistics Depot
                              </div>
                              <span className="text-[11px] font-black px-2 py-0.5 bg-black text-white rounded">
                                {selectedEvent.nearestWarehouseDistanceKm ? `${selectedEvent.nearestWarehouseDistanceKm} KM` : 'LOGISTICS'}
                              </span>
                            </div>
                            <div className="text-sm font-black">{selectedEvent.nearestWarehouse}</div>
                            {selectedEvent.recommendedSupplies && selectedEvent.recommendedSupplies.length > 0 && (
                              <div className="mt-2">
                                <div className="text-[10px] uppercase font-mono font-bold opacity-80 mb-1">
                                  Recommended Supply Kits:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedEvent.recommendedSupplies.map((item) => (
                                    <span key={item} className="px-2 py-0.5 bg-white border border-black rounded text-[10px] font-extrabold">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Link
                              to={`/supply-chain?destination=${encodeURIComponent(selectedEvent.targetDispatchDestination || selectedEvent.label)}&fromWarehouse=${encodeURIComponent(selectedEvent.nearestWarehouse)}&resource=${encodeURIComponent(selectedEvent.recommendedSupplies?.[0] || 'Medicine')}`}
                              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--color-crav-black)] text-[var(--color-crav-mustard)] hover:bg-[var(--color-crav-red)] hover:text-white rounded-lg font-[var(--font-mouse)] text-xl uppercase transition-colors shadow-[2px_2px_0_black]"
                            >
                              <Truck className="h-5 w-5 stroke-[2.5]" />
                              Dispatch Relief From Warehouse
                            </Link>
                          </div>
                        )}

                        {selectedEvent.role === 'warehouse' && (
                          <div className="bg-[var(--color-crav-mustard)] border-4 border-[var(--color-crav-black)] rounded-xl p-4 shadow-[4px_4px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]">
                            <div className="font-[var(--font-mouse)] text-2xl uppercase flex items-center gap-1.5 mb-1.5">
                              <Warehouse className="h-5 w-5" />
                              Strategic Depot Inventory
                            </div>
                            <div className="text-xs font-bold mb-3">{selectedEvent.description}</div>
                            <Link
                              to={`/supply-chain?fromWarehouse=${encodeURIComponent(selectedEvent.label.replace('Strategic Warehouse: ', '').split(' (')[0])}`}
                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--color-crav-black)] text-[var(--color-crav-mustard)] hover:bg-[var(--color-crav-green)] hover:text-white rounded-lg font-[var(--font-mouse)] text-xl uppercase transition-colors shadow-[2px_2px_0_black]"
                            >
                              <PackageOpen className="h-5 w-5 stroke-[2.5]" />
                              Manage Warehouse Stock
                            </Link>
                          </div>
                        )}

                        <a
                          href={report?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${selectedEvent.position[0]},${selectedEvent.position[1]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full justify-center items-center gap-2 mt-1 bg-[var(--color-crav-black)] text-white border-4 border-[var(--color-crav-black)] rounded-xl py-2.5 font-[var(--font-mouse)] text-xl hover:bg-[var(--color-crav-red)] transition-colors shadow-[4px_4px_0px_var(--color-crav-black)] active:translate-y-1 active:shadow-none"
                        >
                          <MapPin className="h-5 w-5" />
                          OPEN ON SATELLITE MAP
                        </a>
                      </div>
                    ) : (
                      <div className="flex h-[200px] flex-col items-center justify-center gap-4 text-center bg-white border-4 border-[var(--color-crav-black)] rounded-xl p-6 shadow-[4px_4px_0px_var(--color-crav-black)]">
                        <AlertTriangle className="h-10 w-10 text-[var(--color-crav-red)]" />
                        <div className="font-[var(--font-mouse)] text-2xl text-[var(--color-crav-black)]">
                          SELECT AN EVENT FROM THE FEED OR MAP TO LOAD INTEL.
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </CravScrollReveal>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
