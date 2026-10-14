/**
 * scripts/seed-unified.js
 * -----------------------
 * Seeds the database with unified, realistic, production-grade disaster response data.
 * Guarantees 100% data consistency across:
 * - Operations Dashboard (/operations-dashboard)
 * - Resource Allocation (/resources)
 * - Predictive Analytics (/analytics)
 * - Supply Chain & Convoys (/supply-chain)
 * - Crisis Map & SOS Hub (/crisis-map, /sos-citizen)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User.model');
const Resource = require('../models/Resource.model');
const Supply = require('../models/Supply.model');
const SOS = require('../models/SOS.model');
const Alert = require('../models/Alert.model');

const seedUnifiedData = async () => {
  await connectDB();
  console.log('Connected to MongoDB for unified seeding...');

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Supply.deleteMany({}),
    SOS.deleteMany({}),
    Alert.deleteMany({}),
  ]);
  console.log('Cleared all prior collections.');

  // 2. Seed Users
  const [admin, rescueLead, dispatcher, citizen] = await User.create([
    {
      name: 'Col. Rajesh Verma',
      email: 'admin@reliefos.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91-98110-24510',
    },
    {
      name: 'Cmdr. Ananya Nair (Convoy Alpha)',
      email: 'rescue@reliefos.com',
      password: 'rescue123',
      role: 'rescue_team',
      phone: '+91-94470-33219',
    },
    {
      name: 'Vikram Joshi (Logistics Officer)',
      email: 'dispatcher@reliefos.com',
      password: 'dispatch123',
      role: 'rescue_team',
      phone: '+91-98200-55123',
    },
    {
      name: 'Suresh Kumar (Citizen Reporter)',
      email: 'citizen@reliefos.com',
      password: 'citizen123',
      role: 'citizen',
      phone: '+91-97451-99882',
    },
  ]);
  console.log('Seeded 4 core operational users.');

  // 3. Seed Realistic Unified Inventory across Core Depots
  // Depot A: Northern Strategic Hub (Calicut / Wayanad corridor: 11.6854, 76.1320)
  // Food: 8,500 kg | Water: 12,000 L | Medicine: 1,400 kits | Fuel: 3,500 L | Ambulances: 18 | Equipment: 4,200
  // Depot B: Forward Staging Center (11.5900, 76.0800)
  // Food: 7,200 kg | Water: 11,000 L | Medicine: 1,100 kits | Fuel: 2,800 L | Ambulances: 14 | Equipment: 24
  // Depot C: Southern Reserve Depot (11.4500, 76.2200)
  // Food: 4,300 kg | Water: 7,000 L | Medicine: 500 kits | Fuel: 1,900 L | Ambulances: 10 | Equipment: 18
  // Central Logistics Hub (Delhi Central): Strategic buffer
  // Coastal Maritime Depot (Mumbai Port): Heavy desalinators and marine supplies

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  const resourcesData = [
    // ── Depot A (Northern Strategic Hub) ──
    {
      type: 'Food',
      name: 'Ready-to-Eat High-Protein Ration Packs (Batch A-1)',
      quantity: 5000,
      unit: 'packs',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [
        { target: 'Zone A (Meppadi Emergency Camp)', quantity: 1500, notes: 'Initial Camp Drop', allocatedAt: new Date(Date.now() - 1 * DAY), allocatedBy: rescueLead._id },
      ],
    },
    {
      type: 'Food',
      name: 'Emergency High-Calorie Energy Bars (Batch A-2)',
      quantity: 3500,
      unit: 'boxes',
      status: 'Healthy',
      priority: 'Medium',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Water',
      name: 'Purified Canned Drinking Water 1L (Batch W-1)',
      quantity: 8000,
      unit: 'cans',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [
        { target: 'Zone A (Meppadi Emergency Camp)', quantity: 2000, notes: 'Safe water triage', allocatedAt: new Date(Date.now() - 2 * DAY), allocatedBy: rescueLead._id },
      ],
    },
    {
      type: 'Water',
      name: 'Heavy-Duty Reverse Osmosis Purification Jerrycans (5L)',
      quantity: 4000,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Medicine',
      name: 'Trauma & Suture Surgical Field Kits',
      quantity: 850,
      unit: 'kits',
      status: 'Healthy',
      priority: 'Critical',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [
        { target: 'Zone A (Meppadi Emergency Camp)', quantity: 150, notes: 'Emergency triage tent', allocatedAt: new Date(Date.now() - 6 * 3600000), allocatedBy: admin._id },
      ],
    },
    {
      type: 'Medicine',
      name: 'Broad-Spectrum Antibiotics & Antivirals Batch X-4',
      quantity: 550,
      unit: 'vials',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Fuel',
      name: 'High-Octane Generator Diesel Pods',
      quantity: 3500,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Ambulance',
      name: 'All-Terrain 4x4 Medical Rescue Ambulances',
      quantity: 18,
      unit: 'vehicles',
      status: 'Healthy',
      priority: 'Critical',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Equipment',
      name: 'Fleece Thermal Blankets & Bivvy Sacks',
      quantity: 4200,
      unit: 'units',
      status: 'Healthy',
      priority: 'Medium',
      location: 'Depot A (Northern Strategic Hub)',
      addedBy: admin._id,
      allocations: [],
    },

    // ── Depot B (Forward Staging Center) ──
    {
      type: 'Food',
      name: 'Nutritional Dry Ration Kits (Batch B-1)',
      quantity: 4200,
      unit: 'packs',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Food',
      name: 'Fortified Infant & Elderly Porridge Packs',
      quantity: 3000,
      unit: 'packs',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Water',
      name: 'Rapid Dissolution Water Purification Tablets',
      quantity: 6000,
      unit: 'tabs',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Water',
      name: 'Potable Water Bladders 500L',
      quantity: 5000,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Medicine',
      name: 'Emergency Splints, Cervical Collars & Tourniquets',
      quantity: 600,
      unit: 'kits',
      status: 'Healthy',
      priority: 'Critical',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Medicine',
      name: 'IV Saline & Dextrose Infusion Bags',
      quantity: 500,
      unit: 'bags',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Fuel',
      name: 'Refined Diesel for Water Pumps',
      quantity: 2800,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Ambulance',
      name: 'Rapid Extraction Off-Road Ambulances',
      quantity: 14,
      unit: 'vehicles',
      status: 'Healthy',
      priority: 'Critical',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Equipment',
      name: 'Autonomous Search & Rescue Thermal Drones',
      quantity: 24,
      unit: 'drones',
      status: 'Healthy',
      priority: 'Critical',
      location: 'Depot B (Forward Staging Center)',
      addedBy: admin._id,
      allocations: [],
    },

    // ── Depot C (Southern Reserve Depot) ──
    {
      type: 'Food',
      name: 'Emergency Dehydrated Meals (Batch C-1)',
      quantity: 4300,
      unit: 'packs',
      status: 'Healthy',
      priority: 'Medium',
      location: 'Depot C (Southern Reserve Depot)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Water',
      name: 'Emergency Spring Water Containers (Batch W-C)',
      quantity: 7000,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot C (Southern Reserve Depot)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Medicine',
      name: 'Sterile Burn Dressings & Antiseptic Packs',
      quantity: 500,
      unit: 'kits',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot C (Southern Reserve Depot)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Fuel',
      name: 'Emergency Vehicle Fuel Stock',
      quantity: 1900,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot C (Southern Reserve Depot)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Ambulance',
      name: 'Shuttle Transport Ambulances',
      quantity: 10,
      unit: 'vehicles',
      status: 'Healthy',
      priority: 'High',
      location: 'Depot C (Southern Reserve Depot)',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Equipment',
      name: 'Heavy-Duty Motorized Inflatable Rescue Boats',
      quantity: 18,
      unit: 'boats',
      status: 'Healthy',
      priority: 'Critical',
      location: 'Depot C (Southern Reserve Depot)',
      addedBy: admin._id,
      allocations: [],
    },

    // ── Central Logistics Hub (National Central Reserve) ──
    {
      type: 'Medicine',
      name: 'Portable ICU Mobile Ventilators',
      quantity: 45,
      unit: 'units',
      status: 'Critical',
      priority: 'Critical',
      location: 'Central Logistics Hub',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Water',
      name: 'Industrial Water Purification Systems',
      quantity: 15,
      unit: 'systems',
      status: 'Low',
      priority: 'High',
      location: 'Central Logistics Hub',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Food',
      name: 'Emergency Canned Protein Rations',
      quantity: 12000,
      unit: 'cans',
      status: 'Healthy',
      priority: 'Medium',
      location: 'Central Logistics Hub',
      addedBy: admin._id,
      allocations: [],
    },
    {
      type: 'Fuel',
      name: 'Heavy Reserve Turbine Fuel',
      quantity: 8500,
      unit: 'liters',
      status: 'Healthy',
      priority: 'High',
      location: 'Central Logistics Hub',
      addedBy: admin._id,
      allocations: [],
    },
  ];

  const createdResources = await Resource.create(resourcesData);
  console.log(`Seeded ${createdResources.length} realistic inventory items.`);

  // 4. Seed Unified Shipments / Active Missions
  const shipmentsData = [
    {
      shipmentId: 'SC-OP-1024',
      resourceType: 'Medicine',
      quantity: 200,
      unit: 'kits',
      from: 'Depot A (Northern Strategic Hub)',
      to: 'Zone A (Meppadi Emergency Camp)',
      fromCoords: { lat: 11.6854, lng: 76.1320 },
      toCoords: { lat: 11.5564, lng: 76.1320 },
      currentCoords: { lat: 11.6050, lng: 76.1320 },
      vehicle: 'Heavy Tactical Transport #1024',
      driver: 'Lead Cmdr. Roy (Convoy Alpha)',
      status: 'In Transit',
      progress: 68,
      etaMinutes: 32,
      etaLabel: '32 mins',
      priority: 'Critical',
      routeState: 'Clear',
      blockedReason: '',
      destinationType: 'Camp',
      notes: 'Priority air-supported convoy carrying surgical field kits and emergency plasma.',
    },
    {
      shipmentId: 'SC-OP-1025',
      resourceType: 'Food',
      quantity: 2500,
      unit: 'packs',
      from: 'Depot B (Forward Staging Center)',
      to: 'Zone B (Chooralmala Disaster Sector)',
      fromCoords: { lat: 11.5900, lng: 76.0800 },
      toCoords: { lat: 11.5320, lng: 76.1750 },
      currentCoords: { lat: 11.5600, lng: 76.1280 },
      vehicle: 'All-Terrain Carrier #1025',
      driver: 'Capt. Ananya Nair (Convoy Bravo)',
      status: 'In Transit',
      progress: 45,
      etaMinutes: 48,
      etaLabel: '48 mins',
      priority: 'High',
      routeState: 'Clear',
      blockedReason: '',
      destinationType: 'Zone',
      notes: 'High-density ration packs dispatched to cut-off bridge sector.',
    },
    {
      shipmentId: 'SC-OP-1026',
      resourceType: 'Medicine',
      quantity: 150,
      unit: 'kits',
      from: 'Depot C (Southern Reserve Depot)',
      to: 'Zone C (Mundakkai Cut-off Outpost)',
      fromCoords: { lat: 11.4500, lng: 76.2200 },
      toCoords: { lat: 11.5180, lng: 76.2100 },
      currentCoords: { lat: 11.4850, lng: 76.2150 },
      vehicle: 'Aero Drop Air-Copter #1026',
      driver: 'Flight Lt. Karan (Air Wing 3)',
      status: 'Rerouted',
      progress: 80,
      etaMinutes: 18,
      etaLabel: '18 mins',
      priority: 'Critical',
      routeState: 'Blocked',
      blockedReason: 'Primary bridge collapsed; rerouted via Eastern Valley Ridge.',
      destinationType: 'Zone',
      notes: 'Trauma kits and burn dressings via helicopter drop.',
    },
    {
      shipmentId: 'SC-OP-1027',
      resourceType: 'Water',
      quantity: 4000,
      unit: 'liters',
      from: 'Depot A (Northern Strategic Hub)',
      to: 'Zone B (Chooralmala Disaster Sector)',
      fromCoords: { lat: 11.6854, lng: 76.1320 },
      toCoords: { lat: 11.5320, lng: 76.1750 },
      currentCoords: { lat: 11.6854, lng: 76.1320 },
      vehicle: 'Heavy Water Tanker WT-4',
      driver: 'Sgt. Farooq (Rapid Water Supply)',
      status: 'Queued',
      progress: 10,
      etaMinutes: 75,
      etaLabel: '1 hr 15 mins',
      priority: 'High',
      routeState: 'Watch',
      blockedReason: '',
      destinationType: 'Zone',
      notes: 'Bulk potable water supply for decontamination and hydration.',
    },
    {
      shipmentId: 'SC-OP-1028',
      resourceType: 'Equipment',
      quantity: 12,
      unit: 'drones',
      from: 'Depot B (Forward Staging Center)',
      to: 'Zone A (Meppadi Emergency Camp)',
      fromCoords: { lat: 11.5900, lng: 76.0800 },
      toCoords: { lat: 11.5564, lng: 76.1320 },
      currentCoords: { lat: 11.5564, lng: 76.1320 },
      vehicle: 'Tech Transporter TT-1',
      driver: 'S.A.R. Tech Crew Beta',
      status: 'Delivered',
      progress: 100,
      etaMinutes: 0,
      etaLabel: 'Delivered',
      priority: 'Medium',
      routeState: 'Clear',
      blockedReason: '',
      destinationType: 'Camp',
      deliveredAt: new Date(Date.now() - 2 * 3600000),
      notes: 'Thermal search drones successfully staged at Camp Meppadi base.',
    },
    {
      shipmentId: 'SC-OP-1029',
      resourceType: 'Fuel',
      quantity: 1200,
      unit: 'liters',
      from: 'Depot C (Southern Reserve Depot)',
      to: 'Zone C (Mundakkai Cut-off Outpost)',
      fromCoords: { lat: 11.4500, lng: 76.2200 },
      toCoords: { lat: 11.5180, lng: 76.2100 },
      currentCoords: { lat: 11.4700, lng: 76.2150 },
      vehicle: 'Hazardous Cargo Fuel Carrier',
      driver: 'Driver Ramesh (Fuel Logistics)',
      status: 'Delayed',
      progress: 35,
      etaMinutes: 95,
      etaLabel: '1 hr 35 mins',
      priority: 'High',
      routeState: 'Blocked',
      blockedReason: 'Debris flow across Route NH-766.',
      destinationType: 'Zone',
      notes: 'Backup diesel for field hospital power generators.',
    },
  ];

  const createdShipments = await Supply.create(shipmentsData);
  console.log(`Seeded ${createdShipments.length} live tactical shipments.`);

  // 5. Seed Real Unified SOS Emergency Tickets
  const sosData = [
    {
      submittedBy: citizen._id,
      location: {
        type: 'Point',
        coordinates: [76.1320, 11.5564],
        label: 'Meppadi Primary Health Centre, Wayanad',
      },
      region: 'Wayanad',
      crisisType: 'medical',
      status: 'in_progress',
      severity: 'critical',
      message: 'Flash flooding swept access bridge. 140 people stranded, 18 with severe trauma requiring suture and intravenous hydration.',
      assignedTeam: 'Lead Cmdr. Roy (Convoy Alpha)',
    },
    {
      submittedBy: citizen._id,
      location: {
        type: 'Point',
        coordinates: [76.1750, 11.5320],
        label: 'Chooralmala Town Junction Sector B',
      },
      region: 'Wayanad',
      crisisType: 'flood',
      status: 'in_progress',
      severity: 'critical',
      message: 'Massive landslide blocking downhill evacuation. Severe shortage of high-calorie ration packs and potable water.',
      assignedTeam: 'Capt. Ananya Nair (Convoy Bravo)',
    },
    {
      submittedBy: citizen._id,
      location: {
        type: 'Point',
        coordinates: [76.2100, 11.5180],
        label: 'Mundakkai Estate Settlement',
      },
      region: 'Wayanad',
      crisisType: 'earthquake',
      status: 'in_progress',
      severity: 'critical',
      message: 'Settlement isolated by mud torrents. Power completely off. Emergency generator fuel depleted; medical outpost at risk.',
      assignedTeam: 'Flight Lt. Karan (Air Wing 3)',
    },
    {
      submittedBy: citizen._id,
      location: {
        type: 'Point',
        coordinates: [76.0250, 11.6050],
        label: 'Vythiri Hill Outpost',
      },
      region: 'Wayanad',
      crisisType: 'fuel',
      status: 'pending',
      severity: 'medium',
      message: 'Temporary relief shelter running on final 40L diesel. Requesting backup fuel and warm blankets.',
      assignedTeam: 'Depot B Reserve Team',
    },
    {
      submittedBy: citizen._id,
      location: {
        type: 'Point',
        coordinates: [76.1320, 11.6854],
        label: 'Sulthan Bathery Evacuation Staging Hub',
      },
      region: 'Wayanad',
      crisisType: 'food',
      status: 'resolved',
      severity: 'low',
      message: 'Thermal search drones arrived safely. Camp stabilized with clean water and emergency food.',
      assignedTeam: 'S.A.R. Tech Crew Beta',
    },
  ];

  const createdSOS = await SOS.create(sosData);
  console.log(`Seeded ${createdSOS.length} real tactical SOS reports.`);

  // 6. Seed High-Priority Critical Alerts
  const alertsData = [
    {
      title: 'CRITICAL HAZARD: Route NH-766 Bridge Collapse',
      message: 'Meppadi-Chooralmala primary bridge structure compromised by heavy mudflow. Priority rerouting active via Eastern Ridge bypass.',
      type: 'critical',
      affectedCity: 'Wayanad (Chooralmala)',
      createdBy: admin._id,
      createdAt: new Date(Date.now() - 4 * 3600000),
    },
    {
      title: 'WEATHER ADVISORY: Red Alert High Rainfall Expected',
      message: 'Continuous torrential rainfall forecasted for next 18 hours across Western Ghats sector. Pre-staging all high-clearance 4x4 convoys.',
      type: 'warning',
      affectedCity: 'Kerala High Ranges',
      createdBy: admin._id,
      createdAt: new Date(Date.now() - 8 * 3600000),
    },
  ];

  await Alert.create(alertsData);
  console.log('Seeded high-priority operational alerts.');

  console.log('----------------------------------------------------');
  console.log('UNIFIED ENTERPRISE DISASTER DATASET SEEDING COMPLETE');
  console.log('----------------------------------------------------');
  process.exit(0);
};

seedUnifiedData().catch((err) => {
  console.error('Unified seeding failed:', err);
  process.exit(1);
});
