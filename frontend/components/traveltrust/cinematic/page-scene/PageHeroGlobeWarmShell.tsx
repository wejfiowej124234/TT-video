"use client";

import * as THREE from "three";
import {
  TT_HERO_GLOBE_WARM_FRONT_VEIL_L5,
  TT_HERO_GLOBE_WARM_LIMB_SHELL_L5,
} from "@/lib/traveltrust/l5";
import { smoothstep } from "../traveltrustCinematicEasing3d";

/** Hero 首屏：暖墨缘壳 + 贴球薄雾（压赤道青蓝光晕 · 非地球贴图 mesh） */
export function PageHeroGlobeWarmShell({ radius, heroT }: { radius: number; heroT: number }) {
  const limb = TT_HERO_GLOBE_WARM_LIMB_SHELL_L5;
  const veil = TT_HERO_GLOBE_WARM_FRONT_VEIL_L5;
  const k = Math.max(0, 1 - smoothstep(0.06, limb.heroFadeEnd, heroT));
  if (k < 0.02) return null;
  return (
    <group renderOrder={4}>
      <mesh scale={radius * limb.scaleMul} frustumCulled={false}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshBasicMaterial
          color={limb.color}
          transparent
          opacity={limb.opacity * k}
          depthWrite={false}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      {veil.opacity > 0.001 ? (
        <mesh scale={radius * veil.scaleMul} frustumCulled={false}>
          <sphereGeometry args={[1, 40, 40]} />
          <meshBasicMaterial
            color={veil.color}
            transparent
            opacity={veil.opacity * k}
            depthWrite={false}
            side={THREE.FrontSide}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
