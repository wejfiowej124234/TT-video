"use client";

import Link from "next/link";
import type { PesTouchpoint } from "@/lib/productEnhancementSprint";
import { trackPesCtaClick } from "@/lib/conversionAnalyticsLayer";
import { PES_UI } from "@/lib/productEnhancementSprint";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type TouchpointConversionStripProps = {
  touchpoint: PesTouchpoint;
  kicker: string;
  body: string;
  badge?: string;
  ctaHref: string;
  ctaLabel: string;
  className?: string;
};

/** 商业化 / 转化轻条 — 叠加于现有区块，不新增 section 层级 */
export function TouchpointConversionStrip({
  touchpoint,
  kicker,
  body,
  badge,
  ctaHref,
  ctaLabel,
  className = "",
}: TouchpointConversionStripProps) {
  usePesTouchpointImpression(touchpoint);
  const ctaId = `pes_strip_${touchpoint}`;
  return (
    <aside
      className={`${PES_UI.conversionStrip} ${className}`}
      aria-label={kicker}
      data-tt-pes-conversion={touchpoint}
    >
      <div className="min-w-0 flex-1">
        <p className={PES_UI.conversionKicker}>{kicker}</p>
        <p className={PES_UI.conversionBody}>{body}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {badge ? <span className={PES_UI.conversionBadge}>{badge}</span> : null}
        <Link
          href={ctaHref}
          onClick={() => trackPesCtaClick(touchpoint, ctaHref, ctaId)}
          className={`${PES_UI.ctaPrimary} ${travelFocusRingCoreOffset2Classes}`}
        >
          {ctaLabel}
        </Link>
      </div>
    </aside>
  );
}
