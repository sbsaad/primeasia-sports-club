// components/ThreeSportsBackground.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeSportsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    // 2. WebGL Renderer with High Precision & Responsive Viewport
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    containerRef.current.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;

    // 3. Multi-directional Luminous Stadium Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.8);
    scene.add(ambientLight);

    const stadiumMainLight = new THREE.DirectionalLight(0xfff5ea, 2.4);
    stadiumMainLight.position.set(10, 20, 15);
    scene.add(stadiumMainLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    blueRimLight.position.set(-15, -10, 8);
    scene.add(blueRimLight);

    const goldPointLight = new THREE.PointLight(0xfbbf24, 6, 100);
    goldPointLight.position.set(12, 10, 10);
    scene.add(goldPointLight);

    const cyanLight = new THREE.PointLight(0x38bdf8, 5, 90);
    cyanLight.position.set(-12, -6, 12);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x818cf8, 4, 80);
    purpleLight.position.set(0, 14, -4);
    scene.add(purpleLight);

    // 4. Create 3D Sports Meshes & World Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Mesh 1: Cyber Football
    const fbRadius = isMobile ? 1.8 : 2.5;
    const footballGeom = new THREE.IcosahedronGeometry(fbRadius, 2);
    const footballMat = new THREE.MeshStandardMaterial({
      color: 0x1a3668,
      roughness: 0.15,
      metalness: 0.9,
      flatShading: true,
    });
    const football = new THREE.Mesh(footballGeom, footballMat);
    football.position.set(isMobile ? -3.4 : -10.5, isMobile ? 6.8 : 5.5, -2);

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const footballWireframe = new THREE.Mesh(footballGeom, wireframeMat);
    football.add(footballWireframe);

    const fRingGeom = new THREE.TorusGeometry(fbRadius * 1.35, 0.05, 16, 64);
    const fRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.65 });
    const fRing = new THREE.Mesh(fRingGeom, fRingMat);
    fRing.rotation.x = Math.PI / 3;
    football.add(fRing);
    worldGroup.add(football);

    // Mesh 2: Glowing Cricket Ball
    const cbRadius = isMobile ? 1.4 : 2.0;
    const cricketGeom = new THREE.SphereGeometry(cbRadius, 32, 32);
    const cricketMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Bright Sports Crimson
      roughness: 0.25,
      metalness: 0.7,
    });
    const cricketBall = new THREE.Mesh(cricketGeom, cricketMat);
    cricketBall.position.set(isMobile ? 3.5 : 11.5, isMobile ? 1.8 : -3.5, -2);

    const seamGeom = new THREE.TorusGeometry(cbRadius * 1.02, 0.08, 16, 64);
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.98,
      roughness: 0.1,
    });
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.rotation.x = Math.PI / 2;
    cricketBall.add(seam);
    worldGroup.add(cricketBall);

    // Mesh 3: Futuristic Neon Basketball
    const bbRadius = isMobile ? 1.5 : 2.2;
    const basketGeom = new THREE.SphereGeometry(bbRadius, 32, 32);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Bright Neon Orange
      roughness: 0.35,
      metalness: 0.6,
    });
    const basketBall = new THREE.Mesh(basketGeom, basketMat);
    basketBall.position.set(isMobile ? -3.2 : -9, isMobile ? -5.8 : -8, -3);

    const basketRingGeom = new THREE.TorusGeometry(bbRadius * 1.015, 0.06, 16, 64);
    const basketRingMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const bRing1 = new THREE.Mesh(basketRingGeom, basketRingMat);
    const bRing2 = new THREE.Mesh(basketRingGeom, basketRingMat);
    bRing2.rotation.y = Math.PI / 2;
    basketBall.add(bRing1, bRing2);
    worldGroup.add(basketBall);

    // Mesh 4: Cyber Shuttlecock / Emerald Energy Orb
    const sbRadius = isMobile ? 1.2 : 1.6;
    const shuttleGeom = new THREE.OctahedronGeometry(sbRadius, 2);
    const shuttleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald Green
      roughness: 0.15,
      metalness: 0.95,
      wireframe: true,
    });
    const shuttleOrb = new THREE.Mesh(shuttleGeom, shuttleMat);
    shuttleOrb.position.set(isMobile ? 3.0 : 9.5, isMobile ? -10.8 : 7.5, -3);

    const sRingGeom = new THREE.TorusGeometry(sbRadius * 1.4, 0.04, 16, 64);
    const sRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const sRing = new THREE.Mesh(sRingGeom, sRingMat);
    sRing.rotation.y = Math.PI / 4;
    shuttleOrb.add(sRing);
    worldGroup.add(shuttleOrb);

    // Mesh 5: Championship Golden Trophy Cup (Crisp Sports Cup with Glowing Star)
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(0, isMobile ? -2.2 : -1.8, -7);

    const goldTrophyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Pedestal base
    const baseGeom = new THREE.CylinderGeometry(1.2, 1.4, 0.5, 24);
    const cupBase = new THREE.Mesh(baseGeom, goldTrophyMat);
    cupBase.position.y = -1.1;
    trophyGroup.add(cupBase);

    // Slim stem
    const stemGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 24);
    const cupStem = new THREE.Mesh(stemGeom, goldTrophyMat);
    cupStem.position.y = -0.4;
    trophyGroup.add(cupStem);

    // Main Trophy Bowl / Cup Chalice
    const bowlGeom = new THREE.CylinderGeometry(1.45, 0.7, 1.7, 24);
    const cupBowl = new THREE.Mesh(bowlGeom, goldTrophyMat);
    cupBowl.position.y = 0.8;
    trophyGroup.add(cupBowl);

    // Left & Right Curved Handles
    const handleGeom = new THREE.TorusGeometry(0.6, 0.09, 16, 24, Math.PI);
    const leftHandle = new THREE.Mesh(handleGeom, goldTrophyMat);
    leftHandle.position.set(-1.1, 0.8, 0);
    leftHandle.rotation.z = Math.PI / 2;
    trophyGroup.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeom, goldTrophyMat);
    rightHandle.position.set(1.1, 0.8, 0);
    rightHandle.rotation.z = -Math.PI / 2;
    trophyGroup.add(rightHandle);

    // Floating Golden Championship Star on Top
    const starGeom = new THREE.OctahedronGeometry(0.45, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.75,
      metalness: 0.9,
      roughness: 0.1,
    });
    const trophyStar = new THREE.Mesh(starGeom, starMat);
    trophyStar.position.y = 2.2;
    trophyGroup.add(trophyStar);

    worldGroup.add(trophyGroup);

    // 5. Dynamic Streaming Starfield / World-Moving Particle Flow
    const particleCount = isMobile ? 220 : 400;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    const rangeX = isMobile ? 35 : 60;
    const rangeY = isMobile ? 40 : 60;
    const rangeZ = 50;

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * rangeX;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * rangeY;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * rangeZ;

      particleSpeeds[i] = 0.04 + Math.random() * 0.08; // Forward movement speed

      // Luminous gold, cyan, and white particle colors
      const rVal = Math.random();
      if (rVal < 0.45) {
        // Gold
        particleColors[i * 3] = 0.98;
        particleColors[i * 3 + 1] = 0.75;
        particleColors[i * 3 + 2] = 0.15;
      } else if (rVal < 0.8) {
        // Cyan
        particleColors[i * 3] = 0.22;
        particleColors[i * 3 + 1] = 0.74;
        particleColors[i * 3 + 2] = 0.97;
      } else {
        // Pure Starlight White
        particleColors[i * 3] = 1.0;
        particleColors[i * 3 + 1] = 1.0;
        particleColors[i * 3 + 2] = 1.0;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.26 : 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 6. Interactive Mouse & Touch Parallax Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        targetMouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // 7. Responsive Window Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // 8. Animation & World Sensation Render Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth camera sway following mouse/touch
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      camera.position.x = currentMouseX * 2.2;
      camera.position.y = currentMouseY * 1.8;
      camera.lookAt(0, 0, 0);

      // Rotate individual sports meshes
      football.rotation.y += 0.012;
      football.rotation.x += 0.008;

      cricketBall.rotation.y += 0.015;
      cricketBall.rotation.z += 0.01;

      basketBall.rotation.x += 0.014;
      basketBall.rotation.y += 0.01;

      shuttleOrb.rotation.y += 0.018;
      shuttleOrb.rotation.z += 0.012;

      trophyGroup.rotation.y += 0.012;
      trophyStar.rotation.y += 0.025;
      trophyStar.rotation.x += 0.015;

      // Gentle floating oscillation
      football.position.y = (isMobile ? 6.8 : 5.5) + Math.sin(elapsedTime * 1.5) * 0.5;
      cricketBall.position.y = (isMobile ? 1.8 : -3.5) + Math.cos(elapsedTime * 1.8) * 0.45;
      basketBall.position.y = (isMobile ? -5.8 : -8) + Math.sin(elapsedTime * 1.3) * 0.4;
      shuttleOrb.position.y = (isMobile ? -10.8 : 7.5) + Math.cos(elapsedTime * 1.6) * 0.45;
      trophyGroup.position.y = (isMobile ? -2.2 : -1.8) + Math.sin(elapsedTime * 1.2) * 0.35;

      // Continuous Streaming Warp Particle Motion (Z-axis forward flying)
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Move particle towards camera
        positions[i * 3 + 2] += particleSpeeds[i];

        // If particle moves past the camera, loop back to the deep background
        if (positions[i * 3 + 2] > 16) {
          positions[i * 3 + 2] = -rangeZ / 2;
          positions[i * 3] = (Math.random() - 0.5) * rangeX;
          positions[i * 3 + 1] = (Math.random() - 0.5) * rangeY;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    const container = containerRef.current;
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
