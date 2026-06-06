"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/** Lightweight post FX for page cinematic canvas (TT-PH1-130 · ①). */
export function TravelTrustCinematicBloom({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.78}
        luminanceSmoothing={0.4}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
      />
      <Vignette eskil={false} offset={0.18} darkness={0.42} />
    </EffectComposer>
  );
}
