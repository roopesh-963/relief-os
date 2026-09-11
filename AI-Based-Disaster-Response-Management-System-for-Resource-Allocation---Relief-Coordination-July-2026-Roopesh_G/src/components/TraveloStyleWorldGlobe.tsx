import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import {
  RotateCcw,
  ArrowRight,
  Shield,
  Zap,
  Globe2,
  Activity,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CrisisRegion {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  highlightColor: string;
  items: {
    id: string;
    title: string;
    type: string;
    severity: 'Critical' | 'Severe' | 'Moderate';
    image: string;
    desc: string;
    stats: string;
  }[];
}

export const CRISIS_REGIONS: CrisisRegion[] = [
  {
    id: 'china',
    name: 'CHINA',
    code: 'CN-SEC',
    lat: 35.86,
    lng: 104.19,
    highlightColor: '#ff3366',
    items: [
      {
        id: 'cn-1',
        title: 'SICHUAN BASIN',
        type: 'Seismic Rift M6.8',
        severity: 'Critical',
        image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=600&q=80',
        desc: 'Rapid mountain terrain relief dispatch & shelter deployment active across 4 valleys.',
        stats: '1,420 Triaged • 24 Convoys Active',
      },
      {
        id: 'cn-2',
        title: 'ZHANGJIAJIE CANYON',
        type: 'Flash Flood Barrier',
        severity: 'Severe',
        image: 'https://images.unsplash.com/photo-1513415277900-a62401e19be4?auto=format&fit=crop&w=600&q=80',
        desc: 'Water diversion gates reinforced with autonomous pump stations and aerial drone delivery.',
        stats: '890 Evacuated • High Water Alert',
      },
      {
        id: 'cn-3',
        title: 'THE BUND LOGISTICS',
        type: 'Port Emergency Hub',
        severity: 'Moderate',
        image: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=600&q=80',
        desc: 'Maritime medical supplies loaded for rapid coastal emergency distribution.',
        stats: '45,000 Medical Kits • 98% Ready',
      },
    ],
  },
  {
    id: 'japan',
    name: 'JAPAN',
    code: 'JP-ARC',
    lat: 36.20,
    lng: 138.25,
    highlightColor: '#ff6a40',
    items: [
      {
        id: 'jp-1',
        title: 'HONSHU TRENCH',
        type: 'Deep Subduction Zone',
        severity: 'Critical',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
        desc: 'Tsunami early-warning acoustic buoys tracking sea-floor displacement.',
        stats: 'Wave Gauge: Normal • M6.2 Aftershock Logged',
      },
      {
        id: 'jp-2',
        title: 'TOKYO METRO DEFENSE',
        type: 'Seismic Dampening Matrix',
        severity: 'Moderate',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
        desc: 'Underground discharge tunnel monitoring and high-density evacuation corridors open.',
        stats: 'Capacity: 100% • 12 Shelters Active',
      },
    ],
  },
  {
    id: 'usa',
    name: 'USA',
    code: 'US-PAC',
    lat: 37.09,
    lng: -95.71,
    highlightColor: '#38bdf8',
    items: [
      {
        id: 'us-1',
        title: 'SAN ANDREAS FAULT',
        type: 'Transform Boundary',
        severity: 'Critical',
        image: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=600&q=80',
        desc: 'InSAR satellite radar tracking micro-slip deformations across tectonic fault lines.',
        stats: 'Strain Rate: 34mm/yr • 42 Seismometers Active',
      },
      {
        id: 'us-2',
        title: 'GULF OF MEXICO',
        type: 'Tropical Cyclone Track',
        severity: 'Severe',
        image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=80',
        desc: 'Autonomous ocean glider fleet deployed to sample sea surface temperature and surge.',
        stats: 'Cat 3 Simulation • High Wave Warning',
      },
    ],
  },
  {
    id: 'turkey',
    name: 'TURKEY',
    code: 'TR-ANA',
    lat: 38.96,
    lng: 35.24,
    highlightColor: '#f59e0b',
    items: [
      {
        id: 'tr-1',
        title: 'EAST ANATOLIAN FAULT',
        type: 'Strike-Slip Corridor',
        severity: 'Critical',
        image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a1b?auto=format&fit=crop&w=600&q=80',
        desc: 'Heavy urban search-and-rescue teams equipped with acoustic life locators.',
        stats: '36 Units Deployed • 840 Sheltered',
      },
      {
        id: 'tr-2',
        title: 'ISTANBUL STRAIT',
        type: 'Maritime Relief Corridor',
        severity: 'Moderate',
        image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80',
        desc: 'Vessel triage coordination and emergency helicopter supply drops operating 24/7.',
        stats: 'Flow: Unrestricted • 18 Vessels Queued',
      },
    ],
  },
  {
    id: 'india',
    name: 'INDIA',
    code: 'IN-HIM',
    lat: 20.59,
    lng: 78.96,
    highlightColor: '#10b981',
    items: [
      {
        id: 'in-1',
        title: 'HIMALAYAN ARC',
        type: 'Continental Collision Zone',
        severity: 'Critical',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
        desc: 'Glacial lake outburst flood early-warning acoustic nodes and aerial reconnaissance.',
        stats: 'Alert Level 4 • Rapid Response Units En Route',
      },
      {
        id: 'in-2',
        title: 'BAY OF BENGAL',
        type: 'Coastal Storm Surge',
        severity: 'Severe',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        desc: 'Mass evacuation shelters fortified with solar battery backup and satellite telemetry.',
        stats: '350,000 Safe • 14 Ports On Standby',
      },
    ],
  },
];

export function TraveloStyleWorldGlobe() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<CrisisRegion | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // References for 3D Three.js objects
  const globeRootRef = useRef<THREE.Group | null>(null);
  const globeModelRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Drag-to-spin state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const spinVelocityRef = useRef({ x: 0, y: 0.003 });

  // Lat / Lng to 3D Vector converter (matching calibrated radius)
  const latLngToVec3 = (lat: number, lng: number, radius = 2.02) => {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isDisposed = false;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Global Root Wrapper for Smooth GSAP Movement ──
    const globeRoot = new THREE.Group();
    globeRootRef.current = globeRoot;
    scene.add(globeRoot);

    // ── Pins Group ──
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    globeRoot.add(pinsGroup);

    // ── Soft Glowing Outer Atmosphere Mesh ──
    const atmosGeo = new THREE.SphereGeometry(2.18, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeRoot.add(atmosphereMesh);

    // ── Lighting Setup ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6ea, 3.8);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.6);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    const bottomFillLight = new THREE.DirectionalLight(0x0284c7, 1.4);
    bottomFillLight.position.set(0, -5, 2);
    scene.add(bottomFillLight);

    // ── Load User's Uploaded earth.glb ──
    const loader = new GLTFLoader();
    loader.load(
      '/earth.glb',
      (gltf) => {
        if (isDisposed) return;

        const model = gltf.scene;

        // Calculate bounding box to normalize scale & center model perfectly
        const bbox = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Center pivot
        model.position.sub(center);

        // Scale to standard target radius (target diameter: 4.0)
        const targetRadius = 2.0;
        const scaleFactor = (targetRadius * 2) / (maxDim || 1);
        
        const modelWrapper = new THREE.Group();
        modelWrapper.scale.setScalar(scaleFactor);
        modelWrapper.add(model);

        // Optimize materials for stunning vibrancy
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = false;
            mesh.receiveShadow = false;

            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                mat.depthWrite = true;
                if (mat.name && mat.name.toUpperCase().includes('NUAGES')) {
                  // Clouds material transparency
                  mat.transparent = true;
                  mat.opacity = 0.85;
                  mat.depthWrite = false;
                }
              });
            }
          }
        });

        // Set up built-in GLB animation if available
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
          });
          mixerRef.current = mixer;
        }

        globeModelRef.current = modelWrapper;
        globeRoot.add(modelWrapper);

        // Add Sector Pins on Surface
        CRISIS_REGIONS.forEach((region) => {
          const pos = latLngToVec3(region.lat, region.lng, 2.03);

          // Center Pin Dot
          const pinGeo = new THREE.SphereGeometry(0.06, 16, 16);
          const pinMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(region.highlightColor),
          });
          const pin = new THREE.Mesh(pinGeo, pinMat);
          pin.position.copy(pos);
          pin.userData = { regionId: region.id };
          pinsGroup.add(pin);

          // Outer Pulse Ring
          const ringGeo = new THREE.RingGeometry(0.07, 0.11, 24);
          const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(region.highlightColor),
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.copy(pos.clone().multiplyScalar(1.01));
          ring.lookAt(pos.clone().multiplyScalar(2));
          pinsGroup.add(ring);
        });

        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
          setLoadProgress(percent);
        }
      },
      (error) => {
        console.error('Error loading earth.glb:', error);
        setLoading(false);
      }
    );

    // ── Mouse & Touch Drag-to-Spin Interaction ──
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMousePosRef.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !globeRootRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMousePosRef.current.x;
      const deltaY = clientY - prevMousePosRef.current.y;

      globeRootRef.current.rotation.y += deltaX * 0.005;
      globeRootRef.current.rotation.x = Math.max(
        -0.8,
        Math.min(0.8, globeRootRef.current.rotation.x + deltaY * 0.003)
      );

      spinVelocityRef.current = {
        x: deltaY * 0.0008,
        y: deltaX * 0.0015,
      };

      prevMousePosRef.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // ── Resize Handler ──
    const onResize = () => {
      if (!container || isDisposed) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // ── Render & Animation Loop ──
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Smooth spin inertia & idle rotation when no region is selected
      if (!selectedRegion && globeRootRef.current) {
        if (!isDraggingRef.current) {
          // Slow down spin velocity gradually towards idle rotation
          spinVelocityRef.current.y = THREE.MathUtils.lerp(
            spinVelocityRef.current.y,
            0.002,
            0.03
          );
          spinVelocityRef.current.x = THREE.MathUtils.lerp(
            spinVelocityRef.current.x,
            0,
            0.05
          );

          globeRootRef.current.rotation.y += spinVelocityRef.current.y;
          globeRootRef.current.rotation.x += spinVelocityRef.current.x;
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      renderer.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
    };
  }, []);

  // ── Smooth Camera and Globe Position Tween on Region Selection ──
  useEffect(() => {
    if (!globeRootRef.current) return;

    const globe = globeRootRef.current;

    if (selectedRegion) {
      // Calculate target rotation to face selected country towards camera
      const targetRotationY = ((-selectedRegion.lng - 90) * Math.PI) / 180;
      const targetRotationX = ((selectedRegion.lat - 15) * Math.PI) / 180;

      // Animate Globe smoothly to left side for split UI
      gsap.to(globe.position, {
        x: -1.45,
        y: 0,
        z: 0.2,
        duration: 1.2,
        ease: 'power3.inOut',
      });

      // Rotate target country into view
      gsap.to(globe.rotation, {
        y: targetRotationY,
        x: targetRotationX * 0.45,
        duration: 1.4,
        ease: 'power3.inOut',
      });

      setActiveItemIndex(0);
    } else {
      // Reset back to center "W [GLOBE] R L D" state
      gsap.to(globe.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.2,
        ease: 'power3.inOut',
      });
      gsap.to(globe.rotation, {
        x: 0,
        duration: 1.2,
        ease: 'power3.inOut',
      });
    }
  }, [selectedRegion]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100svh] overflow-hidden bg-gradient-to-b from-[#06142a] via-[#051124] to-[#030914] select-none"
    >
      {/* ── Background Giant Typographic Text: "WORLD" or Selected Region Name ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <AnimatePresence mode="wait">
          {!selectedRegion ? (
            <motion.div
              key="world-text"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center font-black tracking-[-0.03em] select-none"
            >
              {/* "W" */}
              <span className="text-[20vw] font-black text-white/95 drop-shadow-[0_15px_40px_rgba(0,0,0,0.7)] mr-[10vw]">
                W
              </span>
              {/* Space in center where the 3D earth.glb model rotates as the "O" */}
              {/* "RLD" */}
              <span className="text-[20vw] font-black text-white/95 drop-shadow-[0_15px_40px_rgba(0,0,0,0.7)] ml-[10vw]">
                RLD
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={selectedRegion.name}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-[34vw] top-1/2 -translate-y-1/2"
            >
              <h2 className="text-[14vw] font-black tracking-tight text-white/20 select-none uppercase drop-shadow-2xl">
                {selectedRegion.name}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Subtitle above the "W [GLOBE] R L D" title ── */}
      {!selectedRegion && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute left-[20vw] top-[32%] z-10 pointer-events-none"
        >
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] text-cyan-300 drop-shadow">
            EXPLORE YOUR
          </span>
        </motion.div>
      )}

      {/* ── Loading Overlay for 3D earth.glb Model ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#030914]/90 backdrop-blur-md"
          >
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                <Globe2 className="absolute h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Loading 3D Planetary Engine
                </div>
                <div className="mt-1 text-[11px] font-mono text-white/50">
                  {loadProgress > 0 ? `Streaming earth.glb (${loadProgress}%)` : 'Initializing Photorealistic Mesh...'}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${Math.max(15, loadProgress)}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D WebGL Canvas (earth.glb 3D Model + Atmosphere + Region Pins) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
      />

      {/* ── Ambient Radial Atmosphere Overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-15 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(3,9,20,0.6)_100%)]" />

      {/* ── Hint: Drag to rotate ── */}
      {!selectedRegion && !loading && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            Drag to Rotate Earth • Select Sector Below
          </span>
        </div>
      )}
      {/* ── Bottom Region Selection Bar (Allows switching countries) ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-black/60 border border-white/15 px-4 py-2 rounded-full backdrop-blur-xl shadow-2xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 px-2 hidden sm:inline-block">
          Focus Sector:
        </span>
        {CRISIS_REGIONS.map((region) => (
          <button
            key={region.id}
            type="button"
            onClick={() => {
              if (selectedRegion?.id === region.id) {
                setSelectedRegion(null);
              } else {
                setSelectedRegion(region);
              }
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              selectedRegion?.id === region.id
                ? 'bg-white text-black shadow-lg scale-105'
                : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
          >
            {region.name}
          </button>
        ))}

        {selectedRegion && (
          <button
            type="button"
            onClick={() => setSelectedRegion(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-crav-mustard)]/20 border border-[var(--color-crav-mustard)]/40 text-[var(--color-crav-mustard)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--color-crav-mustard)]/30 transition-all cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── Right-Side Interactive Carousel Cards (When a country is selected) ── */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 z-30 w-full max-w-sm sm:max-w-md flex flex-col gap-4"
          >
            {/* Sector Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-cyan-300">
                  {selectedRegion.code} • TACTICAL NODES
                </span>
              </div>
              <span className="text-xs text-white/50 font-mono">
                0{activeItemIndex + 1} / 0{selectedRegion.items.length}
              </span>
            </div>

            {/* Active Card with Real Photo, Title, and "EXPLORE / DISPATCH" button */}
            <div className="relative rounded-3xl border border-white/15 bg-black/60 p-5 backdrop-blur-2xl shadow-2xl overflow-hidden space-y-4">
              {/* Thumbnail Image */}
              <div className="relative h-44 w-full rounded-2xl overflow-hidden group">
                <img
                  src={selectedRegion.items[activeItemIndex].image}
                  alt={selectedRegion.items[activeItemIndex].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Severity Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      selectedRegion.items[activeItemIndex].severity === 'Critical'
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                    }`}
                  >
                    {selectedRegion.items[activeItemIndex].severity}
                  </span>
                </div>

                {/* Explore / Dispatch Button embedded on image */}
                <button
                  type="button"
                  onClick={() => navigate('/crisis-map')}
                  className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-[var(--color-crav-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>EXPLORE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card Meta */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-crav-mustard)]">
                  {selectedRegion.items[activeItemIndex].type}
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white mt-0.5">
                  {selectedRegion.items[activeItemIndex].title}
                </h3>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  {selectedRegion.items[activeItemIndex].desc}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 text-[11px] font-mono text-cyan-300">
                  {selectedRegion.items[activeItemIndex].stats}
                </div>
              </div>

              {/* Sub-item List Navigator */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                  Available Nodes
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedRegion.items.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveItemIndex(idx)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold truncate transition-all cursor-pointer ${
                        activeItemIndex === idx
                          ? 'bg-white/20 border border-white/30 text-white'
                          : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Far Right Vertical Pagination Dots ── */}
      {selectedRegion && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-3">
          {selectedRegion.items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveItemIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeItemIndex === idx
                  ? 'w-6 bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                  : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
