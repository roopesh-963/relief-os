import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function GlobeLetterO({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 240;
    const height = 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 4.8;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── 1. Tactical Earth Texture Generator ──
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 1024;
    earthCanvas.height = 512;
    const eCtx = earthCanvas.getContext('2d');
    if (eCtx) {
      // Deep Blue Oceans with gradient
      const oceanGrad = eCtx.createLinearGradient(0, 0, 0, 512);
      oceanGrad.addColorStop(0, '#091c38');
      oceanGrad.addColorStop(0.5, '#051020');
      oceanGrad.addColorStop(1, '#091c38');
      eCtx.fillStyle = oceanGrad;
      eCtx.fillRect(0, 0, 1024, 512);

      // Lat / Long Grid Overlay
      eCtx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
      eCtx.lineWidth = 1.2;
      for (let x = 0; x <= 1024; x += 64) {
        eCtx.beginPath();
        eCtx.moveTo(x, 0);
        eCtx.lineTo(x, 512);
        eCtx.stroke();
      }
      for (let y = 0; y <= 512; y += 42) {
        eCtx.beginPath();
        eCtx.moveTo(0, y);
        eCtx.lineTo(1024, y);
        eCtx.stroke();
      }

      // Continents with glowing cyan borders
      eCtx.fillStyle = '#0e3a5a';
      const continents = [
        { x: 190, y: 150, rx: 110, ry: 70 }, // N America
        { x: 280, y: 330, rx: 75, ry: 105 }, // S America
        { x: 530, y: 160, rx: 95, ry: 65 },  // Europe
        { x: 540, y: 290, rx: 105, ry: 95 }, // Africa
        { x: 750, y: 170, rx: 160, ry: 85 }, // Asia
        { x: 830, y: 370, rx: 75, ry: 50 },  // Australia
        { x: 512, y: 490, rx: 480, ry: 22 }, // Antarctica
      ];

      continents.forEach(({ x, y, rx, ry }) => {
        eCtx.beginPath();
        eCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        eCtx.fill();
        eCtx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        eCtx.lineWidth = 2.5;
        eCtx.stroke();

        // City telemetry dots
        eCtx.fillStyle = '#ff6a40';
        for (let i = 0; i < 7; i++) {
          const px = x + (Math.sin(i * 1.5) * rx * 0.65);
          const py = y + (Math.cos(i * 1.5) * ry * 0.65);
          eCtx.beginPath();
          eCtx.arc(px, py, 3.5, 0, Math.PI * 2);
          eCtx.fill();
        }
      });
    }

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    // ── 2. Earth Sphere Mesh ──
    const earthGeometry = new THREE.SphereGeometry(1.22, 48, 48);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.4,
      metalness: 0.25,
      emissive: new THREE.Color('#04142a'),
      emissiveIntensity: 0.5,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // ── 3. Atmosphere Glow Aura ──
    const glowGeometry = new THREE.SphereGeometry(1.29, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#22d3ee'),
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // ── 4. Texture for Orbiting "WORLD" Text ──
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 1024;
    textCanvas.height = 128;
    const tCtx = textCanvas.getContext('2d');
    if (tCtx) {
      tCtx.clearRect(0, 0, 1024, 128);
      tCtx.font = '900 50px "Space Grotesk", sans-serif, system-ui';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';

      // Phrases distributed around the 360-degree cylinder
      const phrases = ['WORLD', '✦', 'WORLD', '✦', 'WORLD', '✦', 'WORLD', '✦'];
      const step = 1024 / phrases.length;
      phrases.forEach((txt, idx) => {
        const x = (idx + 0.5) * step;
        tCtx.fillStyle = txt === '✦' ? '#ff6a40' : '#ffffff';
        tCtx.shadowColor = txt === '✦' ? '#ff6a40' : '#22d3ee';
        tCtx.shadowBlur = 10;
        tCtx.fillText(txt, x, 64);
      });
    }

    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.wrapS = THREE.RepeatWrapping;
    textTexture.wrapT = THREE.ClampToEdgeWrapping;

    // ── 5. Orbiting 3D Cylinder / Ring with "WORLD" text ──
    const textRingGeometry = new THREE.CylinderGeometry(1.72, 1.72, 0.44, 64, 1, true);
    const textRingMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const textRing = new THREE.Mesh(textRingGeometry, textRingMaterial);
    // Realistic axial tilt
    textRing.rotation.z = -0.25;
    textRing.rotation.x = 0.22;
    scene.add(textRing);

    // ── 6. Orbital Guide Ring Line ──
    const ringLineGeo = new THREE.RingGeometry(1.70, 1.73, 64);
    const ringLineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ff6a40'),
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ringLine = new THREE.Mesh(ringLineGeo, ringLineMat);
    ringLine.rotation.x = Math.PI / 2 + 0.22;
    ringLine.rotation.y = -0.25;
    scene.add(ringLine);

    // ── 7. Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    dirLight.position.set(4, 3, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 2.0);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // ── 8. Animation Loop ──
    let animId: number;
    const animate = () => {
      earthMesh.rotation.y += 0.009;
      textRing.rotation.y -= 0.016; // "WORLD" orbits around the globe, traversing backside to front
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      textRingGeometry.dispose();
      textRingMaterial.dispose();
      ringLineGeo.dispose();
      ringLineMat.dispose();
      earthTexture.dispose();
      textTexture.dispose();
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={`inline-flex items-center justify-center align-middle relative select-none mx-0.5 sm:mx-1 ${className}`}
      style={{
        width: '0.88em',
        height: '0.88em',
        verticalAlign: '-0.14em',
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]"
      />
    </span>
  );
}
