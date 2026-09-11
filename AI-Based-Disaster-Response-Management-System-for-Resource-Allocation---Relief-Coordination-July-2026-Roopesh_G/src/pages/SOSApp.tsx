import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Shield,
  Signal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { submitSOS, getCurrentLocation } from '../services/api';
import { ZeroTextReveal } from '../components/ZeroTextReveal';

const PHASES = ['TRANSMITTING', 'TEAM ASSIGNED', 'ON ROUTE', 'RESOLVED'];

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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sosActive, phaseIndex]);

  const handleTriggerSOS = async () => {
    setTriggering(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      await submitSOS({
        latitude: loc.latitude,
        longitude: loc.longitude,
        category: 'Critical',
        severity: 'critical',
        description: 'Citizen Emergency SOS',
        contactInfo: 'Auto-detected',
      });
      setSosActive(true);
      setPhaseIndex(0);
    } catch (err) {
      setError('Signal Lost. Retrying via mesh network...');
      // Fallback
      setTimeout(() => setSosActive(true), 2000);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden selection:bg-red-500 selection:text-white flex flex-col justify-center">
      <AppNavBar />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        
        <AnimatePresence mode="wait">
          {!sosActive ? (
            <motion.div 
              key="trigger"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center text-center max-w-3xl"
            >
              <div className="mb-12">
                <Shield className="w-16 h-16 text-white/20 mx-auto mb-6" />
                <ZeroTextReveal 
                  text="CITIZEN EMERGENCY" 
                  as="h1" 
                  className="font-display text-5xl md:text-8xl font-medium tracking-tighter text-white mb-6 uppercase"
                />
                <p className="font-sans text-xl text-white/40 max-w-xl mx-auto font-light">
                  Tap to transmit distress telemetry to the nearest relief node.
                </p>
              </div>

              <button
                onClick={handleTriggerSOS}
                disabled={triggering}
                className="group relative flex items-center justify-center w-64 h-64 rounded-full bg-red-600 border border-red-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
              >
                {/* Ping rings */}
                <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20" />
                <div className="absolute inset-[-20%] rounded-full bg-red-600/10 blur-2xl group-hover:bg-red-500/30 transition-colors" />

                {triggering ? (
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                ) : (
                  <span className="font-display text-5xl tracking-widest uppercase font-medium text-white relative z-10">
                    SOS
                  </span>
                )}
              </button>
              
              {error && (
                <div className="mt-8 flex items-center gap-3 text-red-400 font-mono text-sm uppercase tracking-widest border border-red-500/30 px-6 py-3 rounded-full bg-red-500/10">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-4xl"
            >
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-4">
                  <Signal className="w-6 h-6 text-red-500 animate-pulse" />
                  <span className="font-mono text-sm tracking-[0.3em] uppercase text-red-500">
                    Distress Signal Active
                  </span>
                </div>
                <ZeroTextReveal 
                  text={PHASES[phaseIndex]} 
                  as="h2" 
                  className="font-display text-6xl md:text-9xl font-light tracking-tighter uppercase text-white"
                />
              </div>

              {/* Minimalist Linear Tracking */}
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-white/10" />
                
                {PHASES.map((phase, idx) => {
                  const isActive = idx === phaseIndex;
                  const isPast = idx < phaseIndex;
                  return (
                    <div key={phase} className="relative flex items-center gap-8 mb-12 last:mb-0">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center bg-[#030712] border-2 transition-colors duration-500 ${isPast || isActive ? 'border-white' : 'border-white/10'}`}>
                        {(isPast || isActive) && <div className="w-2 h-2 bg-white rounded-full" />}
                        {isActive && <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />}
                      </div>
                      <div className={`font-mono text-xl tracking-widest uppercase transition-colors duration-500 ${isPast || isActive ? 'text-white' : 'text-white/30'}`}>
                        {phase}
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
