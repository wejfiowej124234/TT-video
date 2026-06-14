"use client";

import Link from "next/link";

import { FOCUS_RING } from "@/components/me/constants";
import {
  GUIDE_IDENTITY_MIN_STAKE_REFERENCE,
  GUIDE_IDENTITY_STAKING_HREF,
  resolveGuideIdentityStakingTier,
} from "@/lib/guide/guideIdentityStakingNav";
import { useGuideIdentityMinStake } from "@/lib/staking/useGuideIdentityMinStake";
import { useGuideOnChainStakeAmount } from "@/lib/staking/useGuideOnChainStakeAmount";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchStakingStatusVariant = "below_min" | "satisfied";

export type GuideWorkbenchStakingStatusCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  variant: GuideWorkbenchStakingStatusVariant;
  apiStakeAmount: string | null;
  minStakeAmount?: string | number | null;
};

function resolveMinDisplay(
  minStakeAmount: string | number | null | undefined,
  t: GuideWorkbenchStakingStatusCardProps["t"],
): string {
  if (minStakeAmount != null && String(minStakeAmount).trim() !== "") {
    return String(minStakeAmount).trim();
  }
  return GUIDE_IDENTITY_MIN_STAKE_REFERENCE;
}

function resolveApiDisplay(
  apiStakeAmount: string | null,
  t: GuideWorkbenchStakingStatusCardProps["t"],
): string {
  return apiStakeAmount != null && apiStakeAmount.trim() !== ""
    ? apiStakeAmount.trim()
    : t("ui_em_dash");
}

/** 工作台顶区 · 身份押金单卡（合并不足额警告 + 链上摘要 · ① L5） */
export default function GuideWorkbenchStakingStatusCard({
  t,
  variant,
  apiStakeAmount,
  minStakeAmount,
}: GuideWorkbenchStakingStatusCardProps) {
  const min = resolveMinDisplay(minStakeAmount, t);
  const api = resolveApiDisplay(apiStakeAmount, t);
  const shortfall = Math.max(0, Number.parseFloat(min) - Number.parseFloat(api)).toString();

  const { minStakeFormatted, loading: minLoading } = useGuideIdentityMinStake();
  const { amount: chainAmount, loading: chainLoading, chainReady } = useGuideOnChainStakeAmount();

  if (variant === "satisfied") {
    return (
      <div
        className="mb-4 rounded-[var(--radius-md)] border border-ref-sun/20 bg-ref-sun/[0.06] px-4 py-3"
        data-tt-guide-workbench-staking-status="satisfied"
      >
        <p className="text-meta text-slate-300">
          {t("guide_workbench_staking_manage_summary_with_min", { amount: api, min })}
        </p>
        <p className="mt-2">
          <Link
            href={GUIDE_IDENTITY_STAKING_HREF}
            className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
            data-tt-guide-workbench-staking-manage-cta="1"
          >
            {t("guide_workbench_staking_manage_cta")}
          </Link>
        </p>
      </div>
    );
  }

  const showChain = variant === "below_min" && (chainLoading || minLoading || chainReady);
  const chainDisplay =
    chainReady && chainAmount != null ? chainAmount : chainLoading || minLoading ? "…" : null;
  const chainBelowMin =
    chainDisplay != null &&
    chainDisplay !== "…" &&
    resolveGuideIdentityStakingTier(chainDisplay, minStakeFormatted ?? min) === "below_min";
  const apiMismatch =
    chainDisplay != null &&
    chainDisplay !== "…" &&
    Number.isFinite(Number.parseFloat(api)) &&
    Number.isFinite(Number.parseFloat(chainDisplay)) &&
    Number.parseFloat(api) !== Number.parseFloat(chainDisplay);

  return (
    <div
      role="alert"
      className="mb-4 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-4 py-3"
      data-tt-guide-workbench-staking-status="below_min"
    >
      <p className="text-body font-semibold text-amber-100">
        {t("guide_staking_status_below_min_title")}
      </p>
      <dl className="mt-2 space-y-1 text-meta">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-slate-400">{t("guide_staking_status_api_label")}</dt>
          <dd className="font-medium text-slate-100">
            {t("guide_staking_status_amount_usdc", { amount: api })}
          </dd>
        </div>
        {showChain && chainDisplay != null ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-slate-400">{t("guide_staking_status_chain_label")}</dt>
            <dd className="font-medium text-slate-100">
              {chainDisplay === "…"
                ? t("guide_staking_chain_loading")
                : t("guide_staking_status_amount_usdc", { amount: chainDisplay })}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-2 text-meta text-slate-300">
        {t("guide_staking_status_shortfall_body", { min, shortfall })}
      </p>
      {apiMismatch ? (
        <p className="mt-1 text-meta text-amber-200/85">{t("guide_staking_status_mismatch_hint")}</p>
      ) : null}
      {chainBelowMin ? (
        <p className="mt-1 text-meta text-amber-200/80">{t("guide_staking_status_chain_below_min")}</p>
      ) : null}
      <div className="mt-3">
        <Link
          href={GUIDE_IDENTITY_STAKING_HREF}
          className={`${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] border-warning/50 bg-warning/20 text-amber-100 hover:bg-warning/30 hover:border-warning/60 ${FOCUS_RING}`}
          data-tt-guide-staking-top-up-cta="1"
        >
          {t("guide_staking_below_min_cta")}
        </Link>
      </div>
    </div>
  );
}
