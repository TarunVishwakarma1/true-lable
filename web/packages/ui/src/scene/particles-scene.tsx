"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { usePointer } from "../use-pointer";
import { Resume } from "./resume";

const COUNT = 14000;
const SEED = "TRUELABEL·KNOWWHATYOUEAT·INDIA·SCANVERIFYKNOW";

// Deterministic PRNG so the field is identical on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Four shapes the same 14k points morph between, all in a box about 8 × 4.4 units.
function shapes() {
  const rand = rng(7);
  const A = new Float32Array(COUNT * 3); // scattered cloud
  const B = new Float32Array(COUNT * 3); // barcode
  const C = new Float32Array(COUNT * 3); // rows of a label
  const D = new Float32Array(COUNT * 3); // 52% arc
  const seeds = new Float32Array(COUNT);

  // A real-looking EAN: guard bars at both ends and the middle, wider gaps so bars read as bars.
  const bars: { x: number; w: number }[] = [];
  let bx = 0;
  const push = (w: number, gap: number) => {
    bars.push({ x: bx, w });
    bx += w + gap;
  };
  const digits = SEED.split("");
  push(0.06, 0.1);
  push(0.06, 0.18);
  for (let i = 0; i < 28; i++) {
    if (i === 14) {
      push(0.06, 0.1);
      push(0.06, 0.18);
    }
    push(((digits[i % digits.length]!.charCodeAt(0) % 3) + 1) * 0.07, 0.13 + (i % 3) * 0.05);
  }
  push(0.06, 0.1);
  push(0.06, 0);
  // Fit the code inside the visible width (about 8 units at z = 0).
  const fit = 7 / bx;
  for (const b of bars) {
    b.x *= fit;
    b.w *= fit;
  }
  const total = bx * fit;

  for (let i = 0; i < COUNT; i++) {
    seeds[i] = rand();

    // A: an ellipsoid cloud with denser core
    const r = Math.pow(rand(), 0.6);
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(2 * rand() - 1);
    A[i * 3] = Math.sin(ph) * Math.cos(th) * r * 4.2;
    A[i * 3 + 1] = Math.cos(ph) * r * 2.2;
    A[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r * 2.4;

    // B: barcode. Guard bars (first, last, middle pairs) run taller, like the real thing.
    const bi = Math.floor(rand() * bars.length);
    const bar = bars[bi]!;
    const guard = bi < 2 || bi >= bars.length - 2 || bi === 16 || bi === 17;
    B[i * 3] = bar.x + rand() * bar.w - total / 2;
    B[i * 3 + 1] = (rand() - 0.5) * (guard ? 2.7 : 2.4) + (guard ? -0.15 : 0);
    B[i * 3 + 2] = (rand() - 0.5) * 0.06;

    // C: eight table rows: a label hairline, a dotted leader, and a value block at the right
    const row = Math.floor(rand() * 8);
    const y = 1.6 - row * 0.46;
    const u = rand();
    if (u < 0.55) {
      C[i * 3] = -3.6 + rand() * 2.2;
      C[i * 3 + 1] = y + (rand() - 0.5) * 0.06;
    } else if (u < 0.8) {
      C[i * 3] = -1.2 + Math.floor(rand() * 26) * 0.16;
      C[i * 3 + 1] = y + (rand() - 0.5) * 0.03;
    } else {
      C[i * 3] = 3.0 + rand() * 0.7;
      C[i * 3 + 1] = y + (rand() - 0.5) * 0.14;
    }
    C[i * 3 + 2] = (rand() - 0.5) * 0.15;

    // D: an annulus, 52% of it dense (the sugar), the rest a faint hairline
    const filled = rand() < 0.86;
    const start = -Math.PI / 2;
    const ang = filled ? start + rand() * Math.PI * 2 * 0.52 : start + Math.PI * 2 * (0.52 + rand() * 0.48);
    const rr = filled ? 1.45 + rand() * 0.55 : 1.7 + (rand() - 0.5) * 0.05;
    D[i * 3] = Math.cos(ang) * rr;
    D[i * 3 + 1] = Math.sin(ang) * rr;
    D[i * 3 + 2] = (rand() - 0.5) * (filled ? 0.35 : 0.05);
  }
  return { A, B, C, D, seeds };
}

const VERT = /* glsl */ `
  attribute vec3 aB; attribute vec3 aC; attribute vec3 aD; attribute float aSeed;
  uniform float uMorph; uniform float uTime; uniform vec3 uMouse; uniform float uStrength; uniform float uSize; uniform float uDpr;
  varying float vSeed; varying float vK;
  float ease(float t){ return t*t*(3.0-2.0*t); }
  void main(){
    float m = clamp(uMorph, 0.0, 3.0);
    vec3 p;
    if (m < 1.0) p = mix(position, aB, ease(m));
    else if (m < 2.0) p = mix(aB, aC, ease(m-1.0));
    else p = mix(aC, aD, ease(m-2.0));
    float t = fract(m); float k = m >= 3.0 ? 0.0 : 4.0*t*(1.0-t);
    // Disperse mid-morph, so the field breathes apart before it settles.
    p += vec3(sin(uTime*0.7+aSeed*40.0), cos(uTime*0.9+aSeed*23.0), sin(uTime*0.5+aSeed*11.0)) * k * 0.7;
    // Idle drift, damped on the barcode so its edges stay sharp.
    float still = 1.0 - smoothstep(0.7, 1.0, m) * (1.0 - smoothstep(1.0, 1.3, m));
    p += vec3(sin(uTime*0.4+aSeed*9.0), cos(uTime*0.3+aSeed*5.0), 0.0) * 0.025 * still;
    // Cursor pushes points aside. uMouse is always the cursor's exact current position —
    // uStrength (not distance to some "parked" position) is what fades the push in/out,
    // so there's nothing for the effect to visibly travel from when it fades in.
    vec2 d = p.xy - uMouse.xy; float l = length(d);
    p.xy += normalize(d + 0.0001) * smoothstep(1.1, 0.0, l) * 0.5 * uStrength;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uDpr * (0.6 + aSeed * 0.9) * (7.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vSeed = aSeed; vK = k;
  }`;

const FRAG = /* glsl */ `
  uniform vec3 uAccent; uniform vec3 uBase;
  varying float vSeed; varying float vK;
  void main(){
    float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d) * (0.18 + vSeed * 0.5);
    vec3 c = mix(uBase, uAccent, step(0.55, vSeed) + vK * 0.6);
    gl_FragColor = vec4(c, a);
  }`;

function Field({
  morph,
  accent,
  dark,
  eventSource,
}: {
  morph: MotionValue<number>;
  accent: string;
  dark: boolean;
  eventSource: React.RefObject<HTMLElement | null>;
}) {
  const points = useRef<THREE.Points>(null);
  const { camera, raycaster, size } = useThree();
  const ndc = usePointer(eventSource);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const data = useMemo(shapes, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.A, 3));
    g.setAttribute("aB", new THREE.BufferAttribute(data.B, 3));
    g.setAttribute("aC", new THREE.BufferAttribute(data.C, 3));
    g.setAttribute("aD", new THREE.BufferAttribute(data.D, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    return g;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMorph: { value: 0 },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector3() },
          uStrength: { value: 0 },
          uSize: { value: 4 },
          uDpr: { value: 1 },
          uAccent: { value: new THREE.Color(accent) },
          uBase: { value: new THREE.Color(dark ? "#8a8a86" : "#5a5750") },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      }),
    // Colours are updated in the effect below; only construct once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    material.uniforms.uAccent!.value.set(accent);
    material.uniforms.uBase!.value.set(dark ? "#8a8a86" : "#5a5750");
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  }, [accent, dark, material]);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  // A static stand-in for the camera, used only to turn the cursor into a world point.
  // The real `camera` drifts for the parallax effect below; raycasting through that
  // moving camera would make the hit-test chase wherever the camera last settled
  // instead of the cursor. This one never moves, so NDC -> world stays exact and instant.
  const hitCam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    c.position.set(0, 0, 7);
    c.lookAt(0, 0, 0);
    c.updateMatrixWorld();
    return c;
  }, []);

  useFrame(({ clock, viewport }, dt) => {
    const k = 1 - Math.exp(-dt * 6);
    const u = material.uniforms;
    u.uTime!.value = clock.elapsedTime;
    u.uMorph!.value += (morph.get() - u.uMorph!.value) * k;
    u.uDpr!.value = viewport.dpr;
    u.uSize!.value = size.width < 768 ? 3 : 4;
    pointer.set(ndc.current.x, ndc.current.y);

    hitCam.aspect = size.width / size.height;
    hitCam.updateProjectionMatrix();
    raycaster.setFromCamera(pointer, hitCam);
    // Snap straight to the cursor's world position — no lag, so there's nothing to sweep
    // in from. uStrength (below) is what fades the effect in/out, not this position.
    if (ndc.current.inside && raycaster.ray.intersectPlane(plane, hit)) u.uMouse!.value.copy(hit);
    u.uStrength!.value += ((ndc.current.inside ? 1 : 0) - u.uStrength!.value) * k;

    // Gentle camera parallax against the cursor — purely decorative, doesn't feed back
    // into the hit-test above.
    target.set(pointer.x * 0.35, pointer.y * 0.25, size.width < 768 ? 9.5 : 7);
    camera.position.lerp(target, k * 0.5);
    camera.lookAt(0, 0, 0);
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

export default function ParticlesScene({
  morph,
  accent,
  dark,
  active,
  eventSource,
}: {
  morph: MotionValue<number>;
  accent: string;
  dark: boolean;
  active: boolean;
  eventSource: React.RefObject<HTMLElement | null>;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7], fov: 40, near: 0.1, far: 40 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Resume active={active} />
      <Field morph={morph} accent={accent} dark={dark} eventSource={eventSource} />
    </Canvas>
  );
}
