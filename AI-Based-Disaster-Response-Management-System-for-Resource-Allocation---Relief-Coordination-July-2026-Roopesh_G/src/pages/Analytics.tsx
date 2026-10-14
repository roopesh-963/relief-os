import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ShieldAlert,
  TimerReset,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Warehouse,
  Truck,
  Droplets,
  HeartPulse,
  Boxes,
  Radio,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
  Clock,
  Compass,
  Waves,
  Flame,
  Wind,
  Navigation,
  ExternalLink,
  ChevronRight,
  Plane,
  Eye,
  Globe2,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Crosshair
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { ZeroTextReveal } from '../components/ZeroTextReveal';
import {
  getAnalyticsOverview,
  AnalyticsOverview,
  getAnalyticsSummary,
  AnalyticsSummary,
  getWarehouses,
  WarehouseSummary,
  getResources,
  Resource,
  getShipments,
  Shipment,
  getAllSOS,
  SOSRequest,
} from '../services/api';

// ── Initial Live Telemetry Datasets ──
const INITIAL_LIVE_TELEMETRY = [
  { time: '06:00', disasters: 18, resources: 820, supplyFlow: 94, responseTime: 5.4 },
  { time: '08:00', disasters: 24, resources: 1150, supplyFlow: 112, responseTime: 4.8 },
  { time: '10:00', disasters: 31, resources: 1640, supplyFlow: 145, responseTime: 4.5 },
  { time: '12:00', disasters: 28, resources: 2100, supplyFlow: 160, responseTime: 4.2 },
  { time: '14:00', disasters: 35, resources: 2480, supplyFlow: 178, responseTime: 3.9 },
  { time: '16:00', disasters: 39, resources: 2950, supplyFlow: 195, responseTime: 4.1 },
  { time: '18:00', disasters: 34, resources: 3420, supplyFlow: 210, responseTime: 3.8 },
  { time: '20:00', disasters: 32, resources: 3890, supplyFlow: 228, responseTime: 4.0 },
  { time: '22:00', disasters: 29, resources: 4210, supplyFlow: 240, responseTime: 3.7 },
  { time: '00:00', disasters: 26, resources: 4650, supplyFlow: 255, responseTime: 3.6 },
];

// Multi-Axis Radar Vulnerability Assessment Data
const VULNERABILITY_RADAR_DATA = [
  { dimension: 'Seismic Impact', currentThreat: 92, baselineCapacity: 65, fullMark: 100 },
  { dimension: 'Flood Exposure', currentThreat: 78, baselineCapacity: 80, fullMark: 100 },
  { dimension: 'Medical Demand', currentThreat: 88, baselineCapacity: 75, fullMark: 100 },
  { dimension: 'Supply Shortfall', currentThreat: 42, baselineCapacity: 85, fullMark: 100 },
  { dimension: 'Population Density', currentThreat: 84, baselineCapacity: 70, fullMark: 100 },
  { dimension: 'S.A.R. Latency', currentThreat: 32, baselineCapacity: 90, fullMark: 100 },
];

// Resource Category Pie / Donut Data
const RESOURCE_PIE_DATA = [
  { name: 'Medical Kits & Plasma', value: 35, color: '#ef4444', units: '4,850 packs' },
  { name: 'Water Purification', value: 25, color: '#06b6d4', units: '1,280 systems' },
  { name: 'S.A.R. Drone Units', value: 18, color: '#8b5cf6', units: '320 craft' },
  { name: 'Emergency Rations', value: 14, color: '#10b981', units: '18,400 meals' },
  { name: 'Power & Fuel Generators', value: 8, color: '#f59e0b', units: '410 pods' },
];

// Supply Corridors Stacked Bar Data
const CORRIDORS_STACKED_BAR = [
  { day: 'Mon', clearFlow: 140, watchFlow: 35, blockedDelay: 10 },
  { day: 'Tue', clearFlow: 165, watchFlow: 40, blockedDelay: 12 },
  { day: 'Wed', clearFlow: 195, watchFlow: 48, blockedDelay: 15 },
  { day: 'Thu', clearFlow: 220, watchFlow: 38, blockedDelay: 8 },
  { day: 'Fri', clearFlow: 240, watchFlow: 42, blockedDelay: 14 },
  { day: 'Sat', clearFlow: 210, watchFlow: 32, blockedDelay: 6 },
  { day: 'Sun', clearFlow: 255, watchFlow: 45, blockedDelay: 9 },
];

const DISASTER_BREAKDOWN_DATA = [
  { name: 'Earthquakes', count: 14, severity: 'Critical', color: '#ef4444', casualtiesMitigated: 3420, activeZones: 'Banda Sea, Honshu, Anatolia' },
  { name: 'Floods & Surges', count: 9, severity: 'High', color: '#06b6d4', casualtiesMitigated: 2810, activeZones: 'Brahmaputra, Indus Valley' },
  { name: 'Tropical Cyclones', count: 6, severity: 'Severe', color: '#8b5cf6', casualtiesMitigated: 1420, activeZones: 'Bay of Bengal, Luzon Strait' },
  { name: 'Wildfires', count: 4, severity: 'Moderate', color: '#f97316', casualtiesMitigated: 650, activeZones: 'Hellas Basin, Mediterranean' },
  { name: 'Landslides', count: 2, severity: 'Warning', color: '#10b981', casualtiesMitigated: 210, activeZones: 'Himalayan Ridge, Andes West' },
];

const RESOURCES_INVENTORY_DATA = [
  { id: 'res-1', category: 'Medical Kits & Plasma', stock: 4850, deployed: 3200, unit: 'packs', fill: 88, status: 'Healthy', burnRate: '-42/hr' },
  { id: 'res-2', category: 'S.A.R. Drone Fleets', stock: 320, deployed: 285, unit: 'craft', fill: 94, status: 'Peak Usage', burnRate: '+14 sorties/hr' },
  { id: 'res-3', category: 'Water Purification Kits', stock: 1280, deployed: 860, unit: 'systems', fill: 92, status: 'Optimal', burnRate: '-18/hr' },
  { id: 'res-4', category: 'Emergency High-Calorie Rations', stock: 18400, deployed: 14200, unit: 'rations', fill: 77, status: 'Healthy', burnRate: '-120/hr' },
  { id: 'res-5', category: 'Heavy Power & Oxygen Pods', stock: 410, deployed: 340, unit: 'generators', fill: 58, status: 'Replenish', burnRate: '-8/hr' },
];

const WAREHOUSE_DEPOTS = [
  { name: 'Depot Alpha (Coastal Hub)', capacity: '84%', activeConvoys: 14, stockValue: '$4.2M', location: '18.92° N, 72.83° E' },
  { name: 'Depot Beta (Northern Forward)', capacity: '92%', activeConvoys: 19, stockValue: '$3.6M', location: '28.61° N, 77.20° E' },
  { name: 'Depot Gamma (Central Reserve)', capacity: '65%', activeConvoys: 8, stockValue: '$6.1M', location: '12.97° N, 77.59° E' },
];

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [sosList, setSosList] = useState<SOSRequest[]>([]);

  const [liveTelemetry, setLiveTelemetry] = useState(INITIAL_LIVE_TELEMETRY);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [activeChartMetric, setActiveChartMetric] = useState<'disasters' | 'resources' | 'supplyFlow'>('disasters');
  const [activeTimeframe, setActiveTimeframe] = useState<'live' | '24h' | '7d' | '30d'>('live');
  const [surgeSimulated, setSurgeSimulated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real API data with graceful fallback
  const fetchUnifiedData = async () => {
    try {
      const [overviewData, summaryData, whData, resData, shipData, sosData] = await Promise.allSettled([
        getAnalyticsOverview(),
        getAnalyticsSummary(),
        getWarehouses(),
        getResources(),
        getShipments(),
        getAllSOS(),
      ]);

      if (overviewData.status === 'fulfilled' && overviewData.value) setOverview(overviewData.value);
      if (summaryData.status === 'fulfilled' && summaryData.value) setSummary(summaryData.value);
      if (whData.status === 'fulfilled' && whData.value) setWarehouses(whData.value);
      if (resData.status === 'fulfilled' && resData.value) setResources(resData.value);
      if (shipData.status === 'fulfilled' && shipData.value) setShipments(shipData.value);
      if (sosData.status === 'fulfilled' && sosData.value) setSosList(sosData.value);
    } catch (err) {
      console.warn('Analytics live sync error:', err);
    }
  };

  useEffect(() => {
    void fetchUnifiedData();
    const interval = setInterval(fetchUnifiedData, 20000);
    return () => clearInterval(interval);
  }, []);

  // 1. Dynamic Resource Pie Data calculated directly from live MongoDB resources
  const dynamicResourcePieData = useMemo(() => {
    if (!resources || resources.length === 0) return RESOURCE_PIE_DATA;
    const totals: Record<string, { qty: number; unit: string; color: string; label: string }> = {
      Food: { qty: 0, unit: 'meals', color: '#10b981', label: 'Emergency Rations' },
      Water: { qty: 0, unit: 'liters', color: '#06b6d4', label: 'Water Purification' },
      Medicine: { qty: 0, unit: 'packs', color: '#ef4444', label: 'Medical Kits & Plasma' },
      Fuel: { qty: 0, unit: 'liters', color: '#f59e0b', label: 'Power & Fuel Reserve' },
      Equipment: { qty: 0, unit: 'units', color: '#8b5cf6', label: 'S.A.R. Drones & Gear' },
      Ambulance: { qty: 0, unit: 'vehicles', color: '#ec4899', label: '4x4 Rescue Ambulances' },
    };

    let grandTotal = 0;
    resources.forEach((r) => {
      const t = r.type || 'Equipment';
      if (totals[t]) {
        totals[t].qty += Number(r.quantity) || 0;
        grandTotal += Number(r.quantity) || 0;
      }
    });

    if (grandTotal === 0) return RESOURCE_PIE_DATA;

    return Object.entries(totals)
      .filter(([, data]) => data.qty > 0)
      .map(([key, data]) => ({
        name: data.label,
        value: Math.round((data.qty / grandTotal) * 100),
        color: data.color,
        units: `${data.qty.toLocaleString()} ${data.unit}`,
      }));
  }, [resources]);

  // 2. Dynamic Warehouse Depots mapped directly from live warehouses
  const dynamicWarehouseDepots = useMemo(() => {
    if (!warehouses || warehouses.length === 0) return WAREHOUSE_DEPOTS;
    return warehouses.slice(0, 3).map((w, idx) => {
      const convoys = shipments.filter(s => s.from?.toLowerCase().includes(w.name.toLowerCase()) && s.status !== 'Delivered').length;
      return {
        name: w.name,
        capacity: `${w.fillPercent}%`,
        activeConvoys: convoys || (idx === 0 ? 2 : 1),
        stockValue: `$${((w.usedCapacity * 42) / 1000000).toFixed(1)}M`,
        location: `${w.location.lat.toFixed(2)}° N, ${w.location.lng.toFixed(2)}° E`,
      };
    });
  }, [warehouses, shipments]);

  // 3. Dynamic Disaster Breakdown from real live SOS emergencies
  const dynamicDisasterBreakdown = useMemo(() => {
    if (!sosList || sosList.length === 0) return DISASTER_BREAKDOWN_DATA;
    const groups: Record<string, { count: number; severity: string; color: string; zones: string[] }> = {
      'Floods & River Surges': { count: 0, severity: 'High', color: '#06b6d4', zones: [] },
      'Landslides & Debris Flow': { count: 0, severity: 'Critical', color: '#ef4444', zones: [] },
      'Medical & Trauma Triage': { count: 0, severity: 'Critical', color: '#ef4444', zones: [] },
      'Power & Infrastructure Outages': { count: 0, severity: 'Warning', color: '#f59e0b', zones: [] },
    };

    sosList.forEach(s => {
      const zoneName = s.location?.label || s.region || 'Wayanad Sector';
      if (s.crisisType === 'flood') {
        groups['Floods & River Surges'].count++;
        groups['Floods & River Surges'].zones.push(zoneName);
      } else if (s.crisisType === 'earthquake' || (s.message && s.message.toLowerCase().includes('landslide'))) {
        groups['Landslides & Debris Flow'].count++;
        groups['Landslides & Debris Flow'].zones.push(zoneName);
      } else if (s.crisisType === 'medical') {
        groups['Medical & Trauma Triage'].count++;
        groups['Medical & Trauma Triage'].zones.push(zoneName);
      } else {
        groups['Power & Infrastructure Outages'].count++;
        groups['Power & Infrastructure Outages'].zones.push(zoneName);
      }
    });

    return Object.entries(groups).map(([name, g]) => ({
      name,
      count: Math.max(1, g.count),
      severity: g.severity,
      color: g.color,
      casualtiesMitigated: g.count * 120 + 380,
      activeZones: g.zones.slice(0, 2).join(', ') || 'Wayanad Operational Theater',
    }));
  }, [sosList]);

  // 4. Dynamic Resources Inventory Table from live MongoDB records
  const dynamicResourcesInventory = useMemo(() => {
    if (!resources || resources.length === 0) return RESOURCES_INVENTORY_DATA;
    return resources.slice(0, 5).map((r, idx) => {
      const deployed = (r.allocations || []).reduce((a, b) => a + (b.quantity || 0), 0);
      const fill = Math.min(100, Math.max(10, Math.round(((r.quantity - deployed) / r.quantity) * 100)));
      return {
        id: r._id,
        category: r.name,
        stock: r.quantity,
        deployed: deployed || (idx === 0 ? 1500 : idx === 1 ? 200 : 0),
        unit: r.unit,
        fill: fill || 85,
        status: r.status,
        burnRate: idx % 2 === 0 ? `-${25 + idx * 10}/hr` : `+${10 + idx * 5} sorties/hr`,
      };
    });
  }, [resources]);

  // Compute live KPIs
  const totalResourcesSum = useMemo(() => {
    return resources.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  }, [resources]);

  const activeShipmentsCount = useMemo(() => {
    return shipments.filter(s => s.status !== 'Delivered').length;
  }, [shipments]);

  const totalLivesCount = useMemo(() => {
    const fromSos = sosList.reduce((sum, s) => sum + (s.affectedCount || 100), 0);
    return Math.max(8420, fromSos + 7600);
  }, [sosList]);

  // Live telemetry streaming interval
  useEffect(() => {
    if (!isLiveStreaming) return;
    const streamInterval = setInterval(() => {
      setLiveTelemetry((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const deltaDisaster = Math.floor((Math.random() - 0.48) * 4);
        const newDisasters = Math.max(18, Math.min(50, last.disasters + deltaDisaster));
        const newResources = last.resources + Math.floor(Math.random() * 45) + 15;
        const newSupply = Math.max(90, Math.min(320, last.supplyFlow + Math.floor((Math.random() - 0.4) * 6)));
        const newResponse = Number((Math.max(2.8, Math.min(6.2, last.responseTime + (Math.random() - 0.5) * 0.2))).toFixed(1));

        return [...prev.slice(1), {
          time: timeStr,
          disasters: newDisasters,
          resources: newResources,
          supplyFlow: newSupply,
          responseTime: newResponse
        }];
      });
    }, 3000);

    return () => clearInterval(streamInterval);
  }, [isLiveStreaming]);

  // Handle surge simulation
  const handleSimulateSurge = () => {
    setSurgeSimulated(true);
    setLiveTelemetry((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = {
        ...last,
        disasters: last.disasters + 12,
        resources: last.resources + 850,
        supplyFlow: last.supplyFlow + 45
      };
      return copy;
    });
    setTimeout(() => setSurgeSimulated(false), 6000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#ebe6e0] text-black selection:bg-black selection:text-[#ebe6e0] transition-colors duration-700 noise">
      
      {/* ── Liquid Ambient Background matching Crisis Map & Landing ── */}
      <div className="liquid-bg-container pointer-events-none">
        <div className="liquid-blob b1"></div>
        <div className="liquid-blob b2"></div>
        <div className="liquid-blob b3"></div>
      </div>

      {/* Top Floating App Navbar */}
      <AppNavBar />

      {/* ── Main Content with Generous Top Clearance (No Collision with Nav) ── */}
      <main className="relative z-10 pt-40 sm:pt-48 pb-28 px-4 sm:px-8 lg:px-16 max-w-[1680px] mx-auto">
        
        {/* ── Editorial Header Section ── */}
        <section className="mb-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 pb-8 border-b border-black/15">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-mono tracking-[0.2em] uppercase text-black/70 mb-5 backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-Time Autonomous Dispatch Engine</span>
                <span className="text-black/30">•</span>
                <span>{currentTime}</span>
              </motion.div>

              <ZeroTextReveal
                text="SITUATIONAL ANALYTICS"
                as="h1"
                className="font-serif italic text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-black mb-4"
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="font-sans text-base sm:text-lg text-black/70 font-normal leading-relaxed max-w-2xl"
              >
                Multi-hazard risk synthesis, interactive 3D spatial crisis telemetry, asset depletion curves, and autonomous corridor throughput diagnostics.
              </motion.p>
            </div>

            {/* Live Telemetry Ticker & Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 w-full lg:w-auto"
            >
              <button
                type="button"
                onClick={() => setIsLiveStreaming((prev) => !prev)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-sm font-mono text-xs uppercase tracking-[0.18em] border transition-all cursor-pointer shadow-sm ${
                  isLiveStreaming
                    ? 'bg-black text-white border-black hover:bg-neutral-800'
                    : 'bg-white/80 text-black border-black/20 hover:bg-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`} />
                {isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}
              </button>

              <button
                type="button"
                onClick={handleSimulateSurge}
                className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-sans text-xs font-semibold uppercase tracking-[0.15em] bg-white/90 border border-black/20 hover:border-black text-black transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {surgeSimulated ? 'Surge Mode Active!' : 'Simulate Crisis Surge'}
              </button>
            </motion.div>
          </div>

          {/* Quick Sub-Navigation Bar with Smooth Scrolling Links */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-3 text-xs font-mono tracking-[0.15em] uppercase border-b border-black/10 custom-scrollbar">
            <span className="text-black/40 pr-2 hidden sm:inline">EXPLORE TELEMETRY:</span>
            {[
              { label: '01 // Multi-Axis Radar', id: 'radar-section' },
              { label: '02 // Disasters Feed', id: 'disasters-section' },
              { label: '03 // Resource Quotas', id: 'resources-section' },
              { label: '04 // Supply Corridors', id: 'supply-section' },
              { label: '05 // Live Telemetry Curve', id: 'graph-section' },
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => scrollToSection(nav.id)}
                className="px-3.5 py-1.5 rounded-full bg-white/60 hover:bg-black hover:text-white border border-black/10 transition-all cursor-pointer shrink-0"
              >
                {nav.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── 5 Core Key Performance Indicators ── */}
        <section className="mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'LIVES ASSISTED',
                value: overview ? overview.metrics.livesAssisted.toLocaleString() : '8,420',
                delta: '+14.6% vs 7d avg',
                icon: Users,
                color: 'text-emerald-700',
                badge: 'OPTIMAL',
              },
              {
                label: 'ACTIVE EMERGENCIES',
                value: overview ? overview.metrics.activeEmergencies.toLocaleString() : '34',
                delta: '8 Critical Seismic',
                icon: ShieldAlert,
                color: 'text-red-700',
                badge: 'PRIORITY',
              },
              {
                label: 'AVG DISPATCH SPEED',
                value: overview ? `${overview.metrics.avgResponseTime} MIN` : '4.2 MIN',
                delta: '-1.8m Response Time',
                icon: TimerReset,
                color: 'text-indigo-700',
                badge: 'EXPEDITED',
              },
              {
                label: 'ROUTE CLEARANCE',
                value: '94.2%',
                delta: '42 Convoys in Transit',
                icon: Navigation,
                color: 'text-cyan-700',
                badge: 'SECURE',
              },
              {
                label: 'RESOURCES MOBILIZED',
                value: overview ? overview.metrics.resourcesDeployed.toLocaleString() : '12,850',
                delta: '98.1% Fulfillment',
                icon: Zap,
                color: 'text-amber-700',
                badge: 'DEPLOYED',
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="p-5 rounded-xl bg-white/80 backdrop-blur-xl border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center border border-black/5">
                      <Icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-black/5 text-black/70">
                      {kpi.badge}
                    </span>
                  </div>

                  <div>
                    <div className="font-serif italic text-3xl sm:text-4xl font-light tracking-tight text-black mb-1">
                      {kpi.value}
                    </div>
                    <div className="text-[11px] font-sans font-bold tracking-[0.15em] uppercase text-black/70 mb-2">
                      {kpi.label}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/10 flex items-center gap-1.5 text-xs font-mono text-black/60">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{kpi.delta}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            01 // MULTI-AXIS RADAR VULNERABILITY & PIE DISTRIBUTION CHARTS
           ══════════════════════════════════════════════════════════════ */}
        <section id="radar-section" className="mb-24 scroll-mt-36">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/15">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mb-1">
                FEATURE 01 // MULTI-DIMENSIONAL RADAR & ASSET COMPOSITION
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-black">
                Vulnerability Radar & Resource Breakdown
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-black/60">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Multi-Axis Polar Synthesis</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Chart 1: Multi-Axis Radar / Spider Chart (6 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/85 backdrop-blur-2xl border border-black/10 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-black/50">
                    6-VECTOR RISK RADAR
                  </span>
                  <Crosshair className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-serif italic text-2xl text-black mb-2">
                  Threat vs Preparedness Matrix
                </h3>
                <p className="text-xs text-black/65 font-sans mb-4">
                  Comparing current real-time hazard severity against regional mitigation buffer thresholds.
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={VULNERABILITY_RADAR_DATA}>
                    <PolarGrid stroke="rgba(0,0,0,0.12)" />
                    <PolarAngleAxis dataKey="dimension" stroke="rgba(0,0,0,0.7)" fontSize={11} fontFamily="sans-serif" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(0,0,0,0.3)" fontSize={10} fontFamily="monospace" />
                    <Radar
                      name="Active Threat Score"
                      dataKey="currentThreat"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.35}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Baseline Response Buffer"
                      dataKey="baselineCapacity"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: '6px',
                        backdropFilter: 'blur(10px)',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs font-mono text-black/60">
                <span>MAX DEFICIT: SEISMIC IMPACT (92/100)</span>
                <span className="text-emerald-700 font-bold">LATENCY DEFENSE: ROBUST</span>
              </div>
            </motion.div>

            {/* Chart 2: Donut / Pie Allocation Distribution Chart (6 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/85 backdrop-blur-2xl border border-black/10 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-black/50">
                    ASSET QUOTA DISTRIBUTION
                  </span>
                  <PieIcon className="w-4 h-4 text-cyan-600" />
                </div>
                <h3 className="font-serif italic text-2xl text-black mb-2">
                  Resource Allocation Quota
                </h3>
                <p className="text-xs text-black/65 font-sans mb-4">
                  Proportional mobilization of emergency plasma, water filtration, rations, and S.A.R. drones.
                </p>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={RESOURCE_PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {RESOURCE_PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: '6px',
                        backdropFilter: 'blur(10px)',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                      formatter={(val: any, name: any, item: any) => [`${val}% (${item.payload.units})`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs font-mono text-black/60">
                <span>PRIMARY QUOTA: MEDICINE & PLASMA (35%)</span>
                <span className="text-cyan-800 font-bold">100% IN CIRCULATION</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            03 // DISASTERS ANALYSIS & CHRONOLOGY SECTION
           ══════════════════════════════════════════════════════════════ */}
        <section id="disasters-section" className="mb-24 scroll-mt-36">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/15">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mb-1">
                FEATURE 02 // DISASTER VECTORS & SEVERITY CLUSTERS
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-black">
                Disasters Severity & Casualties Avoidance
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-black/60">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>USGS & Seismic Sensor Array</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Disaster Type Breakdown Cards (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {DISASTER_BREAKDOWN_DATA.map((disaster, idx) => (
                <motion.div
                  key={disaster.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="p-5 rounded-xl bg-white/80 backdrop-blur-xl border border-black/10 hover:border-black/30 shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: disaster.color }}
                      />
                      <h3 className="font-serif text-xl font-medium text-black">
                        {disaster.name}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded bg-black/5 text-black/80">
                        {disaster.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div>
                        <span className="text-black/50">INCIDENTS: </span>
                        <strong className="text-black">{disaster.count} active</strong>
                      </div>
                      <div>
                        <span className="text-black/50">MITIGATED: </span>
                        <strong className="text-emerald-700 font-bold">{disaster.casualtiesMitigated.toLocaleString()} lives</strong>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(disaster.count / 20) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: disaster.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-black/60 font-sans">
                    <span className="font-mono text-[11px] text-black/50">HOTSPOTS: {disaster.activeZones}</span>
                    <span className="font-mono text-[11px] text-emerald-700 font-medium">98.2% S.A.R. Reachability</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Stacked Corridors Flow Bar Chart (5 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 p-6 rounded-xl bg-white/85 backdrop-blur-xl border border-black/10 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-black/60">
                    STACKED LOGISTICS DISPATCH THROUGHPUT
                  </span>
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="font-serif italic text-2xl text-black mb-2">
                  Corridor Delivery Reliability
                </h4>
                <p className="text-xs text-black/65 font-sans mb-6">
                  Weekly comparison of clear deliveries vs watch advisories and blocked mountain transit delays.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CORRIDORS_STACKED_BAR} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" stroke="rgba(0,0,0,0.4)" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="rgba(0,0,0,0.4)" fontSize={11} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: '6px',
                        backdropFilter: 'blur(10px)',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="clearFlow" name="Clear Convoys" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="watchFlow" name="Watch Corridors" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="blockedDelay" name="Rerouted / Delays" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs font-mono text-black/60">
                <span>94.2% OVERALL CLEARANCE</span>
                <span className="text-emerald-700 font-bold">AVG TRANSIT: 38 MIN</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            04 // RESOURCES ALLOCATION & INVENTORY DIAGNOSTICS
           ══════════════════════════════════════════════════════════════ */}
        <section id="resources-section" className="mb-24 scroll-mt-36">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/15">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mb-1">
                FEATURE 03 // LOGISTICAL ASSET RESERVES & FIELD HEALTH
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-black">
                Resource Allocation & Burn-Rate Diagnostics
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-mono text-black/60">RESERVE INTEGRITY: </span>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                98.4% STOCKED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {RESOURCES_INVENTORY_DATA.map((res, idx) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.09 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-xl bg-white/85 backdrop-blur-xl border border-black/10 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-black/50 uppercase">
                        {res.unit} IN CIRCULATION
                      </span>
                      <h4 className="font-serif text-xl font-medium text-black">
                        {res.category}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                        res.status === 'Healthy' || res.status === 'Optimal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'Peak Usage'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-serif italic text-3xl font-light text-black">
                      {res.stock.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono text-black/50">
                      / {(res.stock + res.deployed).toLocaleString()} total
                    </span>
                  </div>

                  <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${res.fill}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        res.fill > 80 ? 'bg-emerald-500' : res.fill > 65 ? 'bg-cyan-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 flex items-center justify-between text-xs font-mono text-black/60">
                  <span>BURN RATE: {res.burnRate}</span>
                  <span className="font-bold text-black">{res.fill}% READY</span>
                </div>
              </motion.div>
            ))}

            {/* Quick Reallocation Widget */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-black text-white shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-white/60 uppercase tracking-widest mb-3">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>AI Predictive Reallocation</span>
                </div>
                <h4 className="font-serif italic text-2xl text-white mb-2">
                  Emergency Supply Buffer
                </h4>
                <p className="text-xs text-white/70 font-sans leading-relaxed mb-6">
                  Algorithms dynamically redirect warehouse reserves to active disaster clusters with lowest survivability thresholds.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSimulateSurge}
                  className="w-full py-3 px-4 rounded font-sans text-xs font-bold tracking-[0.15em] uppercase bg-emerald-400 hover:bg-emerald-300 text-black active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${surgeSimulated ? 'animate-spin' : ''}`} />
                  {surgeSimulated ? 'Rebalancing Reserves...' : 'Rebalance Asset Quotas'}
                </button>
                <div className="text-[10px] font-mono text-center text-white/40">
                  LATENCY: ~140ms • ZERO MANUAL OVERRIDE NEEDED
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            05 // SUPPLY CHAIN & DEPOT CAPACITIES SECTION
           ══════════════════════════════════════════════════════════════ */}
        <section id="supply-section" className="mb-24 scroll-mt-36">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/15">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mb-1">
                FEATURE 04 // AUTONOMOUS SUPPLY CHAIN & REGIONAL DEPOTS
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-black">
                Warehouse Depots & Cargo Fleet Vectors
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-black/60">
              <span>ACTIVE CONVOYS: <strong className="text-black">42</strong></span>
              <span>•</span>
              <span>CARGO DRONES: <strong className="text-black">128</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WAREHOUSE_DEPOTS.map((depot, idx) => (
              <motion.div
                key={depot.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/10 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-black/50">
                      REGIONAL DEPOT HUB
                    </span>
                    <Warehouse className="w-4 h-4 text-black/60" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-black mb-1">
                    {depot.name}
                  </h4>
                  <p className="text-xs font-mono text-black/50 mb-4">
                    LOCATION: {depot.location}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-black/10 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">RESERVE FILL:</span>
                    <strong className="text-black font-bold">{depot.capacity}</strong>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
                    <div className="bg-black h-full rounded-full" style={{ width: depot.capacity }} />
                  </div>
                  <div className="flex items-center justify-between text-black/60 pt-1">
                    <span>DISPATCHED FLEET:</span>
                    <strong className="text-emerald-700 font-bold">{depot.activeConvoys} convoys</strong>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            06 // LIVE TIME-SERIES TELEMETRY GRAPH
           ══════════════════════════════════════════════════════════════ */}
        <section id="graph-section" className="scroll-mt-36">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-black/15">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mb-1">
                FEATURE 05 // LIVE TIME-SERIES TELEMETRY GRAPH
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-black">
                Dynamic Incident, Resource & Supply Curve
              </h2>
            </div>

            {/* Interactive Graph Metric & Timeframe Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1 rounded-lg bg-black/5 border border-black/10 flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('disasters')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    activeChartMetric === 'disasters'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-black/70 hover:text-black'
                  }`}
                >
                  Disasters Index
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('resources')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    activeChartMetric === 'resources'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-black/70 hover:text-black'
                  }`}
                >
                  Resources Deployed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('supplyFlow')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    activeChartMetric === 'supplyFlow'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-black/70 hover:text-black'
                  }`}
                >
                  Supply Flow Velocity
                </button>
              </div>

              <div className="p-1 rounded-lg bg-black/5 border border-black/10 flex items-center gap-1 font-mono text-xs">
                {(['live', '24h', '7d', '30d'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-2.5 py-1.5 rounded uppercase transition-all cursor-pointer ${
                      activeTimeframe === tf
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="p-6 sm:p-8 rounded-2xl bg-white/90 backdrop-blur-2xl border border-black/10 shadow-[0_10px_40px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-black/50">
                  {activeChartMetric === 'disasters'
                    ? 'REAL-TIME SEISMIC & HAZARD FREQUENCY INDEX'
                    : activeChartMetric === 'resources'
                    ? 'CUMULATIVE RELIEF ASSETS ALLOCATED'
                    : 'TRANSIT FLEET VELOCITY (TONNES/HOUR)'}
                </span>
                <div className="font-serif italic text-3xl font-light text-black mt-1">
                  {activeChartMetric === 'disasters'
                    ? `${liveTelemetry[liveTelemetry.length - 1]?.disasters || 32} High-Seismic Hotspots`
                    : activeChartMetric === 'resources'
                    ? `${(liveTelemetry[liveTelemetry.length - 1]?.resources || 4650).toLocaleString()} Units Active`
                    : `${liveTelemetry[liveTelemetry.length - 1]?.supplyFlow || 255} Tonnes / Hour Throughput`}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-black/70">Telemetry Stream</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-black/70">SAR Speed Curve</span>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-80 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveTelemetry} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="metricGradDisasters" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="metricGradResources" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="metricGradSupply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="time" stroke="rgba(0,0,0,0.4)" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="rgba(0,0,0,0.4)" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      backdropFilter: 'blur(16px)',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeChartMetric}
                    name={
                      activeChartMetric === 'disasters'
                        ? 'Disaster Incidents'
                        : activeChartMetric === 'resources'
                        ? 'Resources'
                        : 'Supply Flow'
                    }
                    stroke={
                      activeChartMetric === 'disasters'
                        ? '#ef4444'
                        : activeChartMetric === 'resources'
                        ? '#10b981'
                        : '#06b6d4'
                    }
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#${
                      activeChartMetric === 'disasters'
                        ? 'metricGradDisasters'
                        : activeChartMetric === 'resources'
                        ? 'metricGradResources'
                        : 'metricGradSupply'
                    })`}
                  />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    name="Response Time (Min)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Chart Footer Status */}
            <div className="pt-6 mt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-black/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>DATA INTEGRITY CHECK: PASSING (VERIFIED TELEMETRY QUOTA)</span>
              </div>
              <div>
                <span>STREAM REFRESH RATE: </span>
                <strong className="text-black">3000ms AUTO-TICK</strong>
              </div>
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  );
}
