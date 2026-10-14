import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCw, Sparkles, Navigation, Activity, Box, Eye, Layers } from 'lucide-react';

export interface DataOrbNode {
  id: string;
  name: string;
  category: 'earthquake' | 'flood' | 'cyclone' | 'depot' | 'resource';
  value: number;
  label: string;
  lat: number;
  lng: number;
  color: string;
  demand: number;
}

const NODES_DATA: DataOrbNode[] = [
  { id: '1', name: 'Banda Sea Tremor', category: 'earthquake', value: 7.2, label: '7.2M Critical', lat: -4.5, lng: 129.8, color: '#ef4444', demand: 92 },
  { id: '2', name: 'Honshu Coastal Trench', category: 'earthquake', value: 6.4, label: '6.4M Warning', lat: 37.5, lng: 142.1, color: '#f97316', demand: 78 },
  { id: '3', name: 'Brahmaputra Delta', category: 'flood', value: 4.8, label: 'Catastrophic Flood', lat: 26.1, lng: 91.7, color: '#06b6d4', demand: 85 },
  { id: '4', name: 'Bay of Bengal Surge', category: 'cyclone', value: 5.5, label: 'Category-4 Cyclone', lat: 15.5, lng: 88.2, color: '#8b5cf6', demand: 88 },
  { id: '5', name: 'Anatolian Fault', category: 'earthquake', value: 5.9, label: '5.9M Moderate', lat: 38.2, lng: 35.8, color: '#ef4444', demand: 64 },
  { id: '6', name: 'Hub Alpha Coast', category: 'depot', value: 95, label: 'Forward Depot Alpha', lat: 18.9, lng: 72.8, color: '#10b981', demand: 25 },
  { id: '7', name: 'Hub Beta North', category: 'depot', value: 88, label: 'Cargo Hive Beta', lat: 28.6, lng: 77.2, color: '#10b981', demand: 30 },
];

/* Convert lat/lng to 3D point on a sphere */
function latLngToVector3(lat: number, lng: number, radius = 2.05): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* 3D Arc Spline connecting two points on sphere */
function createArcPoints(v1: THREE.Vector3, v2: THREE.Vector3, numPoints = 40): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const v = new THREE.Vector3().lerpVectors(v1, v2, t);
    // Arc elevation outward
    const elevation = Math.sin(Math.PI * t) * 0.45;
    v.normalize().multiplyScalar(2.05 + elevation);
    points.push(v);
  }
  return points;
}

/* 3D Data Pin & Pillar */
function OrbPin({
  node,
  isSelected,
  mode,
  onSelect,
}: {
  node: DataOrbNode;
  isSelected: boolean;
  mode: 'hazards' | 'supply' | 'pillars';
  onSelect: (n: DataOrbNode) => void;
}) {
  const pos = useMemo(() => latLngToVector3(node.lat, node.lng, 2.05), [node.lat, node.lng]);
  const pillarHeight = (node.demand / 100) * 0.8 + 0.1;
  const pillarPos = useMemo(() => latLngToVector3(node.lat, node.lng, 2.05 + pillarHeight / 2), [node.lat, node.lng, pillarHeight]);

  // Orient pillar towards center of sphere
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(node);
  };

  return (
    <group>
      {/* Interactive clickable hit area */}
      <mesh
        position={pos}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Mode = Pillars: Extruded 3D Bar Proportional to Demand */}
      {mode === 'pillars' && (
        <group position={pillarPos}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.05, pillarHeight, 12]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={isSelected ? 1.5 : 0.6}
              roughness={0.2}
              metalness={0.4}
            />
          </mesh>
        </group>
      )}

      {/* Sphere Orb Beacon */}
      <mesh position={pos}>
        <sphereGeometry args={[isSelected ? 0.09 : 0.05, 16, 16]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 2.5 : 1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Outer Halo ring */}
      <mesh position={pos}>
        <ringGeometry args={[0.08, 0.13, 16]} />
        <meshBasicMaterial color={node.color} transparent opacity={isSelected ? 0.8 : 0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* 3D Supply Line Arcs connecting Depot to Disasters */
function SupplyArcs({ nodes }: { nodes: DataOrbNode[] }) {
  const hubs = nodes.filter((n) => n.category === 'depot');
  const targets = nodes.filter((n) => n.category !== 'depot');

  const arcs = useMemo(() => {
    const list: THREE.Vector3[][] = [];
    targets.forEach((target, i) => {
      const hub = hubs[i % hubs.length];
      if (hub) {
        const v1 = latLngToVector3(hub.lat, hub.lng, 2.05);
        const v2 = latLngToVector3(target.lat, target.lng, 2.05);
        list.push(createArcPoints(v1, v2));
      }
    });
    return list;
  }, [hubs, targets]);

  return (
    <group>
      {arcs.map((points, idx) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.015, 6, false);
        return (
          <mesh key={idx} geometry={tubeGeo}>
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={0.8}
              transparent
              opacity={0.65}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* 3D Particle Cloud Rings around Globe */
function OrbitalRings() {
  const ringRef = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.08;
      ringRef.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <group ref={ringRef}>
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.55, 0.008, 8, 80]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[2.85, 0.006, 8, 80]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/* 3D Scene Controller */
function OrbScene({
  mode,
  selectedNode,
  onSelectNode,
  isAutoRotate,
}: {
  mode: 'hazards' | 'supply' | 'pillars';
  selectedNode: DataOrbNode | null;
  onSelectNode: (n: DataOrbNode) => void;
  isAutoRotate: boolean;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (!globeGroupRef.current) return;
    if (isAutoRotate && !selectedNode) {
      globeGroupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight position={[6, 8, 6]} intensity={3.5} color="#ffffff" />
      <directionalLight position={[-6, -4, -4]} intensity={1.8} color="#06b6d4" />
      <pointLight position={[0, 5, 0]} intensity={2.0} color="#34d399" />

      <group ref={globeGroupRef}>
        {/* Core Wireframe Tech Sphere */}
        <mesh>
          <sphereGeometry args={[2.0, 36, 36]} />
          <meshStandardMaterial
            color="#2a3832"
            wireframe
            transparent
            opacity={0.35}
            roughness={0.7}
          />
        </mesh>

        {/* Inner Solid Translucent Sphere */}
        <mesh>
          <sphereGeometry args={[1.98, 36, 36]} />
          <meshStandardMaterial
            color="#142921"
            transparent
            opacity={0.12}
            roughness={0.9}
          />
        </mesh>

        {/* 3D Pins */}
        {NODES_DATA.map((node) => (
          <OrbPin
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            mode={mode}
            onSelect={onSelectNode}
          />
        ))}

        {/* Mode = Supply: Active Corridors */}
        {(mode === 'supply' || mode === 'hazards') && <SupplyArcs nodes={NODES_DATA} />}

        {/* Orbital telemetry rings */}
        <OrbitalRings />
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={7.5}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.6}
      />
    </>
  );
}

export function Interactive3DDataOrb({
  onSelectNode,
  selectedNode,
}: {
  onSelectNode?: (n: DataOrbNode) => void;
  selectedNode?: DataOrbNode | null;
}) {
  const [mode, setMode] = useState<'hazards' | 'supply' | 'pillars'>('hazards');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [internalSelected, setInternalSelected] = useState<DataOrbNode | null>(NODES_DATA[0]);

  const activeNode = selectedNode ?? internalSelected;

  const handleNodeClick = (node: DataOrbNode) => {
    setInternalSelected(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] rounded-2xl bg-white/85 backdrop-blur-2xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between select-none">
      
      {/* 3D Canvas Top Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 border border-black/10 rounded-full px-3 py-1.5 backdrop-blur-md shadow-sm pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-black uppercase">
            3D SPATIAL TELEMETRY
          </span>
          <span className="text-[10px] font-mono text-black/40">• INTERACTIVE ORB</span>
        </div>

        {/* Mode switchers */}
        <div className="flex items-center gap-1 bg-white/95 border border-black/10 rounded-lg p-1 backdrop-blur-md shadow-sm pointer-events-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setMode('hazards')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              mode === 'hazards' ? 'bg-black text-white' : 'text-black/70 hover:text-black'
            }`}
          >
            Hazards
          </button>
          <button
            type="button"
            onClick={() => setMode('supply')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              mode === 'supply' ? 'bg-black text-white' : 'text-black/70 hover:text-black'
            }`}
          >
            Supply Arcs
          </button>
          <button
            type="button"
            onClick={() => setMode('pillars')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              mode === 'pillars' ? 'bg-black text-white' : 'text-black/70 hover:text-black'
            }`}
          >
            Asset Pillars
          </button>

          <button
            type="button"
            onClick={() => setIsAutoRotate((p) => !p)}
            title="Toggle Auto Rotation"
            className={`p-1 rounded ml-1 transition-all cursor-pointer ${
              isAutoRotate ? 'text-black bg-black/10' : 'text-black/40 hover:text-black'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 0, 5.0], fov: 42, near: 0.1, far: 50 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.4,
          }}
        >
          <OrbScene
            mode={mode}
            selectedNode={activeNode}
            onSelectNode={handleNodeClick}
            isAutoRotate={isAutoRotate}
          />
        </Canvas>
      </div>

      {/* Bottom Floating Dossier HUD of Hovered / Selected Node */}
      {activeNode && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="pointer-events-auto p-4 rounded-xl bg-white/95 backdrop-blur-xl border border-black/15 shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: activeNode.color }}
              />
              <div>
                <div className="font-serif text-lg font-bold text-black leading-tight">
                  {activeNode.name}
                </div>
                <div className="text-xs font-mono text-black/60">
                  COORD: {activeNode.lat.toFixed(1)}°N, {activeNode.lng.toFixed(1)}°E • {activeNode.label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <div className="text-[10px] text-black/40 uppercase">RELIEF DEMAND</div>
                <div className="font-bold text-emerald-700">{activeNode.demand}% CAPACITY</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-black text-white text-[10px] uppercase font-bold tracking-wider">
                ACTIVE FOCUS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Helper label */}
      <div className="absolute top-16 left-4 z-10 text-[10px] font-mono text-black/40 pointer-events-none">
        [CLICK & DRAG TO ORBIT 3D GLOBE • CLICK NODES TO INSPECT]
      </div>
    </div>
  );
}
