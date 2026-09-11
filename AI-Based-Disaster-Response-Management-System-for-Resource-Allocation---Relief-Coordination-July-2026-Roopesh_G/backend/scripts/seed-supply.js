/**
 * scripts/seed-supply.js
 * ----------------------
 * Seeds supply chain shipments, warehouses (via resources), and related data.
 * Run: node scripts/seed-supply.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Supply = require('../models/Supply.model');
const Resource = require('../models/Resource.model');
const User = require('../models/User.model');

const COORDS = {
  'Central Hub':        { lat: 28.6139,  lng: 77.2090 },
  'East Depot':         { lat: 28.7041,  lng: 77.1025 },
  'North Warehouse':    { lat: 28.5355,  lng: 77.3910 },
  'Coastal Depot':      { lat: 19.0760,  lng: 72.8777 },
  'Warehouse 01':       { lat: 28.6139,  lng: 77.2090 },
  'Warehouse 02':       { lat: 28.7041,  lng: 77.1025 },
  'Sector 4 Base':      { lat: 12.9300,  lng: 77.6200 },
  'Camp 4':             { lat: 12.9621,  lng: 77.5984 },
  'East Zone':          { lat: 12.9739,  lng: 77.6101 },
  'West Shelter':       { lat: 12.9500,  lng: 77.6290 },
  'South District':     { lat: 12.9660,  lng: 77.5840 },
  'Zone 11 Clinic':     { lat: 13.0100,  lng: 77.5800 },
  'North Medical Post': { lat: 28.5800,  lng: 77.3000 },
  'Harbor Relief Camp': { lat: 13.0827,  lng: 80.2707 },
  'Airport Triage':     { lat: 17.3850,  lng: 78.4867 },
  'Hill Base Camp':     { lat: 30.3165,  lng: 78.0322 },
  'River Camp':         { lat: 25.4358,  lng: 81.8463 },
};

const coords = (name) => COORDS[name] || { lat: 20.5937, lng: 78.9629 };

const midpoint = (a, b) => ({
  lat: (a.lat + b.lat) / 2,
  lng: (a.lng + b.lng) / 2,
});

const seed = async () => {
  await connectDB();

  // Get or create a system user
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@reliefos.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Created admin user: admin@reliefos.com / admin123');
  }

  let rescue = await User.findOne({ role: 'rescue_team' });
  if (!rescue) {
    rescue = await User.create({
      name: 'Rescue Team Alpha',
      email: 'rescue@reliefos.com',
      password: 'rescue123',
      role: 'rescue_team',
    });
    console.log('Created rescue user: rescue@reliefos.com / rescue123');
  }

  // ── Wipe existing supply & resource data ──────────────────────────
  await Supply.deleteMany({});
  await Resource.deleteMany({});
  console.log('Cleared old supply + resource data');

  // ── Resources (warehouse stock) ───────────────────────────────────
  const now = Date.now();
  const DAY = 86400000;

  await Resource.create([
    { type: 'Medicine',   name: 'Antiviral Batch X-4',    quantity: 530,  unit: 'units',  status: 'Healthy',   priority: 'High',     location: 'Warehouse 01',    addedBy: admin._id },
    { type: 'Medicine',   name: 'Emergency Splints',       quantity: 80,   unit: 'units',  status: 'Low',       priority: 'Critical', location: 'Sector 4 Base',   addedBy: admin._id },
    { type: 'Medicine',   name: 'IV Fluid Bags',           quantity: 320,  unit: 'bags',   status: 'Healthy',   priority: 'High',     location: 'Central Hub',     addedBy: admin._id },
    { type: 'Food',       name: 'Dry Ration Kits',         quantity: 1200, unit: 'packs',  status: 'Healthy',   priority: 'Medium',   location: 'Warehouse 02',    addedBy: admin._id },
    { type: 'Food',       name: 'High-Calorie Bars',       quantity: 640,  unit: 'boxes',  status: 'Healthy',   priority: 'Medium',   location: 'East Depot',      addedBy: admin._id },
    { type: 'Water',      name: 'Canned Spring Water',     quantity: 2400, unit: 'cans',   status: 'Healthy',   priority: 'High',     location: 'Warehouse 01',    addedBy: admin._id },
    { type: 'Water',      name: 'Water Purification Tabs', quantity: 1800, unit: 'tabs',   status: 'Healthy',   priority: 'Medium',   location: 'North Warehouse', addedBy: rescue._id },
    { type: 'Fuel',       name: 'Diesel Reserve Units',    quantity: 220,  unit: 'liters', status: 'Low',       priority: 'High',     location: 'Coastal Depot',   addedBy: admin._id },
    { type: 'Equipment',  name: 'Mobile Ventilators',      quantity: 12,   unit: 'units',  status: 'Critical',  priority: 'Critical', location: 'Zone 11 Clinic',  addedBy: rescue._id },
    { type: 'Equipment',  name: 'Thermal Blankets',        quantity: 980,  unit: 'units',  status: 'Healthy',   priority: 'Medium',   location: 'Warehouse 02',    addedBy: admin._id },
    { type: 'Ambulance',  name: 'Field Ambulance Unit',    quantity: 3,    unit: 'vehicles',status: 'Healthy',  priority: 'Critical', location: 'Central Hub',     addedBy: admin._id },
    { type: 'Fuel',       name: 'Petrol Canisters',        quantity: 380,  unit: 'liters', status: 'Healthy',   priority: 'Medium',   location: 'East Depot',      addedBy: admin._id },
  ]);
  console.log('Resources seeded (12 items)');

  // ── Supply Shipments ──────────────────────────────────────────────
  const shipments = [
    {
      shipmentId: 'SC-240901-001',
      resourceType: 'Medicine',
      quantity: 200,
      unit: 'units',
      from: 'Warehouse 01',
      fromCoords: coords('Warehouse 01'),
      to: 'Sector 4 Base',
      toCoords: coords('Sector 4 Base'),
      currentCoords: midpoint(coords('Warehouse 01'), coords('Sector 4 Base')),
      vehicle: 'Truck Alpha-1',
      driver: 'Ravi Kumar',
      status: 'In Transit',
      etaMinutes: 45,
      priority: 'Critical',
      routeState: 'Clear',
      destinationType: 'Zone',
      notes: 'Urgent medicine convoy for Sector 4 outbreak',
      createdBy: admin._id,
    },
    {
      shipmentId: 'SC-240901-002',
      resourceType: 'Water',
      quantity: 500,
      unit: 'cans',
      from: 'Warehouse 01',
      fromCoords: coords('Warehouse 01'),
      to: 'West Shelter',
      toCoords: coords('West Shelter'),
      currentCoords: coords('East Zone'),
      vehicle: 'Truck Bravo-7',
      driver: 'Priya Sharma',
      status: 'Delayed',
      etaMinutes: 180,
      priority: 'Critical',
      routeState: 'Blocked',
      blockedReason: 'Road access flooded near East Zone bridge.',
      destinationType: 'Shelter',
      createdBy: rescue._id,
    },
    {
      shipmentId: 'SC-240901-003',
      resourceType: 'Food',
      quantity: 300,
      unit: 'packs',
      from: 'Warehouse 02',
      fromCoords: coords('Warehouse 02'),
      to: 'Camp 4',
      toCoords: coords('Camp 4'),
      currentCoords: coords('Camp 4'),
      vehicle: 'Van Charlie-3',
      driver: 'Sanjay Patel',
      status: 'Delivered',
      etaMinutes: 0,
      priority: 'High',
      routeState: 'Clear',
      destinationType: 'Camp',
      deliveredAt: new Date(now - 2 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
    {
      shipmentId: 'SC-240901-004',
      resourceType: 'Fuel',
      quantity: 150,
      unit: 'liters',
      from: 'Coastal Depot',
      fromCoords: coords('Coastal Depot'),
      to: 'Airport Triage',
      toCoords: coords('Airport Triage'),
      currentCoords: coords('Coastal Depot'),
      vehicle: 'Tanker Delta-2',
      driver: 'Meena Reddy',
      status: 'Queued',
      etaMinutes: 240,
      priority: 'High',
      routeState: 'Clear',
      destinationType: 'Zone',
      createdBy: admin._id,
    },
    {
      shipmentId: 'SC-240901-005',
      resourceType: 'Equipment',
      quantity: 5,
      unit: 'units',
      from: 'Central Hub',
      fromCoords: coords('Central Hub'),
      to: 'Zone 11 Clinic',
      toCoords: coords('Zone 11 Clinic'),
      currentCoords: midpoint(coords('Central Hub'), coords('Zone 11 Clinic')),
      vehicle: 'Ambulance Echo-1',
      driver: 'Dr. Arjun Nair',
      status: 'In Transit',
      etaMinutes: 30,
      priority: 'Critical',
      routeState: 'Watch',
      destinationType: 'Clinic',
      notes: 'Ventilators for Zone 11 ICU',
      createdBy: rescue._id,
    },
    {
      shipmentId: 'SC-240901-006',
      resourceType: 'Blankets',
      quantity: 400,
      unit: 'units',
      from: 'Warehouse 02',
      fromCoords: coords('Warehouse 02'),
      to: 'North Medical Post',
      toCoords: coords('North Medical Post'),
      currentCoords: midpoint(coords('Warehouse 02'), coords('North Medical Post')),
      vehicle: 'Truck Foxtrot-4',
      driver: 'Kavya Menon',
      status: 'In Transit',
      etaMinutes: 90,
      priority: 'Medium',
      routeState: 'Clear',
      destinationType: 'Clinic',
      createdBy: admin._id,
    },
    {
      shipmentId: 'SC-240901-007',
      resourceType: 'Medicine',
      quantity: 120,
      unit: 'bags',
      from: 'Central Hub',
      fromCoords: coords('Central Hub'),
      to: 'Harbor Relief Camp',
      toCoords: coords('Harbor Relief Camp'),
      currentCoords: midpoint(coords('Central Hub'), coords('Harbor Relief Camp')),
      vehicle: 'Truck Golf-9',
      driver: 'Rahul Singh',
      status: 'Rerouted',
      etaMinutes: 200,
      priority: 'High',
      routeState: 'Watch',
      blockedReason: 'Original highway under repair — using coastal road.',
      destinationType: 'Camp',
      createdBy: rescue._id,
    },
    {
      shipmentId: 'SC-240901-008',
      resourceType: 'Food',
      quantity: 600,
      unit: 'boxes',
      from: 'East Depot',
      fromCoords: coords('East Depot'),
      to: 'South District',
      toCoords: coords('South District'),
      currentCoords: coords('East Depot'),
      vehicle: 'Van Hotel-6',
      driver: 'Sunita Joshi',
      status: 'Queued',
      etaMinutes: 120,
      priority: 'Medium',
      routeState: 'Clear',
      destinationType: 'Zone',
      createdBy: admin._id,
    },
    {
      shipmentId: 'SC-240901-009',
      resourceType: 'Ambulance',
      quantity: 1,
      unit: 'vehicle',
      from: 'Central Hub',
      fromCoords: coords('Central Hub'),
      to: 'River Camp',
      toCoords: coords('River Camp'),
      currentCoords: midpoint(coords('Central Hub'), coords('River Camp')),
      vehicle: 'Ambulance India-1',
      driver: 'Dr. Pooja Das',
      status: 'In Transit',
      etaMinutes: 110,
      priority: 'Critical',
      routeState: 'Watch',
      destinationType: 'Camp',
      notes: 'Mobile surgical unit deployment',
      createdBy: rescue._id,
    },
    {
      shipmentId: 'SC-240901-010',
      resourceType: 'Water',
      quantity: 800,
      unit: 'tabs',
      from: 'North Warehouse',
      fromCoords: coords('North Warehouse'),
      to: 'Hill Base Camp',
      toCoords: coords('Hill Base Camp'),
      currentCoords: coords('Hill Base Camp'),
      vehicle: 'Truck Juliet-2',
      driver: 'Vikram Iyer',
      status: 'Delivered',
      etaMinutes: 0,
      priority: 'High',
      routeState: 'Clear',
      destinationType: 'Camp',
      deliveredAt: new Date(now - 5 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
    {
      shipmentId: 'SC-240901-011',
      resourceType: 'Medicine',
      quantity: 60,
      unit: 'units',
      from: 'Warehouse 01',
      fromCoords: coords('Warehouse 01'),
      to: 'Camp 4',
      toCoords: coords('Camp 4'),
      currentCoords: coords('Camp 4'),
      vehicle: 'Truck Kilo-5',
      driver: 'Ananya Rao',
      status: 'Delivered',
      etaMinutes: 0,
      priority: 'High',
      routeState: 'Clear',
      destinationType: 'Camp',
      deliveredAt: new Date(now - DAY),
      createdBy: rescue._id,
    },
    {
      shipmentId: 'SC-240901-012',
      resourceType: 'Fuel',
      quantity: 200,
      unit: 'liters',
      from: 'Coastal Depot',
      fromCoords: coords('Coastal Depot'),
      to: 'West Shelter',
      toCoords: coords('West Shelter'),
      currentCoords: midpoint(coords('Coastal Depot'), coords('West Shelter')),
      vehicle: 'Tanker Lima-3',
      driver: 'Suresh Babu',
      status: 'Delayed',
      etaMinutes: 300,
      priority: 'High',
      routeState: 'Blocked',
      blockedReason: 'Checkpoint delay due to flood zone access restrictions.',
      destinationType: 'Shelter',
      createdBy: admin._id,
    },
  ];

  await Supply.create(shipments);
  console.log(`Supply shipments seeded (${shipments.length} records)`);

  console.log('\n✅ Supply chain data seeded successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin:       admin@reliefos.com  / admin123');
  console.log('  Rescue Team: rescue@reliefos.com / rescue123\n');

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  mongoose.connection.close();
  process.exit(1);
});
