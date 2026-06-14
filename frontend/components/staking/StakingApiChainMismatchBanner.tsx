"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { useGuideApiStakeAmount } from "@/lib/staking/useGuideApiStakeAmount";
import { useGuideOnChainStakeAmount } from "@/lib/staking/useGuideOnChainStakeAmount";
import { guideStakeAmountsMismatch } from "@/lib/staking/compareGuideStakeAmounts";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

/** 已连钱包且 API 与链上质押额不一致时展示（① 诚实性 · ② STK-P2-004 前预警） */
export function StakingApiChainMismatchBanner({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const { amount: apiAmount, loading: apiLoading } = useGuideApiStakeAmount(enabled);
  const { amount: chainAmount, loading: chainLoading, chainReady } = useGuideOnChainStakeAmount();

  if (!enabled || !chainReady || apiLoading || chainLoading) return null;
  if (!guideStakeAmountsMismatch(apiAmount, chainAmount)) return null;

  return (
    <div
      className={TT_STAKING_PAGE_L5.calloutWarn}
      role="alert"
      data-tt-staking-api-chain-mismatch="1"
    >
      <p className="text-body font-medium text-amber-100">{t("staking_api_chain_mismatch_title")}</p>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-meta">
        <div>
          <dt className="inline text-slate-400">{t("staking_api_chain_mismatch_api_label")}</dt>
          <dd className="inline font-medium text-slate-100">
            {t("staking_api_chain_mismatch_amount_line", { amount: apiAmount ?? "—" })}
          </dd>
        </div>
        <div>
          <dt className="inline text-slate-400">{t("staking_api_chain_mismatch_chain_label")}</dt>
          <dd className="inline font-medium text-slate-100">
            {t("staking_api_chain_mismatch_amount_line", { amount: chainAmount ?? "—" })}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-meta text-slate-300/95">{t("staking_api_chain_mismatch_hint")}</p>
    </div>
  );
}
