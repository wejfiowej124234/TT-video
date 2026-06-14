"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { getTargetChain } from "@/lib/chainEnv";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export function StakingWrongChainNote({
  currentChainId,
  expectedChainId,
}: {
  currentChainId: number;
  expectedChainId: number;
}) {
  const { t } = useTranslation();
  const expectedName = getTargetChain().name;

  return (
    <div
      className={TT_STAKING_PAGE_L5.calloutWarn}
      role="alert"
      data-tt-staking-wrong-chain="1"
    >
      <p className="text-body text-amber-100">{t("staking_wrong_chain_title")}</p>
      <p className="mt-2 text-meta text-slate-300/95">
        {t("staking_wrong_chain_body", {
          current: String(currentChainId),
          expected: String(expectedChainId),
          expectedName,
        })}
      </p>
    </div>
  );
}
