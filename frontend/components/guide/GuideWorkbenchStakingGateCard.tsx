"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import { GuideWorkbenchTrustAdmissionLink } from "@/components/guide/GuideWorkbenchTrustAdmissionLink";
import {
  GUIDE_IDENTITY_MIN_STAKE_REFERENCE,
  GUIDE_IDENTITY_STAKING_HREF,
  resolveGuideIdentityStakingTier,
} from "@/lib/guide/guideIdentityStakingNav";
import type { GuideStakingGateMode } from "@/lib/guide/guideWorkbenchWorkspaceL5";
import { useGuideIdentityMinStake } from "@/lib/staking/useGuideIdentityMinStake";
import { useGuideOnChainStakeAmount } from "@/lib/staking/useGuideOnChainStakeAmount";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchStakingGateCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  mode: GuideStakingGateMode;
  apiStakeAmount: string | null;
  minStakeAmount?: string | number | null;
};

function resolveMinDisplay(minStakeAmount: string | number | null | undefined): string {
  if (minStakeAmount != null && String(minStakeAmount).trim() !== "") {
    return String(minStakeAmount).trim();
  }
  return GUIDE_IDENTITY_MIN_STAKE_REFERENCE;
}

function resolveApiDisplay(apiStakeAmount: string | null, emDash: string): string {
  return apiStakeAmount != null && apiStakeAmount.trim() !== "" ? apiStakeAmount.trim() : emDash;
}

function resolveBelowMinOpsHintKey(apiMismatch: boolean, chainBelowMin: boolean): string | null {
  if (apiMismatch && chainBelowMin) return "guide_staking_status_ops_hint";
  if (apiMismatch) return "guide_staking_status_mismatch_hint";
  if (chainBelowMin) return "guide_staking_status_chain_below_min";
  return null;
}

/** 工作台顶区 · 身份质押门闸单卡（对齐商家工作台门闸排版 · ① L5） */
export default function GuideWorkbenchStakingGateCard({
  t,
  mode,
  apiStakeAmount,
  minStakeAmount,
}: GuideWorkbenchStakingGateCardProps) {
  const min = resolveMinDisplay(minStakeAmount);
  const api = resolveApiDisplay(apiStakeAmount, t("ui_em_dash"));
  const shortfall = Math.max(0, Number.parseFloat(min) - Number.parseFloat(api)).toString();

  const { minStakeFormatted, loading: minLoading } = useGuideIdentityMinStake();
  const { amount: chainAmount, loading: chainLoading, chainReady } = useGuideOnChainStakeAmount();

  if (mode === "satisfied") {
    return (
      <div
        className="mb-4 rounded-xl border border-ref-sun/20 bg-ref-sun/[0.06] px-4 py-3"
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

  const titleKey =
    mode === "need_stake" ? "guide_staking_banner_title" : "guide_staking_status_below_min_title";
  const bodyKey = mode === "need_stake" ? "guide_staking_banner_body" : "guide_staking_below_min_body";
  const primaryCtaKey =
    mode === "need_stake" ? "guide_staking_banner_cta" : "guide_staking_below_min_cta";

  const showChain = mode === "below_min" && (chainLoading || minLoading || chainReady);
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
  const belowMinOpsHintKey =
    mode === "below_min" ? resolveBelowMinOpsHintKey(apiMismatch, chainBelowMin) : null;

  return (
    <div
      className="mb-4 rounded-xl border border-ref-sun/28 bg-gradient-to-br from-ref-sun/[0.08] via-[#0c0a09]/40 to-[#0a0a0a]/80 px-4 py-4 sm:px-5"
      data-tt-guide-workbench-staking-gate="1"
      data-tt-guide-workbench-staking-gate-mode={mode}
      role={mode === "below_min" ? "alert" : "region"}
      aria-label={t("guide_staking_banner_aria")}
    >
      <p className="text-small font-semibold text-slate-100">{t(titleKey)}</p>
      <p className="text-meta text-slate-400 mt-1.5 leading-relaxed">
        {mode === "need_stake"
          ? t(bodyKey)
          : t(bodyKey, { amount: api, min, shortfall })}
      </p>

      {mode === "below_min" && showChain && chainDisplay != null ? (
        <p className="mt-2 text-meta text-slate-400">
          {chainDisplay === "…"
            ? t("guide_staking_chain_loading")
            : t("guide_staking_status_snapshot_line", { amount: api, chain: chainDisplay })}
        </p>
      ) : null}

      {belowMinOpsHintKey ? (
        <p className="mt-1.5 text-meta text-amber-200/85">
          {belowMinOpsHintKey === "guide_staking_status_ops_hint"
            ? t(belowMinOpsHintKey, { min })
            : t(belowMinOpsHintKey)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={GUIDE_IDENTITY_STAKING_HREF}
          className={`${TT_WORKSPACE_L5.primaryBtn} min-h-[44px] w-full justify-center ${FOCUS_RING}`}
          data-tt-guide-go-identity-staking="1"
        >
          {t(primaryCtaKey)}
        </Link>
        <GuideWorkbenchTrustAdmissionLink t={t} className="w-full justify-center" />
      </div>

      <p
        className="mt-3 text-meta text-slate-500 leading-relaxed border-t border-ref-sun/12 pt-3"
        data-tt-guide-workbench-market-exposure-collapsed="1"
      >
        {t("guide_workbench_market_exposure_locked_placeholder")}
      </p>
    </div>
  );
}
