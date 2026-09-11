import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CrisisMarker } from '../services/api';
import { RotateCw, Compass, ZoomIn, ZoomOut, Eye, Sparkles } from 'lucide-react';

interface GoogleEarthCrisisGlobeProps {
  markers: CrisisMarker[];
  selectedMarkerId: string | null;
  onMarkerSelect: (marker: CrisisMarker) => void;
  isDetailsOpen: boolean;
  hideHUD?: boolean;
  transparentBackground?: boolean;
}

/* Convert lat/lng to 3D point ON the sphere surface (radius = 2.0) */
const latLngToVector3 = (lat: number, lng: number, radius = 2.05) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

/* Calculate target Y-rotation to face the marker's longitude towards camera (z > 0) */
const getTargetRotationY = (lng: number) => {
  // Longitude theta = (lng + 180) * rad. To bring it to facing camera (z = 1, x = 0), theta + rotY = PI/2 or 3PI/2.
  const rad = (lng * Math.PI) / 180;
  return -rad - Math.PI / 2;
};

const getMarkerColor = (type: CrisisMarker['type']) => {
  if (type === 'critical') return '#ef4444';
  if (type === 'warning') return '#f59e0b';
  return '#06b6d4';
};

/* ── 3D Crisis Pin on Globe Surface ── */
function CrisisPin({
  marker,
  isSelected,
  onSelect,
}: {
  marker: CrisisMarker;
  isSelected: boolean;
  onSelect: (m: CrisisMarker) => void;
}) {
  const baseColor = getMarkerColor(marker.type);
  const displayColor = isSelected ? '#ef4444' : baseColor;
  
  const pos = useMemo(
    () => latLngToVector3(marker.position[0], marker.position[1], 2.05),
    [marker.position]
  );

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(marker);
  };

  return (
    <group position={pos.toArray()}>
      {/* Invisible hit area */}
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Core Glowing Orb */}
      <mesh>
        <sphereGeometry args={[isSelected ? 0.08 : 0.048, 16, 16]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={isSelected ? 3.5 : 1.6}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Static Outer Halo */}
      <mesh>
        <sphereGeometry args={[isSelected ? 0.25 : 0.13, 14, 14]} />
        <meshBasicMaterial color={displayColor} transparent opacity={isSelected ? 0.5 : 0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ── Interactive 3D Earth Globe Scene ── */
function EarthScene({
  markers,
  selectedMarkerId,
  onMarkerSelect,
  isDetailsOpen,
  isAutoRotate,
  rotationSpeed,
}: GoogleEarthCrisisGlobeProps & {
  isAutoRotate: boolean;
  rotationSpeed: number;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  // High-res NASA / Three.js Planet Textures
  const [earthDay, earthNight, earthBump, earthSpec, clouds] = useTexture([
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  ]);

  earthDay.colorSpace = THREE.SRGBColorSpace;
  earthNight.colorSpace = THREE.SRGBColorSpace;
  clouds.colorSpace = THREE.SRGBColorSpace;

  // Target X position:
  // When details panel is open on the left -> globe shifts to the right (x = 1.85)
  // When details panel is closed -> globe sits comfortably in the center-right (x = 0.75)
  const targetX = isDetailsOpen ? 1.85 : 0.75;

  useFrame((_state, delta) => {
    if (!globeGroupRef.current) return;

    // Smoothly lerp globe X position to move slightly right when details open
    globeGroupRef.current.position.x = THREE.MathUtils.lerp(
      globeGroupRef.current.position.x,
      targetX,
      delta * 4.0
    );

    // Continuous auto-rotation when no marker is selected and auto-rotate is enabled
    if (isAutoRotate && !selectedMarker) {
      globeGroupRef.current.rotation.y += delta * 0.12 * rotationSpeed;
    }

    // Smoothly rotate cloud layer independently
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.035 * rotationSpeed;
    }

    // When a marker is selected, smoothly orient globe towards that marker's longitude
    if (selectedMarker) {
      const targetRotY = getTargetRotationY(selectedMarker.position[1]);
      // Normalize target and current rotation
      const diff = ((targetRotY - globeGroupRef.current.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      globeGroupRef.current.rotation.y += diff * delta * 2.8;

      // Slight tilt on X axis to show latitude
      const targetRotX = (selectedMarker.position[0] * Math.PI) / 360;
      globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        globeGroupRef.current.rotation.x,
        targetRotX,
        delta * 2.8
      );
    } else {
      // Re-align tilt smoothly to default
      globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        globeGroupRef.current.rotation.x,
        0,
        delta * 2.0
      );
    }
  });

  return (
    <>

      {/* Studio Lighting - Animated Style */}
      <ambientLight intensity={2.0} color="#ffffff" />
      <directionalLight intensity={4.5} color="#ffffff" position={[10, 5, 8]} />
      <directionalLight intensity={2.0} color="#4ade80" position={[-10, 5, -10]} /> {/* Green bounce light for land */}
      <pointLight intensity={2.5} color="#00bfff" position={[-8, -3, -5]} /> {/* Sky blue ocean highlight */}
      <pointLight intensity={1.5} color="#38bdf8" position={[0, 8, 2]} />

      {/* Cosmic Starfield */}
      <Stars radius={80} depth={50} count={2500} factor={3.5} saturation={0.3} fade speed={0.4} />

      {/* ── Rotating Globe Container (Moves right when details open) ── */}
      <group ref={globeGroupRef} position={[targetX, 0, 0]}>
        {/* Main Earth Sphere */}
        <mesh>
          <sphereGeometry args={[2.0, 128, 128]} />
          <meshPhongMaterial
            map={earthDay}
            bumpMap={earthBump}
            bumpScale={0.15}
            specularMap={earthSpec}
            specular={new THREE.Color('#00bfff')} /* Animated sky blue ocean reflection */
            shininess={80}
            color="#dcfce7" /* Slight bright green tint to boost land colors */
          />
        </mesh>

        {/* City Night Lights (Additive Blending on dark side) */}
        <mesh>
          <sphereGeometry args={[2.002, 64, 64]} />
          <meshBasicMaterial
            map={earthNight}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Dynamic Rotating Cloud Layer */}
        <mesh ref={cloudRef}>
          <sphereGeometry args={[2.035, 96, 96]} />
          <meshPhongMaterial
            map={clouds}
            transparent
            opacity={0.52}
            depthWrite={false}
            shininess={5}
            specular={new THREE.Color('#ffffff')}
          />
        </mesh>

        {/* Ocean Sky Blue Glow Tint */}
        <mesh>
          <sphereGeometry args={[2.006, 48, 48]} />
          <meshBasicMaterial
            color="#00bfff"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* ── Active Crisis Pins (Rotating synchronously on the globe) ── */}
        {markers.map((marker) => (
          <CrisisPin
            key={marker.id}
            marker={marker}
            isSelected={marker.id === selectedMarkerId}
            onSelect={onMarkerSelect}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={8.5}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
      />
    </>
  );
}

/* Fallback procedural wireframe globe while textures load */
function FallbackGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <group position={[0.75, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshStandardMaterial
          color="#0284c7"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

export function GoogleEarthCrisisGlobe(props: GoogleEarthCrisisGlobeProps) {
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" style={{ background: props.transparentBackground ? 'transparent' : 'radial-gradient(circle at 50% 50%, #ffffff 0%, #00aaff 45%, #001f3f 100%)' }}>
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 44, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <Suspense fallback={<FallbackGlobe />}>
          <EarthScene
            {...props}
            isAutoRotate={isAutoRotate}
            rotationSpeed={rotationSpeed}
          />
        </Suspense>
      </Canvas>

      {/* Floating HUD Controls in Bottom-Right */}
      {!props.hideHUD && (
      <div className="absolute bottom-6 right-6 lg:right-10 z-20 flex items-center gap-3 bg-white/95 border border-gray-200 rounded-sm p-2 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,10,30,0.15)]">
        <button
          type="button"
          title={isAutoRotate ? 'Pause Rotation' : 'Resume Rotation'}
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm ${
            isAutoRotate
              ? 'bg-black text-white hover:bg-gray-900'
              : 'bg-gray-100 text-gray-500 hover:text-black border border-gray-200'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${isAutoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <span>{isAutoRotate ? 'ROTATING' : 'PAUSED'}</span>
        </button>

        <button
          type="button"
          title="Cycle Orbit Speed"
          onClick={() => setRotationSpeed((prev) => (prev >= 2.0 ? 0.5 : prev + 0.5))}
          className="px-4 py-2 rounded-sm font-sans font-bold text-[10px] tracking-widest uppercase text-black hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer shadow-sm"
        >
          {rotationSpeed.toFixed(1)}X SPEED
        </button>

        <div className="border-l border-gray-300 pl-4 pr-3 text-[10px] font-sans font-bold text-black uppercase tracking-widest hidden sm:block">
          LIVE 3D
        </div>
      </div>
      )}
    </div>
  );
}
