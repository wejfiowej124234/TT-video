"use client";

import Link from "next/link";
import type { PesTouchpoint } from "@/lib/productEnhancementSprint";
import { PES_UI } from "@/lib/productEnhancementSprint";
import {
  CONVERSION_FUNNEL_STAGES,
  TOUCHPOINT_FUNNEL_STAGE,
  getFunnelStageIndex,
  resolveFunnelNextStep,
} from "@/lib/conversionFunnelModel";
import {
  trackPesFunnelNextCta,
  trackPesFunnelStageClick,
} from "@/lib/conversionAnalyticsLayer";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type ConversionFunnelRailProps = {
  touchpoint: PesTouchpoint;
  t: (key: string) => string;
  /** 覆盖默认当前阶段 */
  currentStageId?: (typeof TOUCHPOINT_FUNNEL_STAGE)[PesTouchpoint];
  variant?: "dark" | "light";
  className?: string;
};

/**
 * 横向可滑转化轨 — 标示「你在哪一步」+ 下一跳 CTA（移动端 44px 触控）
 */
export function ConversionFunnelRail({
  touchpoint,
  t,
  currentStageId,
  variant = "dark",
  className = "",
}: ConversionFunnelRailProps) {
  usePesTouchpointImpression(touchpoint);
  const currentId = currentStageId ?? TOUCHPOINT_FUNNEL_STAGE[touchpoint];
  const nextStep = resolveFunnelNextStep(currentId, touchpoint);
  const shell =
    variant === "light"
      ? "rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/70 p-3 dark:border-ink-600/40 dark:bg-ink-900/25"
      : "rounded-[var(--radius-md)] border border-slate-600/40 bg-ink-900/55 backdrop-blur-sm p-3";

  return (
    <nav
      className={`${shell} ${className}`}
      aria-label={t("pes2_funnel_rail_aria")}
      data-tt-pes-funnel-rail={touchpoint}
      data-tt-pes-funnel-stage={currentId}
    >
      <p
        className={`text-meta font-medium mb-2 sm:mb-2.5 ${
          variant === "light" ? "text-ink-700 dark:text-ink-200" : "text-slate-300"
        }`}
      >
        {t("pes2_funnel_rail_title")}
      </p>
      <ol
        className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
        role="list"
      >
        {CONVERSION_FUNNEL_STAGES.map((stage) => {
          const active = stage.id === currentId;
          const done = getFunnelStageIndex(stage.id) < getFunnelStageIndex(currentId);
          return (
            <li key={stage.id} className="snap-start shrink-0">
              <Link
                href={stage.href}
                onClick={() => trackPesFunnelStageClick(touchpoint, stage.id, stage.href)}
                aria-current={active ? "step" : undefined}
                className={
                  `inline-flex min-h-[44px] items-center rounded-full border px-3 py-1.5 text-meta whitespace-nowrap ` +
                  (active
                    ? "border-cyan-400/55 bg-cyan-500/20 text-cyan-100 font-semibold"
                    : done
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200/90"
                      : variant === "light"
                        ? "border-ink-200 bg-white/80 text-ink-600 dark:border-ink-600/50 dark:bg-ink-800/40 dark:text-ink-300"
                        : "border-slate-600/50 bg-ink-800/40 text-slate-400") +
                  ` ${travelFocusRingCoreOffset2Classes}`
                }
              >
                {t(stage.labelKey)}
              </Link>
            </li>
          );
        })}
      </ol>
      {nextStep ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`text-small ${variant === "light" ? "text-ink-500 dark:text-ink-400" : "text-slate-400"}`}
          >
            {t("pes2_funnel_next_label")}
          </span>
          <Link
            href={nextStep.href}
            data-tt-pes-funnel-next-cta="1"
            data-tt-pes-funnel-next-key={nextStep.ctaKey}
            onClick={() =>
              trackPesFunnelNextCta(touchpoint, currentId, nextStep.href, nextStep.ctaKey)
            }
            className={`${PES_UI.ctaPrimary} ${travelFocusRingCoreOffset2Classes}`}
          >
            {t(nextStep.ctaKey)}
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
