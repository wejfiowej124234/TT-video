"use client";

import { Float, Line, Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, PerspectiveCamera } from "three";
import * as THREE from "three";
import {
  ROLE_CINEMATIC_3D_COLORS,
  TT_CINEMATIC_3D_BG,
  TT_CINEMATIC_FILM,
  type TravelTrustCinematic3dConfig,
} from "./traveltrustCinematic3dConfig";
import { useTravelTrustTheaterRole } from "./TravelTrustTheaterRoleContext";
import {
  DepthDust,
  GlobeGlowHalo,
  GlobeBrandAtmosphere,
  TravelGlobeNetwork,
} from "./TravelTrustCinematicScene3DContent";
import { damp, easeInOutCubic, lerp, lerpHex, smoothstep } from "./traveltrustCinematicEasing3d";
import { resolveTravelTrustBlendedChapterPreset } from "./traveltrustCinematicChapters";
import { TravelTrustCinematicBloom } from "./TravelTrustCinematicBloom";
import { TravelTrustPhase1GlobeHighlights } from "./TravelTrustPhase1GlobeHighlights";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";
import { useTravelTrustTheaterViewport } from "./TravelTrustTheaterViewportContext";
import {
  CinematicHorizonBand,
  EscrowAnchorNodes,
  PageCinematicLighting,
  RouteTrustPulses,
  TrustEquatorRing,
  TrustEscrowFilaments,
} from "./TravelTrustWeb3CinematicElements";
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

function PageTheaterRing() {
  const { roleId } = useTravelTrustTheaterRole();
  const group = useRef<Group>(null);
  const colors = useRef({
    primary: ROLE_CINEMATIC_3D_COLORS.traveler.primary,
    secondary: ROLE_CINEMATIC_3D_COLORS.traveler.secondary,
    pulse: ROLE_CINEMATIC_3D_COLORS.traveler.pulse,
  });
  const [lineColors, setLineColors] = useState(colors.current);
  const colorFrame = useRef(0);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const r = 2.35;
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2) * 0.14, Math.sin(a) * r * 0.52));
    }
    return pts;
  }, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const pulseA = useRef<THREE.Mesh>(null);
  const pulseB = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const target = ROLE_CINEMATIC_3D_COLORS[roleId];
    colors.current = { primary: target.primary, secondary: target.secondary, pulse: target.pulse };
  }, [roleId]);

  useFrame((state, delta) => {
    const target = ROLE_CINEMATIC_3D_COLORS[roleId];
    colors.current.primary = lerpHex(colors.current.primary, target.primary, 0.08);
    colors.current.secondary = lerpHex(colors.current.secondary, target.secondary, 0.08);
    colors.current.pulse = lerpHex(colors.current.pulse, target.pulse, 0.08);
    colorFrame.current += 1;
    if (colorFrame.current % 5 === 0) {
      setLineColors({ ...colors.current });
    }
    if (group.current) group.current.rotation.y += delta * 0.11;
    const e = state.clock.elapsedTime;
    if (pulseA.current) {
      pulseA.current.position.copy(curve.getPointAt((e * 0.13) % 1));
    }
    if (pulseB.current) {
      pulseB.current.position.copy(curve.getPointAt((0.5 + e * 0.13) % 1));
    }
  });

  return (
    <group ref={group}>
      <Line points={points} color={lineColors.primary} transparent opacity={0.28} lineWidth={1} />
      <mesh ref={pulseA}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={lineColors.pulse} toneMapped={false} />
      </mesh>
      <mesh ref={pulseB}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={lineColors.secondary} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** 全页 hero 地球 rig：左置 + 慢速阻尼缩放（TT-PH1-151/152 · ①） */
function PageHeroGlobeRig({
  config,
  enableGlow,
  routePulseCount,
  isMobile,
}: {
  config: TravelTrustCinematic3dConfig;
  enableGlow: boolean;
  routePulseCount: number;
  isMobile: boolean;
}) {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const theaterViewport = useTravelTrustTheaterViewport();
  const { roleId } = useTravelTrustTheaterRole();
  const globeRig = useRef<Group>(null);
  const ringRig = useRef<Group>(null);
  const parallax = useRef({ x: 0, y: 0 });
  const scaleSm = useRef(1);
  const opacitySm = useRef(1);
  const ringYSm = useRef(-2.4);
  const ringScaleSm = useRef(0.2);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    const splitBlend = resolveHeroSplitLayoutBlend(heroT, isMobile);
    const heroScrollEase = easeInOutCubic(heroT);
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
      globeRig.current.rotation.y +=
        delta * lerp(config.autoRotateSpeed, config.autoRotateSpeed * 0.35, heroScrollEase) * (1 - opacityExit * 0.65);
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
      <group ref={globeRig} data-tt-traveltrust-page-globe-rig="1">
        <Float speed={0.65} rotationIntensity={0.06} floatIntensity={0.1}>
          <group rotation={[0.18, 0.38, 0]}>
            {enableGlow ? (
              <>
                <GlobeBrandAtmosphere radius={config.globeRadius} opacity={0.26} />
                <GlobeGlowHalo radius={config.globeRadius} intensity={0.22} />
              </>
            ) : null}
            <TrustEquatorRing radius={config.globeRadius} opacity={0.1} />
            <TravelGlobeNetwork config={config} showOrbitalArcs={false} />
            {enableGlow ? <TravelTrustPhase1GlobeHighlights radius={config.globeRadius} /> : null}
            <TrustEscrowFilaments radius={config.globeRadius} activeRole={roleId} />
            <EscrowAnchorNodes radius={config.globeRadius} activeRole={roleId} />
            {enableGlow && routePulseCount > 0 ? (
              <RouteTrustPulses config={config} count={routePulseCount} />
            ) : null}
          </group>
        </Float>
      </group>
      <group ref={ringRig} visible={false}>
        <PageTheaterRing />
      </group>
    </>
  );
}

export function TravelTrustPageCinematicScene({
  config,
  isMobile = false,
  enableGlow = true,
  enablePostFx = true,
  routePulseCount = TT_CINEMATIC_FILM.routePulseCountDesktop,
}: {
  config: TravelTrustCinematic3dConfig;
  isMobile?: boolean;
  enableGlow?: boolean;
  enablePostFx?: boolean;
  routePulseCount?: number;
}) {
  return (
    <>
      <color attach="background" args={[TT_CINEMATIC_3D_BG]} />
      <fog attach="fog" args={[TT_CINEMATIC_3D_BG, 8, 22]} />
      <PageCinematicLighting />
      <Stars radius={80} depth={40} count={config.starCount} factor={3} saturation={0} fade speed={0.35} />
      <DepthDust count={config.dustCount} />
      {UNIFIED_PAGE_3D ? null : <CinematicHorizonBand />}
      <PageCameraRig isMobile={isMobile} />
      <PageHeroGlobeRig
        config={config}
        enableGlow={enableGlow}
        routePulseCount={routePulseCount}
        isMobile={isMobile}
      />
      {enablePostFx ? <TravelTrustCinematicBloom enabled /> : null}
    </>
  );
}
