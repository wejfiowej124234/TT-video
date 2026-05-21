"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — Hero tourism globe; see `traveltrustHeroGlobeFrozenManifest.ts` */

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { TRAVELTRUST_HERO_GLOBE_FROZEN_ID } from "@/lib/traveltrustHeroGlobeFrozenManifest";
import {
  TRAVELTRUST_GLOBE_A_CLOSURE_ID,
  TRAVELTRUST_GLOBE_L5_SPRINT_ID,
  TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH,
  TT_CINEMATIC_GLOBE_RENDER_TIER_DEFAULT,
  resolveHeroWarmInkGlobeTier,
  resolveTraveltrustGlobeRenderTier,
  type GlobeRenderTierConfig,
} from "@/lib/traveltrustGlobeEarthAsset";
import {
  createTraveltrustGlobeEarthTextureProcedural,
  enhanceTraveltrustGlobeEarthMap,
} from "@/lib/traveltrustGlobeEarthTexture";
import { traveltrustGlobeSunLightPosition } from "@/lib/traveltrustGlobeSun";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { TT_BRAND_3D, type TravelTrustCinematic3dConfig } from "./traveltrustCinematic3dConfig";
import {
  TourismGlobeAmbientParticles,
  TourismGlobeAtmosphereHaze,
  TourismGlobeDaylightAtmosphereRim,
  TourismGlobeCloudLayer,
  TourismGlobeFresnelRim,
  TourismGlobeGlassShell,
  TourismGlobeHoloGrid,
  TourismGlobeNightLights,
} from "./TravelTrustTourismGlobeLayers";

/** Shared Y spin for earth, Phase1 markers, and travel arcs. */
export function TravelTrustTourismGlobeSpin({
  config,
  children,
}: {
  config: TravelTrustCinematic3dConfig;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * config.autoRotateSpeed;
    }
  });
  return (
    <group ref={group} rotation={[0, TT_CINEMATIC_GLOBE_VISUAL.heroYawOffset, 0]}>
      {children}
    </group>
  );
}

function TourismGlobeProceduralMesh({
  radius,
  segments,
  lit,
}: {
  radius: number;
  segments: number;
  lit: boolean;
}) {
  const earthMap = useMemo(() => createTraveltrustGlobeEarthTextureProcedural(), []);
  useEffect(() => () => earthMap.dispose(), [earthMap]);
  const v = TT_CINEMATIC_GLOBE_VISUAL;
  const bright = v.earthDisplayBrightness;

  if (lit) {
    return (
      <mesh>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={earthMap}
          color={new THREE.Color(bright * 1.12, bright * 1.06, bright * 0.94)}
          roughness={v.earthRoughness}
          metalness={v.earthMetalness}
        />
      </mesh>
    );
  }

  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshBasicMaterial
        map={earthMap}
        color={new THREE.Color(bright * 1.12, bright * 1.06, bright * 0.94)}
        toneMapped={false}
      />
    </mesh>
  );
}

function TourismGlobeTexturedMesh({
  radius,
  segments,
  lit,
}: {
  radius: number;
  segments: number;
  lit: boolean;
}) {
  const sourceMap = useTexture(TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH, undefined, undefined, "anonymous");
  const displayMap = useMemo(() => enhanceTraveltrustGlobeEarthMap(sourceMap), [sourceMap]);

  useEffect(() => {
    sourceMap.colorSpace = THREE.SRGBColorSpace;
    sourceMap.anisotropy = 8;
    sourceMap.needsUpdate = true;
  }, [sourceMap]);

  useEffect(() => () => displayMap.dispose(), [displayMap]);

  const v = TT_CINEMATIC_GLOBE_VISUAL;
  const bright = v.earthDisplayBrightness;

  if (lit) {
    return (
      <mesh>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={displayMap}
          color={new THREE.Color(bright * 1.12, bright * 1.06, bright * 0.94)}
          roughness={v.earthRoughness}
          metalness={v.earthMetalness}
        />
      </mesh>
    );
  }

  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshBasicMaterial
        map={displayMap}
        color={new THREE.Color(bright * 1.12, bright * 1.06, bright * 0.94)}
        toneMapped={false}
      />
    </mesh>
  );
}

function TourismGlobeBody({
  config,
  tier,
  heroWarmInkSky = false,
}: {
  config: TravelTrustCinematic3dConfig;
  tier: GlobeRenderTierConfig;
  heroWarmInkSky?: boolean;
}) {
  const r = config.globeRadius;
  const segments = tier.earthSegments;
  const earthR = r * 0.998;
  const cloudSeg = Math.min(segments, 64);

  const earthMesh = tier.texturedEarth ? (
    <Suspense fallback={<TourismGlobeProceduralMesh radius={earthR} segments={segments} lit={tier.litEarth} />}>
      <TourismGlobeTexturedMesh radius={earthR} segments={segments} lit={tier.litEarth} />
    </Suspense>
  ) : (
    <TourismGlobeProceduralMesh radius={earthR} segments={segments} lit={tier.litEarth} />
  );

  return (
    <>
      {earthMesh}
      {tier.nightLights ? (
        <Suspense fallback={null}>
          <TourismGlobeNightLights radius={earthR} segments={segments} />
        </Suspense>
      ) : null}
      {tier.cloudLayer ? (
        <Suspense fallback={null}>
          <TourismGlobeCloudLayer
            radius={r}
            segments={cloudSeg}
            opacityScale={heroWarmInkSky ? 0.18 : tier.texturedEarth ? 1 : 0.45}
          />
        </Suspense>
      ) : null}
      <TourismGlobeAtmosphereHaze radius={r} />
      <TourismGlobeDaylightAtmosphereRim radius={r} />
      {tier.fresnelRim ? <TourismGlobeFresnelRim radius={r} /> : null}
      {tier.glassShell ? <TourismGlobeGlassShell radius={r} /> : null}
      {tier.holoGrid ? <TourismGlobeHoloGrid radius={r} /> : null}
    </>
  );
}

/** L4+ tourism globe — A closure (`TT-GLOBE-A-2026-05` · ① decorative). */
export function TravelTrustTourismGlobe({
  config,
  tier: tierProp,
  isMobile = false,
  lowQuality = false,
  /** Hero 首屏：Basic 材质展示暖化贴图，避免 Standard + 蓝海反光像「蓝色背景」 */
  heroWarmInkSky = false,
}: {
  config: TravelTrustCinematic3dConfig;
  tier?: GlobeRenderTierConfig;
  isMobile?: boolean;
  lowQuality?: boolean;
  heroWarmInkSky?: boolean;
}) {
  const baseTier =
    tierProp ??
    resolveTraveltrustGlobeRenderTier({ isMobile, lowQuality }) ??
    TT_CINEMATIC_GLOBE_RENDER_TIER_DEFAULT;
  const tier = heroWarmInkSky ? resolveHeroWarmInkGlobeTier(baseTier) : baseTier;

  const groupRef = useRef<Group>(null);
  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.userData.ttTraveltrustTourismGlobe = "1";
    g.userData.ttTraveltrustHeroWarmInkSky = heroWarmInkSky ? "1" : "0";
    g.userData.ttTraveltrustGlobeEarthSource = tier.texturedEarth ? "jpeg" : "procedural";
    g.userData.ttTraveltrustGlobeAClosure = TRAVELTRUST_GLOBE_A_CLOSURE_ID;
    g.userData.ttTraveltrustGlobeL4Plus = "1";
    g.userData.ttTraveltrustGlobeL5Sprint = TRAVELTRUST_GLOBE_L5_SPRINT_ID;
    g.userData.ttTraveltrustGlobeFrozen = TRAVELTRUST_HERO_GLOBE_FROZEN_ID;
  }, [heroWarmInkSky, tier.texturedEarth, tier.litEarth]);

  return (
    <group ref={groupRef}>
      <TourismGlobeBody config={config} tier={tier} heroWarmInkSky={heroWarmInkSky} />
    </group>
  );
}

/** Ambient motes live outside spin group in scene rig. */
export { TourismGlobeAmbientParticles };

/** Hero 球区光照 — 主光从镜头侧打来，首屏昼侧可读 */
export function TravelTrustTourismGlobeFillLight({ radius }: { radius: number }) {
  const sunPos = traveltrustGlobeSunLightPosition(radius);
  const fillPos = sunPos.clone().multiplyScalar(-0.55);
  fillPos.y += radius * 0.35;
  return (
    <>
      <ambientLight intensity={0.1} color="#14100e" />
      <directionalLight position={sunPos.toArray()} intensity={2.12} color="#fff2e4" />
      <directionalLight position={fillPos.toArray()} intensity={0.12} color="#d4a878" />
      <hemisphereLight
        color="#1c1612"
        groundColor="#0c0a09"
        intensity={0.055}
        position={[0, radius * 2, 0]}
      />
    </>
  );
}
