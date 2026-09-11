import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows, OrbitControls, Stars } from '@react-three/drei';
import { Box3, Vector3, Group, Mesh } from 'three';
import * as THREE from 'three';
import { Compass, RotateCw, Globe, Sparkles } from 'lucide-react';

interface BlenderEarthWidgetProps {
  className?: string;
  size?: 'compact' | 'normal' | 'hero';
  targetCoordinates?: [number, number];
  interactive?: boolean;
  showControls?: boolean;
}

function EarthModel({
  url,
  rotationSpeed = 0.4,
  isPaused = false,
}: {
  url: string;
  rotationSpeed?: number;
  isPaused?: boolean;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);

  const modelFit = useMemo(() => {
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;

    return {
      centerOffset: center.multiplyScalar(-1),
      scale: 3.8 / maxDimension,
    };
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!isPaused) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
    // Subtle organic floating bob
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
  });

  return (
    <group ref={groupRef} scale={modelFit.scale}>
      <primitive object={scene} position={modelFit.centerOffset} />
    </group>
  );
}

function ProceduralEarthFallback({ rotationSpeed = 0.4 }: { rotationSpeed?: number }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial
        color="#0ea5e9"
        roughness={0.4}
        metalness={0.2}
        wireframe={true}
      />
    </mesh>
  );
}

// Atmospheric halo ring
function OrbitalGlowRing() {
  const ringRef = useRef<Mesh>(null);
  useFrame((_state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2.8, 0, 0]}>
      <ringGeometry args={[2.1, 2.14, 64]} />
      <meshBasicMaterial
        color="#22d3ee"
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function BlenderEarthWidget({
  className = '',
  size = 'normal',
  targetCoordinates,
  interactive = true,
  showControls = true,
}: BlenderEarthWidgetProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(0.4);

  const dimensions = {
    compact: 'w-44 h-44',
    normal: 'w-64 h-64',
    hero: 'w-80 h-80',
  }[size];

  const cameraDistance = size === 'compact' ? 8.5 : size === 'hero' ? 7.2 : 7.8;

  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl border border-white/10 bg-[#060b18]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_0_25px_rgba(34,211,238,0.06)] ${dimensions} ${className}`}
    >
      {/* Background Cosmic Starfield Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.18)_0%,rgba(6,11,24,0.85)_70%,transparent_100%)]" />

      {/* Cyber Reticle Corner Accents */}
      <div className="pointer-events-none absolute top-2 left-2 z-10 font-mono text-[9px] uppercase tracking-widest text-cyan-400/80 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>ORBIT SCAN</span>
      </div>

      {targetCoordinates && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 font-mono text-[8.5px] text-cyan-300/70 tracking-wider">
          LAT {targetCoordinates[0].toFixed(2)}° | LNG {targetCoordinates[1].toFixed(2)}°
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5 backdrop-blur-sm">
          <button
            type="button"
            title={isPaused ? 'Resume Rotation' : 'Pause Rotation'}
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded text-cyan-400/80 hover:text-cyan-300 hover:bg-white/10 transition-colors"
          >
            <RotateCw className={`w-3 h-3 ${!isPaused ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
          <button
            type="button"
            title="Cycle Orbit Speed"
            onClick={() => setSpeed((prev) => (prev >= 0.8 ? 0.2 : prev + 0.3))}
            className="px-1 py-0.5 font-mono text-[8px] text-cyan-300/80 hover:text-cyan-200 hover:bg-white/10 rounded transition-colors"
          >
            {speed.toFixed(1)}x
          </button>
        </div>
      )}

      {/* WebGL 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.4, cameraDistance], fov: 32, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} color="#dbeafe" />
        <directionalLight position={[6, 4, 6]} intensity={2.6} color="#ffffff" />
        <directionalLight position={[-5, -3, -4]} intensity={1.1} color="#06b6d4" />
        <pointLight position={[0, -4, 2]} intensity={0.8} color="#3b82f6" />

        <Stars radius={50} depth={20} count={350} factor={2} saturation={0} fade speed={0.4} />

        <Suspense fallback={<ProceduralEarthFallback rotationSpeed={speed} />}>
          <EarthModel
            url="/earth_cartoon.glb"
            rotationSpeed={speed}
            isPaused={isPaused}
          />
          <OrbitalGlowRing />
          <ContactShadows
            position={[0, -1.9, 0]}
            opacity={0.4}
            scale={4.2}
            blur={2.5}
            far={2}
          />
        </Suspense>

        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
            autoRotate={false}
          />
        )}
      </Canvas>

      {/* HUD Reticle Crosshairs */}
      <div className="pointer-events-none absolute inset-0 border border-cyan-500/15 rounded-2xl flex items-center justify-center">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent absolute" />
        <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent absolute" />
      </div>
    </div>
  );
}

// Preload the GLTF model
useGLTF.preload('/earth_cartoon.glb');
