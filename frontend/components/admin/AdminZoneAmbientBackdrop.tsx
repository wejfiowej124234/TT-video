"use client";

import { memo } from "react";

import {
  TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW,
  TT_MARKETING_ADMIN_ZONE_DOT_GRID,
  TT_MARKETING_ADMIN_ZONE_VIGNETTE,
} from "@/lib/marketingUi";

/** ① Admin · 页壳氛围（同源 `/` `LandingHomeDecorLayers` · 无 Ken Burns 摄影）。 */
function AdminZoneAmbientBackdrop() {
  return (
    <>
      <div
        className={TT_MARKETING_ADMIN_ZONE_VIGNETTE}
        aria-hidden
        data-tt-admin-zone-vignette="1"
      />
      <div
        className={TT_MARKETING_ADMIN_ZONE_AMBIENT_GLOW}
        aria-hidden
        data-tt-admin-zone-ambient-glow="1"
      />
      <div className={TT_MARKETING_ADMIN_ZONE_DOT_GRID} aria-hidden data-tt-admin-zone-dot-grid="1" />
    </>
  );
}

export default memo(AdminZoneAmbientBackdrop);
