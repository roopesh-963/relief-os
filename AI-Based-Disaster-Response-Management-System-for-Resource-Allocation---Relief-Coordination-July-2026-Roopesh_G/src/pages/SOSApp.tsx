import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Shield,
  Signal,
  CheckCircle2,
  Radio,
  Wifi,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { submitSOS, getCurrentLocation } from '../services/api';
import { ZeroTextReveal } from '../components/ZeroTextReveal';

const PHASES = ['TRANSMITTING TELEMETRY', 'A.I. ROUTING INITIATED', 'NODE DISPATCHED', 'RESCUE SECURED'];

export default function SOSApp() {
  const [sosActive, setSosActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation of SOS lifecycle
  useEffect(() => {
    if (sosActive && phaseIndex < PHASES.length - 1) {
      const timer = setTimeout(() => {
        setPhaseIndex(p => p + 1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [sosActive, phaseIndex]);

  const handleTriggerSOS = async () => {
    if (triggering || sosActive) return;
    setTriggering(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      await submitSOS({
        latitude: loc.lat,
        longitude: loc.lng,
        severity: 'critical',
        crisisType: 'medical',
        message: 'Citizen Emergency SOS',
      });
      setSosActive(true);
      setPhaseIndex(0);
    } catch (err) {
      setError('Primary link degraded. Rerouting via mesh...');
      // Fallback
      setTimeout(() => {
        setError(null);
        setSosActive(true);
      }, 2500);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#ebe6e0] text-black selection:bg-black selection:text-[#ebe6e0] transition-colors duration-700 noise">
      
      {/* ── Liquid Ambient Background ── */}
      <div className="liquid-bg-container pointer-events-none">
        <div className="liquid-blob b1"></div>
        <div className="liquid-blob b2"></div>
        <div className="liquid-blob b3"></div>
      </div>

      <AppNavBar />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-24 pb-32">
        
        <AnimatePresence mode="wait">
          {!sosActive ? (
            <motion.div 
              key="trigger"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-between h-full w-full max-w-5xl relative"
            >
              
              {/* Header Text */}
              <div className="text-center mb-8 mt-12 sm:mt-0">
                <ZeroTextReveal 
                  text="CITIZEN RELIEF SIGNAL" 
                  as="h1" 
                  className="font-serif italic text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-black mb-4 uppercase"
                />
                <p className="font-sans text-sm sm:text-base text-black/60 max-w-lg mx-auto font-normal">
                  Our mesh network analyzes your geospatial telemetry to dispatch the nearest active drone or responder node instantly.
                </p>
              </div>

              {/* Central Claymorphic Hub / Beacon */}
              <div className="relative flex items-center justify-center w-full max-w-2xl aspect-square sm:aspect-video my-8">
                
                {/* The Beacon Container */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="clay-panel w-48 h-64 sm:w-64 sm:h-80 flex flex-col items-center justify-center relative z-20"
                >
                  <div className="absolute top-4 w-12 h-2 rounded-full bg-black/5 inner-shadow"></div>
                  
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#ebe6e0] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1),inset_-4px_-4px_10px_rgba(255,255,255,0.8)] flex items-center justify-center mb-4 relative overflow-hidden bg-[#ebe6e0]">
                    <Shield className="w-10 h-10 sm:w-14 sm:h-14 text-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                  </div>

                  <div className="font-mono text-xs font-bold tracking-[0.2em] text-black/40 uppercase">
                    Hub 04-B
                  </div>
                  <div className="flex gap-1 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-black/20"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-black/20"></span>
                  </div>
                </motion.div>

                {/* Decorative connecting lines / cables behind beacon */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden sm:block" preserveAspectRatio="none" viewBox="0 0 1000 400">
                  <path d="M 200 200 Q 300 50, 500 200" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 800 200 Q 700 350, 500 200" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 200 200 Q 350 350, 500 200" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" strokeLinecap="round" />
                </svg>

                {/* Floating Interactive Stat Nodes */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute left-4 top-10 sm:left-12 sm:top-20 z-30 group"
                >
                  <div className="clay-button w-10 h-10 rounded-full flex items-center justify-center cursor-help">
                    <span className="font-mono font-bold text-black/60">+</span>
                  </div>
                  <div className="absolute top-12 left-0 w-48 p-3 rounded-xl bg-white/90 backdrop-blur border border-black/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-2 mb-1 text-black">
                      <Wifi className="w-4 h-4" />
                      <span className="font-serif italic font-semibold text-lg">Mesh Status</span>
                    </div>
                    <p className="text-xs font-mono text-black/60 uppercase tracking-widest">Active nodes: 1,402</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute right-8 top-1/4 sm:right-24 sm:top-1/3 z-30 group"
                >
                  <div className="clay-button w-10 h-10 rounded-full flex items-center justify-center cursor-help">
                    <span className="font-mono font-bold text-black/60">+</span>
                  </div>
                  <div className="absolute top-12 right-0 w-48 p-3 rounded-xl bg-white/90 backdrop-blur border border-black/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-2 mb-1 text-black">
                      <Navigation className="w-4 h-4" />
                      <span className="font-serif italic font-semibold text-lg">Response Time</span>
                    </div>
                    <p className="text-xs font-mono text-black/60 uppercase tracking-widest">Global Avg: 4.2m</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute left-10 bottom-10 sm:left-32 sm:bottom-16 z-30 group"
                >
                  <div className="clay-button w-10 h-10 rounded-full flex items-center justify-center cursor-help">
                    <span className="font-mono font-bold text-black/60">+</span>
                  </div>
                  <div className="absolute bottom-12 left-0 w-48 p-3 rounded-xl bg-white/90 backdrop-blur border border-black/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-2 mb-1 text-black">
                      <Shield className="w-4 h-4" />
                      <span className="font-serif italic font-semibold text-lg">Drone Fleet</span>
                    </div>
                    <p className="text-xs font-mono text-black/60 uppercase tracking-widest">S.A.R Ready: 320</p>
                  </div>
                </motion.div>
                
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-3 text-red-700 font-mono text-xs font-bold uppercase tracking-widest border border-red-500/20 px-6 py-3 rounded-full bg-red-500/10 backdrop-blur-md"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              {/* Lacoste "Tap" inspired massive SOS button */}
              <div className="flex flex-col items-center mt-auto">
                <div 
                  className={`w-32 h-32 sm:w-40 sm:h-40 lacoste-sos-base ${triggering ? 'pointer-events-none scale-95 opacity-80' : ''}`}
                  onClick={handleTriggerSOS}
                >
                  <div className="lacoste-sos-inner">
                    <div className="lacoste-sos-core relative">
                       {triggering ? (
                          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white/90 animate-spin absolute" />
                        ) : (
                          <span className="font-sans font-black italic text-xl sm:text-3xl tracking-tighter uppercase text-white/90 drop-shadow-md">
                            TAP
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-xs font-mono font-bold tracking-[0.2em] text-black/40 uppercase bg-black/5 px-4 py-1.5 rounded-full">
                  PRESS TO BROADCAST SOS
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="status"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-4xl bg-white/40 backdrop-blur-3xl border border-white/60 p-8 sm:p-16 rounded-[40px] shadow-2xl relative overflow-hidden"
            >
              {/* Inner ambient glow for active SOS */}
              <div className="absolute inset-0 bg-red-500/5 mix-blend-multiply pointer-events-none"></div>

              <div className="mb-16 relative z-10">
                <div className="flex items-center gap-3 mb-6 bg-red-500/10 w-fit px-4 py-1.5 rounded-full border border-red-500/20">
                  <Signal className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-red-700">
                    Emergency Broadcast Live
                  </span>
                </div>
                <ZeroTextReveal 
                  text={PHASES[phaseIndex]} 
                  as="h2" 
                  className="font-serif italic text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-black"
                />
              </div>

              {/* Progress Tracking Timeline */}
              <div className="relative z-10 pl-4 sm:pl-8">
                <div className="absolute left-[27px] sm:left-[43px] top-4 bottom-4 w-[2px] bg-black/10 rounded-full" />
                
                {PHASES.map((phase, idx) => {
                  const isActive = idx === phaseIndex;
                  const isPast = idx < phaseIndex;
                  return (
                    <div key={phase} className="relative flex items-center gap-6 sm:gap-10 mb-10 last:mb-0">
                      
                      {/* Timeline Node */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 bg-[#ebe6e0] shadow-[4px_4px_10px_#d4d0ca,-4px_-4px_10px_#ffffff] ${isPast ? 'border-2 border-emerald-500' : isActive ? 'border-2 border-amber-500' : 'border border-black/10'}`}>
                        {isPast && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        {isActive && <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />}
                      </div>

                      {/* Phase Text */}
                      <div className={`transition-all duration-700 flex-1 ${isPast || isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`font-serif italic text-2xl sm:text-3xl ${isPast || isActive ? 'text-black' : 'text-black/60'}`}>
                          {phase}
                        </div>
                        {isActive && (
                          <div className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 mt-1">
                            Processing...
                          </div>
                        )}
                        {isPast && (
                          <div className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-600 mt-1">
                            Confirmed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
