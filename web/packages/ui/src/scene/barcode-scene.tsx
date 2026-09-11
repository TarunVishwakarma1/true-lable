"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { holdTone, play, sweepTone } from "../sound";
import { usePointer } from "../use-pointer";
import { Resume } from "./resume";
import * as THREE from "three";

const SEED =
  "TRUELABEL·KNOWWHATYOUEAT·MADEFORINDIANSHELVES·OPENSOURCE·COMMUNITYVERIFIED·APACHE2·FREE·SCANVERIFYKNOW·BHUJIA·BISCUITS·NOODLES";
const UNIT = 0.085;
const GAP = 0.055;
const HEIGHT = 1.7;
const DEPTH = 0.32;
const PARTICLES = 420;

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

// Overbright so only lit bars cross the bloom threshold.
const BOOST = 1.7;
const PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

type Props = {
  progress: MotionValue<number>;
  hold: MotionValue<number>;
  dark: boolean;
  reduced: boolean;
  accent: string;
  eventSource: RefObject<HTMLElement | null>;
};

function Bars({ progress, hold, dark, reduced, accent, eventSource }: Props) {
  const { bars, total } = useMemo(layout, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const points = useRef<THREE.Points>(null);
  const { camera, raycaster, size } = useThree();
  const ndc = usePointer(eventSource);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const ACCENT = useMemo(() => new THREE.Color(accent).multiplyScalar(BOOST), [accent]);

  // Silence the shared drones so a mid-gesture unmount can't leave them humming.
  useEffect(() => () => {
    sweepTone(false);
    holdTone(false);
  }, []);

  const state = useMemo(() => {
    const seeds = new Float32Array(PARTICLES * 4);
    for (let i = 0; i < PARTICLES; i++) {
      seeds[i * 4] = Math.random(); // x (0..1 of total)
      seeds[i * 4 + 1] = Math.random(); // phase
      seeds[i * 4 + 2] = 0.4 + Math.random() * 0.9; // speed
      seeds[i * 4 + 3] = (Math.random() - 0.5) * 0.6; // z
    }
    return {
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
      prevMouseX: 0,
      camPos: new THREE.Vector3(0, 1.7, 9.2),
      look: new THREE.Vector3(0, 0.8, 0),
      seeds,
      pos: new Float32Array(PARTICLES * 3),
      alpha: new Float32Array(PARTICLES),
      // Bar index last ticked for the scroll-driven scan front — -1 so the very
      // first lit bar still ticks.
      lastFrontIdx: -1,
    };
  }, [bars.length]);

  useFrame(({ clock }, dt) => {
    const im = mesh.current;
    if (!im) return;
    const t = clock.elapsedTime;
    const pr = progress.get();
    const hd = hold.get();
    const k = 1 - Math.exp(-dt * 7);

    pointer.set(ndc.current.x, ndc.current.y);
    raycaster.setFromCamera(pointer, camera);
    if (ndc.current.inside && raycaster.ray.intersectPlane(PLANE, state.hit)) {
      state.mouseX += (state.hit.x - state.mouseX) * k;
    }
    // How fast the cursor is actually sweeping — driving the "vroom" off this (rather
    // than plain proximity) means it's silent the instant the cursor stops, even mid-hover.
    const speed = Math.abs(state.mouseX - state.prevMouseX) / Math.max(dt, 1 / 240);
    state.prevMouseX = state.mouseX;

    // Scroll drives the camera and the scan front along the wall. Portrait screens
    // see a narrower slice, so back the camera off and aim lower.
    const rise = THREE.MathUtils.smoothstep(pr, 0, 1);
    const narrow = size.width < size.height ? 1 : 0;
    state.camPos.set(0, 1.7 + rise * 3.6 + narrow * 0.4, 9.2 + narrow * 4.5 - rise * 2.2);
    camera.position.lerp(state.camPos, k);
    state.look.set(0, 0.8 - narrow * 0.6 - rise * 0.4, 0);
    camera.lookAt(state.look);

    const front = -total / 2 + THREE.MathUtils.clamp((pr - 0.08) / 0.8, 0, 1) * total;
    const radius = hd * total * 0.6;
    state.base.set(dark ? "#3a3a37" : "#c9c4b6");

    // Bars are laid out left-to-right, so "how far the front has swept" is just the index
    // of the last bar behind it, and "distance to the nearest bar" falls out of the same
    // per-bar loop below — no extra pass needed for either.
    let frontIdx = -1;
    let nearDist = Infinity;

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i]!;
      const d = b.x - state.mouseX;
      const ad = Math.abs(d);
      if (ad < nearDist) nearDist = ad;
      if (b.x < front) frontIdx = i;
      const lift = Math.exp(-(d * d) / 0.6);
      const idle = reduced ? 0 : Math.sin(t * 1.1 + b.x * 0.9) * 0.05;
      // Ripple: the scan front pushes a wave through the wall as it passes.
      const df = b.x - front;
      const ripple = reduced ? 0 : Math.exp(-(df * df) / 0.35) * 0.9;
      const dh = ad - radius;
      const holdEdge = hd > 0 ? Math.exp(-(dh * dh) / 0.3) * 0.7 * Math.min(1, hd * 3) : 0;
      const targetH = HEIGHT * (1 + lift * 0.45 + ripple + holdEdge) + idle;
      state.h[i] = state.h[i]! + (targetH - state.h[i]!) * k;

      const lit = b.x < front || ad < radius ? 1 : 0;
      const targetMix = Math.max(lit, lift * 0.9);
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

    // A click per bar as the scan front sweeps past it — index comparison, so silent
    // (and free) whenever nothing's scrolling. play("tick") is itself rate-limited
    // (packages/ui/src/sound.tsx), so a fast scroll can't turn this into a buzz.
    if (frontIdx >= 0 && frontIdx !== state.lastFrontIdx) {
      state.lastFrontIdx = frontIdx;
      play("tick");
    }
    // A soft "vroom" while the cursor is actually sweeping (speed-driven, so a still
    // cursor goes quiet even mid-hover), and a deeper "hum" that builds with the
    // existing hold-to-scan progress — both drive one persistent drone each
    // (packages/ui/src/sound.tsx), so sweeping/holding never spawns nodes.
    const nearness = Math.max(0, 1 - nearDist / 1.4);
    sweepTone(ndc.current.inside, Math.min(1, speed / 9) * nearness);
    holdTone(hd > 0, hd);

    // Particles: sparks lift off lit bars near the front and near the cursor.
    const pts = points.current;
    if (pts && !reduced) {
      const posAttr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
      const alphaAttr = pts.geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
      const frontN = (front + total / 2) / total;
      for (let i = 0; i < PARTICLES; i++) {
        const sx = state.seeds[i * 4]!;
        const ph = state.seeds[i * 4 + 1]!;
        const sp = state.seeds[i * 4 + 2]!;
        const sz = state.seeds[i * 4 + 3]!;
        const x = -total / 2 + sx * total;
        const near = Math.abs(sx - frontN) < 0.06 || Math.abs(x - state.mouseX) < 0.8 || Math.abs(Math.abs(x - state.mouseX) - radius) < 0.5;
        const life = (t * sp + ph * 10) % 1;
        const y = HEIGHT + life * 2.6;
        state.pos[i * 3] = x + Math.sin(t * 2 + ph * 20) * 0.08;
        state.pos[i * 3 + 1] = y;
        state.pos[i * 3 + 2] = sz;
        const target = near ? (1 - life) * 0.9 : 0;
        state.alpha[i] = state.alpha[i]! + (target - state.alpha[i]!) * Math.min(1, k * 2);
      }
      posAttr.copyArray(state.pos);
      posAttr.needsUpdate = true;
      alphaAttr.copyArray(state.alpha);
      alphaAttr.needsUpdate = true;
    }

    if (light.current) {
      light.current.position.set(state.mouseX, 1.6, 1.4);
      light.current.intensity = (dark ? 18 : 6) * (1 + hd * 1.5);
    }
  });

  const particleGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(PARTICLES), 1));
    return g;
  }, []);

  const particleMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(accent) }, uSize: { value: 26 } },
        vertexShader: `
          attribute float aAlpha; varying float vA; uniform float uSize;
          void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0);
            gl_PointSize = uSize * (1.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `
          uniform vec3 uColor; varying float vA;
          void main(){ float d = length(gl_PointCoord - 0.5); if(d>0.5) discard;
            float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(uColor * 2.0, a); }`,
      }),
    [],
  );
  useEffect(() => {
    (particleMat.uniforms.uColor!.value as THREE.Color).set(accent);
  }, [accent, particleMat]);

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, bars.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.38} metalness={0.08} />
      </instancedMesh>
      <points ref={points} geometry={particleGeo} material={particleMat} frustumCulled={false} />
      <pointLight ref={light} color={accent} distance={6} decay={2} />
    </>
  );
}

function Floor({ dark, quality }: { dark: boolean; quality: "high" | "low" }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[90, 40]} />
      <MeshReflectorMaterial
        blur={[320, 120]}
        resolution={quality === "high" ? 512 : 256}
        mixBlur={1}
        mixStrength={dark ? 42 : 10}
        roughness={1}
        depthScale={1.1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={dark ? "#070707" : "#d6d1c4"}
        metalness={dark ? 0.55 : 0.12}
        mirror={0}
      />
    </mesh>
  );
}

export default function BarcodeScene({
  progress,
  hold,
  dark,
  reduced,
  active,
  quality,
  accent,
  eventSource,
}: Props & { active: boolean; quality: "high" | "low"; eventSource: RefObject<HTMLElement | null> }) {
  const bg = dark ? "#0a0a0a" : "#f3f0e8";
  // Pick a pixel ratio once. Changing it live would leave the post-processing buffers stale.
  const dpr = useMemo(() => {
    const cores = typeof navigator === "undefined" ? 8 : (navigator.hardwareConcurrency ?? 8);
    return quality === "high" && cores >= 6 ? 1.5 : 1.25;
  }, [quality]);
  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.7, 9.2], fov: 36, near: 0.1, far: 60 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <fog attach="fog" args={[bg, 6, 20]} />
      <ambientLight intensity={dark ? 0.35 : 0.9} />
      <directionalLight position={[4, 8, 6]} intensity={dark ? 3 : 2.4} />
      <directionalLight position={[-6, 3, -2]} intensity={dark ? 0.6 : 0.8} color="#bfe8d6" />
      <Resume active={active} />
      <Bars progress={progress} hold={hold} dark={dark} reduced={reduced} accent={accent} eventSource={eventSource} />
      <Floor dark={dark} quality={quality} />
      {quality === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.2} mipmapBlur intensity={dark ? 0.9 : 0.5} radius={0.7} />
          <ChromaticAberration offset={[0.0009, 0.0006]} radialModulation modulationOffset={0.4} />
          <Noise opacity={dark ? 0.06 : 0.04} blendFunction={BlendFunction.SOFT_LIGHT} />
          <Vignette offset={0.25} darkness={dark ? 0.7 : 0.35} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
