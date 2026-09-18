"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// A field of bars on a grid, lit from one side, rippling. It reads as intake
// volume without pretending to be a chart of anything real.
//
// Monochrome on purpose. The console's rule is that hue always means a verdict
// (a grade, a status, a severity) and never decorates, so the only colours here
// are the two ends of the neutral ramp.
const GRID = 26;
const COUNT = GRID * GRID;
const SPACING = 0.42;
const HALF = ((GRID - 1) / 2) * SPACING;

// Ends of the ramp, and the page colour the far edge dissolves into. All four
// match globals.css.
const THEME = {
  dark: { low: "#2b2722", high: "#efe6d4", bg: "#0c0b0a" },
  light: { low: "#cdc5b3", high: "#2a2620", bg: "#f4efe2" },
};

type Align = "center" | "bleed";

function Bars({ dark, still }: { dark: boolean; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  const ramp = useMemo(() => {
    const t = dark ? THEME.dark : THEME.light;
    return { low: new THREE.Color(t.low), high: new THREE.Color(t.high) };
  }, [dark]);

  // Grid positions never change, so they are computed once. `fade` flattens the
  // field towards its edge, so it reads as a mound sitting in space rather than
  // as a slab cropped by the canvas.
  const cells = useMemo(() => {
    const out: { x: number; z: number; d: number; fade: number }[] = [];
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = i * SPACING - HALF;
        const z = j * SPACING - HALF;
        const d = Math.hypot(x, z);
        out.push({ x, z, d, fade: 1 - THREE.MathUtils.smoothstep(d, HALF * 0.45, HALF * 1.05) });
      }
    }
    return out;
  }, []);

  // Smoothed pointer, so the swell under the cursor has weight instead of
  // snapping. Kept in a ref: a motion value per frame would re-render React.
  const cursor = useRef({ x: 0, z: 0 });

  useFrame(({ clock, pointer }, dt) => {
    const m = mesh.current;
    if (!m) return;

    const t = still ? 0 : clock.elapsedTime;
    const k = Math.min(1, dt * 3.5);
    cursor.current.x += (pointer.x * 4 - cursor.current.x) * k;
    cursor.current.z += (-pointer.y * 2.6 - cursor.current.z) * k;

    for (let i = 0; i < COUNT; i++) {
      const c = cells[i]!;
      if (c.fade <= 0.001) {
        // Off the edge of the mound: park it flat rather than drawing a stub.
        dummy.position.set(c.x, -2, c.z);
        dummy.scale.set(0.0001, 0.0001, 0.0001);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // A ring travelling out from the middle, crossed by a slower swell, so
      // the field never repeats on a short loop.
      const wave = Math.sin(c.d * 1.1 - t * 1.3) * 0.5 + Math.sin(c.x * 0.5 + t * 0.6) * 0.28;
      const near = Math.max(0, 1 - Math.hypot(c.x - cursor.current.x, c.z - cursor.current.z) / 2.2);
      const h = (0.12 + Math.max(0.05, wave + 0.55) * 0.78 + near * near * 1.15) * c.fade;

      dummy.position.set(c.x, h / 2, c.z);
      dummy.scale.set(0.155, Math.max(h, 0.02), 0.155);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);

      tint.copy(ramp.low).lerp(ramp.high, THREE.MathUtils.clamp((h - 0.2) / 1.15, 0, 1));
      m.setColorAt(i, tint);
    }

    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // A slow quarter-turn drift, so the field is never twice in the same pose.
    if (group.current && !still) group.current.rotation.y = 0.5 + Math.sin(t * 0.08) * 0.22;
  });

  return (
    <group ref={group} rotation={[0, 0.5, 0]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} metalness={0.04} />
      </instancedMesh>
    </group>
  );
}

// The same scene is used in a wide hero and in a tall, narrow auth panel. A
// fixed camera frames the first and crops deep into the second, so the distance
// is solved from the viewport's aspect every time it changes.
function FitCamera({ bg, align }: { bg: string; align: Align }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);

  useEffect(() => {
    // The mound's *visible* radius, which is well inside the grid's full
    // extent because `fade` flattens everything past the midpoint.
    const R = 3.3;
    const vFov = (camera.fov * Math.PI) / 180;
    const aspect = size.width / size.height;
    const fitV = R / Math.tan(vFov / 2);
    const fitH = R / (Math.tan(vFov / 2) * aspect);
    const wide = aspect > 1.15;

    // Full-bleed behind copy: the field has to clear the text, so it is framed
    // looser and pushed off-centre rather than sitting dead middle.
    // A boxed panel wants it centred and tight.
    const margin = align === "bleed" ? (wide ? 1.55 : 1.35) : 1.08;
    const dist = Math.max(fitV, fitH) * margin;

    const dir = new THREE.Vector3(0, 0.565, 0.825).normalize();
    camera.position.copy(dir.multiplyScalar(dist));

    // Panning the camera and its target together shifts the field within the
    // frame without rotating the view. The camera sits on the world YZ plane
    // looking at the origin, so its right vector is world +X: panning -X moves
    // the field to the right of frame, which is where the copy is not.
    let panX = 0;
    let panY = 0;
    if (align === "bleed") {
      if (wide) panX = -R * 0.62;
      // On a narrow screen the copy stacks on top, so the field drops instead.
      // How far depends on how tall the viewport is: a phone needs the full
      // push to clear the copy, a portrait tablet leaves a dead band if it
      // gets the same treatment.
      else panY = R * THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(aspect, 0.45, 0.8, 1.2, 0.7), 0.7, 1.2);
    }
    camera.position.x += panX;
    camera.position.y += panY;
    camera.lookAt(panX, 0.1 + panY, 0);
    camera.updateProjectionMatrix();

    // Fog has to follow the camera out, or a panel that pushes the camera
    // back drops the whole field past the far plane and it vanishes.
    scene.fog = new THREE.Fog(bg, dist - R * 1.5, dist + R * 4.2);
  }, [camera, scene, size.width, size.height, bg, align]);

  return null;
}

export default function TerrainScene({
  dark,
  still = false,
  align = "center",
}: {
  dark: boolean;
  still?: boolean;
  align?: Align;
}) {
  const bg = dark ? THEME.dark.bg : THEME.light.bg;

  return (
    <Canvas
      dpr={[1, 1.6]}
      // A still field still needs one frame drawn; "demand" renders on change
      // and after mount, which is exactly the reduced-motion behaviour.
      frameloop={still ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 7.2, 10.5], fov: 30, near: 0.1, far: 60 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      {/* Fog is set in FitCamera, which is where the camera distance it has
          to track is solved. */}
      <ambientLight intensity={dark ? 1.0 : 1.9} />
      <directionalLight position={[5, 9, 4]} intensity={dark ? 2.4 : 2.2} />
      <directionalLight position={[-6, 4, -3]} intensity={dark ? 0.6 : 0.4} />
      <FitCamera bg={bg} align={align} />
      <Bars dark={dark} still={still} />
    </Canvas>
  );
}
