import React, { useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertCircle,
  Box,
  ChevronRight,
  Loader2,
  Package,
  Send,
  Warehouse,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNavBar } from '../components/navigation/AppNavBar';
import { getWarehouses, createShipment, WarehouseSummary, ShipmentResourceType } from '../services/api';

const MAP_CENTER: [number, number] = [20.5937, 78.9629]; // India center

const createWarehouseIcon = (warehouse: WarehouseSummary, selected: boolean) => {
  const isCritical = warehouse.lowStockWarnings.length > 0;
  const colorClass = isCritical ? 'text-red-500 border-red-500/50 bg-red-500/10' : 'text-[#34e899] border-[#34e899]/50 bg-[#34e899]/10';
  const shadow = isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(52,232,153,0.3)]';
  const selectedRing = selected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : '';

  const html = renderToString(
    <div className={`relative flex items-center justify-center w-12 h-12 rounded-lg border-2 ${colorClass} backdrop-blur-md ${shadow} ${selectedRing} transition-all duration-300`}>
      <Warehouse className="w-6 h-6" />
      {isCritical && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
      )}
      {isCritical && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-black" />
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

export default function Resources() {
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [transferType, setTransferType] = useState<ShipmentResourceType>('Food');
  const [transferQty, setTransferQty] = useState(100);
  const [targetId, setTargetId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getWarehouses();
      setWarehouses(data);
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
      setTimeout(() => setTransferSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#34e899]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-mono selection:bg-[#34e899] selection:text-black">
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
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          />
          <ZoomControl position="bottomright" />

          {warehouses.map((w) => (
            <Marker 
              key={w.id} 
              position={[w.location.lat, w.location.lng]}
              icon={createWarehouseIcon(w, selectedWarehouse?.id === w.id)}
              eventHandlers={{
                click: () => {
                  setSelectedWarehouse(w);
                  setTransferSuccess(false);
                }
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Map Overlay HUD elements */}
      <div className="absolute top-[90px] left-6 z-10 pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-display font-light uppercase text-white tracking-tighter drop-shadow-lg">
          Global <span className="text-[#34e899]">Resources</span>
        </h1>
        <div className="text-white/70 text-xs tracking-[0.2em] uppercase mt-2 drop-shadow-md">
          Strategic Node Telemetry
        </div>
      </div>

      {/* Side Panel for Warehouse Details */}
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



            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
