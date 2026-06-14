"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

import { useSuppressStakingConnectHint } from "./StakingWalletGateContext";

/** 未连钱包时子面板禁用态（页顶已有 CTA 则不再重复长文案） */
export function StakingPanelDisconnectedState({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const suppressHint = useSuppressStakingConnectHint() || compact;

  if (suppressHint) {
    return (
      <p
        className={`${TT_STAKING_PAGE_L5.metaProse} ${compact ? "" : "opacity-60"}`}
        role="status"
        data-tt-staking-panel-wallet-gated="1"
      >
        {compact ? t("staking_panel_wallet_gated_workbench") : t("staking_panel_wallet_gated_compact")}
      </p>
    );
  }

  return <p className={TT_STAKING_PAGE_L5.metaProse}>{t("staking_connect_see_above")}</p>;
}
