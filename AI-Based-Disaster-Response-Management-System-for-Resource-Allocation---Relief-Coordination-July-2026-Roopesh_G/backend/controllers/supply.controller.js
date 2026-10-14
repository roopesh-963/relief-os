const Supply = require('../models/Supply.model');
const Resource = require('../models/Resource.model');

const RESOURCE_TYPES = ['Medicine', 'Food', 'Water', 'Fuel', 'Equipment', 'Blankets', 'Ambulance'];
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_PROGRESS = {
  Queued: 8,
  'In Transit': 58,
  Delayed: 42,
  Rerouted: 64,
  Delivered: 100,
};
const LOCATION_COORDS = {
  // ── Unified Strategic Disaster Depots & Camps ──────────────────
  'Depot A (Northern Strategic Hub)':    { lat: 11.6854, lng: 76.1320 },
  'Depot B (Forward Staging Center)':     { lat: 11.5900, lng: 76.0800 },
  'Depot C (Southern Reserve Depot)':     { lat: 11.4500, lng: 76.2200 },
  'Central Logistics Hub':               { lat: 28.6139, lng: 77.2090 },
  'Zone A (Meppadi Emergency Camp)':     { lat: 11.5564, lng: 76.1320 },
  'Zone B (Chooralmala Disaster Sector)': { lat: 11.5320, lng: 76.1750 },
  'Zone C (Mundakkai Cut-off Outpost)':  { lat: 11.5180, lng: 76.2100 },
  'Vythiri Hill Outpost':                { lat: 11.6050, lng: 76.0250 },
  'Sulthan Bathery Evacuation Staging Hub': { lat: 11.6854, lng: 76.1320 },

  // ── India (original hubs) ──────────────────────────────────────
  'Central Hub':       { lat: 28.6139,  lng: 77.2090 },
  'East Depot':        { lat: 28.7041,  lng: 77.1025 },
  'North Warehouse':   { lat: 28.5355,  lng: 77.3910 },
  'Coastal Depot':     { lat: 19.0760,  lng: 72.8777 },
  'River Camp':        { lat: 25.4358,  lng: 81.8463 },
  'Zone C Shelter':    { lat: 26.9124,  lng: 75.7873 },
  'Sector 7 Clinic':   { lat: 22.5726,  lng: 88.3639 },
  'Hill Base Camp':    { lat: 30.3165,  lng: 78.0322 },
  'Harbor Relief Camp':{ lat: 13.0827,  lng: 80.2707 },
  'Airport Triage':    { lat: 17.3850,  lng: 78.4867 },

  // ── Global warehouses ──────────────────────────────────────────
  'Geneva HQ':         { lat: 46.2044,  lng:  6.1432 },   // Switzerland – ICRC
  'Dubai Logistics Hub':{ lat: 25.2048, lng: 55.2708 },   // UAE – Gulf gateway
  'Nairobi Regional':  { lat: -1.2921,  lng: 36.8219 },   // Kenya – East Africa
  'Dakar West Africa': { lat: 14.7167,  lng: -17.4677 },  // Senegal
  'Cairo Distribution':{ lat: 30.0444,  lng: 31.2357 },   // Egypt – North Africa/Levant
  'Bangkok SEARO':     { lat: 13.7563,  lng: 100.5018 },  // Thailand – SE Asia
  'Manila Pacific':    { lat: 14.5995,  lng: 120.9842 },  // Philippines
  'São Paulo Americas':{ lat: -23.5505, lng: -46.6333 },  // Brazil – South America
  'Mexico City Hub':   { lat: 19.4326,  lng: -99.1332 },  // Mexico – Central America
  'New York Staging':  { lat: 40.7128,  lng: -74.0060 },  // USA – North America
  'London Depot':      { lat: 51.5074,  lng: -0.1278 },   // UK – Europe
  'Karachi Depot':     { lat: 24.8607,  lng: 67.0104 },   // Pakistan
  'Dhaka Relief':      { lat: 23.8103,  lng: 90.4125 },   // Bangladesh
  'Kabul Forward Base':{ lat: 34.5553,  lng: 69.2075 },   // Afghanistan
  'Kyiv Ukraine Hub':  { lat: 50.4501,  lng: 30.5234 },   // Ukraine
  'Istanbul Transit':  { lat: 41.0082,  lng: 28.9784 },   // Turkey – Europe/Asia
  'Jakarta Indonesia': { lat: -6.2088,  lng: 106.8456 },  // Indonesia
  'Lagos Nigeria':     { lat:  6.5244,  lng:  3.3792 },   // Nigeria – West Africa
  'Addis Ababa':       { lat:  9.0320,  lng: 38.7469 },   // Ethiopia – Horn of Africa
  'Sydney Pacific':    { lat: -33.8688, lng: 151.2093 },  // Australia

  // ── Rescue / relief destinations ──────────────────────────────
  'Delhi Building Collapse Zone': { lat: 28.6942, lng: 77.2796 },
  'Nepal Quake Zone':  { lat: 27.9881,  lng: 86.9250 },
  'Nepal Quake & Landslide Hub': { lat: 28.7042, lng: 82.2035 },
  'Assam Brahmaputra Flood Zone': { lat: 26.1445, lng: 91.7362 },
  'Wayanad Landslide Relief Camp': { lat: 11.5564, lng: 76.1320 },
  'Bay of Bengal Cyclone Shelter': { lat: 21.6845, lng: 87.5512 },
  'Gaza Relief Zone':  { lat: 31.3547,  lng: 34.3088 },
  'Haiti Shelter':     { lat: 18.5944,  lng: -72.3074 },
  'Flood Zone Bangladesh':{ lat: 24.0000, lng: 90.0000 },
  'Somalia Famine Zone':{ lat:  5.1521, lng: 46.1996 },
  'Syria Conflict Zone':{ lat: 36.2021, lng: 37.1343 },
  'Mozambique Cyclone':{ lat: -19.8500, lng: 34.8500 },
  'Pakistan Flood Camp':{ lat: 29.0000, lng: 68.0000 },
  'Philippines Typhoon':{ lat: 13.0000, lng: 122.0000 },
  'Yemen Relief Camp': { lat: 15.3694,  lng: 44.1910 },
};

// Global strategic warehouses that always appear on the supply map
const GLOBAL_WAREHOUSES = [
  { id: 'wh-geneva',     name: 'Geneva HQ',           region: 'Europe',       location: { lat: 46.2044,  lng:  6.1432 }, capacity: 2000 },
  { id: 'wh-dubai',      name: 'Dubai Logistics Hub', region: 'Middle East',  location: { lat: 25.2048,  lng: 55.2708 }, capacity: 2500 },
  { id: 'wh-nairobi',    name: 'Nairobi Regional',    region: 'East Africa',  location: { lat: -1.2921,  lng: 36.8219 }, capacity: 1800 },
  { id: 'wh-cairo',      name: 'Cairo Distribution',  region: 'North Africa', location: { lat: 30.0444,  lng: 31.2357 }, capacity: 1600 },
  { id: 'wh-bangkok',    name: 'Bangkok SEARO',        region: 'SE Asia',      location: { lat: 13.7563,  lng:100.5018 }, capacity: 1800 },
  { id: 'wh-manila',     name: 'Manila Pacific',       region: 'Pacific',      location: { lat: 14.5995,  lng:120.9842 }, capacity: 1400 },
  { id: 'wh-saopaulo',   name: 'São Paulo Americas',   region: 'South America',location: { lat: -23.5505, lng: -46.6333}, capacity: 1600 },
  { id: 'wh-newyork',    name: 'New York Staging',     region: 'North America',location: { lat: 40.7128,  lng: -74.0060}, capacity: 2000 },
  { id: 'wh-london',     name: 'London Depot',         region: 'Europe',       location: { lat: 51.5074,  lng: -0.1278 }, capacity: 1800 },
  { id: 'wh-istanbul',   name: 'Istanbul Transit',     region: 'Europe/Asia',  location: { lat: 41.0082,  lng: 28.9784 }, capacity: 1500 },
  { id: 'wh-karachi',    name: 'Karachi Depot',        region: 'South Asia',   location: { lat: 24.8607,  lng: 67.0104 }, capacity: 1200 },
  { id: 'wh-lagos',      name: 'Lagos Nigeria',        region: 'West Africa',  location: { lat:  6.5244,  lng:  3.3792 }, capacity: 1400 },
  { id: 'wh-addis',      name: 'Addis Ababa',          region: 'Horn of Africa',location: { lat: 9.0320,  lng: 38.7469 }, capacity: 1200 },
  { id: 'wh-kyiv',       name: 'Kyiv Ukraine Hub',     region: 'Eastern Europe',location: { lat: 50.4501, lng: 30.5234 }, capacity: 1000 },
  { id: 'wh-jakarta',    name: 'Jakarta Indonesia',    region: 'SE Asia',      location: { lat: -6.2088,  lng:106.8456 }, capacity: 1200 },
  { id: 'wh-dakar',      name: 'Dakar West Africa',    region: 'West Africa',  location: { lat: 14.7167,  lng: -17.4677}, capacity: 1000 },
  // India hubs
  { id: 'wh-central',    name: 'Central Hub',          region: 'India',        location: { lat: 28.6139,  lng: 77.2090 }, capacity: 1200 },
  { id: 'wh-coastal',    name: 'Coastal Depot',        region: 'India',        location: { lat: 19.0760,  lng: 72.8777 }, capacity: 1000 },
  { id: 'wh-harbor',     name: 'Harbor Relief Camp',   region: 'India',        location: { lat: 13.0827,  lng: 80.2707 }, capacity: 900  },
];

// Pre-defined multi-path routes connecting warehouses to rescue zones
const GLOBAL_ROUTES = [
  // Geneva → Gaza (primary + alternate via Cairo)
  { id: 'rt-geneva-gaza-1', from: 'Geneva HQ',       to: 'Gaza Relief Zone',   waypoints: [[41.0082,28.9784]], type: 'primary'   },
  { id: 'rt-geneva-gaza-2', from: 'Cairo Distribution', to: 'Gaza Relief Zone', waypoints: [],                 type: 'alternate' },
  // Dubai → Yemen
  { id: 'rt-dubai-yemen-1', from: 'Dubai Logistics Hub', to: 'Yemen Relief Camp', waypoints: [],               type: 'primary'   },
  { id: 'rt-dubai-yemen-2', from: 'Cairo Distribution',  to: 'Yemen Relief Camp', waypoints: [[25.2048,55.2708]], type: 'alternate' },
  // Nairobi → Somalia
  { id: 'rt-nairobi-somalia-1', from: 'Nairobi Regional', to: 'Somalia Famine Zone', waypoints: [],            type: 'primary'   },
  { id: 'rt-addis-somalia-2',   from: 'Addis Ababa',      to: 'Somalia Famine Zone', waypoints: [],            type: 'alternate' },
  // Bangkok → Philippines Typhoon
  { id: 'rt-bangkok-ph-1',  from: 'Bangkok SEARO',  to: 'Philippines Typhoon', waypoints: [],                  type: 'primary'   },
  { id: 'rt-manila-ph-2',   from: 'Manila Pacific', to: 'Philippines Typhoon', waypoints: [],                  type: 'alternate' },
  // São Paulo → Haiti
  { id: 'rt-sp-haiti-1', from: 'São Paulo Americas', to: 'Haiti Shelter', waypoints: [[19.4326,-99.1332]],     type: 'primary'   },
  { id: 'rt-ny-haiti-2', from: 'New York Staging',   to: 'Haiti Shelter', waypoints: [],                       type: 'alternate' },
  // Karachi → Pakistan Flood
  { id: 'rt-karachi-pak-1', from: 'Karachi Depot',    to: 'Pakistan Flood Camp', waypoints: [],                type: 'primary'   },
  { id: 'rt-dubai-pak-2',   from: 'Dubai Logistics Hub', to: 'Pakistan Flood Camp', waypoints: [[24.8607,67.0104]], type: 'alternate' },
  // Dhaka / Bangkok → Bangladesh Flood
  { id: 'rt-dhaka-bd-1',   from: 'Bangkok SEARO',  to: 'Flood Zone Bangladesh', waypoints: [[23.8103,90.4125]], type: 'primary'  },
  { id: 'rt-karachi-bd-2', from: 'Karachi Depot',  to: 'Flood Zone Bangladesh', waypoints: [],                 type: 'alternate' },
  // Kyiv → Syria
  { id: 'rt-kyiv-syria-1',    from: 'Kyiv Ukraine Hub', to: 'Syria Conflict Zone', waypoints: [[41.0082,28.9784]], type: 'primary'   },
  { id: 'rt-istanbul-syria-2', from: 'Istanbul Transit', to: 'Syria Conflict Zone', waypoints: [],              type: 'alternate' },
  // Lagos → Mozambique
  { id: 'rt-lagos-moz-1',  from: 'Lagos Nigeria',   to: 'Mozambique Cyclone', waypoints: [],                   type: 'primary'   },
  { id: 'rt-nairobi-moz-2', from: 'Nairobi Regional', to: 'Mozambique Cyclone', waypoints: [],                 type: 'alternate' },
  // Central Hub → Nepal Quake
  { id: 'rt-central-nepal-1', from: 'Central Hub',  to: 'Nepal Quake Zone', waypoints: [],                     type: 'primary'   },
  { id: 'rt-bangkok-nepal-2', from: 'Bangkok SEARO', to: 'Nepal Quake Zone', waypoints: [],                    type: 'alternate' },
];

const resolveCoords = (label, fallback = { lat: 20.5937, lng: 78.9629 }) => {
  return LOCATION_COORDS[label] || fallback;
};

const isValidCoords = (value) =>
  Boolean(
    value &&
      typeof value.lat === 'number' &&
      Number.isFinite(value.lat) &&
      typeof value.lng === 'number' &&
      Number.isFinite(value.lng)
  );

const ensureCoords = (value, fallbackLabel, fallback) => {
  if (isValidCoords(value)) {
    return value;
  }
  if (fallbackLabel) {
    return resolveCoords(fallbackLabel, fallback);
  }
  return fallback;
};

const formatEta = (etaMinutes) => {
  if (etaMinutes <= 0) {
    return 'Arrived';
  }
  if (etaMinutes < 60) {
    return `${Math.round(etaMinutes)} min`;
  }
  const hours = Math.floor(etaMinutes / 60);
  const mins = Math.round(etaMinutes % 60);
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

const interpolatePoint = (from, to, progress) => {
  const safeFrom = ensureCoords(from, undefined, { lat: 20.5937, lng: 78.9629 });
  const safeTo = ensureCoords(to, undefined, safeFrom);

  return {
    lat: Number((safeFrom.lat + (safeTo.lat - safeFrom.lat) * progress).toFixed(5)),
    lng: Number((safeFrom.lng + (safeTo.lng - safeFrom.lng) * progress).toFixed(5)),
  };
};

const buildRoutePath = (shipment) => {
  const from = ensureCoords(shipment.fromCoords, shipment.from, { lat: 20.5937, lng: 78.9629 });
  const to = ensureCoords(shipment.toCoords, shipment.to, { lat: 24.8607, lng: 67.0011 });

  if (shipment.status === 'Rerouted' || shipment.routeState === 'Blocked') {
    const latOffset = from.lat <= to.lat ? 1.15 : -1.15;
    const lngOffset = from.lng <= to.lng ? 1.75 : -1.75;
    return [
      [from.lat, from.lng],
      [Number(((from.lat + to.lat) / 2 + latOffset).toFixed(5)), Number(((from.lng + to.lng) / 2 + lngOffset).toFixed(5))],
      [to.lat, to.lng],
    ];
  }

  return [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ];
};

const shipmentToClient = (shipmentDoc) => {
  const shipment = typeof shipmentDoc.toObject === 'function' ? shipmentDoc.toObject() : shipmentDoc;
  const fromLabel = shipment.from || shipment.warehouse || 'Central Hub';
  const toLabel = shipment.to || shipment.destination || 'Relief Zone';
  const fromCoords = ensureCoords(shipment.fromCoords, fromLabel, { lat: 20.5937, lng: 78.9629 });
  const toCoords = ensureCoords(shipment.toCoords, toLabel, { lat: 24.8607, lng: 67.0011 });
  const normalizedStatus =
    shipment.status === 'En-route'
      ? 'In Transit'
      : shipment.status === 'Idle' || shipment.status === 'Loading'
        ? 'Queued'
        : shipment.status === 'Cancelled'
          ? 'Delayed'
          : shipment.status || 'Queued';
  const etaMinutes =
    typeof shipment.etaMinutes === 'number'
      ? shipment.etaMinutes
      : (() => {
          const etaText = String(shipment.eta || '').trim().toLowerCase();
          if (!etaText || etaText === '-') {
            return normalizedStatus === 'Delivered' ? 0 : 90;
          }
          if (etaText.endsWith('min')) {
            return Number.parseInt(etaText, 10) || 0;
          }
          if (etaText.endsWith('h')) {
            return Math.round((Number.parseFloat(etaText) || 0) * 60);
          }
          return Number.parseInt(etaText, 10) || 90;
        })();
  const progress =
    normalizedStatus === 'Delivered'
      ? 1
      : typeof shipment.progress === 'number'
        ? Math.min(0.95, Math.max(0.08, shipment.progress / 100))
        : Math.min(0.9, Math.max(0.08, 1 - etaMinutes / Math.max(etaMinutes + 90, 1)));

  return {
    _id: String(shipment._id),
    shipmentId: shipment.shipmentId || shipment.trackingId || `SC-${String(shipment._id).slice(-3)}`,
    resourceType: shipment.resourceType || shipment.cargoType || 'Equipment',
    quantity: shipment.quantity,
    unit: shipment.unit || 'units',
    from: fromLabel,
    to: toLabel,
    vehicle: shipment.vehicle || shipment.assignedTruck || 'Field Vehicle',
    driver: shipment.driver || `${shipment.assignedTruck || 'Ops'} Driver`,
    status: normalizedStatus,
    etaMinutes,
    etaLabel: formatEta(etaMinutes),
    priority: shipment.priority || 'Medium',
    routeState: shipment.routeState || (normalizedStatus === 'Delayed' ? 'Blocked' : 'Clear'),
    blockedReason: shipment.blockedReason || '',
    destinationType: shipment.destinationType || 'Zone',
    progress: normalizedStatus === 'Delivered' ? 100 : Math.round(progress * 100),
    fromCoords,
    toCoords,
    currentCoords:
      normalizedStatus === 'Delivered'
        ? toCoords
        : ensureCoords(shipment.currentCoords, undefined, interpolatePoint(fromCoords, toCoords, progress)),
    routePath: buildRoutePath({
      ...shipment,
      status: normalizedStatus,
      fromCoords,
      toCoords,
      routeState: shipment.routeState || (normalizedStatus === 'Delayed' ? 'Blocked' : 'Clear'),
    }),
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    deliveredAt: shipment.deliveredAt,
    notes: shipment.notes,
  };
};

const toWarehouseKey = (name) => name.trim().toLowerCase();

const collectWarehouseStock = (resources) => {
  const warehouses = new Map();

  resources.forEach((resourceDoc) => {
    const resource = typeof resourceDoc.toObject === 'function' ? resourceDoc.toObject() : resourceDoc;
    const name = resource.location || 'Central Logistics Hub';
    const key = toWarehouseKey(name);
    const existing = warehouses.get(key) || {
      id: `wh-${key.replace(/[^a-z0-9]+/g, '-')}`,
      name,
      location: resolveCoords(name),
      stockLevels: { Water: 0, Food: 0, Medicine: 0, Fuel: 0, Blankets: 0, Ambulance: 0 },
      capacity: 35000,
      usedCapacity: 0,
      lowStockWarnings: [],
      lastUpdated: resource.updatedAt || resource.lastUpdated || new Date(),
    };

    existing.usedCapacity += Number(resource.quantity || 0);
    const normalizedType = resource.type === 'Equipment' ? 'Blankets' : resource.type;
    if (Object.prototype.hasOwnProperty.call(existing.stockLevels, normalizedType)) {
      existing.stockLevels[normalizedType] += Number(resource.quantity || 0);
    } else {
      existing.stockLevels[normalizedType] = Number(resource.quantity || 0);
    }

    const updatedAt = new Date(resource.updatedAt || resource.lastUpdated || Date.now());
    if (updatedAt > new Date(existing.lastUpdated)) {
      existing.lastUpdated = updatedAt.toISOString();
    }

    warehouses.set(key, existing);
  });

  return Array.from(warehouses.values())
    .map((warehouse) => {
      // Dynamic capacity calculation to maintain realistic 60-85% fill rate
      const cap = Math.max(warehouse.capacity, Math.ceil(warehouse.usedCapacity * 1.25 / 1000) * 1000);
      const fillPercent = Math.min(100, Math.max(0, Math.round((warehouse.usedCapacity / cap) * 100)));
      const lowStockWarnings = Object.entries(warehouse.stockLevels)
        .filter(([type, value]) => Number(value) > 0 && Number(value) <= 120 && type !== 'Ambulance')
        .map(([type, value]) => `${type} at ${value} units`);

      return {
        ...warehouse,
        capacity: cap,
        fillPercent,
        lowStockWarnings,
      };
    })
    .sort((a, b) => b.usedCapacity - a.usedCapacity);
};

const consumeInventory = async ({ resourceType, quantity, from, target, shipmentId, userId }) => {
  const resources = await Resource.find({ location: from, type: resourceType }).sort({ quantity: -1, updatedAt: 1 });
  const totalAvailable = resources.reduce((sum, resource) => sum + Number(resource.quantity || 0), 0);

  if (totalAvailable < quantity) {
    return { error: `Insufficient ${resourceType} stock at ${from}. Available ${totalAvailable}, requested ${quantity}.` };
  }

  let remaining = quantity;
  const updatedResources = [];
  const sourceResourceIds = [];

  for (const resource of resources) {
    if (remaining <= 0) {
      break;
    }

    const consumed = Math.min(Number(resource.quantity || 0), remaining);
    if (consumed <= 0) {
      continue;
    }

    resource.quantity -= consumed;
    resource.isDeployed = true;
    resource.deploymentTarget = target;
    resource.status = resource.quantity <= 20 ? 'Critical' : resource.quantity <= 100 ? 'Low' : 'Healthy';
    resource.lastUpdated = new Date();
    resource.lastChecked = new Date();
    resource.allocations.push({
      target,
      quantity: consumed,
      notes: `Shipment ${shipmentId} dispatched`,
      allocatedBy: userId || null,
      allocatedAt: new Date(),
    });

    await resource.save();
    updatedResources.push(resource);
    sourceResourceIds.push(resource._id);
    remaining -= consumed;
  }

  return { updatedResources, sourceResourceIds };
};

const buildOptimizationInsights = (shipments, warehouses) => {
  const insights = [];
  const delayed = shipments.filter((shipment) => shipment.status === 'Delayed' || shipment.routeState === 'Blocked');
  const criticalRoute = delayed[0];
  if (criticalRoute) {
    insights.push({
      id: `insight-${criticalRoute.shipmentId}-route`,
      title: `Reroute truck ${criticalRoute.shipmentId} due to blocked road`,
      message: criticalRoute.blockedReason || `${criticalRoute.to} is experiencing route friction. Shift convoy via alternate corridor.`,
      tone: 'critical',
    });
  }

  const medicineLow = warehouses.find((warehouse) => warehouse.stockLevels.Medicine <= 120);
  if (medicineLow) {
    insights.push({
      id: `insight-${medicineLow.id}-medicine`,
      title: `${medicineLow.name} medicine below threshold`,
      message: `Only ${medicineLow.stockLevels.Medicine} medicine units remain. Prioritize inbound replenishment.`,
      tone: 'warning',
    });
  }

  const zoneCShipment = shipments.find((shipment) => shipment.to.toLowerCase().includes('zone c'));
  if (zoneCShipment) {
    const nearestWarehouse = warehouses[0];
    if (nearestWarehouse) {
      insights.push({
        id: `insight-${zoneCShipment.shipmentId}-nearest`,
        title: `Use nearest warehouse for ${zoneCShipment.to}`,
        message: `${nearestWarehouse.name} is carrying the strongest reserve profile for ${zoneCShipment.resourceType}.`,
        tone: 'info',
      });
    }
  }

  const fuelDemand = shipments
    .filter((shipment) => shipment.resourceType === 'Fuel' && shipment.status !== 'Delivered')
    .reduce((sum, shipment) => sum + shipment.quantity, 0);
  if (fuelDemand > 180) {
    insights.push({
      id: 'insight-fuel-demand',
      title: 'Fuel demand spike expected in 3 hrs',
      message: `Open fuel commitments are at ${fuelDemand} units. Pre-stage reserves before peak dispatch.`,
      tone: 'warning',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'insight-balance',
      title: 'Network balanced',
      message: 'No critical route or stock pressure detected. Maintain live monitoring cadence.',
      tone: 'info',
    });
  }

  return insights.slice(0, 4);
};

const loadShipments = async () => {
  const shipments = await Supply.find().sort({ createdAt: -1 });
  return shipments.map(shipmentToClient);
};

const getShipments = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    const base = await Supply.find(filter).sort({ createdAt: -1 });
    let shipments = base.map(shipmentToClient);

    if (search) {
      const term = String(search).trim().toLowerCase();
      shipments = shipments.filter((shipment) =>
        [
          shipment.shipmentId,
          shipment.resourceType,
          shipment.from,
          shipment.to,
          shipment.vehicle,
          shipment.driver,
          shipment.status,
        ].some((value) => String(value).toLowerCase().includes(term))
      );
    }

    res.json(shipments);
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getWarehouses = async (_req, res) => {
  try {
    const resources = await Resource.find().sort({ updatedAt: -1 });
    const dbWarehouses = collectWarehouseStock(resources);

    // Active DB warehouses with live inventory come FIRST
    const dbByName = new Map(dbWarehouses.map(w => [w.name.trim().toLowerCase(), w]));
    const merged = [...dbWarehouses];

    // Append global warehouses if not already present
    GLOBAL_WAREHOUSES.forEach(gw => {
      if (!dbByName.has(gw.name.trim().toLowerCase())) {
        merged.push({
          ...gw,
          stockLevels: { Water: 0, Food: 0, Medicine: 0, Fuel: 0, Blankets: 0, Ambulance: 0 },
          usedCapacity: 0,
          fillPercent: 0,
          lowStockWarnings: [],
          lastUpdated: new Date().toISOString()
        });
      }
    });

    res.json(merged);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getGlobalMapData = async (_req, res) => {
  try {
    const resources = await Resource.find().sort({ updatedAt: -1 });
    const dbWarehouses = collectWarehouseStock(resources);
    const dbByName = new Map(dbWarehouses.map(w => [w.name.trim().toLowerCase(), w]));

    const warehouses = GLOBAL_WAREHOUSES.map(gw => {
      const db = dbByName.get(gw.name.trim().toLowerCase());
      const fillPercent = db ? db.fillPercent : 0;
      return { ...gw, fillPercent, stockLevels: db ? db.stockLevels : { Water: 0, Food: 0, Medicine: 0, Fuel: 0, Blankets: 0 } };
    });

    const routes = GLOBAL_ROUTES.map(r => {
      const fromCoords = LOCATION_COORDS[r.from];
      const toCoords   = LOCATION_COORDS[r.to];
      if (!fromCoords || !toCoords) return null;
      const positions = [
        [fromCoords.lat, fromCoords.lng],
        ...r.waypoints,
        [toCoords.lat, toCoords.lng],
      ];
      return { id: r.id, from: r.from, to: r.to, type: r.type, positions };
    }).filter(Boolean);

    // Rescue zones
    const rescueZones = [
      'Gaza Relief Zone','Haiti Shelter','Flood Zone Bangladesh','Nepal Quake Zone',
      'Somalia Famine Zone','Syria Conflict Zone','Mozambique Cyclone',
      'Pakistan Flood Camp','Philippines Typhoon','Yemen Relief Camp',
    ].map(name => ({ id: `rz-${name.replace(/\s+/g,'-').toLowerCase()}`, name, ...LOCATION_COORDS[name] })).filter(z => z.lat);

    res.json({ warehouses, routes, rescueZones });
  } catch (error) {
    console.error('Global map data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSupplyAnalytics = async (_req, res) => {
  try {
    const [shipments, resources] = await Promise.all([loadShipments(), Resource.find().sort({ updatedAt: -1 })]);
    const warehouses = collectWarehouseStock(resources);

    const activeShipments = shipments.filter((shipment) => shipment.status !== 'Delivered').length;
    const deliveredToday = shipments.filter((shipment) => {
      if (!shipment.deliveredAt) {
        return false;
      }
      const delivered = new Date(shipment.deliveredAt);
      const now = new Date();
      return delivered.toDateString() === now.toDateString();
    }).length;
    const delayedDeliveries = shipments.filter((shipment) => shipment.status === 'Delayed').length;
    const avgEta = shipments.filter((shipment) => shipment.status !== 'Delivered');
    const avgEtaMinutes =
      avgEta.length > 0 ? Math.round(avgEta.reduce((sum, shipment) => sum + shipment.etaMinutes, 0) / avgEta.length) : 0;
    const criticalRoutes = shipments.filter(
      (shipment) => shipment.routeState === 'Blocked' || shipment.status === 'Delayed' || shipment.priority === 'Critical'
    ).length;
    const warehouseCapacity =
      warehouses.length > 0
        ? Math.round(warehouses.reduce((sum, warehouse) => sum + warehouse.fillPercent, 0) / warehouses.length)
        : 0;

    const byStatus = ['Queued', 'In Transit', 'Delayed', 'Rerouted', 'Delivered'].map((status) => ({
      name: status,
      value: shipments.filter((shipment) => shipment.status === status).length,
    }));

    const byPriority = ['Critical', 'High', 'Medium', 'Low'].map((priority) => ({
      name: priority,
      value: shipments.filter((shipment) => shipment.priority === priority).length,
    }));

    res.json({
      summary: {
        activeShipments,
        deliveredToday,
        delayedDeliveries,
        avgEtaMinutes,
        avgEtaLabel: formatEta(avgEtaMinutes),
        criticalRoutes,
        warehouseCapacity,
      },
      byStatus,
      byPriority,
      insights: buildOptimizationInsights(shipments, warehouses),
    });
  } catch (error) {
    console.error('Supply analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createShipment = async (req, res) => {
  try {
    const {
      resourceType,
      quantity,
      from,
      to,
      vehicle,
      driver,
      etaMinutes,
      priority,
      destinationType,
      unit,
      notes,
    } = req.body;

    const numericQuantity = Number(quantity || 0);
    const numericEtaMinutes = Number(etaMinutes || 0);
    if (!RESOURCE_TYPES.includes(resourceType) || numericQuantity <= 0 || numericEtaMinutes < 0 || !from || !to || !vehicle) {
      return res.status(400).json({ message: 'resourceType, quantity, from, to, vehicle, and etaMinutes are required' });
    }

    const provisionalShipment = new Supply({
      resourceType,
      quantity: numericQuantity,
      unit: unit || 'units',
      from,
      fromCoords: req.body.fromCoords || resolveCoords(from),
      to,
      toCoords: req.body.toCoords || resolveCoords(to, { lat: 24.8607, lng: 67.0011 }),
      vehicle,
      driver: driver || `${vehicle} Driver`,
      status: 'In Transit',
      etaMinutes: numericEtaMinutes,
      priority: priority || 'High',
      routeState: numericEtaMinutes > 180 ? 'Watch' : 'Clear',
      destinationType: destinationType || 'Zone',
      notes: notes || '',
      createdBy: req.user?._id || null,
    });

    if (!provisionalShipment.shipmentId) {
      provisionalShipment.shipmentId = `SC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }
    if (!provisionalShipment.trackingId) {
      provisionalShipment.trackingId = provisionalShipment.shipmentId;
    }

    const stockResult = await consumeInventory({
      resourceType,
      quantity: numericQuantity,
      from,
      target: to,
      shipmentId: provisionalShipment.shipmentId,
      userId: req.user?._id || null,
    });

    if (stockResult.error) {
      return res.status(400).json({ message: stockResult.error });
    }

    provisionalShipment.sourceResourceIds = stockResult.sourceResourceIds;
    await provisionalShipment.save();

    const shipment = shipmentToClient(provisionalShipment);
    req.io.to('dashboard').emit('shipment_created', shipment);
    req.io.to('dashboard').emit('new_deployment', shipment);
    stockResult.updatedResources.forEach((resource) => {
      req.io.to('dashboard').emit('resource_updated', resource);
    });

    const [warehouses, analytics] = await Promise.all([
      collectWarehouseStock(await Resource.find().sort({ updatedAt: -1 })),
      (async () => {
        const shipments = await loadShipments();
        const resources = await Resource.find().sort({ updatedAt: -1 });
        return {
          summary: {
            activeShipments: shipments.filter((item) => item.status !== 'Delivered').length,
            deliveredToday: shipments.filter((item) => item.deliveredAt).length,
            delayedDeliveries: shipments.filter((item) => item.status === 'Delayed').length,
            avgEtaMinutes:
              shipments.filter((item) => item.status !== 'Delivered').reduce((sum, item) => sum + item.etaMinutes, 0) /
                Math.max(shipments.filter((item) => item.status !== 'Delivered').length, 1) || 0,
            avgEtaLabel: '',
            criticalRoutes: shipments.filter((item) => item.routeState === 'Blocked' || item.status === 'Delayed').length,
            warehouseCapacity:
              collectWarehouseStock(resources).reduce((sum, warehouse) => sum + warehouse.fillPercent, 0) /
                Math.max(collectWarehouseStock(resources).length, 1) || 0,
          },
        };
      })(),
    ]);
    req.io.to('dashboard').emit('warehouse_updated', warehouses);
    req.io.to('dashboard').emit('shipment_analytics_updated', analytics);

    res.status(201).json({ message: 'Shipment created', shipment });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateShipment = async (req, res) => {
  try {
    const updates = { ...req.body };
    const existing = await Supply.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    if (typeof updates.etaMinutes !== 'undefined') {
      updates.etaMinutes = Number(updates.etaMinutes);
    }
    if (updates.status === 'Delivered') {
      updates.deliveredAt = new Date();
      updates.etaMinutes = 0;
      updates.currentCoords = existing.toCoords;
    }
    if (updates.status === 'Delayed' && !updates.routeState) {
      updates.routeState = 'Blocked';
    }
    if (updates.status === 'Rerouted' && !updates.routeState) {
      updates.routeState = 'Watch';
    }

    const shipmentDoc = await Supply.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    const shipment = shipmentToClient(shipmentDoc);
    req.io.to('dashboard').emit('shipment_updated', shipment);
    req.io.to('dashboard').emit('deployment_updated', shipment);

    res.json({ message: 'Shipment updated', shipment });
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteShipment = async (req, res) => {
  try {
    const shipment = await Supply.findByIdAndDelete(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    req.io.to('dashboard').emit('shipment_deleted', {
      id: String(shipment._id),
      shipmentId: shipment.shipmentId,
    });

    res.json({ message: 'Shipment removed' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const rerouteShipment = async (req, res) => {
  try {
    const { shipmentId, reason, etaAdjustmentMinutes } = req.body;
    if (!shipmentId) {
      return res.status(400).json({ message: 'shipmentId is required' });
    }

    const shipmentDoc = await Supply.findById(shipmentId);
    if (!shipmentDoc) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipmentDoc.status = 'Rerouted';
    shipmentDoc.routeState = 'Blocked';
    shipmentDoc.blockedReason = reason || 'Blocked corridor detected';
    shipmentDoc.etaMinutes = Number(shipmentDoc.etaMinutes || 0) + Number(etaAdjustmentMinutes || 18);
    shipmentDoc.currentCoords = interpolatePoint(
      ensureCoords(shipmentDoc.fromCoords, shipmentDoc.from, { lat: 20.5937, lng: 78.9629 }),
      ensureCoords(shipmentDoc.toCoords, shipmentDoc.to, { lat: 24.8607, lng: 67.0011 }),
      0.52
    );
    await shipmentDoc.save();

    const shipment = shipmentToClient(shipmentDoc);
    req.io.to('dashboard').emit('shipment_rerouted', shipment);
    req.io.to('dashboard').emit('shipment_updated', shipment);

    res.json({ message: 'Shipment rerouted', shipment });
  } catch (error) {
    console.error('Reroute shipment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  getWarehouses,
  getGlobalMapData,
  getSupplyAnalytics,
  rerouteShipment,
};
