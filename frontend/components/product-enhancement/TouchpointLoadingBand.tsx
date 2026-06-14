"use client";

import { PES_UI } from "@/lib/productEnhancementSprint";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type TouchpointLoadingBandProps = {
  message: string;
  /** 列表骨架行数（移动端友好） */
  skeletonRows?: number;
  className?: string;
};

/** 统一加载反馈：文案 + 轻量骨架（不改页结构） */
export function TouchpointLoadingBand({
  message,
  skeletonRows = 3,
  className = "",
}: TouchpointLoadingBandProps) {
  return (
    <div
      className={`${PES_UI.loadingBand} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-tt-pes-loading="1"
    >
      <div className="flex items-start gap-2.5">
        <span className={`${PES_UI.loadingPulse} mt-1.5 shrink-0`} aria-hidden />
        <p className={PES_UI.loadingText}>{message}</p>
      </div>
      <div className="mt-3 space-y-2 pl-4" aria-hidden>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div
            key={i}
            className={`${PES_UI.skeletonRow} ${i === skeletonRows - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

/** 治理等浅色页用的加载条 */
export function TouchpointLoadingBandLight({
  message,
  skeletonRows = 3,
  className = "",
}: TouchpointLoadingBandProps) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-ink-200/90 bg-ink-50/80 px-4 py-3 dark:border-ink-600/40 dark:bg-ink-900/30 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-tt-pes-loading="1"
    >
      <p className="text-meta text-ink-700 dark:text-ink-200">{message}</p>
      <div className="mt-3 space-y-2" aria-hidden>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div
            key={i}
            className={`h-3 rounded-[var(--radius-sm)] bg-ink-200/80 dark:bg-ink-700/50 animate-pulse motion-reduce:animate-none ${i === skeletonRows - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

export const pesLoadingFocusRing = travelFocusRingCoreOffset2Classes;
