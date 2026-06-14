"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { MeTrustSummary } from "@/lib/meTrust";
import { formatKycStatusLabelCompact } from "@/lib/meTrust";
import { resolveGuideWorkbenchTrustCta } from "@/lib/guide/guideWorkbenchTrustCta";
import { FOCUS_RING } from "@/components/me/constants";
import {
  GUIDE_WORKBENCH_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_L5_FROZEN_MARKER,
} from "@/lib/guide/guideWorkbenchInboxModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchTrustSummaryCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  trust: MeTrustSummary;
};

function riskPillClass(risk: string): string {
  const s = risk.toLowerCase();
  if (s === "high") return "bg-danger/15 text-danger/95 border-danger/40";
  if (s === "medium") return "bg-warning/15 text-warning/95 border-warning/40";
  return "bg-success/15 text-success border-success/35";
}

function reputationDisplay(trust: MeTrustSummary, t: GuideWorkbenchTrustSummaryCardProps["t"]): string {
  const score = trust.reputation?.as_guide?.weighted_avg_score;
  if (score != null && typeof score === "number" && Number.isFinite(score)) {
    return score.toFixed(2);
  }
  return t("guide_workbench_trust_summary_reputation_empty");
}

function riskLabel(trust: MeTrustSummary, t: GuideWorkbenchTrustSummaryCardProps["t"]): string {
  if (!trust.risk_level) return t("guide_workbench_trust_risk_unknown");
  const key = `guide_workbench_trust_risk_${trust.risk_level.toLowerCase()}`;
  const label = t(key);
  return label !== key ? label : trust.risk_level;
}

function SummaryStat({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className={`${TT_WORKSPACE_L5.statTile} min-w-[5.5rem]`}>
      <p className={numeric ? TT_WORKSPACE_L5.statValueAccent : TT_WORKSPACE_L5.statValue}>{value}</p>
      <p className={TT_WORKSPACE_L5.statLabel}>{label}</p>
    </div>
  );
}

/** 向导工作台：KYC / 信誉 / 风险摘要 + 跳转身份 Hub（① · L5） */
export default function GuideWorkbenchTrustSummaryCard({ t, trust }: GuideWorkbenchTrustSummaryCardProps) {
  const kycLabel = formatKycStatusLabelCompact(trust.kyc_status, t);
  const repLabel = reputationDisplay(trust, t);
  const repNumeric = trust.reputation?.as_guide?.weighted_avg_score != null;
  const risk = riskLabel(trust, t);
  const hasRiskPill = Boolean(trust.risk_level);
  const trustCta = resolveGuideWorkbenchTrustCta(trust);

  return (
    <section
      className={`${TT_WORKSPACE_L5.sectionCard} mb-1`}
      aria-label={t("guide_workbench_trust_summary_aria")}
      data-tt-guide-workbench-trust-summary="1"
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_L5_FROZEN_MARKER}
    >
      <div className="mb-3">
        <h2 className={TT_WORKSPACE_L5.sectionTitle}>{t("guide_workbench_trust_summary_title")}</h2>
        <p className={TT_WORKSPACE_L5.sectionSubtitle}>{t("guide_workbench_trust_summary_subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
        <SummaryStat label={t("guide_workbench_trust_summary_kyc")} value={kycLabel} />
        <SummaryStat
          label={t("guide_workbench_trust_summary_reputation")}
          value={repLabel}
          numeric={repNumeric}
        />
        <SummaryStat
          label={t("guide_workbench_trust_summary_risk")}
          value={
            hasRiskPill ? (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-meta font-medium border ${riskPillClass(trust.risk_level!)}`}
              >
                {risk}
              </span>
            ) : (
              <span className="text-slate-300">{risk}</span>
            )
          }
        />
      </div>

      <Link href={trustCta.href} className={`${TT_WORKSPACE_L5.secondaryBtn} ${FOCUS_RING}`}>
        {t(trustCta.labelKey)}
      </Link>
    </section>
  );
}
