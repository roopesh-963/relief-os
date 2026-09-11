const CACHE = new Map();
const DEFAULT_NEWS_QUERY = '(earthquake OR flood OR wildfire OR storm OR cyclone OR hurricane OR landslide OR evacuation OR disaster)';
const CRISIS_KEYWORDS = [
  'earthquake',
  'quake',
  'tremor',
  'flood',
  'wildfire',
  'cyclone',
  'hurricane',
  'typhoon',
  'tornado',
  'landslide',
  'evacuation',
  'disaster',
  'emergency',
  'aftershock',
  'tsunami',
  'eruption',
  'volcanic',
  'severe weather',
];
const USGS_FEED_URL =
  process.env.USGS_EARTHQUAKE_URL ||
  process.env.usgs_earthquick_url ||
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || process.env.Weather_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY || process.env.news_api;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.google_map_api;

const getCache = (key) => {
  const cached = CACHE.get(key);
  if (!cached || cached.expiresAt < Date.now()) {
    CACHE.delete(key);
    return null;
  }

  return cached.value;
};

const setCache = (key, value, ttlMs) => {
  CACHE.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
};

const withCache = async (key, ttlMs, factory) => {
  const cached = getCache(key);
  if (cached) {
    return cached;
  }

  const value = await factory();
  return setCache(key, value, ttlMs);
};

const fetchJson = async (url, options = {}, timeoutMs = 9000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Request failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const toRadians = (value) => (value * Math.PI) / 180;

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatTemperature = (value) => `${Math.round(value)}C`;
const formatWind = (value) => `${Math.round(value * 3.6)} km/h`;
const formatPrecipitation = (rainAmount) => `${Math.round(rainAmount)} mm`;

const mapOpenWeatherAqi = (aqiValue) => {
  // OpenWeather returns 1..5. Convert to a more familiar 0..500 scale.
  const mapping = {
    1: 35,
    2: 75,
    3: 125,
    4: 180,
    5: 250,
  };

  return mapping[aqiValue] || 50;
};

const toMarkerType = (magnitude) => {
  if (magnitude >= 6) {
    return 'critical';
  }

  if (magnitude >= 4.5) {
    return 'warning';
  }

  return 'stable';
};

const extractCountry = (components = []) => {
  return components.find((component) => component.types?.includes('country'))?.long_name || 'Unknown';
};

const extractLocality = (components = []) => {
  const preferredTypes = [
    'locality',
    'administrative_area_level_2',
    'administrative_area_level_1',
    'postal_town',
    'sublocality',
  ];

  for (const type of preferredTypes) {
    const match = components.find((component) => component.types?.includes(type));
    if (match) {
      return match.long_name;
    }
  }

  return null;
};

const normalizeEarthquakeFeature = (feature) => {
  const [longitude, latitude, depth = 0] = feature.geometry?.coordinates || [0, 0, 0];
  const magnitude = Number(feature.properties?.mag || 0);
  const place = feature.properties?.place || 'Unspecified seismic event';

  return {
    id: feature.id,
    label: place,
    position: [latitude, longitude],
    type: toMarkerType(magnitude),
    role: 'city',
    magnitude,
    depthKm: depth,
    occurredAt: feature.properties?.time,
    sourceUrl: feature.properties?.url,
    tsunami: Boolean(feature.properties?.tsunami),
    significance: feature.properties?.sig || 0,
  };
};

const fetchEarthquakes = async () => {
  return withCache('usgs:all_day', 60 * 1000, async () => {
    const feed = await fetchJson(USGS_FEED_URL);
    return (feed.features || [])
      .map(normalizeEarthquakeFeature)
      .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0));
  });
};

const filterNewsArticles = (articles, options = {}) => {
  const contextTerms = (options.contextTerms || [])
    .map((term) => String(term || '').trim().toLowerCase())
    .filter((term) => term.length >= 3);
  const crisisTerms = (options.crisisTerms || CRISIS_KEYWORDS).map((term) => term.toLowerCase());

  return articles.filter((article) => {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    const matchesCrisis = crisisTerms.some((term) => text.includes(term));
    const matchesContext = contextTerms.length === 0 || contextTerms.some((term) => text.includes(term));
    return matchesCrisis && matchesContext;
  });
};

const FALLBACK_CRISIS_HEADLINES = [
  {
    title: 'Delhi Building Collapse: NDRF and Civil Defense Teams Deploy Canine Units and Thermal Cutters in Mustafabad',
    description: 'Search and rescue teams have extricated trapped survivors following the multi-story structure collapse. Emergency trauma supplies dispatched from Central Hub.',
    source: 'Delhi Emergency Services',
    url: 'https://reliefos.org/updates/delhi-building-collapse',
    imageUrl: null,
  },
  {
    title: 'Nepal Seismic & Landslide Alert: Responders Mobilize in Remote Hill Districts After Shocks and Mudslides',
    description: 'High-altitude mountain rescue teams continue clearing boulder obstructions along mountain routes. Hill Base Camp pre-positions cold-weather shelter packs.',
    source: 'Himalayan Disaster Relay',
    url: 'https://reliefos.org/updates/nepal-disaster-alert',
    imageUrl: null,
  },
  {
    title: 'Assam Flood Crisis: Brahmaputra Overflows Inundating 18 Districts; Indian Army Activates 140 Relief Shelters',
    description: 'Over 350,000 residents moved to elevated camps as water levels cross warning marks. Emergency drinking water and medical rations rushed to priority sectors.',
    source: 'Assam Disaster Management Authority',
    url: 'https://reliefos.org/updates/assam-floods',
    imageUrl: null,
  },
  {
    title: 'Wayanad Hill Landslide Surge: Defense Engineering Regiments Deploy Bailey Bridges for Isolated Mountain Settlements',
    description: 'Torrential rains trigger mudflows blocking access to plantation settlements. Heavy earthmovers and trauma supplies deployed from Coastal Depot.',
    source: 'Kerala State Emergency Desk',
    url: 'https://reliefos.org/updates/wayanad-landslide',
    imageUrl: null,
  },
  {
    title: 'Bay of Bengal Cyclone Warning: Coastal Embankment Evacuations Initiated with 48h Rations Prepositioned',
    description: 'Meteorological telemetry forecasts severe gusts and tidal storm surges. Cyclone shelters stocked with dry rations and emergency solar lanterns.',
    source: 'Coastal Hazard Monitoring Network',
    url: 'https://reliefos.org/updates/bay-cyclone-warning',
    imageUrl: null,
  },
  {
    title: 'Central Relief Logistics Grid: Strategic Warehouses Release Emergency Stockpiles for Rapid Regional Dispatch',
    description: 'Automated warehouse tracking synchronizes inventory across Central Hub, Hill Base Camp, and East Depot with live disaster epicenters.',
    source: 'ReliefOS Operations Command',
    url: 'https://reliefos.org/updates/logistics-dispatch',
    imageUrl: null,
  },
];

const LIVE_PRIORITY_DISASTERS = [
  {
    id: 'crisis-delhi-collapse',
    label: 'Delhi Multi-Story Building Collapse (Mustafabad/Welcome)',
    position: [28.6942, 77.2796],
    type: 'critical',
    role: 'city',
    category: 'building_collapse',
    magnitude: 5.9,
    depthKm: 0,
    occurredAt: Date.now() - 38 * 60 * 1000,
    sourceUrl: 'https://reliefos.org/operations/delhi-collapse',
    tsunami: false,
    significance: 920,
    description: 'Catastrophic structural failure of commercial-residential complex. NDRF & Delhi Fire Services deploying canine search units and thermal imaging cutters.',
    nearestWarehouse: 'Central Hub',
    nearestWarehouseDistanceKm: 12,
    recommendedSupplies: ['Equipment', 'Medicine', 'Blankets', 'Ambulance'],
    targetDispatchDestination: 'Delhi Building Collapse Zone',
  },
  {
    id: 'crisis-nepal-quake-landslide',
    label: 'Nepal High-Altitude Earthquake & Landslides (Jajarkot/Karnali)',
    position: [28.7042, 82.2035],
    type: 'critical',
    role: 'city',
    category: 'earthquake',
    magnitude: 6.4,
    depthKm: 12,
    occurredAt: Date.now() - 75 * 60 * 1000,
    sourceUrl: 'https://reliefos.org/operations/nepal-quake',
    tsunami: false,
    significance: 950,
    description: 'Severe seismic shocks followed by steep mountain landslides severing overland routes. Immediate need for high-altitude emergency winter blankets, high-calorie food rations, and trauma medicine.',
    nearestWarehouse: 'Hill Base Camp',
    nearestWarehouseDistanceKm: 160,
    recommendedSupplies: ['Blankets', 'Food', 'Medicine', 'Water'],
    targetDispatchDestination: 'Nepal Quake & Landslide Hub',
  },
  {
    id: 'crisis-nepal-kathmandu-center',
    label: 'Nepal Disaster Coordination Hub (Kathmandu Valley)',
    position: [27.7172, 85.3240],
    type: 'warning',
    role: 'city',
    category: 'earthquake',
    magnitude: 4.8,
    depthKm: 15,
    occurredAt: Date.now() - 110 * 60 * 1000,
    sourceUrl: 'https://reliefos.org/operations/kathmandu-hub',
    tsunami: false,
    significance: 680,
    description: 'Regional monitoring station tracking aftershock clusters and coordinating trans-border humanitarian supply distribution.',
    nearestWarehouse: 'Hill Base Camp',
    nearestWarehouseDistanceKm: 190,
    recommendedSupplies: ['Medicine', 'Water', 'Food'],
    targetDispatchDestination: 'Nepal Quake Zone',
  },
  {
    id: 'crisis-assam-floods',
    label: 'Assam Brahmaputra River Basin Flash Floods (Guwahati/Kaziranga)',
    position: [26.1445, 91.7362],
    type: 'critical',
    role: 'city',
    category: 'flood',
    magnitude: 5.4,
    depthKm: 0,
    occurredAt: Date.now() - 130 * 60 * 1000,
    sourceUrl: 'https://reliefos.org/operations/assam-floods',
    tsunami: false,
    significance: 880,
    description: 'Brahmaputra flowing above danger mark in 18 districts. 350,000+ residents in elevated camps; urgent demand for water purification units, chlorine tablets, and inflatable rescue boats.',
    nearestWarehouse: 'East Depot',
    nearestWarehouseDistanceKm: 280,
    recommendedSupplies: ['Water', 'Food', 'Medicine', 'Fuel'],
    targetDispatchDestination: 'Assam Brahmaputra Flood Zone',
  },
  {
    id: 'crisis-wayanad-landslide',
    label: 'Wayanad Highland Landslide & Flash Surge (Meppadi Sector)',
    position: [11.5564, 76.1320],
    type: 'critical',
    role: 'city',
    category: 'landslide',
    magnitude: 5.1,
    depthKm: 0,
    occurredAt: Date.now() - 190 * 60 * 1000,
    sourceUrl: 'https://reliefos.org/operations/wayanad-landslide',
    tsunami: false,
    significance: 840,
    description: 'Heavy monsoon-triggered mudslides burying plantations and roads. Army engineering regiments erecting emergency Bailey bridges for rescue access.',
    nearestWarehouse: 'Coastal Depot',
    nearestWarehouseDistanceKm: 220,
    recommendedSupplies: ['Equipment', 'Medicine', 'Blankets'],
    targetDispatchDestination: 'Wayanad Landslide Relief Camp',
  },
  {
    id: 'crisis-bay-of-bengal-cyclone',
    label: 'Bay of Bengal Cyclone & Tidal Storm Surge (Digha/Sundarbans)',
    position: [21.6845, 87.5512],
    type: 'warning',
    role: 'city',
    category: 'cyclone',
    magnitude: 4.9,
    depthKm: 0,
    occurredAt: Date.now() - 280 * 60 * 1000,
    sourceUrl: 'https://reliefos.org/operations/bay-cyclone',
    tsunami: false,
    significance: 710,
    description: 'Category 2 cyclone storm surge with 95 km/h gusts breaching tidal bunds. Pre-evacuation of 80,000 residents into reinforced storm shelters.',
    nearestWarehouse: 'Harbor Relief Camp',
    nearestWarehouseDistanceKm: 180,
    recommendedSupplies: ['Food', 'Water', 'Fuel', 'Blankets'],
    targetDispatchDestination: 'Bay of Bengal Cyclone Shelter',
  },
];

const STRATEGIC_WAREHOUSES_MARKERS = [
  {
    id: 'wh-central-hub',
    label: 'Strategic Warehouse: Central Hub (Delhi)',
    position: [28.6139, 77.2090],
    type: 'stable',
    role: 'warehouse',
    category: 'warehouse',
    magnitude: 0,
    depthKm: 0,
    occurredAt: Date.now(),
    sourceUrl: '/supply-chain',
    tsunami: false,
    significance: 100,
    description: 'Northern Command Main Distribution Hub. Stocked with 530+ Medical Kits, 250+ Extrication Units, 400 Food Crates, Fleet of 18 Emergency Ambulances.',
    nearestWarehouse: 'Central Hub',
    nearestWarehouseDistanceKm: 0,
    recommendedSupplies: ['Medicine', 'Equipment', 'Ambulance'],
    targetDispatchDestination: 'Central Hub',
  },
  {
    id: 'wh-hill-base-camp',
    label: 'Strategic Warehouse: Hill Base Camp (Himalayan / Nepal Corridor)',
    position: [30.3165, 78.0322],
    type: 'stable',
    role: 'warehouse',
    category: 'warehouse',
    magnitude: 0,
    depthKm: 0,
    occurredAt: Date.now(),
    sourceUrl: '/supply-chain',
    tsunami: false,
    significance: 100,
    description: 'High-Altitude Forward Logistics Depot. Equipped with Air-Drop Pallets, Thermal Blankets, Mountain Rescue Rations, Satellite Telemetry Transceivers.',
    nearestWarehouse: 'Hill Base Camp',
    nearestWarehouseDistanceKm: 0,
    recommendedSupplies: ['Blankets', 'Food', 'Medicine'],
    targetDispatchDestination: 'Hill Base Camp',
  },
  {
    id: 'wh-east-depot',
    label: 'Strategic Warehouse: East Depot (Brahmaputra / East Sector)',
    position: [28.7041, 77.1025],
    type: 'stable',
    role: 'warehouse',
    category: 'warehouse',
    magnitude: 0,
    depthKm: 0,
    occurredAt: Date.now(),
    sourceUrl: '/supply-chain',
    tsunami: false,
    significance: 100,
    description: 'Eastern Logistics Base. Stocked with Water Purification Trucks, Inflatable Rubber Boats, Life Jackets, Antiseptic Rations.',
    nearestWarehouse: 'East Depot',
    nearestWarehouseDistanceKm: 0,
    recommendedSupplies: ['Water', 'Food', 'Fuel'],
    targetDispatchDestination: 'East Depot',
  },
  {
    id: 'wh-coastal-depot',
    label: 'Strategic Warehouse: Coastal Depot (Western Marine Command)',
    position: [19.0760, 72.8777],
    type: 'stable',
    role: 'warehouse',
    category: 'warehouse',
    magnitude: 0,
    depthKm: 0,
    occurredAt: Date.now(),
    sourceUrl: '/supply-chain',
    tsunami: false,
    significance: 100,
    description: 'Deepwater Port Logistics Facility. Heavy earthmovers, high-volume water pumps, diesel generators, field surgery units.',
    nearestWarehouse: 'Coastal Depot',
    nearestWarehouseDistanceKm: 0,
    recommendedSupplies: ['Equipment', 'Fuel', 'Medicine'],
    targetDispatchDestination: 'Coastal Depot',
  },
  {
    id: 'wh-harbor-relief-camp',
    label: 'Strategic Warehouse: Harbor Relief Camp (Southern Bay Base)',
    position: [13.0827, 80.2707],
    type: 'stable',
    role: 'warehouse',
    category: 'warehouse',
    magnitude: 0,
    depthKm: 0,
    occurredAt: Date.now(),
    sourceUrl: '/supply-chain',
    tsunami: false,
    significance: 100,
    description: 'Southern Coastal Disaster Depot. Cyclone shelter emergency supplies, solar charging hubs, dry nutrient packs.',
    nearestWarehouse: 'Harbor Relief Camp',
    nearestWarehouseDistanceKm: 0,
    recommendedSupplies: ['Food', 'Water', 'Blankets'],
    targetDispatchDestination: 'Harbor Relief Camp',
  },
  {
    id: 'wh-dhaka-relief',
    label: 'Strategic Warehouse: Dhaka Regional Hub (Bengal Delta)',
    position: [23.8103, 90.4125],
    type: 'stable',
    role: 'warehouse',
    category: 'warehouse',
    magnitude: 0,
    depthKm: 0,
    occurredAt: Date.now(),
    sourceUrl: '/supply-chain',
    tsunami: false,
    significance: 100,
    description: 'Trans-boundary Flood Response Facility. Specialized amphibious transport and mobile water disinfection units.',
    nearestWarehouse: 'Dhaka Relief',
    nearestWarehouseDistanceKm: 0,
    recommendedSupplies: ['Water', 'Medicine', 'Food'],
    targetDispatchDestination: 'Dhaka Relief',
  },
];

const getFallbackNews = (limit = 6) => {
  const now = new Date().toISOString();
  return FALLBACK_CRISIS_HEADLINES.slice(0, limit).map((item, index) => ({
    id: `fallback-news-${index}`,
    ...item,
    publishedAt: now,
  }));
};

const fetchCrisisNews = async (query, limit = 6, options = {}) => {
  if (!NEWS_API_KEY) {
    return getFallbackNews(limit);
  }

  const cacheKey = `news:${query}:${limit}:${JSON.stringify(options)}`;
  return withCache(cacheKey, 5 * 60 * 1000, async () => {
    try {
      const url = new URL('https://newsapi.org/v2/everything');
      url.searchParams.set('q', query);
      url.searchParams.set('language', 'en');
      url.searchParams.set('searchIn', 'title,description');
      url.searchParams.set('sortBy', options.sortBy || 'publishedAt');
      url.searchParams.set('pageSize', String(Math.max(limit * 3, limit)));

      const result = await fetchJson(
        url.toString(),
        {
          headers: {
            'X-Api-Key': NEWS_API_KEY,
          },
        },
        9000
      );

      if (result.status === 'error' || !Array.isArray(result.articles)) {
        return getFallbackNews(limit);
      }

      const normalized = (result.articles || []).map((article, index) => ({
        id: `${article.url || article.title || 'article'}-${index}`,
        title: article.title,
        description: article.description || article.content || '',
        source: article.source?.name || 'Unknown source',
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
      }));

      const filtered = filterNewsArticles(normalized, options).slice(0, limit);
      return filtered.length > 0 ? filtered : getFallbackNews(limit);
    } catch (err) {
      console.warn('NewsAPI notice (falling back to curated crisis telemetry headlines):', err.message);
      return getFallbackNews(limit);
    }
  });
};

const geocodeByLabel = async (label) => {
  if (!GOOGLE_MAPS_API_KEY || !label) {
    return null;
  }

  const cacheKey = `geocode:${label.toLowerCase()}`;
  return withCache(cacheKey, 24 * 60 * 60 * 1000, async () => {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', label);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const result = await fetchJson(url.toString(), {}, 9000);
    const location = result.results?.[0];
    if (!location) {
      return null;
    }

    return {
      label: location.formatted_address,
      city: extractLocality(location.address_components) || label,
      country: extractCountry(location.address_components),
      lat: location.geometry.location.lat,
      lng: location.geometry.location.lng,
    };
  });
};

const reverseGeocode = async (lat, lng) => {
  if (!GOOGLE_MAPS_API_KEY || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const cacheKey = `reverse:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  return withCache(cacheKey, 24 * 60 * 60 * 1000, async () => {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const result = await fetchJson(url.toString(), {}, 9000);
    const location = result.results?.[0];
    if (!location) {
      return null;
    }

    return {
      label: location.formatted_address,
      city: extractLocality(location.address_components) || location.formatted_address,
      country: extractCountry(location.address_components),
      lat,
      lng,
    };
  });
};

const fetchWeather = async (lat, lng) => {
  if (!WEATHER_API_KEY) {
    return null;
  }

  const cacheKey = `weather:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  return withCache(cacheKey, 10 * 60 * 1000, async () => {
    const weatherUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
    weatherUrl.searchParams.set('lat', String(lat));
    weatherUrl.searchParams.set('lon', String(lng));
    weatherUrl.searchParams.set('units', 'metric');
    weatherUrl.searchParams.set('appid', WEATHER_API_KEY);

    const aqiUrl = new URL('https://api.openweathermap.org/data/2.5/air_pollution');
    aqiUrl.searchParams.set('lat', String(lat));
    aqiUrl.searchParams.set('lon', String(lng));
    aqiUrl.searchParams.set('appid', WEATHER_API_KEY);

    const [weather, airQuality] = await Promise.all([
      fetchJson(weatherUrl.toString(), {}, 9000),
      fetchJson(aqiUrl.toString(), {}, 9000).catch(() => null),
    ]);

    const rainVolume = weather.rain?.['1h'] || weather.rain?.['3h'] || 0;
    const aqi = mapOpenWeatherAqi(airQuality?.list?.[0]?.main?.aqi);

    return {
      temperature: formatTemperature(weather.main?.temp || 0),
      precipitation: formatPrecipitation(rainVolume),
      windSpeed: formatWind(weather.wind?.speed || 0),
      condition: weather.weather?.[0]?.main || 'Unknown',
      aqi,
      humidity: weather.main?.humidity || null,
      pressure: weather.main?.pressure || null,
    };
  });
};

const deriveThreatLevel = ({ strongestMagnitude, nearbyEarthquakes, headlinesCount, aqi, windSpeedKmh }) => {
  const quakeSignal = strongestMagnitude >= 6 ? 55 : strongestMagnitude >= 5 ? 40 : strongestMagnitude >= 4 ? 28 : strongestMagnitude > 0 ? 16 : 0;
  const nearbySignal = clamp(nearbyEarthquakes * 6, 0, 18);
  const mediaSignal = clamp(headlinesCount * 6, 0, 18);
  const aqiSignal = clamp((aqi - 35) / 5, 0, 16);
  const windSignal = clamp((windSpeedKmh - 20) / 3, 0, 12);

  return clamp(Math.round(quakeSignal + nearbySignal + mediaSignal + aqiSignal + windSignal), 5, 95);
};

const buildPopulationAtRisk = (threatLevel, headlinesCount) => {
  if (threatLevel >= 75) {
    return 'High-risk urban corridor';
  }

  if (threatLevel >= 50 || headlinesCount >= 3) {
    return 'Elevated community exposure';
  }

  return 'Localized disruption risk';
};

const buildEnvironmentalStatus = (label, weather, strongestMagnitude, nearbyCount) => {
  const quakeFragment =
    strongestMagnitude > 0
      ? `Recent seismic activity near ${label} includes a strongest magnitude of ${strongestMagnitude.toFixed(1)} with ${nearbyCount} nearby events in the last 24 hours.`
      : `No major earthquakes were captured near ${label} in the latest 24-hour feed.`;

  if (!weather) {
    return `${quakeFragment} Live weather telemetry is currently unavailable.`;
  }

  return `${quakeFragment} Current conditions are ${weather.condition.toLowerCase()}, ${weather.temperature}, winds ${weather.windSpeed}, and AQI ${weather.aqi}.`;
};

const buildRecommendation = (status, weather, nearbyEarthquakes, headlines) => {
  if (status === 'Critical') {
    return 'Escalate monitoring, pre-stage rescue logistics, validate shelter readiness, and issue public advisories through local command channels.';
  }

  if (nearbyEarthquakes > 0) {
    return 'Keep field teams on alert, inspect critical infrastructure routes, and maintain rapid assessment crews near likely impact zones.';
  }

  if (weather && weather.aqi >= 125) {
    return 'Advise responders to use respiratory protection, limit prolonged outdoor staging, and rotate teams through cleaner air corridors where available.';
  }

  if (headlines.length > 0) {
    return 'Track media-confirmed incident developments, validate source credibility, and coordinate updates with local authorities before dispatch changes.';
  }

  return 'Maintain routine monitoring and keep reconnaissance assets available for rapid deployment if new signals emerge.';
};

const buildRecentIncidents = (nearbyEarthquakes, headlines) => {
  const incidents = [
    ...nearbyEarthquakes.slice(0, 3).map((quake) => `M${quake.magnitude.toFixed(1)} earthquake detected near ${quake.label}.`),
    ...headlines.slice(0, 3).map((headline) => headline.title),
  ];

  return incidents.slice(0, 6);
};

const resolveLocationContext = async ({ label, lat, lng }) => {
  const numericLat = Number(lat);
  const numericLng = Number(lng);

  if (!Number.isNaN(numericLat) && !Number.isNaN(numericLng)) {
    const reverse = await reverseGeocode(numericLat, numericLng);
    return reverse || {
      label: label || `${numericLat.toFixed(2)}, ${numericLng.toFixed(2)}`,
      city: label || 'Selected location',
      country: 'Unknown',
      lat: numericLat,
      lng: numericLng,
    };
  }

  const geocoded = await geocodeByLabel(label);
  if (geocoded) {
    return geocoded;
  }

  throw new Error('Unable to resolve the requested location.');
};

const getOverview = async (_req, res) => {
  try {
    const [earthquakes, headlines] = await Promise.all([
      fetchEarthquakes().catch((err) => {
        console.warn('Earthquake telemetry notice:', err.message);
        return [];
      }),
      fetchCrisisNews(DEFAULT_NEWS_QUERY, 6, { sortBy: 'publishedAt' }).catch((err) => {
        console.warn('News telemetry notice:', err.message);
        return getFallbackNews(6);
      }),
    ]);

    const activeQuakes = Array.isArray(earthquakes) ? earthquakes : [];
    const activeHeadlines = Array.isArray(headlines) && headlines.length > 0 ? headlines : getFallbackNews(6);

    const seismicMarkers = activeQuakes.map((quake) => ({
      ...quake,
      category: 'earthquake',
      nearestWarehouse: quake.position[1] >= 65 && quake.position[1] <= 95 ? 'Hill Base Camp' : 'Dubai Logistics Hub',
      nearestWarehouseDistanceKm: 150,
      recommendedSupplies: ['Medicine', 'Blankets', 'Water'],
      targetDispatchDestination: 'Nepal Quake Zone',
    }));

    const allMarkers = [
      ...LIVE_PRIORITY_DISASTERS,
      ...STRATEGIC_WAREHOUSES_MARKERS,
      ...seismicMarkers.slice(0, 25),
    ];

    const criticalDisasters = allMarkers.filter((m) => m.type === 'critical').length;
    const warningDisasters = allMarkers.filter((m) => m.type === 'warning').length;
    const maxMagnitude = allMarkers.reduce((max, m) => Math.max(max, m.magnitude || 0), 0);

    res.json({
      updatedAt: new Date().toISOString(),
      markers: allMarkers,
      headlines: activeHeadlines,
      summary: {
        activeEarthquakes: activeQuakes.length,
        criticalEarthquakes: criticalDisasters,
        warningEarthquakes: warningDisasters,
        crisisArticles: activeHeadlines.length,
        maxMagnitude: Number(maxMagnitude.toFixed(1)),
        totalDisasters: allMarkers.length,
      },
    });
  } catch (error) {
    console.error('Intel overview handled fallback:', error.message);
    const fallbackNews = getFallbackNews(6);
    res.json({
      updatedAt: new Date().toISOString(),
      markers: [],
      headlines: fallbackNews,
      summary: {
        activeEarthquakes: 0,
        criticalEarthquakes: 0,
        warningEarthquakes: 0,
        crisisArticles: fallbackNews.length,
        maxMagnitude: 0,
      },
    });
  }
};

const getSourceStatus = (_req, res) => {
  const weatherEnabled = Boolean(WEATHER_API_KEY);
  const newsEnabled = Boolean(NEWS_API_KEY);
  const geocodingEnabled = Boolean(GOOGLE_MAPS_API_KEY);
  const mode = weatherEnabled && newsEnabled && geocodingEnabled ? 'live' : 'partial';

  res.json({
    weatherEnabled,
    newsEnabled,
    geocodingEnabled,
    usgsFeedUrl: USGS_FEED_URL,
    mode,
  });
};

const getLocationReport = async (req, res) => {
  try {
    const label = req.query.label || req.params.label;
    const location = await resolveLocationContext({
      label,
      lat: req.query.lat,
      lng: req.query.lng,
    });

    const [earthquakes, weather, headlines] = await Promise.all([
      fetchEarthquakes(),
      fetchWeather(location.lat, location.lng),
      fetchCrisisNews(`"${location.city}"`, 5, {
        contextTerms: [location.city, label].filter(Boolean),
        sortBy: 'relevancy',
      }).catch(() => []),
    ]);

    const nearbyEarthquakes = earthquakes
      .map((quake) => ({
        ...quake,
        distanceKm: haversineKm(location.lat, location.lng, quake.position[0], quake.position[1]),
      }))
      .filter((quake) => quake.distanceKm <= 500)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const strongestMagnitude = nearbyEarthquakes[0]?.magnitude || 0;
    const windSpeedKmh = weather ? Number(weather.windSpeed.replace(/[^\d.-]/g, '')) : 0;
    const threatLevel = deriveThreatLevel({
      strongestMagnitude,
      nearbyEarthquakes: nearbyEarthquakes.length,
      headlinesCount: headlines.length,
      aqi: weather?.aqi || 50,
      windSpeedKmh,
    });
    const status = threatLevel >= 70 ? 'Critical' : threatLevel >= 40 ? 'Warning' : 'Stable';

    res.json({
      city: location.city,
      country: location.country,
      status,
      threatLevel,
      populationAtRisk: buildPopulationAtRisk(threatLevel, headlines.length),
      environmentalStatus: buildEnvironmentalStatus(location.city, weather, strongestMagnitude, nearbyEarthquakes.length),
      recentIncidents: buildRecentIncidents(nearbyEarthquakes, headlines),
      recommendation: buildRecommendation(status, weather, nearbyEarthquakes.length, headlines),
      weather: weather || {
        temperature: 'N/A',
        precipitation: '0 mm',
        windSpeed: '0 km/h',
        condition: 'Unavailable',
        aqi: 50,
      },
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      headlines,
      stats: {
        nearbyEarthquakes: nearbyEarthquakes.length,
        strongestMagnitude,
      },
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
    });
  } catch (error) {
    console.error('Location intel error:', error);
    res.status(500).json({ message: 'Failed to fetch location intelligence' });
  }
};

module.exports = {
  getOverview,
  getSourceStatus,
  getLocationReport,
};
