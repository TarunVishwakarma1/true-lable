"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface IPhone3DProps {
  imageSrc: string;
  alt?: string;
  className?: string;
  interactive?: boolean;
  showHint?: boolean;
}

const MODEL_PATH = "/3d/iphone_air.glb";

function GLTFPhoneModel({
  imageSrc,
  interactive = true,
}: {
  imageSrc: string;
  interactive?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dragRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0,
  });

  // Load screenshot texture
  const texture = useLoader(THREE.TextureLoader, imageSrc);
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }, [texture]);

  // Load GLTF Model
  const { scene } = useGLTF(MODEL_PATH);

  // Clone scene & set up materials and exact planar UVs on screen mesh
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Object_4 is the front screen glass
        if (mesh.name === "Object_4") {
          const pos = mesh.geometry.attributes.position;
          if (pos) {
            const uvs = new Float32Array(pos.count * 2);
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i);
              const z = pos.getZ(i);
              // In local coordinates: X spans [-3.617, +3.617] (width), Z spans [-7.693, +7.693] (height)
              const u = (x + 3.617) / 7.234;
              const v = (z + 7.693) / 15.386;
              uvs[i * 2] = Math.max(0, Math.min(1, u));
              uvs[i * 2 + 1] = Math.max(0, Math.min(1, v));
            }
            mesh.geometry = mesh.geometry.clone();
            mesh.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
            const uvAttr = mesh.geometry.getAttribute("uv");
            if (uvAttr) uvAttr.needsUpdate = true;
          }

          mesh.material = new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
          });
        }
        // Object_2 is the main aluminum/titanium frame
        else if (mesh.name === "Object_2") {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#181a20"),
            metalness: 0.95,
            roughness: 0.2,
          });
        }
        // Object_6 is the matte back glass
        else if (mesh.name === "Object_6") {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#0d0e12"),
            metalness: 0.35,
            roughness: 0.45,
          });
        }
        // Object_3 & Object_5 are camera glass/lenses
        else if (mesh.name === "Object_3" || mesh.name === "Object_5") {
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#050507"),
            metalness: 0.9,
            roughness: 0.05,
            transmission: 0.8,
            ior: 1.5,
          });
        }
        // Object_8 & Object_9 are antenna / steel details
        else if (mesh.name === "Object_8" || mesh.name === "Object_9") {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#252830"),
            metalness: 0.85,
            roughness: 0.28,
          });
        }
      }
    });

    return cloned;
  }, [scene, texture]);

  // Update screen texture when active screen changes
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name === "Object_4") {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshBasicMaterial).map = texture;
          (mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
        }
      }
    });
  }, [clonedScene, texture]);

  // Physics loop for floating & damped rotation
  useFrame((state) => {
    if (!groupRef.current) return;

    const drag = dragRef.current;
    const t = state.clock.getElapsedTime();

    // Subtle breathing floating physics
    const hoverY = Math.sin(t * 1.6) * 0.06;
    const hoverRoll = Math.sin(t * 1.2) * 0.015;

    if (!drag.isDragging) {
      // Subtle cursor hover parallax tracking
      const factor = interactive ? 1.0 : 0.6;
      const targetPointerY = state.pointer.x * (0.35 * factor);
      const targetPointerX = -state.pointer.y * (0.24 * factor);

      // Friction damping on rotational momentum
      drag.velX *= 0.92;
      drag.velY *= 0.92;
      drag.rotX += drag.velX;
      drag.rotY += drag.velY;

      // Elastic snap-back towards pointer position
      drag.rotX = THREE.MathUtils.lerp(drag.rotX, targetPointerX, 0.06);
      drag.rotY = THREE.MathUtils.lerp(drag.rotY, targetPointerY, 0.06);
    }

    // Apply combined rotations
    groupRef.current.rotation.x = drag.rotX;
    groupRef.current.rotation.y = drag.rotY;
    groupRef.current.rotation.z = hoverRoll;
    groupRef.current.position.y = hoverY;
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        dragRef.current.isDragging = true;
        dragRef.current.prevX = e.clientX;
        dragRef.current.prevY = e.clientY;
      }}
      onPointerMove={(e) => {
        if (!interactive || !dragRef.current.isDragging) return;
        const dx = e.clientX - dragRef.current.prevX;
        const dy = e.clientY - dragRef.current.prevY;
        dragRef.current.prevX = e.clientX;
        dragRef.current.prevY = e.clientY;

        const sensitivity = 0.006;
        dragRef.current.rotY += dx * sensitivity;
        dragRef.current.rotX += dy * sensitivity;
        dragRef.current.velY = dx * sensitivity;
        dragRef.current.velX = dy * sensitivity;
      }}
      onPointerUp={() => {
        if (!interactive) return;
        dragRef.current.isDragging = false;
      }}
      onPointerOut={() => {
        if (!interactive) return;
        dragRef.current.isDragging = false;
      }}
    >
      {/* Centered & Orientated GLB Model */}
      <group
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.32}
        position={[0, 0, 0]}
      >
        <primitive object={clonedScene} />

        {/* Dynamic Island Notch Pill */}
        <mesh position={[0.29, 6.85, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <capsuleGeometry args={[0.22, 1.05, 16, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Front TrueDepth Camera Lens */}
        <mesh position={[0.295, 6.85, 0.38]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.075, 24]} />
          <meshBasicMaterial color="#090f1d" />
        </mesh>
        {/* Camera Lens Reflection Dot */}
        <mesh position={[0.296, 6.87, 0.39]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </mesh>

        {/* FaceID Sensor */}
        <mesh position={[0.295, 6.85, -0.28]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.065, 24]} />
          <meshBasicMaterial color="#050508" />
        </mesh>

        {/* Top Speaker Micro-Ear Grille */}
        <mesh position={[0.29, 7.42, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <capsuleGeometry args={[0.04, 0.8, 8, 8]} />
          <meshBasicMaterial color="#27272a" />
        </mesh>
      </group>
    </group>
  );
}

// Preload the GLB model in browser cache
useGLTF.preload(MODEL_PATH);

function FallbackMockup({ imageSrc, alt }: { imageSrc: string; alt?: string }) {
  return (
    <div className="relative mx-auto aspect-[9/19.5] w-full max-w-[320px] overflow-hidden rounded-[48px] border-[10px] border-neutral-900 bg-neutral-950 shadow-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt={alt ?? "Phone Screen"} className="h-full w-full object-cover object-top" />
    </div>
  );
}

export function IPhone3D({
  imageSrc,
  alt,
  className = "h-[580px] w-full",
  interactive = true,
  showHint = true,
}: IPhone3DProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <FallbackMockup imageSrc={imageSrc} alt={alt} />;
  }

  return (
    <div
      className={`relative ${className} select-none ${
        interactive ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {/* Subtle Hint Badge (only for interactive 3D hero) */}
      {showHint && interactive && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full border border-line bg-bg/80 px-3 py-1 text-[11px] font-mono text-muted backdrop-blur-md shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>3D iPhone Air · Drag to rotate</span>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="h-full w-full"
      >
        {/* Studio Lighting */}
        <ambientLight intensity={1.4} />
        {/* Key Front Light */}
        <directionalLight position={[4, 6, 6]} intensity={2.6} />
        {/* Fill Edge Light */}
        <directionalLight position={[-4, -3, 4]} intensity={1.6} color="#e4e4e7" />
        {/* Emerald Rim Highlight */}
        <directionalLight position={[0, 6, -4]} intensity={2.0} color="#10b981" />
        {/* Azure Back Rim */}
        <directionalLight position={[0, -5, -6]} intensity={1.5} color="#60a5fa" />

        <Suspense fallback={null}>
          <GLTFPhoneModel imageSrc={imageSrc} interactive={interactive} />
        </Suspense>
      </Canvas>
    </div>
  );
}
