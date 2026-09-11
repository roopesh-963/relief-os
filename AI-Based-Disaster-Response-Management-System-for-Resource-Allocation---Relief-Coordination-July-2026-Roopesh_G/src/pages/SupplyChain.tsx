import React, { useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Plane, Package, Clock, ShieldAlert, X, Zap, Warehouse, Box, Send, ChevronRight, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { getShipments, Shipment, getSupplyAnalytics, SupplyAnalytics, getWarehouses, WarehouseSummary, createShipment, ShipmentResourceType } from '../services/api';

const MAP_CENTER: [number, number] = [20.5937, 78.9629]; // India center

// Distance calculation
const haversineDistance = (coords1: [number, number], coords2: [number, number]) => {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

// Generate curved path for flights
const createCurve = (p1: [number, number], p2: [number, number]): [number, number][] => {
  const points: [number, number][] = [];
  const numPoints = 50;
  // Simple bezier curve pulling upwards (increasing lat)
  const cx = (p1[0] + p2[0]) / 2 + 5; // Curve offset
  const cy = (p1[1] + p2[1]) / 2;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1-t)*(1-t)*p1[0] + 2*(1-t)*t*cx + t*t*p2[0];
    const lng = (1-t)*(1-t)*p1[1] + 2*(1-t)*t*cy + t*t*p2[1];
    points.push([lat, lng]);
  }
  return points;
};

const createVehicleIcon = (shipment: Shipment, selected: boolean) => {
  const isDelayed = shipment.status === 'Delayed';
  const colorClass = isDelayed ? 'text-red-500 bg-red-500/10 border-red-500' : 'text-cyan-400 bg-cyan-400/10 border-cyan-400';
  const shadow = isDelayed ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(34,211,238,0.5)]';
  const selectedRing = selected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : '';
  
  // Calculate dist directly from start to end (approximate if path is complex)
  const dist = (shipment.routePath && shipment.routePath.length > 1) 
    ? haversineDistance(shipment.routePath[0], shipment.routePath[shipment.routePath.length - 1]) 
    : 0;
  const isFlight = dist > 500;

  const html = renderToString(
    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${colorClass} backdrop-blur-md ${shadow} ${selectedRing} transition-all duration-300`}>
      {isFlight ? <Plane className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
      {isDelayed && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
      )}
    </div>
  );

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createWarehouseIcon = (warehouse: WarehouseSummary, selected: boolean) => {
  const isCritical = (warehouse.lowStockWarnings || []).length > 0;
  const colorClass = isCritical ? 'text-red-500 border-red-500/50 bg-red-500/10' : 'text-[#34e899] border-[#34e899]/50 bg-[#34e899]/10';
  const shadow = isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(52,232,153,0.3)]';
  const selectedRing = selected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : '';

  const html = renderToString(
    <div className={`relative flex items-center justify-center w-12 h-12 rounded-lg border-2 ${colorClass} backdrop-blur-md ${shadow} ${selectedRing} transition-all duration-300`}>
      <Warehouse className="w-6 h-6" />
      {isCritical && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
      )}
    </div>
  );

  return L.divIcon({
    html,
    className: 'custom-warehouse-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

export default function SupplyChain() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [analytics, setAnalytics] = useState<SupplyAnalytics | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationTick, setAnimationTick] = useState(0);

  // Transfer Form State
  const [transferType, setTransferType] = useState<ShipmentResourceType>('Food');
  const [transferQty, setTransferQty] = useState(100);
  const [targetId, setTargetId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [shipmentData, analyticsData, warehouseData] = await Promise.all([
        getShipments(),
        getSupplyAnalytics(),
        getWarehouses()
      ]);
      setShipments(shipmentData.filter(s => s.status !== 'Delivered')); 
      setAnalytics(analyticsData);
      setWarehouses(warehouseData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(function tick() {
      setAnimationTick(prev => prev + 0.0002); // 5x slower
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const getInterpolatedPosition = (shipment: Shipment): [number, number] => {
    let points = shipment.routePath;
    if (!points || !Array.isArray(points) || points.length < 2 || !points[0] || !points[points.length - 1]) {
      return [shipment.currentCoords?.lat ?? MAP_CENTER[0], shipment.currentCoords?.lng ?? MAP_CENTER[1]];
    }
    
    const dist = haversineDistance(points[0], points[points.length - 1]);
    if (dist > 500) {
      points = createCurve(points[0], points[points.length - 1]);
    }
    
    const progress = (animationTick + (shipment.id ? shipment.id.charCodeAt(0) : 0)) % 1;
    const totalSegments = points.length - 1;
    const currentSegmentIndex = Math.floor(progress * totalSegments);
    const segmentProgress = (progress * totalSegments) - currentSegmentIndex;

    const p1 = points[currentSegmentIndex];
    const p2 = points[currentSegmentIndex + 1] || points[currentSegmentIndex];

    if (!p1 || !p2) {
      return [shipment.currentCoords?.lat ?? MAP_CENTER[0], shipment.currentCoords?.lng ?? MAP_CENTER[1]];
    }

    const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
    const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
    
    return [lat, lng];
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || !targetId || transferQty <= 0) return;
    setTransferring(true);
    try {
      const targetW = warehouses.find(w => w.id === targetId);
      await createShipment({
        resourceType: transferType,
        quantity: transferQty,
        from: selectedWarehouse.name,
        to: targetW?.name || targetId,
        vehicle: 'Automated Transport',
        driver: 'AI Guided',
        etaMinutes: Math.floor(Math.random() * 60) + 30,
        priority: 'High',
        destinationType: 'Warehouse'
      });
      setTransferSuccess(true);
      setTimeout(() => {
        setTransferSuccess(false);
        setSelectedWarehouse(null);
        void fetchData(); // Refresh shipments
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-mono selection:bg-cyan-400 selection:text-black">
      <AppNavBar />

      <div className="absolute inset-0 z-0 pt-[72px]">
        <MapContainer 
          center={MAP_CENTER} 
          zoom={5} 
          zoomControl={false}
          className="w-full h-full bg-[#0a0a0a]"
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
          <ZoomControl position="bottomright" />

          {/* Render Warehouses */}
          {warehouses.map((w) => (
            <Marker 
              key={w.id} 
              position={[w.location.lat, w.location.lng]}
              icon={createWarehouseIcon(w, selectedWarehouse?.id === w.id)}
              eventHandlers={{
                click: () => {
                  setSelectedWarehouse(w);
                  setSelectedShipment(null);
                  setTransferSuccess(false);
                }
              }}
            />
          ))}

          {/* Render Shipments */}
          {shipments.map((s) => {
            const currentPos = getInterpolatedPosition(s);
            const isDelayed = s.status === 'Delayed';
            
            let points = s.routePath;
            const dist = points && points.length > 1 ? haversineDistance(points[0], points[points.length - 1]) : 0;
            if (dist > 500 && points) {
              points = createCurve(points[0], points[points.length - 1]);
            }
            
            return (
              <React.Fragment key={s.id}>
                {points && points.length > 0 && (
                  <Polyline 
                    positions={points}
                    color={isDelayed ? '#ef4444' : '#22d3ee'}
                    weight={2}
                    opacity={0.5}
                    dashArray={dist > 500 ? "" : "5, 10"} // Solid curve for planes, dashed for trucks
                    className={isDelayed ? 'animate-pulse' : ''}
                  />
                )}
                
                <Marker 
                  position={currentPos}
                  icon={createVehicleIcon(s, selectedShipment?.id === s.id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedShipment(s);
                      setSelectedWarehouse(null);
                    }
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      <div className="absolute top-[90px] left-6 z-10 pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-display font-light uppercase text-white tracking-tighter drop-shadow-lg">
          Global <span className="text-cyan-400">Logistics</span>
        </h1>
        <div className="text-white/70 text-xs tracking-[0.2em] uppercase mt-2 drop-shadow-md">
          Live Transport Telemetry
        </div>
      </div>

      {/* Side Panel for Shipment Details */}
      <AnimatePresence>
        {selectedShipment && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-[90px] right-6 bottom-6 w-full md:w-[450px] bg-white text-black rounded-2xl shadow-2xl z-20 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-gray-500 text-[10px] tracking-widest uppercase mb-1">
                    Fleet Interface
                  </div>
                  <h2 className="text-3xl font-display font-light text-black uppercase tracking-tighter">
                    Convoy #{selectedShipment.shipmentId || selectedShipment.id.substring(0, 6)}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedShipment(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className={`flex items-center gap-4 mb-8 p-4 rounded-lg border ${selectedShipment.status === 'Delayed' ? 'border-red-500/30 bg-red-50' : 'border-cyan-400/30 bg-cyan-50'}`}>
                <div className={`p-3 rounded-full ${selectedShipment.status === 'Delayed' ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-600'}`}>
                  {selectedShipment.status === 'Delayed' ? <ShieldAlert className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </div>
                <div>
                  <div className={`text-sm tracking-widest uppercase mb-1 font-bold ${selectedShipment.status === 'Delayed' ? 'text-red-600' : 'text-cyan-600'}`}>
                    {selectedShipment.status}
                  </div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">
                    ETA: {selectedShipment.etaMinutes} mins
                  </div>
                </div>
              </div>

              {/* Payload Details */}
              <div className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Cargo Manifest
                </h3>
                <div className="text-4xl font-light text-black mb-2">
                  {selectedShipment.quantity.toLocaleString()} <span className="text-lg text-gray-400">{selectedShipment.unit || 'units'}</span>
                </div>
                <div className="text-sm tracking-widest uppercase text-cyan-600 font-bold">
                  {selectedShipment.resourceType}
                </div>
              </div>

              {/* Route Trajectory */}
              <div>
                <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-6 pb-2 border-b border-gray-200">
                  Route Trajectory
                </h3>
                <div className="relative pl-6 border-l-2 border-gray-200 ml-3 flex flex-col gap-8">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-400" />
                    <div className="text-[10px] tracking-widest uppercase text-gray-400 mb-1">Origin Node</div>
                    <div className="text-lg font-light text-black uppercase">{selectedShipment.from}</div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-md" />
                    <div className="text-[10px] tracking-widest uppercase text-gray-400 mb-1">Target Node</div>
                    <div className="text-lg font-light text-black uppercase">{selectedShipment.to}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Panel for Warehouse Details & Transfer Form */}
      <AnimatePresence>
        {selectedWarehouse && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-[90px] right-6 bottom-6 w-full md:w-[400px] bg-white text-black rounded-2xl shadow-2xl z-20 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-4">
                <div>
                  <div className="text-gray-500 text-[10px] tracking-widest uppercase mb-1 font-bold">
                    Node Interface
                  </div>
                  <h2 className="text-3xl font-display font-bold text-black uppercase tracking-tighter">
                    {selectedWarehouse.name}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedWarehouse(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Capacity Fill</div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#34e899]" 
                      style={{ width: `${selectedWarehouse.fillPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-2xl font-light text-black">
                  {selectedWarehouse.fillPercent}%
                </div>
              </div>

              {/* Stock Levels */}
              <div className="mb-8">
                <h3 className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4 border-b border-gray-200 pb-2">
                  Inventory Telemetry
                </h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(selectedWarehouse.stockLevels).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <Box className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                        <span className="text-sm text-gray-600 font-bold uppercase tracking-wider">{key}</span>
                      </div>
                      <div className="text-lg text-black font-light">
                        {val.toLocaleString()} <span className="text-xs text-gray-400">u</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transport / Resupply Form */}
              <div className={`p-5 rounded-xl border shadow-sm ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                {((selectedWarehouse.lowStockWarnings || []).length > 0) ? (
                  <>
                    <h3 className="flex items-center gap-2 text-xs text-red-600 font-bold tracking-widest uppercase mb-4">
                      <ShieldAlert className="w-4 h-4" /> Emergency Resupply Needed
                    </h3>
                    <div className="mb-6 flex flex-wrap gap-2">
                      {(selectedWarehouse.lowStockWarnings || []).map(w => (
                        <span key={w} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider">
                          {w}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <h3 className="flex items-center gap-2 text-xs text-[#2bc481] font-bold tracking-widest uppercase mb-6">
                    <Send className="w-4 h-4" /> Initialize Transfer
                  </h3>
                )}
                
                {transferSuccess ? (
                  <div className={`py-8 text-center flex flex-col items-center gap-3 ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'text-red-600' : 'text-[#2bc481]'}`}>
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white shadow-sm ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'border-red-600' : 'border-[#2bc481]'}`}>
                      <ChevronRight className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase">Dispatch Confirmed</span>
                  </div>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!selectedWarehouse || !targetId || transferQty <= 0) return;
                    setTransferring(true);
                    
                    const isResupply = ((selectedWarehouse.lowStockWarnings || []).length > 0);
                    const targetW = warehouses.find(w => w.id === targetId);
                    
                    const fromNode = isResupply ? (targetW?.name || targetId) : selectedWarehouse.name;
                    const toNode = isResupply ? selectedWarehouse.name : (targetW?.name || targetId);
                    
                    const fromCoords = isResupply ? targetW?.location : selectedWarehouse.location;
                    const toCoords = isResupply ? selectedWarehouse.location : targetW?.location;

                    createShipment({
                      resourceType: transferType,
                      quantity: transferQty,
                      from: fromNode,
                      to: toNode,
                      fromCoords,
                      toCoords,
                      vehicle: 'Automated Transport',
                      driver: 'AI Guided',
                      etaMinutes: Math.floor(Math.random() * 60) + 30,
                      priority: isResupply ? 'Critical' : 'High',
                      destinationType: 'Warehouse'
                    }).then(() => {
                      setTransferSuccess(true);
                      setTimeout(() => {
                        setTransferSuccess(false);
                        setSelectedWarehouse(null);
                        void fetchData(); 
                      }, 3000);
                    }).catch(err => {
                      console.error(err);
                    }).finally(() => {
                      setTransferring(false);
                    });
                  }} className="flex flex-col gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold tracking-widest uppercase mb-2 ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'text-red-500' : 'text-gray-500'}`}>
                        {((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'Request Resource' : 'Resource Type'}
                      </label>
                      <select 
                        value={transferType}
                        onChange={(e) => setTransferType(e.target.value as ShipmentResourceType)}
                        className="w-full bg-white border border-gray-300 text-black p-2 rounded-lg outline-none focus:border-[#34e899] focus:ring-1 focus:ring-[#34e899] text-sm shadow-sm"
                      >
                        {((selectedWarehouse.lowStockWarnings || []).length > 0) 
                          ? (selectedWarehouse.lowStockWarnings || []).map(k => {
                              const baseRes = k.split(' ')[0]; // e.g. "Water at 50 units" -> "Water"
                              return <option key={k} value={baseRes}>{k}</option>;
                            })
                          : Object.keys(selectedWarehouse.stockLevels).map(k => <option key={k} value={k}>{k}</option>)
                        }
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold tracking-widest uppercase mb-2 ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'text-red-500' : 'text-gray-500'}`}>Quantity</label>
                      <input 
                        type="number"
                        min="1"
                        value={transferQty}
                        onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-300 text-black p-2 rounded-lg outline-none focus:border-[#34e899] focus:ring-1 focus:ring-[#34e899] text-sm shadow-sm"
                      />
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold tracking-widest uppercase mb-2 ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'text-red-500' : 'text-gray-500'}`}>
                        {((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'Source Node (Dispatch From)' : 'Target Node'}
                      </label>
                      <select 
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 text-black p-2 rounded-lg outline-none focus:border-[#34e899] focus:ring-1 focus:ring-[#34e899] text-sm shadow-sm"
                      >
                        <option value="">Select {((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'Source' : 'Destination'}...</option>
                        {warehouses
                          .filter(w => w.id !== selectedWarehouse.id)
                          .filter(w => {
                             // If this is an emergency resupply, ensure the source has the needed stock
                             if (((selectedWarehouse.lowStockWarnings || []).length > 0)) {
                               const baseRes = transferType || (selectedWarehouse.lowStockWarnings || [])[0].split(' ')[0];
                               const stock = (w.stockLevels as any)[baseRes] || 0;
                               return stock > transferQty;
                             }
                             return true;
                          })
                          .map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} {((w.lowStockWarnings || []).length > 0) ? '(⚠️ Shortage)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="submit"
                      disabled={transferring || !targetId || transferQty <= 0}
                      className={`mt-4 w-full text-black font-bold tracking-widest uppercase text-xs py-3 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${((selectedWarehouse.lowStockWarnings || []).length > 0) ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-[#34e899] hover:bg-[#2bc481]'}`}
                    >
                      {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deploy Fleet'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
