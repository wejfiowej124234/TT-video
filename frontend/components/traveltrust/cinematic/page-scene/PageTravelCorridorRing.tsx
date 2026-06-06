"use client";

import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { useTranslation } from "@/components/LocaleProvider";
import { traveltrustPhase1RegionNameKey, type TraveltrustPhase1RegionLocaleKey } from "@/lib/traveltrustPhase1RegionKeys";
import {
  resolveNonGlobeCorridorRingReveal,
  resolveTheaterRoleWarm3dHex,
  TT_CORRIDOR_HUB_LABEL_L5,
  TT_CORRIDOR_RING_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { TT_CINEMATIC_PAGE_L5 } from "@/lib/traveltrustCinematicPageL5";
import { damp, lerpHex } from "../traveltrustCinematicEasing3d";
import { useTravelTrustHeroScrollProgress } from "../TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "../TravelTrustPageScrollContext";
import { useTravelTrustTheaterRole } from "../TravelTrustTheaterRoleContext";
import { useTravelTrustTheaterViewport } from "../TravelTrustTheaterViewportContext";

/** 滚动 handoff：暖色走廊环 + 枢纽标记 + 示意走廊弦（L5 P0-1） */
function PageCorridorHubLabels({
  curve,
  reveal,
  suppressInTheater,
}: {
  curve: THREE.CatmullRomCurve3;
  reveal: number;
  suppressInTheater?: boolean;
}) {
  const { t } = useTranslation();
  const hubs = TT_CINEMATIC_PAGE_L5.theaterCorridorRing.hubMarkers;
  if (suppressInTheater || reveal < TT_CORRIDOR_HUB_LABEL_L5.minReveal) return null;

  return (
    <>
      {hubs.map((hub) => {
        const pos = curve.getPointAt(hub.t);
        const labelKey = traveltrustPhase1RegionNameKey(
          hub.regionId as Parameters<typeof traveltrustPhase1RegionNameKey>[0],
        ) as TraveltrustPhase1RegionLocaleKey;
        return (
          <Html
            key={hub.regionId}
            position={[pos.x, pos.y + 0.2, pos.z]}
            center
            distanceFactor={9}
            style={{ opacity: reveal * 0.96, pointerEvents: "none" }}
          >
            <span className={TT_CORRIDOR_HUB_LABEL_L5.pillClass}>{t(labelKey)}</span>
          </Html>
        );
      })}
    </>
  );
}

function CorridorHubMarker({
  position,
  color,
  reveal,
  phase,
}: {
  position: THREE.Vector3;
  color: string;
  reveal: number;
  phase: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const s = 0.82 + 0.18 * Math.sin(state.clock.elapsedTime * 2.2 + phase);
    mesh.current.scale.setScalar(s);
  });
  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.072, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.92 * reveal} toneMapped={false} />
    </mesh>
  );
}

export function PageTravelCorridorRing({ isMobile }: { isMobile: boolean }) {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const theaterViewport = useTravelTrustTheaterViewport();
  const revealSm = useRef(0);
  const [reveal, setReveal] = useState(0);
  const { roleId } = useTravelTrustTheaterRole();
  const ring = TT_CINEMATIC_PAGE_L5.theaterCorridorRing;
  const group = useRef<Group>(null);
  const colors = useRef({
    primary: ring.primary,
    secondary: ring.secondary,
    pulse: ring.pulse,
  });
  const [lineColors, setLineColors] = useState(colors.current);
  const colorFrame = useRef(0);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const r = 2.35;
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2) * 0.12, Math.sin(a) * r * 0.5));
    }
    return pts;
  }, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const pulseA = useRef<THREE.Mesh>(null);
  const pulseB = useRef<THREE.Mesh>(null);
  const chordTraveler = useRef<THREE.Mesh>(null);
  const lineOpacity = (ring.lineOpacity + reveal * (ring.lineOpacityActive - ring.lineOpacity)) * 1.08;
  const chord = TT_CINEMATIC_PAGE_L5.theaterCorridorRing.flightChord;
  const chordPoints = useMemo(() => {
    const a = curve.getPointAt(chord.fromT);
    const b = curve.getPointAt(chord.toT);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += 0.35;
    return [a, mid, b];
  }, [chord.fromT, chord.toT, curve]);
  const chordCurve = useMemo(() => new THREE.CatmullRomCurve3(chordPoints), [chordPoints]);

  const roleBlend = TT_CORRIDOR_RING_L5.roleColorBlend;

  useEffect(() => {
    const target = resolveTheaterRoleWarm3dHex(roleId);
    colors.current = {
      primary: lerpHex(ring.primary, target.primary, roleBlend),
      secondary: lerpHex(ring.secondary, target.secondary, roleBlend),
      pulse: lerpHex(ring.pulse, target.pulse, roleBlend),
    };
  }, [roleId, ring.primary, ring.pulse, ring.secondary, roleBlend]);

  useFrame((state, delta) => {
    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    const revealTarget = resolveNonGlobeCorridorRingReveal(heroT, pageT, isMobile);
    revealSm.current = damp(revealSm.current, revealTarget, delta, 2.2);
    const reveal = revealSm.current;

    const target = resolveTheaterRoleWarm3dHex(roleId);
    const blend = TT_CORRIDOR_RING_L5.roleColorBlend;
    const lerpRate = TT_CORRIDOR_RING_L5.roleColorBlendLerp;
    colors.current.primary = lerpHex(colors.current.primary, lerpHex(ring.primary, target.primary, blend), lerpRate);
    colors.current.secondary = lerpHex(
      colors.current.secondary,
      lerpHex(ring.secondary, target.secondary, blend),
      lerpRate,
    );
    colors.current.pulse = lerpHex(colors.current.pulse, lerpHex(ring.pulse, target.pulse, blend), lerpRate);
    colorFrame.current += 1;
    if (colorFrame.current % 5 === 0) {
      setLineColors({ ...colors.current });
      setReveal(revealSm.current);
    }
    if (group.current) group.current.rotation.y += delta * (0.07 + reveal * 0.05);
    const e = state.clock.elapsedTime;
    const ps = ring.pulseScale * (0.85 + reveal * 0.2);
    if (pulseA.current) {
      pulseA.current.position.copy(curve.getPointAt((e * 0.11) % 1));
    }
    if (pulseB.current) {
      pulseB.current.position.copy(curve.getPointAt((0.5 + e * 0.11) % 1));
    }
    if (pulseA.current) pulseA.current.scale.setScalar(ps / 0.05);
    if (pulseB.current) pulseB.current.scale.setScalar(ps * 0.9 / 0.045);
    if (group.current) group.current.visible = reveal > 0.04;
    if (chordTraveler.current && reveal > 0.06) {
      chordTraveler.current.position.copy(chordCurve.getPointAt((e * 0.09) % 1));
    }
  });

  return (
    <group
      ref={group}
      visible={false}
      userData={{
        ttTraveltrustCorridorRingL5: "1",
        ttTraveltrustCinematicNonGlobeL5: TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
      }}
    >
      <Line
        points={points}
        color={lineColors.pulse}
        transparent
        opacity={lineOpacity * reveal * TT_CORRIDOR_RING_L5.glowOpacityMul}
        lineWidth={TT_CORRIDOR_RING_L5.glowLineWidth}
      />
      <Line
        points={points}
        color={lineColors.primary}
        transparent
        opacity={lineOpacity * reveal * TT_CORRIDOR_RING_L5.primaryOpacityMul}
        lineWidth={TT_CORRIDOR_RING_L5.primaryLineWidth}
      />
      <Line
        points={points.map((p) => p.clone().multiplyScalar(0.92))}
        color={lineColors.secondary}
        transparent
        opacity={lineOpacity * 0.48 * reveal}
        lineWidth={1.05}
      />
      <Line
        points={chordPoints}
        color={lineColors.primary}
        transparent
        opacity={lineOpacity * TT_CORRIDOR_RING_L5.chordOpacityMul * reveal}
        lineWidth={TT_CORRIDOR_RING_L5.chordLineWidth}
      />
      {TT_CINEMATIC_PAGE_L5.theaterCorridorRing.hubMarkers.map((hub) => (
        <CorridorHubMarker
          key={hub.regionId}
          position={curve.getPointAt(hub.t)}
          color={lineColors.pulse}
          reveal={reveal}
          phase={hub.t * 12}
        />
      ))}
      <PageCorridorHubLabels curve={curve} reveal={reveal} suppressInTheater={!!theaterViewport} />
      <mesh ref={chordTraveler}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshBasicMaterial color={lineColors.pulse} transparent opacity={0.92 * reveal} toneMapped={false} />
      </mesh>
      <mesh ref={pulseA}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={lineColors.pulse} transparent opacity={0.85 * reveal} toneMapped={false} />
      </mesh>
      <mesh ref={pulseB}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={lineColors.secondary} transparent opacity={0.7 * reveal} toneMapped={false} />
      </mesh>
    </group>
  );
}
