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

export default function ProviderRankBlock({ period, t }: { period: Period; t: TFunc }) {
  const titleId = useId();
  return (
    <section className={didRankMainPanelClass} aria-labelledby={titleId}>
      <div className={didRankMainPanelHeaderClass}>
        <h2 id={titleId} className={didRankMainPanelTitleClass}>
          {t("didRank_providerRank")}
        </h2>
        <p className={didRankMainPanelDescClass}>{t("didRank_providerRankDesc")}</p>
      </div>
      <div className="p-3 sm:p-4">
        <div
          className="rounded-[var(--radius-md)] border border-white/10 bg-slate-900/35 backdrop-blur-md py-12 px-4 text-center text-slate-300 ring-1 ring-white/5"
          role="status"
        >
          <p className="text-small">{t("didRank_emptyProvider")}</p>
          <Link
            href="/market/provider"
            onClick={() => trackDidRankEvent("did_rank_empty_market_cta", { list: "provider", period })}
            className={`mt-4 inline-flex ${touchTargetLink44Classes} font-medium text-small text-cyan-300 hover:text-cyan-100 motion-sub ${deepShellInlineLinkFocusClasses}`}
          >
            {t("didRank_emptyMarketCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
