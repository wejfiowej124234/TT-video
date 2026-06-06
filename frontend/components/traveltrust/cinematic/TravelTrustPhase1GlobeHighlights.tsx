"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { hubPinFacesCamera, resolveHeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";
import { setTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { listTraveltrustRoutesForRegion } from "@/lib/traveltrustGlobeRegionRoutes";
import {
  getHeroGlobeP1FocusedRegion,
  setHeroGlobeP1FocusedRegion,
  navigateToStartWithRegion,
} from "@/lib/traveltrustHeroGlobeP1Link";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { TT_GLOBE_EARTH_SURFACE_RADIUS_MUL } from "@/lib/traveltrustGlobeEarthAsset";
import {
  PHASE1_TIER_GLOW,
  TRAVELTRUST_PHASE1_GLOBE_REGIONS,
  latLonToUnitVector,
} from "@/lib/traveltrustPhase1GlobeRegions";
import { TRAVELTRUST_HERO_GLOBE_MARKER_PULSE_ENABLED } from "@/lib/traveltrustGlobeHeroTuning";
import { useTravelTrustGlobeInteraction } from "./TravelTrustGlobeInteractionContext";

function regionLocaleKey(id: string): string {
  return `traveltrust_phase1_region_${id}`;
}

function DestinationPin({
  regionId,
  nameZh,
  color,
  scale,
  radius,
  pos,
  index,
  tier,
  qualityMul = 1,
}: {
  regionId: string;
  nameZh: string;
  color: string;
  scale: number;
  radius: number;
  pos: [number, number, number];
  index: number;
  tier: "S" | "A" | "B";
  qualityMul?: number;
}) {
  const { t } = useTranslation();
  const { hoveredRegionId, setHoveredRegionId, interactive } = useTravelTrustGlobeInteraction();
  const root = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const hit = useRef<Mesh>(null);
  const [localHover, setLocalHover] = useState(false);
  const base = 0.046 * scale;
  const surfaceR = radius * TT_GLOBE_EARTH_SURFACE_RADIUS_MUL;
  const isS = tier === "S";
  const isEuCluster = regionId === "fr" || regionId === "es";
  const p1Focused = getHeroGlobeP1FocusedRegion();
  const isHovered =
    interactive && (hoveredRegionId === regionId || localHover || p1Focused === regionId);
  const haloBase =
    (isHovered ? TT_CINEMATIC_GLOBE_VISUAL.phase1HaloHoverOpacity : TT_CINEMATIC_GLOBE_VISUAL.phase1HaloOpacity) *
    (isEuCluster ? TT_CINEMATIC_GLOBE_VISUAL.phase1EuClusterHaloMul : 1);
  const routes = useMemo(() => listTraveltrustRoutesForRegion(regionId), [regionId]);

  useLayoutEffect(() => {
    const g = root.current;
    if (!g) return;
    _surface.set(pos[0], pos[1], pos[2]).multiplyScalar(surfaceR);
    _lookTarget.copy(_surface).multiplyScalar(1.1);
    g.position.copy(_surface);
    g.lookAt(_lookTarget);
  }, [pos, surfaceR]);

  useFrame((state) => {
    if (!TRAVELTRUST_HERO_GLOBE_MARKER_PULSE_ENABLED) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2 + index) * (isHovered ? 0.06 : 0.1);
    if (core.current) core.current.scale.setScalar(pulse);
    if (halo.current) halo.current.scale.setScalar(pulse * (isHovered ? 1.12 : 1.05));
  });

  const onEnter = () => {
    if (!interactive) return;
    setLocalHover(true);
    setHoveredRegionId(regionId);
    setHeroGlobeP1FocusedRegion(regionId);
    document.body.style.cursor = "pointer";
  };

  const onLeave = () => {
    if (!interactive) return;
    setLocalHover(false);
    setHoveredRegionId(null);
    if (getHeroGlobeP1FocusedRegion() === regionId) setHeroGlobeP1FocusedRegion(null);
    document.body.style.cursor = "";
  };

  const onPinClick = () => {
    if (!interactive) return;
    trackTravelTrustEvent("traveltrust_globe_pin_click", { region_id: regionId, tier });
    navigateToStartWithRegion(regionId);
  };

  const displayName = t(regionLocaleKey(regionId) as "traveltrust_phase1_region_cn") || nameZh;

  return (
    <group ref={root}>
      <mesh
        ref={hit}
        position={[0, base * 0.5, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onEnter();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPinClick();
        }}
      >
        <sphereGeometry args={[base * (isS ? 2.6 : 2.2), 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={halo} position={[0, base * 0.5, 0]}>
        <sphereGeometry args={[base * (isS ? 1.85 : 1.45), 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={haloBase * qualityMul}
          depthWrite={false}
          blending={THREE.NormalBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, base * (isS ? 0.32 : 0.22), 0]}>
        <cylinderGeometry args={[base * (isS ? 0.1 : 0.07), base * (isS ? 0.14 : 0.1), base * (isS ? 0.92 : 0.55), 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={TT_CINEMATIC_GLOBE_VISUAL.phase1StemOpacity * qualityMul}
          toneMapped={false}
        />
      </mesh>
      {isS && TRAVELTRUST_HERO_GLOBE_MARKER_PULSE_ENABLED ? (
        <mesh position={[0, base * 1.05, 0]}>
          <sphereGeometry args={[base * 0.14, 10, 10]} />
          <meshBasicMaterial
            color={isHovered ? "#fff8f0" : color}
            transparent
            opacity={0.82 * qualityMul}
            toneMapped={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ) : null}
      <mesh ref={core} position={[0, base * (isS ? 0.88 : 0.52), 0]}>
        <sphereGeometry args={[base * (isS ? 0.42 : 0.36), 12, 12]} />
        <meshBasicMaterial
          color={isHovered ? "#fff8f0" : color}
          transparent
          opacity={TT_CINEMATIC_GLOBE_VISUAL.phase1MarkerOpacity * qualityMul}
          toneMapped={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
      {isHovered ? (
        <Html
          position={[0, base * (isS ? 1.65 : 1.2), 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            className="min-w-[9rem] max-w-[12rem] rounded-lg border border-ref-sun/28 bg-ink-950/88 px-2.5 py-2 shadow-[0_8px_28px_rgba(252,164,124,0.14)] backdrop-blur-md"
            data-tt-traveltrust-globe-pin-tooltip-l5="1"
            data-tt-traveltrust-globe-pin-tooltip={regionId}
          >
            <p className="text-meta font-semibold text-white">{displayName}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-300/90">
              {t("traveltrust_globe_pin_tooltip_hub")}
            </p>
            {routes.length > 0 ? (
              <ul className="mt-1.5 space-y-0.5 border-t border-white/10 pt-1.5 text-[10px] text-ref-sun/88">
                {routes.slice(0, 3).map((route) => (
                  <li key={route.id}>{route.label}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-1.5 text-[10px] font-medium text-amber-100/90">
              {t("traveltrust_globe_pin_cta")} →
            </p>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

const _lookTarget = new THREE.Vector3();
const _surface = new THREE.Vector3();

function pinIdsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function TravelTrustPhase1GlobeHighlights({
  radius,
  qualityMul = 1,
}: {
  radius: number;
  qualityMul?: number;
}) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const markers = useMemo(
    () =>
      TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((r) => {
        const pin = resolveTraveltrustHubLatLon(r);
        return {
          ...r,
          pos: latLonToUnitVector(pin.lat, pin.lon) as [number, number, number],
          color: PHASE1_TIER_GLOW[r.tier],
          scale: TT_CINEMATIC_GLOBE_VISUAL.phase1TierScale[r.tier],
        };
      }),
    [],
  );
  const [visibleIds, setVisibleIds] = useState<string[]>(() =>
    TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((r) => r.id),
  );

  useFrame(() => {
    const mw = groupRef.current?.matrixWorld;
    if (!mw) return;
    const ids = markers
      .filter((m) => hubPinFacesCamera(m.id, camera, mw, m.tier))
      .map((m) => m.id);
    setVisibleIds((prev) => (pinIdsEqual(prev, ids) ? prev : ids));
    setTraveltrustGlobeHeroHud({
      visibleHubIds: ids,
      routeBias: resolveHeroGlobeRouteBias(camera, mw),
    });
  });

  return (
    <group ref={groupRef} renderOrder={3}>
      {markers
        .filter((m) => visibleIds.includes(m.id))
        .map((m, i) => (
          <DestinationPin
            key={m.id}
            regionId={m.id}
            nameZh={m.nameZh}
            color={m.color}
            scale={m.scale}
            radius={radius}
            pos={m.pos}
            index={i}
            tier={m.tier}
            qualityMul={qualityMul}
          />
        ))}
    </group>
  );
}
