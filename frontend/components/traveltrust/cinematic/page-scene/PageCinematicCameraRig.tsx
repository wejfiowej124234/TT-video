"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { PerspectiveCamera } from "three";
import { TT_CINEMATIC_FILM } from "../traveltrustCinematic3dConfig";
import { resolveTravelTrustBlendedChapterPreset } from "../traveltrustCinematicChapters";
import { lerp, smoothstep } from "../traveltrustCinematicEasing3d";
import { resolveHeroSplitLayoutBlend, TT_HERO_SPLIT_CAMERA_X } from "@/lib/traveltrustHeroCinematicAlign";
import { useTravelTrustHeroScrollProgress } from "../TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "../TravelTrustPageScrollContext";

export function PageCameraRig({ isMobile }: { isMobile: boolean }) {
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
