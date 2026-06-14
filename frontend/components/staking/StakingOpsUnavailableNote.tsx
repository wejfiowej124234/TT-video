"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

/** 合约未部署时：质押/解押区占位一行（主告警已在 StakingContractPanel 展示） */
export function StakingOpsUnavailableNote({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <p
      className={`${TT_STAKING_PAGE_L5.calloutInfo} text-center`}
      role="note"
      data-tt-staking-ops-unavailable="1"
    >
      {t("staking_ops_unavailableCompact")}
    </p>
  );
}
