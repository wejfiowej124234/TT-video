"use client";

import { useReducedMotion } from "framer-motion";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

/** 榜区顶部 indeterminate 细条（period 切换刷新时） */
export function DidRankBoardRefreshBar({ active, label }: { active: boolean; label: string }) {
  const reduceMotion = useReducedMotion();
  if (!active) return null;

  return (
    <div
      className={TT_MARKETING_DID_RANK_SURFACE.boardRefreshTrack}
      role="progressbar"
      aria-busy="true"
      aria-valuetext={label}
    >
      <div
        className={
          reduceMotion
            ? "h-full w-full bg-ref-sun/75 motion-reduce:animate-none"
            : TT_MARKETING_DID_RANK_SURFACE.boardRefreshBar
        }
        aria-hidden
      />
    </div>
  );
}
