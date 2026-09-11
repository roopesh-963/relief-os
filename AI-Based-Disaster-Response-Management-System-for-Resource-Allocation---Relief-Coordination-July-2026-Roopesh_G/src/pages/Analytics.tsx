import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, TimerReset, Users, Zap } from 'lucide-react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { ZeroTextReveal } from '../components/ZeroTextReveal';
import { getAnalyticsOverview, AnalyticsOverview } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnalyticsOverview();
        setOverview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const kpis = [
    { label: 'LIVES ASSISTED', value: overview.metrics.livesAssisted.toLocaleString(), icon: Users, color: 'text-[#34e899]', bg: 'bg-[#34e899]' },
    { label: 'ACTIVE EMERGENCIES', value: overview.metrics.activeEmergencies.toLocaleString(), icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500' },
    { label: 'AVG RESPONSE TIME', value: `${overview.metrics.avgResponseTime} MIN`, icon: TimerReset, color: 'text-white', bg: 'bg-white' },
    { label: 'TOTAL INCIDENTS', value: overview.metrics.totalIncidents.toLocaleString(), icon: Activity, color: 'text-white/60', bg: 'bg-white/20' },
    { label: 'RESOURCES DEPLOYED', value: overview.metrics.resourcesDeployed.toLocaleString(), icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-400' },
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden selection:bg-white selection:text-black">
      <AppNavBar />

      <main className="relative pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="mb-32 text-center">
          <ZeroTextReveal 
            text="GLOBAL IMPACT" 
            as="h1" 
            className="font-display text-5xl md:text-8xl lg:text-9xl font-light tracking-tighter uppercase mb-6"
          />
          <div className="flex items-center justify-center gap-4 text-white/40 font-mono text-sm tracking-[0.2em] uppercase">
            <span>Live Telemetry</span>
            <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
            <span>Past 7 Days</span>
          </div>
        </div>

        {/* Massive KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-12">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="group relative flex flex-col items-center text-center">
                <div className="mb-6 relative">
                  <div className={`absolute inset-0 ${kpi.bg}/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500`} />
                  <Icon className={`w-8 h-8 ${kpi.color} relative z-10`} />
                </div>
                
                <div className={`font-display text-7xl md:text-8xl font-light tracking-tighter ${kpi.color} mb-4`}>
                  {kpi.value}
                </div>
                
                <div className="font-mono text-xs tracking-[0.3em] uppercase text-white/40">
                  {kpi.label}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
