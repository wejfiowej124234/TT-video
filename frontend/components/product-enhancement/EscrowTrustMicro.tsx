"use client";

import Link from "next/link";
import type { PesTouchpoint } from "@/lib/productEnhancementSprint";
import { trackPesEscrowTrustClick } from "@/lib/conversionAnalyticsLayer";
import { PES_UI } from "@/lib/productEnhancementSprint";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type EscrowTrustMicroProps = {
  t: (key: string) => string;
  touchpoint?: PesTouchpoint;
  variant?: "inline" | "card";
  className?: string;
};

/** Escrow 信任微展示 — 链上托管叙事，链至 /trust */
export function EscrowTrustMicro({ t, touchpoint = "home", variant = "card", className = "" }: EscrowTrustMicroProps) {
  usePesTouchpointImpression(touchpoint);
  const trustHref = "/trust";
  if (variant === "inline") {
    return (
      <p
        className={`flex flex-wrap items-center gap-2 text-meta text-slate-300/95 ${className}`}
        data-tt-pes-escrow-trust="inline"
      >
        <span className={PES_UI.conversionBadge}>{t("pes2_escrow_badge")}</span>
        <span>{t("pes2_escrow_inline")}</span>
        <Link
          href={trustHref}
          onClick={() => trackPesEscrowTrustClick(touchpoint, trustHref, "inline")}
          className={`text-cyan-300 underline underline-offset-2 ${travelFocusRingCoreOffset2Classes}`}
        >
          {t("pes2_escrow_learn")}
        </Link>
      </p>
    );
  }

  return (
    <aside
      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-[var(--radius-md)] border border-emerald-400/25 bg-emerald-500/8 px-3 py-2.5 ${className}`}
      aria-label={t("pes2_escrow_aria")}
      data-tt-pes-escrow-trust="card"
    >
      <div className="min-w-0">
        <p className="text-meta font-semibold text-emerald-200">{t("pes2_escrow_title")}</p>
        <p className="text-small text-slate-200/90 leading-snug">{t("pes2_escrow_body")}</p>
      </div>
      <Link
        href={trustHref}
        onClick={() => trackPesEscrowTrustClick(touchpoint, trustHref, "card")}
        className={`${PES_UI.ctaSecondary} shrink-0 border-emerald-400/35 text-emerald-100 ${travelFocusRingCoreOffset2Classes}`}
      >
        {t("pes2_escrow_learn")}
      </Link>
    </aside>
  );
}
