"use client";

import { Float, Html, Line, Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Group, PerspectiveCamera } from "three";
import * as THREE from "three";
import {
  TT_CINEMATIC_3D_BG,
  TT_CINEMATIC_FILM,
  type TravelTrustCinematic3dConfig,
} from "./traveltrustCinematic3dConfig";
import { useTravelTrustTheaterRole } from "./TravelTrustTheaterRoleContext";
import { DepthDust } from "./TravelTrustCinematicScene3DContent";
import { TravelTrustPhase1TravelArcs } from "./TravelTrustPhase1TravelArcs";
import { TravelTrustHeroGlobeProjectionPublisher } from "./TravelTrustHeroGlobeProjectionPublisher";
import {
  TourismGlobeAmbientParticles,
  TravelTrustTourismGlobe,
  TravelTrustTourismGlobeFillLight,
  TravelTrustTourismGlobeSpin,
} from "./TravelTrustTourismGlobe";
import { damp, easeInOutCubic, lerp, lerpHex, smoothstep } from "./traveltrustCinematicEasing3d";
import { resolveTravelTrustBlendedChapterPreset } from "./traveltrustCinematicChapters";
import {
  resolveTraveltrustGlobeRenderTier,
  TT_GLOBE_EARTH_SURFACE_RADIUS_MUL,
} from "@/lib/traveltrustGlobeEarthAsset";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { TravelTrustCinematicBloom } from "./TravelTrustCinematicBloom";
import { TravelTrustGlobeInteractionProvider } from "./TravelTrustGlobeInteractionContext";
import { TravelTrustPhase1GlobeHighlights } from "./TravelTrustPhase1GlobeHighlights";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";
import { useTravelTrustTheaterViewport } from "./TravelTrustTheaterViewportContext";
import { CinematicHorizonBand, PageCinematicLighting, RouteTrustPulses } from "./TravelTrustWeb3CinematicElements";
import {
  resolveCinematicGlobeDecorFade,
  TT_CINEMATIC_PAGE_L5,
  TRAVELTRUST_CINEMATIC_L5_SPRINT_ID,
} from "@/lib/traveltrustCinematicPageL5";
import {
  resolveNonGlobeCorridorRingReveal,
  resolveNonGlobeHorizonFogOpacity,
  resolveNonGlobeEnvironmentOpacity,
  resolveNonGlobeEnvironmentVisible,
  resolveNonGlobeStarsSpeed,
  resolveTheaterRoleWarm3dHex,
  TT_CORRIDOR_HUB_LABEL_L5,
  TT_CORRIDOR_RING_L5,
  TT_PAGE_HORIZON_FOG_L5,
  TT_HERO_GLOBE_WARM_FRONT_VEIL_L5,
  TT_HERO_GLOBE_WARM_LIMB_SHELL_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import {
  resolveHeroGlobeExitProgress,
  resolveHeroGlobeOpacityExit,
  resolveHeroGlobeScaleExit,
  resolveHeroSplitLayoutBlend,
  TT_HERO_SPLIT_CAMERA_X,
  TT_HERO_SPLIT_GLOBE_SCALE_MUL,
  TT_HERO_SPLIT_GLOBE_X,
  TT_HERO_SPLIT_GLOBE_Y,
  TT_HERO_THEATER_GLOBE_X,
  TT_HERO_THEATER_GLOBE_Y,
} from "@/lib/traveltrustHeroCinematicAlign";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import { PageCinematicSceneLayerDebug } from "./PageCinematicSceneLayerDebug";
import { shouldMountTraveltrustSceneLayerDebug } from "@/lib/traveltrustPageCinematicSceneDebug";
import { useTranslation } from "@/components/LocaleProvider";
import { traveltrustPhase1RegionNameKey } from "@/lib/traveltrustPhase1RegionKeys";
import type { TraveltrustPhase1RegionLocaleKey } from "@/lib/traveltrustPhase1RegionKeys";

function PageCameraRig({ isMobile }: { isMobile: boolean }) {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const { camera } = useThree();
  const smooth = useRef({ z: 7.55, y: 0.32, fov: 47, roll: 0, x: 0 });
  const intro = useRef(0);
  useFrame((state, delta) => {
    intro.current = Math.min(1, intro.current + delta * 0.38);
    const introEase = 1 - Math.pow(1 - intro.current, 2.4);
    const introDolly = lerp(TT_CINEMATIC_FILM.heroIntroDollyZ, 0, introEase);

    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    const preset = resolveTravelTrustBlendedChapterPreset(heroT, pageT);
    const splitBlend = resolveHeroSplitLayoutBlend(heroT, isMobile);
    const targetZ = preset.z;
    const targetY = lerp(preset.y, 0.06, smoothstep(0.48, 1, heroT) * 0.35);
    const targetFov = lerp(preset.fov, 41, smoothstep(0.42, 0.95, heroT) * 0.25);
    const targetRoll = preset.roll;
    const targetX = lerp(preset.x, TT_HERO_SPLIT_CAMERA_X, splitBlend);
    const dampHero = 1 - smoothstep(0.12, 0.55, heroT);
    const dampZ = lerp(0.062, 0.044, dampHero);
    const dampRot = lerp(0.058, 0.042, dampHero);
    smooth.current.z += (targetZ - smooth.current.z) * dampZ;
    smooth.current.y += (targetY - smooth.current.y) * dampZ;
    smooth.current.fov += (targetFov - smooth.current.fov) * dampZ;
    smooth.current.roll += (targetRoll - smooth.current.roll) * dampRot;
    smooth.current.x += (targetX - smooth.current.x) * dampRot;
    camera.position.z = smooth.current.z + introDolly;
    camera.position.y = smooth.current.y;
    camera.position.x = smooth.current.x;
    camera.rotation.z = smooth.current.roll;
    const cam = camera as PerspectiveCamera;
    const breath = Math.sin(state.clock.elapsedTime * 0.45) * TT_CINEMATIC_FILM.heroBreathFov * (1 - heroT);
    cam.fov = smooth.current.fov + (1 - smoothstep(0.18, 0.68, heroT)) * 1.15 + breath;
    cam.updateProjectionMatrix();
  });

  return null;
}

/** Hero 首屏：暖墨空穹（压住 FillLight 冷天光 `#dce8f0` 在空域的发青 · 非地球 mesh） */
function PageCinematicWarmSkyShell() {
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

/** Hero 首屏：暖墨缘壳 + 贴球薄雾（压赤道青蓝光晕 · 非地球贴图 mesh） */
function PageHeroGlobeWarmShell({ radius, heroT }: { radius: number; heroT: number }) {
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

/** Hero 首屏：补偿冻结球光里的冷色 hemisphere（`TravelTrustTourismGlobeFillLight` · 不可改冻结文件） */
function PageCinematicHeroWarmFill() {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    const heroT = heroScroll?.get() ?? 0;
    const k = Math.max(0, 1 - smoothstep(0.1, 0.52, heroT));
    if (hemiRef.current) hemiRef.current.intensity = k * 1.02;
    if (ambRef.current) ambRef.current.intensity = k * 0.52;
  });
  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#0c0a09", "#0c0a09", 0]} />
      <ambientLight ref={ambRef} color="#0c0a09" intensity={0} />
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
function PageCinematicEnvironment({ config }: { config: TravelTrustCinematic3dConfig }) {
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

function PageTravelCorridorRing({ isMobile }: { isMobile: boolean }) {
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

/** 全页 hero 地球 rig：左置 + 慢速阻尼缩放（TT-PH1-151/152 · ①） */
function PageHeroGlobeRig({
  config,
  showPhase1Decor,
  enableGlow,
  globeInteractive,
  routePulseCount,
  isMobile,
  lowQuality,
  heroT,
}: {
  config: TravelTrustCinematic3dConfig;
  showPhase1Decor: boolean;
  enableGlow: boolean;
  globeInteractive: boolean;
  routePulseCount: number;
  isMobile: boolean;
  lowQuality: boolean;
  heroT: number;
}) {
  const heroWarmInkSky = heroT < 0.58;
  const globeTier = resolveTraveltrustGlobeRenderTier({ isMobile, lowQuality });
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const theaterViewport = useTravelTrustTheaterViewport();
  const globeRig = useRef<Group>(null);
  useLayoutEffect(() => {
    if (globeRig.current) globeRig.current.userData.ttTraveltrustPageGlobeRig = "1";
  }, []);
  const ringRig = useRef<Group>(null);
  const parallax = useRef({ x: 0, y: 0 });
  const scaleSm = useRef(1);
  const opacitySm = useRef(1);
  const decorFadeSm = useRef(1);
  const ringYSm = useRef(-2.4);
  const ringScaleSm = useRef(0.2);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    const splitBlend = resolveHeroSplitLayoutBlend(heroT, isMobile);
    const heroScrollEase = easeInOutCubic(heroT);
    const decorFade = resolveCinematicGlobeDecorFade(heroT);
    decorFadeSm.current = damp(decorFadeSm.current, decorFade, delta, 1.8);
    const ringIn = smoothstep(0.32, 0.58, pageT);
    const scaleExit = easeInOutCubic(resolveHeroGlobeScaleExit(heroT));
    const opacityExit = easeInOutCubic(resolveHeroGlobeOpacityExit(heroT));
    const globeFadeOut = resolveHeroGlobeExitProgress(heroT);

    const px = -pointer.x * 0.28 * (1 - heroScrollEase * 0.65);
    const py = -pointer.y * 0.18 * (1 - heroScrollEase * 0.65);
    parallax.current.x += (px - parallax.current.x) * 0.05;
    parallax.current.y += (py - parallax.current.y) * 0.05;

    if (globeRig.current) {
      const parallaxMix = splitBlend * 0.65 + 0.35;
      const globeX = lerp(
        TT_HERO_THEATER_GLOBE_X,
        TT_HERO_SPLIT_GLOBE_X,
        splitBlend,
      ) + parallax.current.x * 0.06 * parallaxMix;
      const splitGlobeY = lerp(TT_HERO_SPLIT_GLOBE_Y, TT_HERO_SPLIT_GLOBE_Y - 0.14, scaleExit);
      const globeY = lerp(TT_HERO_THEATER_GLOBE_Y, splitGlobeY, splitBlend) + parallax.current.y * 0.06;
      globeRig.current.position.set(globeX, globeY, 0);

      const heroScaleMul = lerp(1, TT_HERO_SPLIT_GLOBE_SCALE_MUL, splitBlend);
      const scrollShrink = lerp(1, 0.84, scaleExit);
      const targetScale = heroScaleMul * scrollShrink * (1 - opacityExit * 0.9);
      const scaleLambda = 0.88 + scaleExit * 0.22;
      scaleSm.current = damp(scaleSm.current, targetScale, delta, scaleLambda);
      opacitySm.current = damp(opacitySm.current, 1 - opacityExit, delta, 0.92);
      globeRig.current.scale.setScalar(scaleSm.current);

      globeRig.current.rotation.x = lerp(0.18, 0.36, heroScrollEase);
      globeRig.current.visible = opacitySm.current > 0.028;
    }

    if (ringRig.current) {
      const ringBoost = smoothstep(0.38, 0.62, pageT);
      const ringReveal = Math.max(ringIn, easeInOutCubic(globeFadeOut) * 0.92);
      ringRig.current.visible = ringReveal > 0.04;
      let ringYTarget = lerp(-2.8, -2.2, ringReveal);
      if (theaterViewport && typeof window !== "undefined") {
        const vh = window.innerHeight;
        const ndc = 1 - (theaterViewport.centerY / vh) * 2;
        ringYTarget = ndc * 1.65 - 0.15;
      }
      ringYSm.current = damp(ringYSm.current, ringYTarget, delta, 2.4);
      ringRig.current.position.y = ringYSm.current;
      ringRig.current.position.z = lerp(-0.55, -0.12, ringIn);
      const ringScaleTarget = lerp(0.2, 1.05 + ringBoost * 0.06, easeInOutCubic(ringReveal));
      ringScaleSm.current = damp(ringScaleSm.current, ringScaleTarget, delta, 2.1);
      ringRig.current.scale.setScalar(ringScaleSm.current);
      ringRig.current.rotation.x = 0.52;
      ringRig.current.rotation.y = state.clock.elapsedTime * (0.08 + ringBoost * 0.06);
    }
  });

  return (
    <>
      <group ref={globeRig} userData={{ ttTraveltrustPageGlobeRig: "1" }}>
        <Float speed={0.65} rotationIntensity={0.06} floatIntensity={0.1}>
          <group rotation={[0.18, 0.38, 0]}>
            <TravelTrustTourismGlobeFillLight radius={config.globeRadius} />
            {enableGlow && globeTier.ambientParticles ? (
              <TourismGlobeAmbientParticles radius={config.globeRadius} />
            ) : null}
            <TravelTrustGlobeInteractionProvider interactive={globeInteractive}>
              <TravelTrustTourismGlobeSpin config={config}>
                <group userData={{ ttSceneDebugLayer: "ocean", ttSceneDebugName: "TravelTrustTourismGlobe" }}>
                  <TravelTrustTourismGlobe
                    config={config}
                    tier={globeTier}
                    isMobile={isMobile}
                    lowQuality={lowQuality}
                    heroWarmInkSky={heroWarmInkSky}
                  />
                  {heroWarmInkSky ? <PageHeroGlobeWarmShell radius={config.globeRadius} heroT={heroT} /> : null}
                </group>
                {showPhase1Decor ? (
                  <group userData={{ ttSceneDebugLayer: "arcs", ttSceneDebugName: "Phase1TravelArcs" }}>
                    <TravelTrustPhase1TravelArcs
                      radius={config.globeRadius}
                      lite={globeTier.travelArcLite}
                      qualityMul={
                        (lowQuality ? TT_CINEMATIC_GLOBE_VISUAL.phase1DecorLowQualityMul : 1) * decorFadeSm.current
                      }
                    />
                    <TravelTrustPhase1GlobeHighlights
                      radius={config.globeRadius}
                      qualityMul={
                        (lowQuality ? TT_CINEMATIC_GLOBE_VISUAL.phase1DecorLowQualityMul : 1) * decorFadeSm.current
                      }
                    />
                  </group>
                ) : null}
              </TravelTrustTourismGlobeSpin>
            </TravelTrustGlobeInteractionProvider>
            {enableGlow && routePulseCount > 0 && heroT > 0.22 ? (
              <RouteTrustPulses config={config} count={routePulseCount} />
            ) : null}
          </group>
        </Float>
        <TravelTrustHeroGlobeProjectionPublisher
          globeRigRef={globeRig}
          surfaceRadius={config.globeRadius * TT_GLOBE_EARTH_SURFACE_RADIUS_MUL}
        />
      </group>
      <group ref={ringRig}>
        <PageTravelCorridorRing isMobile={isMobile} />
      </group>
    </>
  );
}

export function TravelTrustPageCinematicScene({
  config,
  isMobile = false,
  lowQuality = false,
  showPhase1Decor = true,
  enableGlow = true,
  globeInteractive = false,
  enablePostFx = true,
  routePulseCount = TT_CINEMATIC_FILM.routePulseCountDesktop,
  heroT: heroTProp = 0,
}: {
  config: TravelTrustCinematic3dConfig;
  isMobile?: boolean;
  lowQuality?: boolean;
  showPhase1Decor?: boolean;
  enableGlow?: boolean;
  globeInteractive?: boolean;
  enablePostFx?: boolean;
  routePulseCount?: number;
  /** 由 Canvas 父级订阅 scroll 传入（避免 R3F 子树不随 heroT 重渲染） */
  heroT?: number;
}) {
  const heroSky = heroTProp < 0.58;

  return (
    <>
      <color attach="background" args={[TT_CINEMATIC_3D_BG]} />
      <fog attach="fog" args={["#0c0a09", heroSky ? 5.4 : 6, heroSky ? 12 : 16]} />
      <PageCinematicWarmSkyShell />
      <PageCinematicHeroWarmFill />
      <PageCinematicLighting />
      <PageCinematicEnvironment config={config} />
      {UNIFIED_PAGE_3D ? null : <CinematicHorizonBand />}
      <PageCameraRig isMobile={isMobile} />
      <PageHeroGlobeRig
        config={config}
        showPhase1Decor={showPhase1Decor}
        enableGlow={enableGlow}
        globeInteractive={globeInteractive}
        routePulseCount={routePulseCount}
        isMobile={isMobile}
        lowQuality={lowQuality}
        heroT={heroTProp}
      />
      {enablePostFx ? <TravelTrustCinematicBloom enabled /> : null}
      {shouldMountTraveltrustSceneLayerDebug() ? <PageCinematicSceneLayerDebug /> : null}
    </>
  );
}
