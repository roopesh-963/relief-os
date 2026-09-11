import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  Waves,
  Building2,
  Wind,
  Droplets,
  Thermometer,
  Send,
  Radio,
  ExternalLink,
  Warehouse,
  CheckCircle2,
  Sparkles,
  MapPin,
  Compass,
} from 'lucide-react';
import { CrisisMarker, LocationIntelReport } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

interface LeftCrisisIntelPanelProps {
  markers: CrisisMarker[];
  selectedMarker: CrisisMarker | null;
  report: LocationIntelReport | null;
  loadingReport: boolean;
  onMarkerSelect: (marker: CrisisMarker) => void;
  onClose: () => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: any) => void;
  activeCount: number;
  criticalCount: number;
  maxMagnitude: number;
}

// Framer Motion Variants for Lacoste-style staggered entrance
const panelVariants = {
  hidden: { x: '-120%', opacity: 0 },
  visible: { 
    x: '0%', 
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1], // Premium bezier
      when: 'beforeChildren',
      staggerChildren: 0.1
    }
  },
  exit: {
    x: '-120%',
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: [0.76, 0, 0.24, 1],
      when: 'afterChildren',
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } 
  },
  exit: { 
    y: 15, 
    opacity: 0, 
    transition: { duration: 0.3 } 
  }
};

export function LeftCrisisIntelPanel({
  selectedMarker,
  report,
  loadingReport,
  onClose,
}: LeftCrisisIntelPanelProps) {
  const { addNotification } = useNotifications();
  const [actionDispatched, setActionDispatched] = useState<string | null>(null);

  const handleDispatch = (teamType: string) => {
    if (!selectedMarker) return;
    setActionDispatched(teamType);
    addNotification({
      type: 'critical',
      title: `${teamType} Mobilized`,
      message: `Emergency convoy en-route to [${selectedMarker.position[0].toFixed(2)}, ${selectedMarker.position[1].toFixed(2)}] (${selectedMarker.label}).`,
    });
    setTimeout(() => setActionDispatched(null), 4000);
  };

  const handleBroadcast = () => {
    if (!selectedMarker) return;
    addNotification({
      type: 'warning',
      title: 'Regional Siren Activated',
      message: `Emergency civil defense broadcast initiated for ${selectedMarker.label}.`,
    });
  };

  const categoryIcon = (cat?: string) => {
    switch (cat) {
      case 'flood': return <Waves className="w-4 h-4 text-cyan-600" />;
      case 'building_collapse': return <Building2 className="w-4 h-4 text-red-500" />;
      case 'cyclone': return <Wind className="w-4 h-4 text-indigo-500" />;
      case 'warehouse': return <Warehouse className="w-4 h-4 text-emerald-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="pointer-events-auto fixed left-4 sm:left-8 bottom-6 z-[500] w-[calc(100vw-2rem)] md:w-[650px] lg:w-[750px] max-h-[55vh] flex flex-col select-none">
      <AnimatePresence mode="wait">
        {selectedMarker ? (
          <motion.div
            key="details-view"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col rounded-xl bg-white/95 backdrop-blur-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,10,30,0.2)] overflow-hidden"
          >
            {/* Dossier Header */}
            <div className="relative border-b border-gray-300/80 bg-white p-5 md:p-6 shrink-0">
              <motion.div variants={itemVariants} className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-[0.15em] border ${
                      selectedMarker.type === 'critical'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : selectedMarker.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                    {selectedMarker.type === 'critical'
                      ? 'CRITICAL DISASTER'
                      : selectedMarker.type === 'warning'
                      ? 'WARNING THREAT'
                      : 'TACTICAL OBSERVATION'}
                  </span>

                  {selectedMarker.magnitude && (
                    <span className="px-2 py-1 rounded-sm bg-gray-100 border border-gray-300 text-[10px] font-mono font-bold text-black">
                      M {selectedMarker.magnitude.toFixed(1)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-sm hover:bg-gray-200/80 text-black hover:text-black transition-all cursor-pointer"
                  title="Close Details & Return to Overview"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-4">
                <div className="flex items-center gap-2 text-[#444] text-xs font-sans tracking-[0.1em] uppercase font-bold">
                  {categoryIcon(selectedMarker.category)}
                  <span>{selectedMarker.category?.replace('_', ' ') || 'Disaster Incident'}</span>
                </div>
                <h2 className="mt-1.5 text-3xl md:text-4xl font-bold font-display text-black tracking-tight leading-none uppercase">
                  {selectedMarker.label}
                </h2>
                <div className="mt-3 flex items-center gap-4 text-xs text-[#333] font-sans tracking-wide">
                  <span className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-4 h-4 text-black" />
                    {selectedMarker.position[0].toFixed(2)}°, {selectedMarker.position[1].toFixed(2)}°
                  </span>
                  {selectedMarker.depthKm !== undefined && (
                    <span className="flex items-center gap-1.5 font-bold">
                      <Compass className="w-4 h-4 text-black" />
                      {selectedMarker.depthKm.toFixed(1)} km depth
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Dossier Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar bg-white/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Environmental Telemetry */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-sans font-bold text-black uppercase tracking-[0.15em] border-b border-gray-300 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4" /> Telemetry
                  </span>
                  <span>LIVE</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white border border-gray-300 rounded-md p-3">
                    <div className="text-[9px] font-sans font-bold text-[#555] tracking-wider">TEMP</div>
                    <div className="text-sm font-mono font-bold text-black mt-1">
                      {report?.weather?.temperature || '26°C'}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-md p-3">
                    <div className="text-[9px] font-sans font-bold text-[#555] tracking-wider">WIND</div>
                    <div className="text-sm font-mono font-bold text-cyan-800 mt-1 flex items-center justify-center gap-1">
                      <Wind className="w-3.5 h-3.5" />
                      {report?.weather?.windSpeed || '12 km/h'}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-md p-3">
                    <div className="text-[9px] font-sans font-bold text-[#555] tracking-wider">PRECIP</div>
                    <div className="text-sm font-mono font-bold text-indigo-800 mt-1 flex items-center justify-center gap-1">
                      <Droplets className="w-3.5 h-3.5" />
                      {report?.weather?.precipitation || '0 mm'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Threat Assessment */}
              <motion.div variants={itemVariants} className="bg-gray-100 border border-gray-300 rounded-md p-4">
                <div className="flex items-center gap-2 text-[10px] font-sans font-bold text-black uppercase tracking-[0.15em] mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span>Tactical Briefing</span>
                </div>
                {loadingReport ? (
                  <div className="py-2 text-xs text-[#555] animate-pulse font-sans tracking-wide">
                    Synthesizing multi-spectral feeds...
                  </div>
                ) : (
                  <p className="text-sm text-black font-medium leading-relaxed font-sans">
                    {report?.environmentalStatus ||
                      selectedMarker.description ||
                      `High seismic anomaly mapped in the ${selectedMarker.label} corridor. Immediate search and rescue drone deployment recommended to assess structural integrity.`}
                  </p>
                )}

                {report?.recommendation && (
                  <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-black font-sans tracking-wide">
                    <strong className="text-black font-bold uppercase tracking-wider text-[10px]">PROTOCOL: </strong>
                    {report.recommendation}
                  </div>
                )}
              </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Nearest Warehouse & Logistics */}
              {selectedMarker.nearestWarehouse && (
                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between text-[10px] font-sans font-bold text-black uppercase tracking-[0.15em] border-b border-gray-300 pb-2 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Warehouse className="w-4 h-4" />
                      Supply Depot
                    </span>
                    {selectedMarker.nearestWarehouseDistanceKm && (
                      <span className="text-black font-bold">
                        {selectedMarker.nearestWarehouseDistanceKm.toFixed(0)} km
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-black font-sans tracking-wide">
                    {selectedMarker.nearestWarehouse}
                  </div>

                  {selectedMarker.recommendedSupplies && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedMarker.recommendedSupplies.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-wider bg-white border border-gray-300 text-black"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* USGS Event Feed */}
              {selectedMarker.sourceUrl && (
                <motion.div variants={itemVariants}>
                  <div className="text-[10px] font-sans font-bold text-black uppercase tracking-[0.15em] border-b border-gray-300 pb-2 mb-3">
                    Sources
                  </div>
                  <a
                    href={selectedMarker.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-sm border border-gray-300 bg-white hover:bg-gray-50 text-xs text-black transition-colors group"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <ExternalLink className="w-4 h-4 text-black" />
                      USGS Data Log
                    </span>
                    <span className="font-sans font-bold text-[10px] tracking-wider uppercase text-black">VIEW ↗</span>
                  </a>
                </motion.div>
              )}
              </div>
            </div>

            {/* Dossier Bottom Action Buttons */}
            <motion.div variants={itemVariants} className="border-t border-gray-300 bg-white p-4 md:p-5 shrink-0 flex flex-col md:flex-row gap-3">
              <button
                type="button"
                disabled={Boolean(actionDispatched)}
                onClick={() => handleDispatch('SAR Rescue Convoy')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-sm font-sans text-[11px] font-bold uppercase tracking-[0.15em] bg-black hover:bg-[#222] active:scale-95 text-white transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {actionDispatched === 'SAR Rescue Convoy' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SENT
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Dispatch
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBroadcast}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-sm font-sans text-[11px] font-bold uppercase tracking-[0.15em] bg-white hover:bg-gray-100 border-2 border-black text-black active:scale-95 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 text-amber-500" /> Siren
              </button>

              <button
                type="button"
                disabled={Boolean(actionDispatched)}
                onClick={() => handleDispatch('Emergency Supply Drones')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-sm font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-black bg-gray-100 hover:bg-gray-200 border-2 border-transparent active:scale-95 transition-all cursor-pointer"
              >
                <Warehouse className="w-4 h-4 text-[#555]" /> Cargo
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
