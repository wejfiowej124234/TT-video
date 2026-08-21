"use client";

import {
  TravelTrustBelowFoldAtmosphere,
  TravelTrustCinematicViewportInk,
  UNIFIED_PAGE_3D,
} from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustHomeWebGLLayer } from "../sections/TravelTrustHomeWebGLLayer";

/** 统一页 3D：Canvas + viewport ink + below-fold 氛围（非节内容） */
export function TravelTrustHomeUnified3DBackdrop() {
  if (!UNIFIED_PAGE_3D) return null;
  return (
    <>
      <TravelTrustHomeWebGLLayer />
      <TravelTrustCinematicViewportInk />
      <TravelTrustBelowFoldAtmosphere />
    </>
  );
}
