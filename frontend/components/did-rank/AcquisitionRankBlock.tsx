"use client";

import React, { useId } from "react";
import Link from "next/link";
import { trackDidRankEvent } from "@/lib/analytics";
import type { Period } from "@/lib/didRankUtils";
import { deepShellInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  didRankMainPanelClass,
  didRankMainPanelDescClass,
  didRankMainPanelHeaderClass,
  didRankMainPanelTitleClass,
} from "@/components/did-rank/didRankPanelShell";

type TFunc = (key: string) => string;

/** 30 §3.2 / 87 §1.4：第四脊签「旅行收购」— 榜单 API 未接入前为合规占位与动线入口 */
export default function AcquisitionRankBlock({ period, t }: { period: Period; t: TFunc }) {
  const titleId = useId();
  return (
    <section className={didRankMainPanelClass} aria-labelledby={titleId}>
      <div className={didRankMainPanelHeaderClass}>
        <h2 id={titleId} className={didRankMainPanelTitleClass}>
          {t("didRank_acquisitionRank")}
        </h2>
        <p className={didRankMainPanelDescClass}>{t("didRank_acquisitionRankDesc")}</p>
      </div>
      <div className="p-3 sm:p-4 space-y-4">
        <div
          className="rounded-[var(--radius-md)] border border-amber-500/25 bg-amber-950/25 backdrop-blur-md py-4 px-4 text-left text-small text-amber-100/95 ring-1 ring-amber-400/15"
          role="status"
        >
          <p className="font-medium text-amber-50">{t("didRank_acquisitionComplianceTitle")}</p>
          <p className="mt-2 text-meta leading-relaxed text-amber-100/90">{t("didRank_acquisitionComplianceNote")}</p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border border-white/10 bg-slate-900/35 backdrop-blur-md py-12 px-4 text-center text-slate-300 ring-1 ring-white/5"
          role="status"
        >
          <p className="text-small">{t("didRank_emptyAcquisition")}</p>
          <Link
            href="/market/acquisition"
            onClick={() => trackDidRankEvent("did_rank_empty_market_cta", { list: "acquisition", period })}
            className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-cyan-300 hover:text-cyan-100 motion-sub ${deepShellInlineLinkFocusClasses}`}
          >
            {t("didRank_emptyMarketCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
