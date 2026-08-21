"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — Hero bloom gate; see `traveltrustHeroGlobeFrozenManifest.ts` */

import { Bloom, BrightnessContrast, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { TT_CINEMATIC_PAGE_L5 } from "@/lib/traveltrustCinematicPageL5";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { smoothstep } from "./traveltrustCinematicEasing3d";

/** Lightweight post FX for page cinematic canvas (L5 · ①). */
export function TravelTrustCinematicBloom({ enabled }: { enabled: boolean }) {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const heroT = heroScroll?.get() ?? 0;
  const heroFocus = 1 - smoothstep(0.12, 0.58, heroT);
  const g = TT_CINEMATIC_GLOBE_VISUAL;
  const b = TT_CINEMATIC_PAGE_L5.bloom;
  if (!enabled || heroFocus > 0.48) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={b.intensity}
        luminanceThreshold={b.luminanceThreshold}
        luminanceSmoothing={b.luminanceSmoothing}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
      />
      <BrightnessContrast
        brightness={g.l5ColorGradeBrightness + b.brightness}
        contrast={g.l5ColorGradeContrast + b.contrast}
      />
      <Vignette eskil={false} offset={b.vignetteOffset} darkness={b.vignetteDarkness} />
    </EffectComposer>
  );
}
