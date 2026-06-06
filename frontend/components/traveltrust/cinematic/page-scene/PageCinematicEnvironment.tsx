"use client";

import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { TT_CINEMATIC_3D_BG, type TravelTrustCinematic3dConfig } from "../traveltrustCinematic3dConfig";
import { DepthDust } from "../TravelTrustCinematicScene3DContent";
import {
  resolveNonGlobeEnvironmentOpacity,
  resolveNonGlobeEnvironmentVisible,
  resolveNonGlobeHorizonFogOpacity,
  resolveNonGlobeStarsSpeed,
  TT_PAGE_HORIZON_FOG_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { TRAVELTRUST_CINEMATIC_L5_SPRINT_ID } from "@/lib/traveltrustCinematicPageL5";
import { TRAVELTRUST_HERO_GLOBE_SHADOW_FILL } from "@/lib/traveltrustHeroGlobeBrighten";
import { smoothstep } from "../traveltrustCinematicEasing3d";
import { useTravelTrustHeroScrollProgress } from "../TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "../TravelTrustPageScrollContext";

/** Hero 首屏：暖墨空穹（压住 FillLight 冷天光 `#dce8f0` 在空域的发青 · 非地球 mesh） */
export function PageCinematicWarmSkyShell() {
  return (
    <mesh
      renderOrder={-30}
      frustumCulled={false}
      userData={{ ttSceneDebugLayer: "warmSkyShell", ttSceneDebugName: "PageCinematicWarmSkyShell" }}
    >
      <sphereGeometry args={[42, 40, 40]} />
      <meshBasicMaterial color={TT_CINEMATIC_3D_BG} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Hero 首屏：补偿冻结球光里的冷色 hemisphere（`TravelTrustTourismGlobeFillLight` · 不可改冻结文件） */
export function PageCinematicHeroWarmFill() {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    const heroT = heroScroll?.get() ?? 0;
    const k = Math.max(0, 1 - smoothstep(0.1, 0.52, heroT));
    const fill = TRAVELTRUST_HERO_GLOBE_SHADOW_FILL;
    if (hemiRef.current) hemiRef.current.intensity = k * fill.hemiIntensity;
    if (ambRef.current) ambRef.current.intensity = k * fill.ambIntensity;
  });
  const fill = TRAVELTRUST_HERO_GLOBE_SHADOW_FILL;
  return (
    <>
      <hemisphereLight ref={hemiRef} args={[fill.hemiSky, fill.hemiGround, 0]} />
      <ambientLight ref={ambRef} color={fill.ambColor} intensity={0} />
    </>
  );
}

/** 地平线暖雾（滚入剧场时替代星空感 · L5 P0-3） */
function PageCinematicHorizonFog({ opacity }: { opacity: number }) {
  if (opacity < 0.02) return null;
  return (
    <mesh
      position={[0, -2.35, -3.8]}
      rotation={[-Math.PI / 2.15, 0, 0]}
      userData={{
        ttSceneDebugLayer: "atmosphere",
        ttSceneDebugName: "PageCinematicHorizonFog",
        ttTraveltrustPageHorizonFogL5: TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
      }}
    >
      <planeGeometry args={[22, 10]} />
      <meshBasicMaterial
        color={TT_PAGE_HORIZON_FOG_L5.color}
        transparent
        opacity={opacity * TT_PAGE_HORIZON_FOG_L5.opacityPeakMul}
        toneMapped={false}
      />
    </mesh>
  );
}

/** 星空/尘粒 — 滚离 Hero 后降噪/隐藏（L5 · TT-CINEMATIC-L5-2026-05） */
export function PageCinematicEnvironment({ config }: { config: TravelTrustCinematic3dConfig }) {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const group = useRef<Group>(null);
  const baseOpacity = useRef<Map<THREE.Material, number>>(new Map());
  const [horizonOpacity, setHorizonOpacity] = useState(0);
  const [starSpeed, setStarSpeed] = useState(0.32);

  useFrame(() => {
    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    const mul = resolveNonGlobeEnvironmentOpacity(heroT, pageT);
    const nextSpeed = resolveNonGlobeStarsSpeed(mul);
    if (Math.abs(nextSpeed - starSpeed) > 0.02) setStarSpeed(nextSpeed);
    const visible = resolveNonGlobeEnvironmentVisible(heroT, pageT);
    const horizon = resolveNonGlobeHorizonFogOpacity(heroT, pageT);
    if (Math.abs(horizon - horizonOpacity) > 0.02) setHorizonOpacity(horizon);

    if (!group.current) return;
    group.current.visible = visible;
    if (!visible) return;
    group.current.traverse((obj) => {
      const points = obj as THREE.Points;
      const mat = points.material;
      if (!mat || Array.isArray(mat)) return;
      if (!baseOpacity.current.has(mat)) baseOpacity.current.set(mat, mat.opacity);
      const base = baseOpacity.current.get(mat) ?? mat.opacity;
      mat.opacity = base * mul;
      mat.transparent = true;
    });
  });

  return (
    <group userData={{ ttSceneDebugLayer: "atmosphere", ttSceneDebugName: "PageCinematicEnvironment" }}>
      <group
        ref={group}
        userData={{
          ttTraveltrustCinematicL5: TRAVELTRUST_CINEMATIC_L5_SPRINT_ID,
          ttTraveltrustCinematicNonGlobeL5: TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
        }}
      >
        <Stars radius={80} depth={40} count={config.starCount} factor={3} saturation={0} fade speed={starSpeed} />
        <DepthDust count={config.dustCount} />
      </group>
      <PageCinematicHorizonFog opacity={horizonOpacity} />
    </group>
  );
}
