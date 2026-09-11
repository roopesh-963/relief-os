import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  AlertTriangle,
  Flame,
  Waves,
  Building2,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Send,
  Radio,
  ExternalLink,
  Warehouse,
  CheckCircle2,
  Share2,
  Sparkles,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react';
import { CrisisMarker, LocationIntelReport } from '../services/api';
import { BlenderEarthWidget } from './BlenderEarthWidget';
import { useNotifications } from '../hooks/useNotifications';

interface TacticalDetailPanelProps {
  marker: CrisisMarker;
  report: LocationIntelReport | null;
  loadingReport: boolean;
  onClose: () => void;
}

export function TacticalDetailPanel({
  marker,
  report,
  loadingReport,
  onClose,
}: TacticalDetailPanelProps) {
  const { addNotification } = useNotifications();
  const [actionDispatched, setActionDispatched] = useState<string | null>(null);

  const isCritical = marker.type === 'critical';
  const isWarning = marker.type === 'warning';

  const categoryIcon = () => {
    switch (marker.category) {
      case 'flood':
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case 'building_collapse':
        return <Building2 className="w-5 h-5 text-red-400" />;
      case 'cyclone':
        return <Wind className="w-5 h-5 text-purple-400" />;
      case 'warehouse':
        return <Warehouse className="w-5 h-5 text-cyan-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleDispatch = (teamType: string) => {
    setActionDispatched(teamType);
    addNotification({
      type: 'critical',
      title: `${teamType} Mobilized`,
      message: `Unit en-route to coordinates [${marker.position[0].toFixed(2)}, ${marker.position[1].toFixed(2)}] (${marker.label}).`,
    });
    setTimeout(() => {
      setActionDispatched(null);
    }, 4000);
  };

  const handleBroadcast = () => {
    addNotification({
      type: 'warning',
      title: 'Regional Siren & Alert Sent',
      message: `Emergency broadcast initiated for area near ${marker.label}.`,
    });
  };

  return (
    <motion.aside
      key={`panel-${marker.id}`}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed right-0 top-0 bottom-0 z-[600] w-full max-w-lg md:max-w-md lg:max-w-[480px] bg-[#070d1e]/95 backdrop-blur-2xl border-l border-white/10 shadow-[-16px_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden select-none"
    >
      {/* ── Top Bar with Rotating 3D Blender Globe ── */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-[#0b1329] to-[#070d1e] p-5 pb-4">
        {/* Glow Accent */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
          }`}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                isCritical
                  ? 'bg-red-500/15 border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : isWarning
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              {isCritical ? 'CRITICAL THREAT' : isWarning ? 'WARNING ALERT' : 'ACTIVE INCIDENT'}
            </span>

            {marker.magnitude && (
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-white">
                M {marker.magnitude.toFixed(1)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Title & 3D Rotating Earth Corner Container */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono tracking-wider uppercase">
              {categoryIcon()}
              <span>{marker.category?.replace('_', ' ') || 'Disaster Event'}</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-white tracking-tight leading-snug line-clamp-2">
              {marker.label}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {marker.position[0].toFixed(2)}°, {marker.position[1].toFixed(2)}°
              </span>
              {marker.depthKm !== undefined && (
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  {marker.depthKm.toFixed(1)} km depth
                </span>
              )}
            </div>
          </div>

          {/* 3D Rotating Earth Globe in Right-Corner of Header */}
          <div className="shrink-0 relative group">
            <BlenderEarthWidget
              size="compact"
              className="w-28 h-28 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              targetCoordinates={marker.position}
              showControls={false}
            />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#060b18] border border-cyan-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-300 tracking-wider">
              3D ORBIT
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable Body Intel Sections ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
        {/* Environmental & Weather Telemetry */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider mb-2.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Thermometer className="w-3.5 h-3.5" /> Environmental Telemetry
            </span>
            <span>LIVE SENSORS</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-black/30 border border-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400">TEMPERATURE</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {report?.weather?.temperature || '28°C'}
              </div>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400">WIND SPEED</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5 flex items-center justify-center gap-1">
                <Wind className="w-3 h-3" />
                {report?.weather?.windSpeed || '14 km/h'}
              </div>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-lg p-2">
              <div className="text-[10px] text-gray-400">PRECIPITATION</div>
              <div className="text-sm font-bold text-indigo-300 mt-0.5 flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3" />
                {report?.weather?.precipitation || '2 mm'}
              </div>
            </div>
          </div>
        </div>

        {/* AI Situation Briefing & Hazard Analysis */}
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>ReliefOS Tactical Briefing</span>
          </div>
          {loadingReport ? (
            <div className="py-4 text-center text-xs text-gray-400 animate-pulse font-mono">
              Synthesizing multi-spectral satellite & seismic feeds...
            </div>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed">
              {report?.environmentalStatus ||
                marker.description ||
                `High seismic disturbance observed around ${marker.label}. Ground integrity compromised. Immediate dispatch of reconnaissance drones and emergency teams recommended.`}
            </p>
          )}

          {report?.recommendation && (
            <div className="mt-3 pt-2.5 border-t border-white/5 text-[11px] text-amber-200/90 font-mono">
              <strong className="text-amber-400">RECOMMENDATION: </strong>
              {report.recommendation}
            </div>
          )}
        </div>

        {/* Logistics & Relief Supply Corridor */}
        {marker.nearestWarehouse && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-white">
                <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
                Nearest Supply Depot
              </span>
              {marker.nearestWarehouseDistanceKm && (
                <span className="text-cyan-400 font-bold">
                  {marker.nearestWarehouseDistanceKm.toFixed(0)} km away
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-white">
              {marker.nearestWarehouse}
            </div>

            {marker.recommendedSupplies && marker.recommendedSupplies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {marker.recommendedSupplies.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 border border-cyan-500/30 text-cyan-200"
                  >
                    + {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Official Source Link */}
        {marker.sourceUrl && (
          <a
            href={marker.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-xs text-gray-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              USGS Scientific Event Feed
            </span>
            <span className="font-mono text-[10px] text-cyan-400">OPEN USGS ↗</span>
          </a>
        )}
      </div>

      {/* ── Fixed Bottom Tactical Action Controls ── */}
      <div className="border-t border-white/10 bg-[#060a16] p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={Boolean(actionDispatched)}
            onClick={() => handleDispatch('SAR Alpha Rescue Team')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 active:scale-98 text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {actionDispatched === 'SAR Alpha Rescue Team' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> DISPATCHED
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Dispatch Rescue
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBroadcast}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/15 text-white active:scale-98 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" /> Broadcast Siren
          </button>
        </div>

        <button
          type="button"
          disabled={Boolean(actionDispatched)}
          onClick={() => handleDispatch('Medical Drone Cargo')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 active:scale-98 transition-all cursor-pointer"
        >
          <Warehouse className="w-3.5 h-3.5" /> Route Emergency Supplies from Depot
        </button>
      </div>
    </motion.aside>
  );
}
