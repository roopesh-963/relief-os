/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CartoonEarthGlobe — loads the earth_cartoon.glb model using @react-three/fiber.
 * Floats, rotates, and renders with a soft shadow.
 */
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import type { Group } from 'three';

function EarthModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);
  const modelFit = useMemo(() => {
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;

    return {
      centerOffset: center.multiplyScalar(-1),
      scale: 4.5 / maxDimension,
    };
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Gentle auto-rotation
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    // Floating bob
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef} scale={modelFit.scale}>
      <primitive object={scene} position={modelFit.centerOffset} />
    </group>
  );
}

export function CartoonEarthGlobe({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 30, near: 0.1, far: 200 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 5, 5]} intensity={2.0} castShadow />
        <directionalLight position={[-4, -2, -3]} intensity={0.8} color="#ffddaa" />
        <Suspense fallback={null}>
          <EarthModel url="/earth_cartoon.glb" />
          <ContactShadows
            position={[0, -1.72, 0]}
            opacity={0.35}
            scale={4.6}
            blur={2}
            far={2}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload so it's ready when the page mounts
useGLTF.preload('/earth_cartoon.glb');
