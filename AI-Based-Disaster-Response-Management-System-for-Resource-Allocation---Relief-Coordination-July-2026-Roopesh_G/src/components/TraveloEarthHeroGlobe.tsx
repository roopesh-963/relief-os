import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface TraveloEarthHeroGlobeProps {
  className?: string;
  onLoaded?: () => void;
}

export function TraveloEarthHeroGlobe({ className, onLoaded }: TraveloEarthHeroGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isDisposed = false;
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // ── 1. Three.js Scene, Camera & Renderer ──
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── 2. Globe Hierarchy ──
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Initial tilt to show India / Asia / Indian Ocean like the reference frame
    rootGroup.rotation.x = 0.28;
    rootGroup.rotation.y = -1.45;

    // ── 3. High-Quality Lighting to Match Reference Frame ──
    // Ambient light with soft blue fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    // Strong Sun Key Light from top-right (creates the bright specular reflection at 2 o'clock)
    const sunLight = new THREE.DirectionalLight(0xffffff, 4.5);
    sunLight.position.set(5.5, 4.0, 5.0);
    scene.add(sunLight);

    // Cyan atmosphere rim light from top-right edge
    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 3.5);
    cyanRimLight.position.set(4.0, 3.5, -2.0);
    scene.add(cyanRimLight);

    // Opposite rim light to highlight the silhouette
    const backRimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    backRimLight.position.set(-5.0, -2.0, -3.0);
    scene.add(backRimLight);

    // Bottom soft fill
    const bottomFill = new THREE.DirectionalLight(0x0284c7, 1.2);
    bottomFill.position.set(0, -4.0, 2.0);
    scene.add(bottomFill);

    // ── 4. Glowing Atmosphere Halo Mesh (Smooth 128x128 Geometry) ──
    /*
    const atmosGeo = new THREE.SphereGeometry(2.14, 128, 128);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      transparent: true,
      opacity: 0.36,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    rootGroup.add(atmosMesh);

    // Inner atmosphere rim glow (FrontSide additive)
    const innerAtmosGeo = new THREE.SphereGeometry(2.04, 128, 128);
    const innerAtmosMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00e5ff'),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerAtmosMesh = new THREE.Mesh(innerAtmosGeo, innerAtmosMat);
    rootGroup.add(innerAtmosMesh);
    */

    // ── 5. Instant Procedural Textured Earth (Ensures instantaneous 0ms display) ──
    const textureLoader = new THREE.TextureLoader();
    const fallbackEarthGroup = new THREE.Group();
    rootGroup.add(fallbackEarthGroup);

    const earthGeo = new THREE.SphereGeometry(2.0, 128, 128);
    const earthMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'), // White base to let texture colors show naturally
      roughness: 0.45,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    fallbackEarthGroup.add(earthMesh);

    // Clouds sphere
    const cloudsGeo = new THREE.SphereGeometry(2.03, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.48,
      blending: THREE.NormalBlending,
      roughness: 1.0,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    fallbackEarthGroup.add(cloudsMesh);

    // Load rich Earth textures
    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      (tex) => {
        if (isDisposed) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      }
    );

    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
      (bumpTex) => {
        if (isDisposed) return;
        earthMat.normalMap = bumpTex;
        earthMat.normalScale = new THREE.Vector2(0.2, 0.2);
        earthMat.needsUpdate = true;
      }
    );

    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
      (cloudTex) => {
        if (isDisposed) return;
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        cloudsMat.map = cloudTex;
        cloudsMat.needsUpdate = true;
      }
    );

    // ── 6. Load High-Resolution 3D earth.glb Model ──
    /*
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/earth.glb',
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        // Calculate bounding box and center
        const bbox = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        model.position.sub(center);

        // Normalize scale to target radius 2.0 (diameter 4.0)
        const scaleFactor = 4.0 / maxDim;
        const modelWrapper = new THREE.Group();
        modelWrapper.scale.setScalar(scaleFactor);
        modelWrapper.add(model);

        // Boost material brightness and color vibrance to match reference frame
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                m.depthWrite = true;
                if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhongMaterial) {
                  m.roughness = 0.5;
                }
                if (m.name && m.name.toUpperCase().includes('NUAGES')) {
                  m.transparent = true;
                  m.opacity = 0.85;
                  m.depthWrite = false;
                }
              });
            }
          }
        });

        // Swap fallback with high-res GLB
        rootGroup.remove(fallbackEarthGroup);
        rootGroup.add(modelWrapper);

        setIsModelLoaded(true);
        onLoaded?.();
      },
      undefined,
      (err) => {
        console.warn('Using procedural Earth fallback:', err);
      }
    );
    */

    // ── 7. Interactive Drag-to-Spin & Inertia ──
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const spinVelocity = { x: 0, y: 0.0025 };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouse = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMouse.x;
      const deltaY = clientY - prevMouse.y;

      rootGroup.rotation.y += deltaX * 0.005;
      rootGroup.rotation.x = Math.max(
        -0.7,
        Math.min(0.7, rootGroup.rotation.x + deltaY * 0.003)
      );

      spinVelocity.x = deltaY * 0.0006;
      spinVelocity.y = deltaX * 0.0012;

      prevMouse = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // ── 8. Responsive Resize ──
    const handleResize = () => {
      if (!container || isDisposed) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // ── 9. Render & Animation Loop ──
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();

      if (!isDragging) {
        // Smoothly decay spin velocity towards idle rotation speed
        spinVelocity.y = THREE.MathUtils.lerp(spinVelocity.y, 0.0018, 0.02);
        spinVelocity.x = THREE.MathUtils.lerp(spinVelocity.x, 0, 0.04);

        rootGroup.rotation.y += spinVelocity.y;
        rootGroup.rotation.x += spinVelocity.x;
      }

      // Slowly rotate clouds independently
      cloudsMesh.rotation.y += delta * 0.02;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      renderer.dispose();
      // atmosGeo.dispose();
      // atmosMat.dispose();
      // innerAtmosGeo.dispose();
      // innerAtmosMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full select-none ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
}
