import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CrisisMarker } from '../services/api';

interface SeismicGlobeProps {
  markers: CrisisMarker[];
  selectedMarkerId: string | null;
  onMarkerSelect: (marker: CrisisMarker) => void;
  speed: number;
}

/* Convert lat/lng to a point ON the sphere surface */
const latLngToVector3 = (lat: number, lng: number, radius = 2.06) => {
  const phi   = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
};

const markerColor = (type: CrisisMarker['type']) => {
  if (type === 'critical') return '#ff2222';
  if (type === 'warning')  return '#ff8800';
  return '#00e5ff';
};

/* ── Atmosphere rim shader ─────────────────────────────────────────────── */
const atmVert = /* glsl */`
  varying vec3 vNormal;
  void main(){
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;
/* clamp() prevents negative pow() inputs that create artefact lines */
const atmFrag = /* glsl */`
  varying vec3 vNormal;
  void main(){
    float facing = dot(vNormal, vec3(0.0, 0.0, 1.0));
    float rim    = clamp(1.0 - facing, 0.0, 1.0);
    float i      = pow(rim, 4.5) * 0.9;
    gl_FragColor = vec4(0.25, 0.65, 1.0, i);
  }
`;

/* ── Single crisis marker — rendered INSIDE the globe group ───────────── */
function CrisisPin({
  marker,
  active,
  onMarkerSelect,
}: {
  marker: CrisisMarker;
  active: boolean;
  onMarkerSelect: (m: CrisisMarker) => void;
}) {
  const haloRef = useRef<THREE.Mesh>(null);
  const color   = markerColor(marker.type);

  /* Position is fixed relative to the group — group handles rotation */
  const pos = useMemo(
    () => latLngToVector3(marker.position[0], marker.position[1], 2.06),
    [marker.position],
  );

  /* Pulse the halo */
  useFrame(({ clock }) => {
    if (!haloRef.current) return;
    const t     = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2 + marker.position[1] * 0.3);
    haloRef.current.scale.setScalar(active ? 1.15 + pulse * 0.45 : 1.0 + pulse * 0.28);
    (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
      active ? 0.55 + pulse * 0.3 : 0.18 + pulse * 0.18;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onMarkerSelect(marker);
  };

  return (
    <group position={pos.toArray()}>
      {/* Invisible large hit area — easier to click */}
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Core glowing dot */}
      <mesh>
        <sphereGeometry args={[active ? 0.068 : 0.046, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 2.8 : 1.1}
          roughness={0.15}
          metalness={0.0}
        />
      </mesh>

      {/* Pulsing halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[active ? 0.17 : 0.12, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Extra outer glow when selected */}
      {active && (
        <mesh>
          <sphereGeometry args={[0.28, 14, 14]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/* ── Main scene ─────────────────────────────────────────────────────────── */
function GlobeScene({ markers, selectedMarkerId, onMarkerSelect, speed }: SeismicGlobeProps) {
  const globeRef  = useRef<THREE.Group>(null);
  const cloudRef  = useRef<THREE.Mesh>(null);

  const [earthDay, earthNight, earthBump, earthSpec, clouds] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  ]);

  earthDay.colorSpace   = THREE.SRGBColorSpace;
  earthNight.colorSpace = THREE.SRGBColorSpace;
  clouds.colorSpace     = THREE.SRGBColorSpace;
  [earthDay, earthSpec, earthBump, clouds].forEach(t => { t.anisotropy = 16; });
  // No wrapS/wrapT — ClampToEdgeWrapping (default) avoids the texture seam line

  useFrame((_s, dt) => {
    const r = Math.max(0.2, speed / 100);
    if (globeRef.current) globeRef.current.rotation.y += dt * 0.13 * r;
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.018 * r;
  });

  return (
    <>
      <color attach="background" args={['#030d1e']} />
      <fog   attach="fog"        args={['#030d1e', 10, 22]} />

      {/* ── Lights ── */}
      <ambientLight     intensity={0.18}  color="#b0d4ff" />
      <directionalLight intensity={2.6}   color="#fff5e0" position={[7, 4, 5]} />
      <pointLight       intensity={0.7}   color="#1a3d8f" position={[-8, -3, -5]} />
      <pointLight       intensity={0.5}   color="#60b4ff" position={[0, 8, 0]} />

      <Stars radius={90} depth={55} count={2000} factor={3.5} saturation={0.3} fade speed={0.3} />

      {/* ── Everything that must rotate together lives in this one group ── */}
      <group ref={globeRef}>

        {/* Earth surface */}
        <mesh>
          <sphereGeometry args={[2, 128, 128]} />
          <meshPhongMaterial
            map={earthDay}
            bumpMap={earthBump}
            bumpScale={0.12}
            specularMap={earthSpec}
            specular={new THREE.Color('#aad4ff')}
            shininess={55}
          />
        </mesh>

        {/* Night-lights (dark side only, additive) */}
        <mesh>
          <sphereGeometry args={[2.001, 64, 64]} />
          <meshBasicMaterial
            map={earthNight}
            transparent opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Primary cloud layer */}
        <mesh ref={cloudRef}>
          <sphereGeometry args={[2.042, 96, 96]} />
          <meshPhongMaterial
            map={clouds}
            transparent
            opacity={0.55}
            depthWrite={false}
            shininess={4}
            specular={new THREE.Color('#888888')}
          />
        </mesh>

        {/* Atmosphere scatter — soft blue rim only, no white */}
        <mesh scale={[1.18, 1.18, 1.18]}>
          <sphereGeometry args={[2, 48, 48]} />
          <shaderMaterial
            vertexShader={atmVert}
            fragmentShader={atmFrag}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Ocean shimmer tint */}
        <mesh>
          <sphereGeometry args={[2.005, 48, 48]} />
          <meshBasicMaterial
            color="#1a6eaa"
            transparent opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* ── Crisis markers — INSIDE the group so they rotate with globe ── */}
        {markers.map((m) => (
          <CrisisPin
            key={m.id}
            marker={m}
            active={m.id === selectedMarkerId}
            onMarkerSelect={onMarkerSelect}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3.4}
        maxDistance={8.0}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.45}
      />
    </>
  );
}

/* ── Exported component ─────────────────────────────────────────────────── */
export function SeismicGlobe(props: SeismicGlobeProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.8, 5.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <Suspense fallback={null}>
          <GlobeScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
