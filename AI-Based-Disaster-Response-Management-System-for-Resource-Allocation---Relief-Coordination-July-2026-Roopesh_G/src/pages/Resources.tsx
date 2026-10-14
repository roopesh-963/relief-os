import React, { useEffect, useState, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import {
  Package,
  ShieldAlert,
  ArrowRight,
  Truck,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Send,
  Layers,
  MapPin,
  Sparkles,
  Sliders,
  X,
  Clock,
  Box,
  HeartPulse,
  Droplets,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import {
  getResources,
  Resource,
  getWarehouses,
  WarehouseSummary,
  getShipments,
  Shipment,
  allocateResource,
  createShipment,
  ShipmentResourceType,
  ShipmentPriority,
} from '../services/api';

const MAP_CENTER: [number, number] = [11.5800, 76.1300]; // Wayanad / Calicut Disaster Operational Theater

// Custom Leaflet Icons styled with high-contrast editorial badges
const createDepotMarkerIcon = (warehouse: WarehouseSummary, selected: boolean) => {
  const isCritical = (warehouse.lowStockWarnings || []).length > 0;
  const html = renderToString(
    <div className={`relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white border-2 ${selected ? 'border-black ring-4 ring-black/20' : 'border-black/20'} text-black shadow-lg backdrop-blur-md transition-transform hover:scale-105`}>
      <Database className="w-5 h-5 text-blue-600" />
      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-warehouse-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const createZoneMarkerIcon = (name: string) => {
  const html = renderToString(
    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white border-2 border-white shadow-xl">
      <MapPin className="w-5 h-5" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping opacity-75" />
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-zone-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const DEMAND_ZONES_PRESETS = [
  { id: 'zone-a', name: 'Zone A (Meppadi Emergency Camp)', coords: [11.5564, 76.1320] as [number, number], need: 'Critical: Trauma Medicine & Water', urgency: 'High' },
  { id: 'zone-b', name: 'Zone B (Chooralmala Disaster Sector)', coords: [11.5320, 76.1750] as [number, number], need: 'Critical: Food Rations & Water', urgency: 'Critical' },
  { id: 'zone-c', name: 'Zone C (Mundakkai Cut-off Outpost)', coords: [11.5180, 76.2100] as [number, number], need: 'Urgent: Fuel & Medical Packs', urgency: 'High' },
  { id: 'zone-d', name: 'Vythiri Hill Outpost', coords: [11.6050, 76.0250] as [number, number], need: 'Generators & Blankets', urgency: 'Medium' },
  { id: 'zone-e', name: 'Sulthan Bathery Evacuation Staging Hub', coords: [11.6854, 76.1320] as [number, number], need: 'S.A.R. Tech & Drones', urgency: 'Low' },
];

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDepotFilter, setSelectedDepotFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Allocation Form State
  const [sourceWarehouse, setSourceWarehouse] = useState<string>('');
  const [targetZone, setTargetZone] = useState<string>('Zone A (Meppadi Emergency Camp)');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [allocationQty, setAllocationQty] = useState<number>(100);
  const [priority, setPriority] = useState<ShipmentPriority>('Critical');
  const [convoyVehicle, setConvoyVehicle] = useState<string>('Heavy Tactical Transport');
  const [convoyDriver, setConvoyDriver] = useState<string>('Lead Commander Roy');
  const [notes, setNotes] = useState<string>('Priority crisis allocation requested via Command Center.');

  const [allocating, setAllocating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Unified Data
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const [resData, whData, shipData] = await Promise.all([
        getResources(),
        getWarehouses(),
        getShipments(),
      ]);
      setResources(resData);
      setWarehouses(whData);
      setShipments(shipData);

      if (!sourceWarehouse && whData.length > 0) {
        setSourceWarehouse(whData[0].name);
      }
      if (!selectedResourceId && resData.length > 0) {
        setSelectedResourceId(resData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load resource allocation data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
    const interval = setInterval(fetchAllData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Inventory
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        (item.type || '').toUpperCase() === selectedCategory.toUpperCase();
      const matchesDepot =
        selectedDepotFilter === 'ALL' ||
        (item.location || '').toLowerCase().includes(selectedDepotFilter.toLowerCase());
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesDepot && matchesSearch;
    });
  }, [resources, selectedCategory, selectedDepotFilter, searchQuery]);

  // Selected Resource Item for Form
  const currentResource = useMemo(() => {
    return resources.find((r) => r._id === selectedResourceId);
  }, [resources, selectedResourceId]);

  // Handle Allocation Submit
  const handleExecuteAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentResource || allocationQty <= 0) {
      setErrorMessage('Please select a valid resource item and quantity.');
      return;
    }
    if (allocationQty > currentResource.quantity) {
      setErrorMessage(`Cannot allocate ${allocationQty} units. Depot only has ${currentResource.quantity} available.`);
      return;
    }

    setAllocating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Allocate resource in backend inventory
      await allocateResource({
        resourceId: currentResource._id,
        target: targetZone,
        quantity: allocationQty,
        notes,
      });

      // 2. Spawn corresponding shipment mission
      await createShipment({
        resourceType: currentResource.type as ShipmentResourceType,
        quantity: allocationQty,
        unit: currentResource.unit,
        from: currentResource.location || sourceWarehouse,
        to: targetZone,
        vehicle: convoyVehicle,
        driver: convoyDriver,
        etaMinutes: Math.floor(Math.random() * 30) + 25,
        priority,
        destinationType: 'Camp',
        notes,
      });

      setSuccessMessage(
        `Successfully allocated ${allocationQty} ${currentResource.unit} of ${currentResource.name} to ${targetZone}. Convoy dispatched!`
      );
      setTimeout(() => setSuccessMessage(null), 6000);

      // Refresh data
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Allocation failed. Please try again.');
    } finally {
      setAllocating(false);
    }
  };

  // Quick prefill from inventory table row
  const handleQuickAllocate = (item: Resource) => {
    setSelectedResourceId(item._id);
    if (item.location) {
      setSourceWarehouse(item.location);
    }
    setAllocationQty(Math.min(item.quantity, Math.max(50, Math.floor(item.quantity * 0.25))));
    const el = document.getElementById('allocation-console');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Compute Total Metrics directly from live inventory
  const totalStockUnits = useMemo(() => {
    return resources.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  }, [resources]);

  const totalAllocatedUnits = useMemo(() => {
    return resources.reduce((sum, r) => {
      const allocSum = (r.allocations || []).reduce((a, b) => a + (b.quantity || 0), 0);
      return sum + allocSum;
    }, 0);
  }, [resources]);

  const activeConvoysCount = useMemo(() => {
    return shipments.filter((s) => s.status !== 'Delivered').length;
  }, [shipments]);

  const criticalItemsCount = useMemo(() => {
    return resources.filter((r) => r.status === 'Critical' || r.status === 'Low').length;
  }, [resources]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#ebe6e0] text-black selection:bg-black selection:text-[#ebe6e0] transition-colors duration-700 noise">
      {/* ── Liquid Ambient Background matching Crisis Map & Landing ── */}
      <div className="liquid-bg-container pointer-events-none">
        <div className="liquid-blob b1" />
        <div className="liquid-blob b2" />
        <div className="liquid-blob b3" />
      </div>

      <AppNavBar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-10">
        
        {/* ── Top Editorial Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-black/10 pb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-black text-xs uppercase tracking-widest font-mono mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Unified Supply Chain · Live Allocation Engine
            </div>
            <h1 className="text-4xl sm:text-6xl font-display font-light tracking-tight uppercase">
              Resource <span className="font-bold">Allocation</span>
            </h1>
            <p className="text-sm sm:text-base text-black/60 max-w-2xl mt-2 font-mono">
              Live multi-depot stock allocation, LP-optimized distribution, and mission convoy dispatching connected across all disaster theaters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchAllData()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/15 hover:border-black rounded-xl text-xs font-mono tracking-wider uppercase transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Live Data'}
            </button>
          </div>
        </div>

        {/* ── Key Metrics Ribbon (100% Dynamic from Live MongoDB) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-md border border-black/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-black/50 text-xs font-mono uppercase mb-2">
              <span>Total Active Stock</span>
              <Database className="w-4 h-4 text-black/60" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-black tracking-tight">
              {totalStockUnits.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Across {warehouses.length} Strategic Depots
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-black/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-black/50 text-xs font-mono uppercase mb-2">
              <span>Allocated to Camps</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-blue-700 tracking-tight">
              {totalAllocatedUnits.toLocaleString()}
            </div>
            <div className="text-[11px] text-black/60 font-mono mt-1">
              Confirmed Field Relief Deployments
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-black/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-black/50 text-xs font-mono uppercase mb-2">
              <span>Active Convoys</span>
              <Truck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-purple-700 tracking-tight">
              {activeConvoysCount}
            </div>
            <div className="text-[11px] text-purple-700 font-mono mt-1">
              Live Missions in Transit
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-black/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-black/50 text-xs font-mono uppercase mb-2">
              <span>Critical Shortages</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-display font-bold text-red-600 tracking-tight">
              {criticalItemsCount}
            </div>
            <div className="text-[11px] text-red-700 font-mono mt-1">
              Low/Critical Priority Batches
            </div>
          </div>
        </div>

        {/* ── Interactive Live Allocation & Dispatch Console ── */}
        <div id="allocation-console" className="bg-white border-2 border-black/15 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-black/10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-blue-700 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Dispatch Console
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight">
                Execute Resource Allocation & Dispatch
              </h2>
            </div>
            <div className="text-xs font-mono text-black/50 bg-black/5 px-3 py-1.5 rounded-lg">
              Authorized by Central Disaster Command
            </div>
          </div>

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 font-mono text-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-center gap-3 font-mono text-xs"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleExecuteAllocation} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Source & Target */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-black/70 mb-2 font-bold">
                  1. Source Depot / Storage Node
                </label>
                <select
                  value={sourceWarehouse}
                  onChange={(e) => {
                    setSourceWarehouse(e.target.value);
                    const matching = resources.find((r) => r.location === e.target.value);
                    if (matching) setSelectedResourceId(matching._id);
                  }}
                  className="w-full bg-[#f8f6f2] border border-black/20 rounded-xl px-4 py-3 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {warehouses.slice(0, 6).map((wh) => (
                    <option key={wh.id} value={wh.name}>
                      {wh.name} (Cap: {wh.capacity.toLocaleString()} u)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-black/70 mb-2 font-bold">
                  2. Destination Demand Zone / Camp
                </label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full bg-[#f8f6f2] border border-black/20 rounded-xl px-4 py-3 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {DEMAND_ZONES_PRESETS.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name} — [{z.urgency}]
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] font-mono text-black/50">
                  Target Need: {DEMAND_ZONES_PRESETS.find((z) => z.name === targetZone)?.need}
                </div>
              </div>
            </div>

            {/* Column 2: Resource & Quantity */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-black/70 mb-2 font-bold">
                  3. Select Resource Batch
                </label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full bg-[#f8f6f2] border border-black/20 rounded-xl px-4 py-3 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {resources.map((item) => (
                    <option key={item._id} value={item._id}>
                      [{item.type}] {item.name} — Avail: {item.quantity.toLocaleString()} {item.unit} ({item.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-black/70 font-bold">
                    4. Dispatch Quantity ({currentResource?.unit || 'units'})
                  </label>
                  <span className="text-xs font-mono font-bold text-black">
                    Available: {currentResource?.quantity.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={currentResource?.quantity || 50000}
                    value={allocationQty}
                    onChange={(e) => setAllocationQty(Number(e.target.value))}
                    className="w-full bg-[#f8f6f2] border border-black/20 rounded-xl px-4 py-3 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <div className="flex gap-1">
                    {[100, 500, 1000].map((step) => (
                      <button
                        type="button"
                        key={step}
                        onClick={() => setAllocationQty(step)}
                        className="px-2.5 py-2 bg-black/5 hover:bg-black/10 rounded-lg text-xs font-mono transition-colors"
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Logistics Logistics & Execution */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-black/70 mb-2 font-bold">
                  5. Priority Level & Transport Unit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ShipmentPriority)}
                    className="bg-[#f8f6f2] border border-black/20 rounded-xl px-3 py-2.5 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Critical">CRITICAL</option>
                    <option value="High">HIGH</option>
                    <option value="Medium">MEDIUM</option>
                    <option value="Low">LOW</option>
                  </select>

                  <select
                    value={convoyVehicle}
                    onChange={(e) => setConvoyVehicle(e.target.value)}
                    className="bg-[#f8f6f2] border border-black/20 rounded-xl px-3 py-2.5 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Heavy Tactical Transport">Tactical Truck</option>
                    <option value="All-Terrain 4x4 Carrier">4x4 Carrier</option>
                    <option value="Air-Drop Aero Copter">Aero Copter</option>
                    <option value="Rapid Water Tanker">Water Tanker</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={allocating}
                className="w-full py-4 px-6 bg-black hover:bg-black/85 text-white font-mono uppercase tracking-widest text-xs font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-98 disabled:opacity-50"
              >
                {allocating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    DISPATCHING CONVOY...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    CONFIRM & DISPATCH CONVOY
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Visual Tactical Map & Warehouse Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-2 bg-white border-2 border-black/15 rounded-3xl p-4 shadow-sm overflow-hidden flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 px-2 border-b border-black/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-mono uppercase font-bold tracking-wider">
                  Operational Theater Map (Wayanad Sector)
                </h3>
              </div>
              <span className="text-xs font-mono text-black/50">
                {warehouses.length} Depots · {shipments.length} Active Convoys
              </span>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden mt-3 relative">
              <MapContainer
                center={MAP_CENTER}
                zoom={10}
                zoomControl={false}
                className="w-full h-full bg-[#ebe6e0]"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <ZoomControl position="bottomright" />

                {/* Warehouse Markers */}
                {warehouses.slice(0, 5).map((w) => (
                  <Marker
                    key={w.id}
                    position={[w.location.lat, w.location.lng]}
                    icon={createDepotMarkerIcon(w, selectedWarehouse?.id === w.id)}
                    eventHandlers={{
                      click: () => setSelectedWarehouse(w),
                    }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -20]} opacity={0.95}>
                      <div className="font-mono text-xs p-1">
                        <div className="font-bold">{w.name}</div>
                        <div>Capacity Fill: {w.fillPercent}%</div>
                        <div>Food: {w.stockLevels?.Food?.toLocaleString() || 0}</div>
                        <div>Water: {w.stockLevels?.Water?.toLocaleString() || 0}</div>
                        <div>Meds: {w.stockLevels?.Medicine?.toLocaleString() || 0}</div>
                      </div>
                    </LeafletTooltip>
                  </Marker>
                ))}

                {/* Demand Zone Markers */}
                {DEMAND_ZONES_PRESETS.map((zone) => (
                  <Marker
                    key={zone.id}
                    position={zone.coords}
                    icon={createZoneMarkerIcon(zone.name)}
                  >
                    <LeafletTooltip direction="top" offset={[0, -15]} opacity={0.95}>
                      <div className="font-mono text-xs p-1">
                        <div className="font-bold text-red-600">{zone.name}</div>
                        <div>Need: {zone.need}</div>
                      </div>
                    </LeafletTooltip>
                  </Marker>
                ))}

                {/* Active Shipment Paths */}
                {shipments.map((s, idx) => {
                  if (!s.fromCoords || !s.toCoords) return null;
                  return (
                    <Polyline
                      key={s._id || idx}
                      positions={[
                        [s.fromCoords.lat, s.fromCoords.lng],
                        s.currentCoords ? [s.currentCoords.lat, s.currentCoords.lng] : [s.toCoords.lat, s.toCoords.lng],
                        [s.toCoords.lat, s.toCoords.lng],
                      ]}
                      pathOptions={{
                        color: s.status === 'Delayed' ? '#ef4444' : s.status === 'Delivered' ? '#10b981' : '#3b82f6',
                        weight: 3,
                        dashArray: s.status === 'In Transit' ? '6, 6' : undefined,
                      }}
                    />
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Active Missions & Depots Side Feed */}
          <div className="bg-white border-2 border-black/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-y-auto max-h-[480px]">
            <div>
              <h3 className="text-sm font-mono uppercase font-bold tracking-wider mb-4 border-b border-black/10 pb-3 flex items-center justify-between">
                <span>Active Convoys ({shipments.length})</span>
                <Truck className="w-4 h-4 text-black/50" />
              </h3>

              <div className="space-y-3">
                {shipments.slice(0, 5).map((s) => (
                  <div
                    key={s._id}
                    className="p-3.5 rounded-xl bg-[#f8f6f2] border border-black/10 hover:border-black/30 transition-all font-mono text-xs"
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-blue-700">{s.shipmentId}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          s.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'Delayed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-black/80 font-medium">
                      {s.resourceType}: {s.quantity.toLocaleString()} {s.unit}
                    </div>
                    <div className="text-black/50 text-[11px] mt-1 truncate">
                      {s.from} → {s.to}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[11px] text-black/60">
                      <span>{s.vehicle}</span>
                      <span className="font-bold text-black">{s.etaLabel || `${s.etaMinutes}m ETA`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/10 text-center">
              <a
                href="/operations-dashboard"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-black hover:underline"
              >
                Open Full Operations Board <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Comprehensive Unified Inventory Matrix ── */}
        <div className="bg-white border-2 border-black/15 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-black/10 gap-4">
            <div>
              <div className="text-xs font-mono uppercase text-black/50 tracking-wider">
                Full Database Inventory
              </div>
              <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                Live Strategic Stock Matrix ({filteredResources.length} Items)
              </h3>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Pills */}
              <div className="flex bg-[#f8f6f2] p-1 rounded-xl border border-black/15 text-xs font-mono">
                {['ALL', 'FOOD', 'WATER', 'MEDICINE', 'FUEL', 'EQUIPMENT'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      selectedCategory === cat ? 'bg-black text-white font-bold shadow-sm' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Depot Filter */}
              <select
                value={selectedDepotFilter}
                onChange={(e) => setSelectedDepotFilter(e.target.value)}
                className="bg-[#f8f6f2] border border-black/15 rounded-xl px-3 py-2 text-xs font-mono text-black focus:outline-none"
              >
                <option value="ALL">All Depots</option>
                <option value="Depot A">Depot A</option>
                <option value="Depot B">Depot B</option>
                <option value="Depot C">Depot C</option>
                <option value="Central">Central Hub</option>
              </select>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="text"
                  placeholder="Search batch or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#f8f6f2] border border-black/15 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-black focus:outline-none w-48 focus:w-64 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-black/10 text-black/50 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Batch Item & Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Depot Node</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Allocated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredResources.map((item) => {
                  const allocTotal = (item.allocations || []).reduce((sum, a) => sum + (a.quantity || 0), 0);
                  const isCrit = item.status === 'Critical';
                  const isLow = item.status === 'Low';

                  return (
                    <tr key={item._id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-black">{item.name}</div>
                        <div className="text-[10px] text-black/40">ID: {item._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-black/5 font-semibold text-[11px]">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-black/80 font-medium">
                        {item.location}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-black">
                          {item.quantity.toLocaleString()}
                        </span>{' '}
                        <span className="text-black/50 text-[10px]">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCrit
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-black/70">
                        {allocTotal > 0 ? (
                          <span className="font-bold text-blue-700">{allocTotal.toLocaleString()} {item.unit}</span>
                        ) : (
                          <span className="text-black/30">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleQuickAllocate(item)}
                          className="px-3 py-1.5 bg-black/5 hover:bg-black hover:text-white rounded-lg transition-all text-[11px] font-bold uppercase inline-flex items-center gap-1.5"
                        >
                          <span>Allocate</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
