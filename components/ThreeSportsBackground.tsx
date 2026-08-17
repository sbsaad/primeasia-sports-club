// components/ThreeSportsBackground.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeSportsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xc9a227, 4, 60);
    goldLight.position.set(15, 12, 10);
    scene.add(goldLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 3.5, 60);
    blueLight.position.set(-15, -10, 8);
    scene.add(blueLight);

    // 4. Create 3D Sports Meshes
    const sportsGroup = new THREE.Group();
    scene.add(sportsGroup);

    // Ball 1: Cyber Football (Icosahedron with glowing wireframe)
    const footballGeom = new THREE.IcosahedronGeometry(2.4, 2);
    const footballMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f,
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true,
    });
    const football = new THREE.Mesh(footballGeom, footballMat);
    football.position.set(-10, 5, -2);

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xc9a227,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const footballWireframe = new THREE.Mesh(footballGeom, wireframeMat);
    football.add(footballWireframe);
    sportsGroup.add(football);

    // Ball 2: Glowing Cricket Ball (Sphere with gold seam ring)
    const cricketGeom = new THREE.SphereGeometry(1.8, 32, 32);
    const cricketMat = new THREE.MeshStandardMaterial({
      color: 0x8b1e22, // Deep sports maroon
      roughness: 0.4,
      metalness: 0.5,
    });
    const cricketBall = new THREE.Mesh(cricketGeom, cricketMat);
    cricketBall.position.set(11, -4, -3);

    // Seam torus
    const seamGeom = new THREE.TorusGeometry(1.82, 0.06, 16, 64);
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0xf5e6a3,
      metalness: 0.9,
      roughness: 0.2,
    });
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.rotation.x = Math.PI / 2;
    cricketBall.add(seam);
    sportsGroup.add(cricketBall);

    // Ball 3: Futuristic Neon Basketball
    const basketGeom = new THREE.SphereGeometry(2.0, 32, 32);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Neon amber orange
      roughness: 0.5,
      metalness: 0.4,
    });
    const basketBall = new THREE.Mesh(basketGeom, basketMat);
    basketBall.position.set(-8, -8, -5);

    const basketRingGeom = new THREE.TorusGeometry(2.02, 0.05, 16, 64);
    const basketRingMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const bRing1 = new THREE.Mesh(basketRingGeom, basketRingMat);
    const bRing2 = new THREE.Mesh(basketRingGeom, basketRingMat);
    bRing2.rotation.y = Math.PI / 2;
    basketBall.add(bRing1, bRing2);
    sportsGroup.add(basketBall);

    // Ball 4: Cyber Tennis/Badminton Shuttle Cock Orb
    const shuttleGeom = new THREE.OctahedronGeometry(1.5, 2);
    const shuttleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: true,
    });
    const shuttleOrb = new THREE.Mesh(shuttleGeom, shuttleMat);
    shuttleOrb.position.set(9, 7, -4);
    sportsGroup.add(shuttleOrb);

    // 5. Star Particle Field (Nebula Particles)
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 50;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const isGold = Math.random() > 0.5;
      particleColors[i * 3] = isGold ? 0.79 : 0.23;
      particleColors[i * 3 + 1] = isGold ? 0.64 : 0.51;
      particleColors[i * 3 + 2] = isGold ? 0.15 : 0.96;
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
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 6. Interactive Mouse Motion Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) * 0.001;
      mouseY = (e.clientY - windowHalfY) * 0.001;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = targetX * 12;
      camera.position.y = -targetY * 12;
      camera.lookAt(scene.position);

      // Rotate individual sports balls
      football.rotation.x += 0.006;
      football.rotation.y += 0.009;
      football.position.y = 5 + Math.sin(elapsedTime * 1.2) * 0.5;

      cricketBall.rotation.y += 0.008;
      cricketBall.rotation.z += 0.005;
      cricketBall.position.y = -4 + Math.cos(elapsedTime * 1.5) * 0.4;

      basketBall.rotation.x -= 0.007;
      basketBall.rotation.y += 0.006;
      basketBall.position.y = -8 + Math.sin(elapsedTime * 0.9) * 0.6;

      shuttleOrb.rotation.y += 0.012;
      shuttleOrb.rotation.z += 0.008;
      shuttleOrb.position.y = 7 + Math.sin(elapsedTime * 1.4) * 0.45;

      // Slowly rotate particle field
      particleSystem.rotation.y = elapsedTime * 0.02;
      particleSystem.rotation.x = elapsedTime * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Window Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
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
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    />
  );
}
