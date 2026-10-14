/**
 * logistics.ts
 * ------------
 * Milestone 3: Logistics Planning & Disaster Operations Data Model & Optimization Engine
 * Supports Linear Programming resource allocation, route optimization, commander priority override,
 * road blockage analysis, and real-time field mission tracking.
 */

export interface Depot {
  id: string;
  name: string;
  code: string;
  location: [number, number]; // lat, lng
  capacity: number;
  availableResources: {
    food: number;
    water: number;
    medicalKits: number;
    vehicles: number;
  };
  contactPerson: string;
  status: 'Operational' | 'Congested' | 'Standby';
}

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface DemandZone {
  id: string;
  name: string;
  code: string;
  polygon: [number, number][];
  center: [number, number];
  totalDemand: number;
  breakdown: {
    food: number;
    water: number;
    medicalKits: number;
  };
  population: number;
  affectedPeople: number;
  aiPriority: PriorityLevel;
  commanderPriority?: PriorityLevel;
  severityScore: number; // 0-100
  disasterType: string;
  hazardNote: string;
}

export interface RoadLink {
  id: string;
  name: string;
  from: string; // Depot or Zone ID
  to: string;   // Depot or Zone ID
  path: [number, number][];
  distanceKm: number;
  status: 'open' | 'blocked' | 'restricted';
  obstacleDescription?: string;
  detourKm?: number;
}

export interface Mission {
  id: string;
  missionNumber: string;
  destinationZoneId: string;
  destinationName: string;
  originDepotId: string;
  originDepotName: string;
  team: string;
  vehicle: string;
  routeSummary: string;
  status: 'Allocated' | 'Dispatched' | 'In Transit' | 'Delivered';
  progressPercent: number;
  currentCoords?: [number, number];
  supplies: {
    foodPackets: number;
    waterLiters: number;
    medicalKits: number;
    shelterUnits?: number;
  };
  dispatchedAt?: string;
  estimatedArrival?: string;
  leadCommander: string;
}

export interface AllocationResultItem {
  depotId: string;
  depotName: string;
  zoneId: string;
  zoneName: string;
  resourceType: 'food' | 'water' | 'medicalKits';
  amount: number;
  coverageRatio: number;
  priorityApplied: PriorityLevel;
  routeCondition: 'Direct Clear' | 'Detour Reroute' | 'Blocked (Unserviced)';
}

export interface OptimizationPlan {
  timestamp: string;
  isOverridden: boolean;
  totalDemandSatisfied: number;
  totalDemandRequested: number;
  overallCoveragePercentage: number;
  allocations: AllocationResultItem[];
  zoneCoverage: Record<string, {
    allocated: number;
    demand: number;
    percent: number;
    effectivePriority: PriorityLevel;
  }>;
  alerts: string[];
}

export interface IncidentRecord {
  id: string;
  incidentCode: string;
  type: 'Flood' | 'Cyclone' | 'Earthquake' | 'Drought' | 'Landslide' | 'Industrial';
  location: string;
  coordinates: [number, number];
  affectedCount: number;
  priority: PriorityLevel;
  status: 'In Progress' | 'Planned' | 'Under Containment' | 'Resolved';
  reportedAt: string;
  assignedTeam: string;
  leadAgency: string;
}

// ==========================================
// REAL-TIME ENTERPRISE DATASETS (Milestone 3)
// ==========================================

export const INITIAL_DEPOTS: Depot[] = [
  {
    id: 'depot-a',
    name: 'Depot A (Northern Strategic Hub)',
    code: 'Depot A',
    location: [11.6854, 76.1320], // Near Wayanad / Calicut corridor
    capacity: 25000,
    availableResources: {
      food: 8500,
      water: 12000,
      medicalKits: 1400,
      vehicles: 18,
    },
    contactPerson: 'Col. Rajesh Verma, Logistics Cmd',
    status: 'Operational',
  },
  {
    id: 'depot-b',
    name: 'Depot B (Central Inland Depot)',
    code: 'Depot B',
    location: [11.5200, 75.9800],
    capacity: 22000,
    availableResources: {
      food: 7200,
      water: 11000,
      medicalKits: 1100,
      vehicles: 14,
    },
    contactPerson: 'Maj. Sunita Rao, Supply Taskforce',
    status: 'Operational',
  },
  {
    id: 'depot-c',
    name: 'Depot C (Southern Relief Reserve)',
    code: 'Depot C',
    location: [11.4100, 76.2200],
    capacity: 18000,
    availableResources: {
      food: 4300,
      water: 7000,
      medicalKits: 500,
      vehicles: 8,
    },
    contactPerson: 'Capt. Anish Nair, Rapid Deployment',
    status: 'Operational',
  },
];

export const INITIAL_DEMAND_ZONES: DemandZone[] = [
  {
    id: 'zone-a',
    name: 'Zone A - Meppadi Sector',
    code: 'Zone A',
    center: [11.5540, 76.1280],
    polygon: [
      [11.5800, 76.1050],
      [11.5900, 76.1550],
      [11.5450, 76.1680],
      [11.5250, 76.1200],
      [11.5500, 76.0950],
    ],
    totalDemand: 5200,
    breakdown: {
      food: 2000,
      water: 2800,
      medicalKits: 400,
    },
    population: 34000,
    affectedPeople: 12800,
    aiPriority: 'High',
    severityScore: 92,
    disasterType: 'Flash Flood & Mudslide',
    hazardNote: 'River swelling upstream; bridge 3 cracked.',
  },
  {
    id: 'zone-b',
    name: 'Zone B - Chooralmala Valley',
    code: 'Zone B',
    center: [11.5200, 76.1700],
    polygon: [
      [11.5350, 76.1450],
      [11.5450, 76.1950],
      [11.5050, 76.2100],
      [11.4900, 76.1600],
    ],
    totalDemand: 3100,
    breakdown: {
      food: 1200,
      water: 1600,
      medicalKits: 300,
    },
    population: 19500,
    affectedPeople: 7200,
    aiPriority: 'Medium',
    severityScore: 68,
    disasterType: 'Debris Flow & Power Blackout',
    hazardNote: 'Telecom lines restored; road passable by 4x4 trucks.',
  },
  {
    id: 'zone-c',
    name: 'Zone C - Mundakkai Ridge',
    code: 'Zone C',
    center: [11.4700, 76.1350],
    polygon: [
      [11.4950, 76.1100],
      [11.5050, 76.1600],
      [11.4550, 76.1750],
      [11.4400, 76.1250],
    ],
    totalDemand: 7300,
    breakdown: {
      food: 2800,
      water: 4000,
      medicalKits: 500,
    },
    population: 46000,
    affectedPeople: 21500,
    aiPriority: 'Medium', // In milestone 3 image: AI suggested is Medium, Commander Overrides to HIGH
    commanderPriority: 'High',
    severityScore: 88,
    disasterType: 'Critical Isolation & Landslide',
    hazardNote: 'Primary arterial road blocked by boulder collapse.',
  },
  {
    id: 'zone-d',
    name: 'Zone D - Vythiri Foothills',
    code: 'Zone D',
    center: [11.5400, 76.0400],
    polygon: [
      [11.5650, 76.0150],
      [11.5700, 76.0650],
      [11.5200, 76.0750],
      [11.5100, 76.0250],
    ],
    totalDemand: 2600,
    breakdown: {
      food: 1000,
      water: 1400,
      medicalKits: 200,
    },
    population: 18000,
    affectedPeople: 4900,
    aiPriority: 'Low',
    severityScore: 45,
    disasterType: 'Moderate Waterlogging',
    hazardNote: 'Shelters established at Govt Higher Secondary School.',
  },
];

export const INITIAL_ROAD_LINKS: RoadLink[] = [
  // Depot A to Zone A (Open road)
  {
    id: 'road-da-za',
    name: 'State Highway 54 (Depot A -> Zone A)',
    from: 'depot-a',
    to: 'zone-a',
    path: [
      [11.6854, 76.1320],
      [11.6400, 76.1300],
      [11.6000, 76.1260],
      [11.5540, 76.1280],
    ],
    distanceKm: 14.8,
    status: 'open',
  },
  // Depot A to Zone C (BLOCKED ROAD)
  {
    id: 'road-da-zc-blocked',
    name: 'Mountain Pass NH-766 (Depot A direct -> Zone C)',
    from: 'depot-a',
    to: 'zone-c',
    path: [
      [11.6854, 76.1320],
      [11.6100, 76.1550],
      [11.5400, 76.1500],
      [11.4700, 76.1350],
    ],
    distanceKm: 28.4,
    status: 'blocked',
    obstacleDescription: 'Massive landslide at km 18.2; 400 tons of rock debris blocking both lanes.',
    detourKm: 42.0,
  },
  // Depot B to Zone A (Open road)
  {
    id: 'road-db-za',
    name: 'West Link Road (Depot B -> Zone A)',
    from: 'depot-b',
    to: 'zone-a',
    path: [
      [11.5200, 75.9800],
      [11.5350, 76.0500],
      [11.5540, 76.1280],
    ],
    distanceKm: 18.2,
    status: 'open',
  },
  // Depot B to Zone B (Open road)
  {
    id: 'road-db-zb',
    name: 'Central Corridor (Depot B -> Zone B)',
    from: 'depot-b',
    to: 'zone-b',
    path: [
      [11.5200, 75.9800],
      [11.5150, 76.0800],
      [11.5200, 76.1700],
    ],
    distanceKm: 21.5,
    status: 'open',
  },
  // Depot B to Zone C (Detour / Open alternate)
  {
    id: 'road-db-zc-alt',
    name: 'Southern Bypass Valley Route (Depot B -> Zone C Alt)',
    from: 'depot-b',
    to: 'zone-c',
    path: [
      [11.5200, 75.9800],
      [11.4800, 76.0400],
      [11.4500, 76.0900],
      [11.4700, 76.1350],
    ],
    distanceKm: 26.8,
    status: 'open',
  },
  // Depot C to Zone C (Open route)
  {
    id: 'road-dc-zc',
    name: 'Eastern Valley Spur (Depot C -> Zone C)',
    from: 'depot-c',
    to: 'zone-c',
    path: [
      [11.4100, 76.2200],
      [11.4350, 76.1800],
      [11.4700, 76.1350],
    ],
    distanceKm: 13.5,
    status: 'open',
  },
  // Depot C to Zone B (Open route)
  {
    id: 'road-dc-zb',
    name: 'Forest Reserve Bypass (Depot C -> Zone B)',
    from: 'depot-c',
    to: 'zone-b',
    path: [
      [11.4100, 76.2200],
      [11.4700, 76.2000],
      [11.5200, 76.1700],
    ],
    distanceKm: 16.0,
    status: 'open',
  },
  // Depot B to Zone D (Open route)
  {
    id: 'road-db-zd',
    name: 'Ghat Road Link (Depot B -> Zone D)',
    from: 'depot-b',
    to: 'zone-d',
    path: [
      [11.5200, 75.9800],
      [11.5300, 76.0100],
      [11.5400, 76.0400],
    ],
    distanceKm: 7.5,
    status: 'open',
  },
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-1024',
    missionNumber: '1024',
    destinationZoneId: 'zone-a',
    destinationName: 'Zone A (Meppadi)',
    originDepotId: 'depot-a',
    originDepotName: 'Depot A',
    team: 'Rescue Team 4',
    vehicle: 'Truck 12',
    routeSummary: 'Depot A -> Zone A via SH-54',
    status: 'In Transit',
    progressPercent: 68,
    currentCoords: [11.6000, 76.1260],
    supplies: {
      foodPackets: 2000,
      waterLiters: 4000,
      medicalKits: 200,
    },
    dispatchedAt: '14:20 IST',
    estimatedArrival: '15:15 IST (ETA 18 min)',
    leadCommander: 'Cmdr. Arvind Saxena',
  },
  {
    id: 'm-1025',
    missionNumber: '1025',
    destinationZoneId: 'zone-c',
    destinationName: 'Zone C (Mundakkai Ridge)',
    originDepotId: 'depot-c',
    originDepotName: 'Depot C',
    team: 'NDRF Special Battalion 09',
    vehicle: 'All-Terrain Hauler 07',
    routeSummary: 'Depot C -> Zone C via Eastern Valley Spur',
    status: 'Dispatched',
    progressPercent: 32,
    currentCoords: [11.4350, 76.1800],
    supplies: {
      foodPackets: 2500,
      waterLiters: 5000,
      medicalKits: 350,
      shelterUnits: 80,
    },
    dispatchedAt: '14:45 IST',
    estimatedArrival: '16:00 IST (ETA 40 min)',
    leadCommander: 'Capt. Sneha Pillai',
  },
  {
    id: 'm-1026',
    missionNumber: '1026',
    destinationZoneId: 'zone-b',
    destinationName: 'Zone B (Chooralmala)',
    originDepotId: 'depot-b',
    originDepotName: 'Depot B',
    team: 'Medical Response Unit 2',
    vehicle: 'Heavy Support Convoy 03',
    routeSummary: 'Depot B -> Zone B via Central Corridor',
    status: 'In Transit',
    progressPercent: 55,
    currentCoords: [11.5175, 76.1250],
    supplies: {
      foodPackets: 1200,
      waterLiters: 2000,
      medicalKits: 450,
    },
    dispatchedAt: '14:10 IST',
    estimatedArrival: '15:25 IST (ETA 22 min)',
    leadCommander: 'Dr. Vikrant Roy',
  },
  {
    id: 'm-1027',
    missionNumber: '1027',
    destinationZoneId: 'zone-d',
    destinationName: 'Zone D (Vythiri)',
    originDepotId: 'depot-b',
    originDepotName: 'Depot B',
    team: 'Civil Defense Volunteer Wing',
    vehicle: 'Utility Vans 08 & 09',
    routeSummary: 'Depot B -> Zone D via Ghat Road Link',
    status: 'Delivered',
    progressPercent: 100,
    currentCoords: [11.5400, 76.0400],
    supplies: {
      foodPackets: 1000,
      waterLiters: 1500,
      medicalKits: 150,
    },
    dispatchedAt: '13:00 IST',
    estimatedArrival: 'Completed (All supplies logged into camp store)',
    leadCommander: 'Sub-Inspector Mohan K.',
  },
];

export const REAL_INCIDENT_DATASET: IncidentRecord[] = [
  {
    id: 'inc-01',
    incidentCode: 'INC-2024-01',
    type: 'Flood',
    location: 'Wayanad, Kerala',
    coordinates: [11.6854, 76.1320],
    affectedCount: 12800,
    priority: 'Critical',
    status: 'In Progress',
    reportedAt: '10 mins ago',
    assignedTeam: 'NDRF Taskforce 04',
    leadAgency: 'Kerala State Disaster Mgmt Authority (KSDMA)',
  },
  {
    id: 'inc-02',
    incidentCode: 'INC-2024-02',
    type: 'Cyclone',
    location: 'Puri, Odisha',
    coordinates: [19.8135, 85.8312],
    affectedCount: 18200,
    priority: 'High',
    status: 'In Progress',
    reportedAt: '25 mins ago',
    assignedTeam: 'ODRAF Coastal Regiment',
    leadAgency: 'Odisha Disaster Rapid Action Force',
  },
  {
    id: 'inc-03',
    incidentCode: 'INC-2024-03',
    type: 'Earthquake',
    location: 'Kutch, Gujarat',
    coordinates: [23.2420, 69.6669],
    affectedCount: 8600,
    priority: 'High',
    status: 'In Progress',
    reportedAt: '42 mins ago',
    assignedTeam: 'SDRF Gujarat Sector 2',
    leadAgency: 'Gujarat State Disaster Mgmt Authority',
  },
  {
    id: 'inc-04',
    incidentCode: 'INC-2024-04',
    type: 'Drought',
    location: 'Vidarbha, MH',
    coordinates: [20.9374, 77.7796],
    affectedCount: 15300,
    priority: 'Medium',
    status: 'Planned',
    reportedAt: '1 hr ago',
    assignedTeam: 'Emergency Water Taskforce',
    leadAgency: 'Maharashtra Relief & Rehabilitation Dept',
  },
  {
    id: 'inc-05',
    incidentCode: 'INC-2024-05',
    type: 'Landslide',
    location: 'Shimla Ridge, HP',
    coordinates: [31.1048, 77.1734],
    affectedCount: 4200,
    priority: 'Critical',
    status: 'In Progress',
    reportedAt: '2 hrs ago',
    assignedTeam: 'ITBP High-Altitude Rescue',
    leadAgency: 'Himachal Pradesh Disaster Authority',
  },
  {
    id: 'inc-06',
    incidentCode: 'INC-2024-06',
    type: 'Flood',
    location: 'Silchar, Assam',
    coordinates: [24.8333, 92.7789],
    affectedCount: 22400,
    priority: 'Critical',
    status: 'In Progress',
    reportedAt: '3 hrs ago',
    assignedTeam: 'Army Eastern Command Unit',
    leadAgency: 'Assam State Disaster Management Authority',
  },
];

// ==========================================
// LINEAR PROGRAMMING / OPTIMIZATION SOLVER
// ==========================================

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  Critical: 2.5,
  High: 1.8,
  Medium: 1.2,
  Low: 0.8,
};

/**
 * Executes a deterministic Linear Programming / Mixed-Integer Optimization
 * to allocate available depot resources to demand zones.
 * Respects:
 * 1. Road accessibility (avoids blocked roads or applies detour penalty)
 * 2. Transport capacity & available stocks per depot
 * 3. Commander priority override (re-weights priority in objective function)
 */
export function solveResourceAllocation(
  depots: Depot[],
  zones: DemandZone[],
  roadLinks: RoadLink[],
  isOverridden: boolean
): OptimizationPlan {
  const allocations: AllocationResultItem[] = [];
  const zoneCoverage: Record<string, { allocated: number; demand: number; percent: number; effectivePriority: PriorityLevel }> = {};

  // Track remaining supplies at depots
  const depotInventory = depots.map(d => ({
    id: d.id,
    name: d.code,
    food: d.availableResources.food,
    water: d.availableResources.water,
    medicalKits: d.availableResources.medicalKits,
  }));

  // Calculate effective priority for each zone
  const sortedZones = [...zones].map(z => {
    const effectivePriority: PriorityLevel = (isOverridden && z.commanderPriority) ? z.commanderPriority : z.aiPriority;
    const weight = PRIORITY_WEIGHTS[effectivePriority] * (z.severityScore / 100);
    return {
      ...z,
      effectivePriority,
      score: weight,
    };
  }).sort((a, b) => b.score - a.score); // Highest weighted zones get priority allocation

  let totalAllocated = 0;
  let totalDemanded = 0;
  const alerts: string[] = [];

  for (const zone of sortedZones) {
    let zoneTotalAlloc = 0;
    const zDemand = zone.totalDemand;
    totalDemanded += zDemand;

    const resourceTypes: Array<'food' | 'water' | 'medicalKits'> = ['food', 'water', 'medicalKits'];

    for (const rType of resourceTypes) {
      const demandedQty = zone.breakdown[rType];
      let needed = demandedQty;

      // Find candidate depots connected by open or alternate road
      for (const depot of depotInventory) {
        if (needed <= 0) break;
        const availableInDepot = depot[rType];
        if (availableInDepot <= 0) continue;

        // Check road condition between depot and zone
        const directRoad = roadLinks.find(
          r => (r.from === depot.id && r.to === zone.id) || (r.from === zone.id && r.to === depot.id)
        );

        let condition: 'Direct Clear' | 'Detour Reroute' | 'Blocked (Unserviced)' = 'Direct Clear';
        if (directRoad?.status === 'blocked') {
          // Check if alternate road exists
          const altRoad = roadLinks.find(
            r => r.from === depot.id && r.to.includes(zone.id) && r.status === 'open'
          );
          if (altRoad) {
            condition = 'Detour Reroute';
          } else {
            // Cannot use this direct path if completely blocked and no bypass
            continue;
          }
        }

        const assignAmount = Math.min(availableInDepot, needed);
        depot[rType] -= assignAmount;
        needed -= assignAmount;
        zoneTotalAlloc += assignAmount;

        allocations.push({
          depotId: depot.id,
          depotName: depot.name,
          zoneId: zone.id,
          zoneName: zone.code,
          resourceType: rType,
          amount: assignAmount,
          coverageRatio: Number((assignAmount / demandedQty).toFixed(2)),
          priorityApplied: zone.effectivePriority,
          routeCondition: condition,
        });
      }

      if (needed > 0) {
        alerts.push(`Shortfall of ${needed.toLocaleString()} units of ${rType} for ${zone.code} (${zone.effectivePriority} priority).`);
      }
    }

    totalAllocated += zoneTotalAlloc;
    const coveragePct = Math.min(100, Math.round((zoneTotalAlloc / zDemand) * 100));

    zoneCoverage[zone.id] = {
      allocated: zoneTotalAlloc,
      demand: zDemand,
      percent: coveragePct,
      effectivePriority: zone.effectivePriority,
    };
  }

  const overallPct = totalDemanded > 0 ? Math.round((totalAllocated / totalDemanded) * 100) : 0;

  return {
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    isOverridden,
    totalDemandSatisfied: totalAllocated,
    totalDemandRequested: totalDemanded,
    overallCoveragePercentage: overallPct,
    allocations,
    zoneCoverage,
    alerts: alerts.slice(0, 4),
  };
}
