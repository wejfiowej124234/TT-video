"use client";

import { memo } from "react";
import {
  TT_MARKETING_HOME_AMBIENT_GLOW,
  TT_MARKETING_HOME_DOT_GRID,
} from "@/lib/marketingUi";

/** 首页静态叠层（vignette 在 page 壳）；无 props，避免 Hero 表单 keystroke 触发重绘。 */
function LandingHomeDecorLayers() {
  return (
    <>
      <div className="absolute inset-0 z-0 bg-experience-landing-vignette pointer-events-none" aria-hidden />
      <div className={TT_MARKETING_HOME_AMBIENT_GLOW} aria-hidden />
      <div className={TT_MARKETING_HOME_DOT_GRID} aria-hidden />
    </>
  );
}

export default memo(LandingHomeDecorLayers);
