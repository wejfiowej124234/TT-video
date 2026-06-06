"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";
import {
  PHASE1_TIER_GLOW,
  TRAVELTRUST_PHASE1_GLOBE_REGIONS,
  latLonToUnitVector,
} from "@/lib/traveltrustPhase1GlobeRegions";

export function TravelTrustPhase1GlobeHighlights({ radius }: { radius: number }) {
  const group = useRef<Group>(null);
  const markers = useMemo(
    () =>
      TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((r) => ({
        ...r,
        pos: latLonToUnitVector(r.lat, r.lon),
        color: PHASE1_TIER_GLOW[r.tier],
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <group ref={group} aria-hidden>
      {markers.map((m) => (
        <mesh key={m.id} position={[m.pos[0] * radius, m.pos[1] * radius, m.pos[2] * radius]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            color={m.color}
            transparent
            opacity={0.14}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
