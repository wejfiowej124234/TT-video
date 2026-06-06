"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import {
  TRAVELTRUST_CINEMATIC_CANVAS_STYLE,
  applyTravelTrustPassiveCanvasGl,
} from "./traveltrustCinematicCanvasPassive";

function TheaterPulse({ curve, offset }: { curve: THREE.Curve<THREE.Vector3>; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const u = (state.clock.elapsedTime * 0.14 + offset) % 1;
    ref.current.position.copy(curve.getPointAt(u));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#23ced9" toneMapped={false} />
    </mesh>
  );
}

function TheaterRing({ active }: { active: number }) {
  const group = useRef<Group>(null);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const r = 2.4;
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2) * 0.15, Math.sin(a) * r * 0.55));
    }
    return pts;
  }, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * (0.1 + active * 0.04);
  });

  const lineOpacity = 0.22 + active * 0.22;

  return (
    <group ref={group} rotation={[0.55, 0.3, 0]}>
      <Line points={points} color="#23ced9" transparent opacity={lineOpacity} lineWidth={1} />
      <Line
        points={points.map((p) => p.clone().multiplyScalar(0.86))}
        color="#fca47c"
        transparent
        opacity={lineOpacity * 0.65}
        lineWidth={1}
      />
      <Line
        points={points.map((p) => p.clone().multiplyScalar(1.12))}
        color="#6ee7b7"
        transparent
        opacity={lineOpacity * 0.35}
        lineWidth={1}
      />
      <TheaterPulse curve={curve} offset={0} />
      <TheaterPulse curve={curve} offset={0.45} />
    </group>
  );
}

function TheaterSceneContent({ active }: { active: number }) {
  return (
    <>
      <ambientLight intensity={0.35 + active * 0.15} />
      <pointLight position={[2, 2, 4]} intensity={0.55 + active * 0.35} color="#23ced9" />
      <pointLight position={[-2, -1, 3]} intensity={0.25 + active * 0.2} color="#fca47c" />
      <Float speed={0.85 + active * 0.2} rotationIntensity={0.1} floatIntensity={0.14 + active * 0.06}>
        <TheaterRing active={active} />
      </Float>
    </>
  );
}

/** 身份剧场背景轻量 3D 轨道环（进入视口时增亮） */
export function TravelTrustTheaterScene3D() {
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: false, margin: "-15% 0px" });
  const [webglOk, setWebglOk] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") ?? c.getContext("webgl"))) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    if (!inView) {
      setActive(0);
      return;
    }
    const id = window.setInterval(() => {
      setActive((a) => Math.min(1, a + 0.08));
    }, 80);
    return () => window.clearInterval(id);
  }, [inView]);

  if (UNIFIED_PAGE_3D || reduceMotion || !webglOk) return null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute -inset-x-4 top-0 z-0 h-[min(62vh,520px)] motion-reduce:hidden sm:-inset-x-8"
      aria-hidden
      data-tt-traveltrust-theater-3d="1"
      style={{ opacity: 0.35 + active * 0.35 }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        frameloop="always"
        onCreated={({ gl }) => applyTravelTrustPassiveCanvasGl(gl)}
        style={TRAVELTRUST_CINEMATIC_CANVAS_STYLE}
      >
        <TheaterSceneContent active={active} />
      </Canvas>
    </div>
  );
}
