import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PhotorealisticEarthGlobeProps {
  className?: string;
  onSelectCrisis?: (name: string, location: [number, number]) => void;
}

export function PhotorealisticEarthGlobe({ className = '', onSelectCrisis }: PhotorealisticEarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isDisposed = false;
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // ── 1. Create Ultra-Realistic Earth Surface Canvas Texture ──
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const ctx = earthCanvas.getContext('2d');

    if (ctx) {
      // Ocean Base: Bright azure tropical ocean grading to deep cobalt blue (like the reference photo)
      const oceanGrad = ctx.createRadialGradient(1024, 512, 100, 1024, 512, 1100);
      oceanGrad.addColorStop(0, '#1da1d2');
      oceanGrad.addColorStop(0.3, '#11689e');
      oceanGrad.addColorStop(0.7, '#0a3c6c');
      oceanGrad.addColorStop(1, '#061f42');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Shallow shelf waters along coastlines
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(0, 0, 2048, 1024);

      // Continents / Lush Landmasses (Green, Forest, Mountain Olive, Desert Gold)
      const drawContinent = (
        cx: number,
        cy: number,
        points: [number, number][],
        baseColor = '#3b7a37',
        highColor = '#789c4a'
      ) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + points[0][0], cy + points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(cx + points[i][0], cy + points[i][1]);
        }
        ctx.closePath();

        // Land fill
        ctx.fillStyle = baseColor;
        ctx.fill();

        // Mountain ridge highlight
        ctx.strokeStyle = highColor;
        ctx.lineWidth = 14;
        ctx.stroke();

        // Coastal glow
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
      };

      // North America
      drawContinent(
        420,
        320,
        [
          [-180, -120], [-80, -160], [120, -140], [180, -60],
          [210, 40], [150, 120], [60, 180], [-40, 130],
          [-120, 160], [-190, 80], [-230, -30],
        ],
        '#3a6f30',
        '#688a42'
      );

      // South America
      drawContinent(
        620,
        640,
        [
          [-60, -140], [70, -100], [110, 20], [80, 140],
          [10, 210], [-50, 160], [-90, 20], [-110, -80],
        ],
        '#2d5e2b',
        '#547738'
      );

      // Europe & UK
      drawContinent(
        1100,
        280,
        [
          [-110, -80], [20, -110], [130, -60], [140, 40],
          [60, 80], [-40, 70], [-100, 20],
        ],
        '#416e37',
        '#718f4c'
      );

      // Africa
      drawContinent(
        1140,
        540,
        [
          [-120, -130], [80, -120], [170, -30], [140, 100],
          [60, 180], [-30, 220], [-90, 140], [-160, 20],
        ],
        '#4d6932',
        '#918844'
      );

      // Asia
      drawContinent(
        1460,
        340,
        [
          [-160, -140], [40, -180], [240, -120], [310, 20],
          [220, 140], [90, 170], [-30, 110], [-120, 50],
        ],
        '#3a6932',
        '#6e8c45'
      );

      // Australia & Islands
      drawContinent(
        1680,
        720,
        [
          [-80, -60], [80, -70], [120, 10], [70, 80],
          [-40, 80], [-100, 20],
        ],
        '#756d3a',
        '#8a8247'
      );

      // Micro topography noise / mountain relief texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const rad = 2 + Math.random() * 8;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = 8;

    // ── 2. Earth Sphere Mesh (Main Globe) ──
    const earthGeometry = new THREE.SphereGeometry(2.0, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.38,
      metalness: 0.15,
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // ── 3. Atmosphere Halo (Luminous Sky Blue Glow matching reference image) ──
    const atmosphereGeometry = new THREE.SphereGeometry(2.14, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // ── 4. Circular Halo Ring of Fluffy White Clouds (Exact feature from picture!) ──
    const cloudsGroup = new THREE.Group();

    // Generate fluffy cloud puffs along an orbital ring surrounding the globe
    const cloudTextureCanvas = document.createElement('canvas');
    cloudTextureCanvas.width = 128;
    cloudTextureCanvas.height = 128;
    const cCtx = cloudTextureCanvas.getContext('2d');
    if (cCtx) {
      const grad = cCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.3, 'rgba(240, 248, 255, 0.75)');
      grad.addColorStop(0.7, 'rgba(224, 242, 254, 0.3)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(64, 64, 64, 0, Math.PI * 2);
      cCtx.fill();
    }
    const cloudTexture = new THREE.CanvasTexture(cloudTextureCanvas);

    const cloudCount = 72;
    const cloudRingRadius = 2.45;

    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2;
      const spreadY = (Math.random() - 0.5) * 0.45;
      const radiusOffset = (Math.random() - 0.5) * 0.25;
      const r = cloudRingRadius + radiusOffset;

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = spreadY;

      const spriteMat = new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.75 + Math.random() * 0.2,
        color: new THREE.Color('#ffffff'),
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x, y, z);
      const scale = 0.35 + Math.random() * 0.4;
      sprite.scale.set(scale, scale, 1);
      cloudsGroup.add(sprite);
    }

    // Tilt the cloud ring slightly like the reference artwork
    cloudsGroup.rotation.x = 0.45;
    cloudsGroup.rotation.z = -0.25;
    scene.add(cloudsGroup);

    // Inner cloud layer attached directly to globe surface
    const innerCloudGeo = new THREE.SphereGeometry(2.03, 48, 48);
    const innerCloudCanvas = document.createElement('canvas');
    innerCloudCanvas.width = 1024;
    innerCloudCanvas.height = 512;
    const icCtx = innerCloudCanvas.getContext('2d');
    if (icCtx) {
      icCtx.fillStyle = 'rgba(255,255,255,0)';
      icCtx.fillRect(0, 0, 1024, 512);
      icCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const w = 40 + Math.random() * 90;
        const h = 20 + Math.random() * 40;
        icCtx.beginPath();
        icCtx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        icCtx.fill();
      }
    }
    const innerCloudTexture = new THREE.CanvasTexture(innerCloudCanvas);
    const innerCloudMat = new THREE.MeshStandardMaterial({
      map: innerCloudTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const innerCloudMesh = new THREE.Mesh(innerCloudGeo, innerCloudMat);
    scene.add(innerCloudMesh);

    // ── 5. Orbiting "WORLD" Text Ribbon (Traverses Backside to Front) ──
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 2048;
    textCanvas.height = 160;
    const tCtx = textCanvas.getContext('2d');
    if (tCtx) {
      tCtx.clearRect(0, 0, 2048, 160);
      tCtx.font = '900 68px "Inter", "Space Grotesk", sans-serif';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';

      const items = ['WORLD', '✦', 'RELIEF OS', '✦', 'WORLD', '✦', 'GLOBAL CRISIS', '✦'];
      const step = 2048 / items.length;
      items.forEach((item, idx) => {
        const x = (idx + 0.5) * step;
        tCtx.fillStyle = item === '✦' ? '#ff6a40' : '#ffffff';
        tCtx.shadowColor = item === '✦' ? '#ff6a40' : '#38bdf8';
        tCtx.shadowBlur = 14;
        tCtx.fillText(item, x, 80);
      });
    }
    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.wrapS = THREE.RepeatWrapping;

    const textRingGeo = new THREE.CylinderGeometry(2.7, 2.7, 0.55, 64, 1, true);
    const textRingMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const textRingMesh = new THREE.Mesh(textRingGeo, textRingMat);
    textRingMesh.rotation.x = 0.35;
    textRingMesh.rotation.z = -0.2;
    scene.add(textRingMesh);

    // ── 6. Live Crisis Telemetry Hotspot Markers on Globe ──
    const crisisNodes = [
      { name: 'Seismic Rift Zone', lat: 36.2, lng: 138.2, type: 'critical' },
      { name: 'Cyclone Coastal Corridor', lat: 15.3, lng: 74.8, type: 'warning' },
      { name: 'Wildfire Defense Line', lat: 37.7, lng: -119.5, type: 'critical' },
      { name: 'Flood Relief Surge', lat: 23.8, lng: 90.4, type: 'warning' },
      { name: 'Volcanic Alert Sector', lat: -0.2, lng: -78.5, type: 'critical' },
    ];

    const pinsGroup = new THREE.Group();
    crisisNodes.forEach((node) => {
      const phi = ((90 - node.lat) * Math.PI) / 180;
      const theta = ((node.lng + 180) * Math.PI) / 180;
      const r = 2.04;

      const x = -r * Math.sin(phi) * Math.cos(theta);
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: node.type === 'critical' ? new THREE.Color('#ff3b30') : new THREE.Color('#ff9500'),
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(x, y, z);
      pinsGroup.add(pinMesh);

      // Pulse ring around pin
      const ringGeo = new THREE.RingGeometry(0.06, 0.085, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.type === 'critical' ? new THREE.Color('#ff3b30') : new THREE.Color('#ff9500'),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(x * 1.01, y * 1.01, z * 1.01);
      ringMesh.lookAt(x * 2, y * 2, z * 2);
      pinsGroup.add(ringMesh);
    });
    scene.add(pinsGroup);

    // ── 7. Lighting (Sun key light, blue sky fill light, atmospheric rim) ──
    const ambientLight = new THREE.AmbientLight(0xdff2ff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 3.2);
    sunLight.position.set(5, 4, 4);
    scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0x38bdf8, 1.8);
    skyFill.position.set(-5, -2, -3);
    scene.add(skyFill);

    // ── 8. Interactive Dragging / Rotating Controls ──
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      earthMesh.rotation.y += deltaX * 0.005;
      innerCloudMesh.rotation.y += deltaX * 0.005;
      pinsGroup.rotation.y += deltaX * 0.005;

      earthMesh.rotation.x += deltaY * 0.005;
      innerCloudMesh.rotation.x += deltaY * 0.005;
      pinsGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Handler
    const onResize = () => {
      if (!container || isDisposed) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // ── 9. Render Loop ──
    let animId: number;
    const animate = () => {
      if (isDisposed) return;

      // Smooth auto-rotation
      earthMesh.rotation.y += 0.003;
      innerCloudMesh.rotation.y += 0.004;
      pinsGroup.rotation.y += 0.003;

      // Clouds ring rotation (floating halo)
      cloudsGroup.rotation.y += 0.006;

      // Orbiting "WORLD" text ribbon
      textRingMesh.rotation.y -= 0.009;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      textRingGeo.dispose();
      textRingMat.dispose();
      earthTexture.dispose();
      cloudTexture.dispose();
      textTexture.dispose();
      innerCloudTexture.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[460px] select-none ${className}`}>
      {/* ── Background Giant Typographic "WORLD" (Like in User's prompt) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <span className="font-serif text-[18vw] font-black uppercase tracking-[0.2em] text-cyan-400/[0.04] select-none blur-[1px]">
          WORLD
        </span>
      </div>

      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10" />

      {/* Ambient Lighting & Glow Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,11,20,0.85)_100%)] z-20" />
    </div>
  );
}
