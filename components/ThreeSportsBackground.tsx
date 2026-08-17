// components/ThreeSportsBackground.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeSportsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = isMobile ? 18 : 22;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent
    container.appendChild(renderer.domElement);

    // 3. Dynamic Bright Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 5, 80);
    goldLight.position.set(12, 14, 12);
    scene.add(goldLight);

    const cyanLight = new THREE.PointLight(0x38bdf8, 4.5, 80);
    cyanLight.position.set(-12, -8, 10);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x818cf8, 3.5, 70);
    purpleLight.position.set(0, 10, -5);
    scene.add(purpleLight);

    // 4. Create 3D Sports Meshes
    const sportsGroup = new THREE.Group();
    scene.add(sportsGroup);

    // Ball 1: Cyber Football (Icosahedron with glowing wireframe)
    const fbRadius = isMobile ? 1.8 : 2.4;
    const footballGeom = new THREE.IcosahedronGeometry(fbRadius, 2);
    const footballMat = new THREE.MeshStandardMaterial({
      color: 0x13274e,
      roughness: 0.2,
      metalness: 0.85,
      flatShading: true,
    });
    const football = new THREE.Mesh(footballGeom, footballMat);
    football.position.set(isMobile ? -3.2 : -9.5, isMobile ? 6.5 : 5, -2);

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const footballWireframe = new THREE.Mesh(footballGeom, wireframeMat);
    football.add(footballWireframe);

    // Golden Orbit Ring around Football
    const fRingGeom = new THREE.TorusGeometry(fbRadius * 1.35, 0.04, 16, 64);
    const fRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 });
    const fRing = new THREE.Mesh(fRingGeom, fRingMat);
    fRing.rotation.x = Math.PI / 3;
    football.add(fRing);

    sportsGroup.add(football);

    // Ball 2: Glowing Cricket Ball (Sphere with gold seam ring)
    const cbRadius = isMobile ? 1.4 : 1.9;
    const cricketGeom = new THREE.SphereGeometry(cbRadius, 32, 32);
    const cricketMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Vivid Sports Red
      roughness: 0.35,
      metalness: 0.6,
    });
    const cricketBall = new THREE.Mesh(cricketGeom, cricketMat);
    cricketBall.position.set(isMobile ? 3.4 : 10.5, isMobile ? 1.5 : -3.5, -2);

    // Gold Seam torus
    const seamGeom = new THREE.TorusGeometry(cbRadius * 1.02, 0.07, 16, 64);
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.95,
      roughness: 0.15,
    });
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.rotation.x = Math.PI / 2;
    cricketBall.add(seam);
    sportsGroup.add(cricketBall);

    // Ball 3: Futuristic Neon Basketball
    const bbRadius = isMobile ? 1.5 : 2.1;
    const basketGeom = new THREE.SphereGeometry(bbRadius, 32, 32);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xea580c, // Bright electric orange
      roughness: 0.4,
      metalness: 0.5,
    });
    const basketBall = new THREE.Mesh(basketGeom, basketMat);
    basketBall.position.set(isMobile ? -3.0 : -8, isMobile ? -5.5 : -7.5, -3);

    const basketRingGeom = new THREE.TorusGeometry(bbRadius * 1.015, 0.05, 16, 64);
    const basketRingMat = new THREE.MeshBasicMaterial({ color: 0x091326 });
    const bRing1 = new THREE.Mesh(basketRingGeom, basketRingMat);
    const bRing2 = new THREE.Mesh(basketRingGeom, basketRingMat);
    bRing2.rotation.y = Math.PI / 2;
    basketBall.add(bRing1, bRing2);
    sportsGroup.add(basketBall);

    // Ball 4: Cyber Tennis/Badminton Shuttle Cock Orb
    const sbRadius = isMobile ? 1.1 : 1.5;
    const shuttleGeom = new THREE.OctahedronGeometry(sbRadius, 2);
    const shuttleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald Green
      roughness: 0.15,
      metalness: 0.9,
      wireframe: true,
    });
    const shuttleOrb = new THREE.Mesh(shuttleGeom, shuttleMat);
    shuttleOrb.position.set(isMobile ? 2.8 : 8.5, isMobile ? -10.5 : 7, -3);

    // Cyan Ring around Shuttlecock Orb
    const sRingGeom = new THREE.TorusGeometry(sbRadius * 1.4, 0.035, 16, 64);
    const sRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const sRing = new THREE.Mesh(sRingGeom, sRingMat);
    sRing.rotation.y = Math.PI / 4;
    shuttleOrb.add(sRing);

    sportsGroup.add(shuttleOrb);

    // 5. Star Particle Field (Nebula Particles)
    const particleCount = isMobile ? 160 : 260;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * (isMobile ? 35 : 55);
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * (isMobile ? 35 : 55);
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const rand = Math.random();
      if (rand < 0.45) {
        // Gold particle
        particleColors[i * 3] = 0.98;
        particleColors[i * 3 + 1] = 0.75;
        particleColors[i * 3 + 2] = 0.14;
      } else if (rand < 0.8) {
        // Cyan particle
        particleColors[i * 3] = 0.22;
        particleColors[i * 3 + 1] = 0.74;
        particleColors[i * 3 + 2] = 0.97;
      } else {
        // White / Emerald particle
        particleColors[i * 3] = 0.1;
        particleColors[i * 3 + 1] = 0.9;
        particleColors[i * 3 + 2] = 0.6;
      }
    }

    particleGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeom.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      size: isMobile ? 0.35 : 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // 6. Interactive Mouse & Touch Parallax Motion
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseX = (touch.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (touch.clientY / window.innerHeight - 0.5) * 2;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Resize Handler
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.position.z = mobile ? 18 : 22;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX = mouseX * 2.2;
      targetY = mouseY * 2.2;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (-targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Rotate Sports Elements
      football.rotation.x = elapsedTime * 0.35;
      football.rotation.y = elapsedTime * 0.45;
      football.position.y += Math.sin(elapsedTime * 1.2) * 0.008;

      fRing.rotation.z = elapsedTime * 0.6;

      cricketBall.rotation.y = elapsedTime * 0.5;
      cricketBall.rotation.x = elapsedTime * 0.3;
      cricketBall.position.y += Math.cos(elapsedTime * 1.5) * 0.007;

      basketBall.rotation.x = elapsedTime * 0.4;
      basketBall.rotation.z = elapsedTime * 0.3;
      basketBall.position.y += Math.sin(elapsedTime * 1.1 + 1) * 0.008;

      shuttleOrb.rotation.x = elapsedTime * 0.55;
      shuttleOrb.rotation.y = elapsedTime * 0.4;
      shuttleOrb.position.y += Math.cos(elapsedTime * 1.3) * 0.009;

      sRing.rotation.x = elapsedTime * 0.7;

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
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
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    />
  );
}
