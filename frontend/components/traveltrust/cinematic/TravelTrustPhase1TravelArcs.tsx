"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — Hero travel arcs; see `traveltrustHeroGlobeFrozenManifest.ts` */
/** Arcs: TubeGeometry + world-space camera cull (TT-GLOBE-L5-2026-05 · ①). */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import {
  arcFlowPulseNearLandHub,
  filterHeroTravelRoutes,
  globeVectorToLatLon,
  resolveHeroGlobeRouteBias,
  selectFacingArcsWorld,
  type GlobeArcPick,
} from "@/lib/traveltrustGlobeArcCull";
import { setTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { greatCircleArcPoints } from "@/lib/traveltrustGlobeGeodesy";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { traveltrustRouteTouchesRegion } from "@/lib/traveltrustGlobeRegionRoutes";
import { resolveHeroGlobeActiveRegionId } from "@/lib/traveltrustHeroGlobeP1Link";
import {
  TRAVELTRUST_PHASE1_GLOBE_REGIONS,
  PHASE1_TIER_GLOW,
} from "@/lib/traveltrustPhase1GlobeRegions";
import {
  TRAVELTRUST_PHASE1_TRAVEL_ROUTES,
  TRAVELTRUST_PHASE1_TRAVEL_ROUTES_LITE,
  type TravelTrustPhase1TravelRoute,
} from "@/lib/traveltrustPhase1TravelRoutes";
import { TT_HERO_GLOBE_L5_PALETTE } from "@/lib/traveltrustCinematicPageL5";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { useTravelTrustGlobeInteraction } from "./TravelTrustGlobeInteractionContext";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";

const REGION_BY_ID = Object.fromEntries(
  TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((r) => [r.id, r]),
) as Record<string, (typeof TRAVELTRUST_PHASE1_GLOBE_REGIONS)[number]>;

type BuiltArc = {
  id: string;
  points: THREE.Vector3[];
  color: string;
  pulse: boolean;
  flow: boolean;
  tier: "S" | "A";
  curve: THREE.CatmullRomCurve3;
};

/** Flow dot only near Phase1 land hubs — never in open ocean. */
function TravelArcPulse({
  curve,
  color,
  speed,
  size = 0.036,
}: {
  curve: THREE.CatmullRomCurve3;
  color: string;
  speed: number;
  size?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const u = (state.clock.elapsedTime * speed) % 1;
    const pos = curve.getPointAt(u);
    const { lat, lon } = globeVectorToLatLon(pos);
    const nearHub = arcFlowPulseNearLandHub(lat, lon);
    ref.current.visible = nearHub;
    if (!nearHub) return;
    ref.current.position.copy(pos);
    ref.current.scale.setScalar(size * (1 + Math.sin(state.clock.elapsedTime * 5.5) * 0.14));
  });
  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.78} toneMapped={false} />
    </mesh>
  );
}

function TravelArcTube({
  curve,
  color,
  opacity,
  radius,
  tubularSegments = 64,
}: {
  curve: THREE.CatmullRomCurve3;
  color: string;
  opacity: number;
  radius: number;
  tubularSegments?: number;
}) {
  const geom = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false),
    [curve, radius, tubularSegments],
  );
  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <mesh geometry={geom} renderOrder={2}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

function buildRouteArc(
  route: TravelTrustPhase1TravelRoute,
  radius: number,
  segments: number,
): Omit<BuiltArc, "id"> | null {
  const from = REGION_BY_ID[route.fromId];
  const to = REGION_BY_ID[route.toId];
  if (!from || !to) return null;
  const alt = TT_CINEMATIC_GLOBE_VISUAL.travelArcAltitude;
  const a = resolveTraveltrustHubLatLon(from);
  const b = resolveTraveltrustHubLatLon(to);
  const points = greatCircleArcPoints(radius, a.lat, a.lon, b.lat, b.lon, segments, alt);
  if (points.length < 3) return null;
  const curve = new THREE.CatmullRomCurve3(points);
  const p = TT_HERO_GLOBE_L5_PALETTE.arc;
  const color = route.tier === "S" ? p.corridor : p.tierA;
  return {
    points,
    color,
    pulse: route.tier === "S",
    flow: route.tier === "S",
    tier: route.tier,
    curve,
  };
}

function arcIdsEqual(a: GlobeArcPick<BuiltArc>[], b: GlobeArcPick<BuiltArc>[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((arc, i) => arc.id === b[i]?.id);
}

export function TravelTrustPhase1TravelArcs({
  radius,
  lite = false,
  qualityMul = 1,
}: {
  radius: number;
  lite?: boolean;
  qualityMul?: number;
}) {
  const routes = lite ? TRAVELTRUST_PHASE1_TRAVEL_ROUTES_LITE : TRAVELTRUST_PHASE1_TRAVEL_ROUTES;
  const segments = lite ? 48 : 72;
  const maxArcs = lite
    ? TT_CINEMATIC_GLOBE_VISUAL.travelArcMaxCountLite
    : TT_CINEMATIC_GLOBE_VISUAL.travelArcMaxCount;

  const tubeScale = radius * TT_CINEMATIC_GLOBE_VISUAL.travelArcTubeRadiusMul;
  const { hoveredRegionId, interactive } = useTravelTrustGlobeInteraction();
  const { camera } = useThree();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const heroT = useSyncExternalStore(
    (onStoreChange) => heroScroll?.on("change", onStoreChange) ?? (() => {}),
    () => heroScroll?.get() ?? 0,
    () => 0,
  );
  const heroSky = heroT < 0.58;
  const groupRef = useRef<Group>(null);
  const [arcs, setArcs] = useState<GlobeArcPick<BuiltArc>[]>([]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.userData.ttTraveltrustHeroArcsL5Warm = "1";
  }, []);

  const arcsBuilt = useMemo(() => {
    return routes
      .map((route) => {
        const arc = buildRouteArc(route, radius, segments);
        if (!arc) return null;
        return { id: route.id, ...arc };
      })
      .filter(Boolean) as BuiltArc[];
  }, [radius, routes, segments]);

  useFrame(() => {
    const mw = groupRef.current?.matrixWorld;
    if (!mw) return;
    const bias = resolveHeroGlobeRouteBias(camera, mw);
    const pool = filterHeroTravelRoutes(arcsBuilt, bias);
    const next = selectFacingArcsWorld(pool, maxArcs, camera, mw);
    setArcs((prev) => (arcIdsEqual(prev, next) ? prev : next));
    setTraveltrustGlobeHeroHud({ routeBias: bias });
  });

  const arcHoverMul = (routeId: string): number => {
    const activeRegionId = resolveHeroGlobeActiveRegionId(hoveredRegionId);
    if (!interactive || !activeRegionId) return 1;
    if (traveltrustRouteTouchesRegion(routeId, activeRegionId)) {
      return TT_CINEMATIC_GLOBE_VISUAL.travelArcHoverBoostMul;
    }
    return TT_CINEMATIC_GLOBE_VISUAL.travelArcDimMul;
  };

  if (arcs.length === 0) {
    return <group ref={groupRef} renderOrder={2} />;
  }

  return (
    <group ref={groupRef} renderOrder={2}>
      {arcs.map((arc, i) => {
        const hoverMul = arcHoverMul(arc.id);
        const mainOpacity =
          TT_CINEMATIC_GLOBE_VISUAL.travelArcOpacity *
          qualityMul *
          hoverMul *
          (arc.pulse ? 1 : 0.9) *
          (1 - i * 0.006);
        const glowOpacity =
          (arc.tier === "S"
            ? TT_CINEMATIC_GLOBE_VISUAL.travelArcGlowOpacity
            : TT_CINEMATIC_GLOBE_VISUAL.travelArcTierAGlowOpacity) *
          qualityMul *
          hoverMul;
        const showFlow = arc.flow && arc.bothEndpointsVisible;

        return (
          <group key={arc.id}>
            {heroSky ? null : (
              <TravelArcTube
                curve={arc.curve}
                color={TT_HERO_GLOBE_L5_PALETTE.arc.glowHalo}
                opacity={glowOpacity * 0.8}
                radius={tubeScale * (arc.pulse ? 1.85 : 1.48)}
                tubularSegments={lite ? 48 : 72}
              />
            )}
            <TravelArcTube
              curve={arc.curve}
              color={arc.tier === "S" ? TT_HERO_GLOBE_L5_PALETTE.arc.flagship : arc.color}
              opacity={mainOpacity}
              radius={tubeScale * (arc.pulse ? 1.38 : 1.08)}
              tubularSegments={lite ? 40 : 64}
            />
            {showFlow ? (
              <TravelArcPulse
                curve={arc.curve}
                color={TT_HERO_GLOBE_L5_PALETTE.arc.pulseAccent}
                speed={0.1 + i * 0.012}
                size={arc.pulse ? 0.03 : 0.024}
              />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
