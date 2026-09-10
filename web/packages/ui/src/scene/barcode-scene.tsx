"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const SEED =
  "TRUELABEL·KNOWWHATYOUEAT·MADEFORINDIANSHELVES·OPENSOURCE·COMMUNITYVERIFIED·APACHE2·FREE·SCANVERIFYKNOW·BHUJIA·BISCUITS·NOODLES";
const UNIT = 0.085;
const GAP = 0.055;
const HEIGHT = 1.7;
const DEPTH = 0.32;

function layout() {
  const chars = (SEED + SEED).split("");
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const c of chars) {
    const w = ((c.charCodeAt(0) % 3) + 1) * UNIT;
    bars.push({ x: x + w / 2, w });
    x += w + GAP;
  }
  const total = x - GAP;
  for (const b of bars) b.x -= total / 2;
  return { bars, total };
}

const ACCENT = new THREE.Color("#10b981");
const PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function Bars({ progress, dark, reduced }: { progress: MotionValue<number>; dark: boolean; reduced: boolean }) {
  const { bars, total } = useMemo(layout, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const { camera, raycaster, pointer, size } = useThree();

  const state = useMemo(
    () => ({
      h: new Float32Array(bars.length).fill(HEIGHT),
      mix: new Float32Array(bars.length),
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      s: new THREE.Vector3(),
      p: new THREE.Vector3(),
      c: new THREE.Color(),
      base: new THREE.Color(),
      hit: new THREE.Vector3(),
      mouseX: 0,
      camPos: new THREE.Vector3(0, 1.7, 9.2),
      look: new THREE.Vector3(0, 0.8, 0),
    }),
    [bars.length],
  );

  useFrame(({ clock }, dt) => {
    const im = mesh.current;
    if (!im) return;
    const t = clock.elapsedTime;
    const pr = progress.get();
    const k = 1 - Math.exp(-dt * 7);

    // Cursor position on the wall plane.
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(PLANE, state.hit)) {
      state.mouseX += (state.hit.x - state.mouseX) * k;
    }

    // Scroll drives the camera and the scan front along the wall.
    const rise = THREE.MathUtils.smoothstep(pr, 0, 1);
    // Portrait screens see a narrower slice of the wall, so back the camera off and aim lower
    // to keep the wall under the headline.
    const narrow = size.width < size.height ? 1 : 0;
    state.camPos.set(0, 1.7 + rise * 3.6 + narrow * 0.8, 9.2 + narrow * 6 - rise * 2.2);
    camera.position.lerp(state.camPos, k);
    state.look.set(0, 0.8 - narrow * 0.9 - rise * 0.4, 0);
    camera.lookAt(state.look);

    const front = -total / 2 + THREE.MathUtils.clamp((pr - 0.08) / 0.8, 0, 1) * total;
    state.base.set(dark ? "#3a3a37" : "#cfcfca");

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i]!;
      const d = b.x - state.mouseX;
      const lift = Math.exp(-(d * d) / 0.6);
      const idle = reduced ? 0 : Math.sin(t * 1.1 + b.x * 0.9) * 0.05;
      const targetH = HEIGHT * (1 + lift * 0.45) + idle;
      state.h[i] = state.h[i]! + (targetH - state.h[i]!) * k;

      const lit = b.x < front ? 1 : 0;
      const targetMix = Math.max(lit, lift);
      state.mix[i] = state.mix[i]! + (targetMix - state.mix[i]!) * k;

      const h = state.h[i]!;
      state.s.set(b.w, h, DEPTH);
      state.p.set(b.x, h / 2, 0);
      state.m.compose(state.p, state.q, state.s);
      im.setMatrixAt(i, state.m);
      state.c.copy(state.base).lerp(ACCENT, state.mix[i]!);
      im.setColorAt(i, state.c);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;

    if (light.current) {
      light.current.position.set(state.mouseX, 1.6, 1.4);
      light.current.intensity = dark ? 18 : 6;
    }
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, bars.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.38} metalness={0.08} />
      </instancedMesh>
      <pointLight ref={light} color="#10b981" distance={6} decay={2} />
    </>
  );
}

function Floor({ dark }: { dark: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[90, 40]} />
      <MeshReflectorMaterial
        blur={[320, 120]}
        resolution={768}
        mixBlur={1}
        mixStrength={dark ? 42 : 12}
        roughness={1}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={dark ? "#070707" : "#d9d9d6"}
        metalness={dark ? 0.55 : 0.15}
        mirror={0}
      />
    </mesh>
  );
}

export default function BarcodeScene({
  progress,
  dark,
  reduced,
  active,
}: {
  progress: MotionValue<number>;
  dark: boolean;
  reduced: boolean;
  active: boolean;
}) {
  const bg = dark ? "#0a0a0a" : "#f6f6f4";
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.7, 9.2], fov: 36, near: 0.1, far: 60 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <fog attach="fog" args={[bg, 6, 20]} />
      <ambientLight intensity={dark ? 0.35 : 0.9} />
      <directionalLight position={[4, 8, 6]} intensity={dark ? 3 : 2.6} />
      <directionalLight position={[-6, 3, -2]} intensity={dark ? 0.6 : 0.8} color="#bfe8d6" />
      <Bars progress={progress} dark={dark} reduced={reduced} />
      <Floor dark={dark} />
    </Canvas>
  );
}
