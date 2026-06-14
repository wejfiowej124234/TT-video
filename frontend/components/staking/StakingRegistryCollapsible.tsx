"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

import type { StakingPanelVariant } from "./StakingContractPanel";
import { StakingRegistryEligibilityBadge } from "./StakingRegistryEligibilityBadge";
import { StakingRegistryPanel } from "./StakingRegistryPanel";

/** 向导 scope：Registry 收进「高级」折叠区，主流程聚焦身份池。 */
export function StakingRegistryCollapsible({
  panelVariant = "warm",
}: {
  panelVariant?: StakingPanelVariant;
}) {
  const { t } = useTranslation();
  const summaryId = useId();

  return (
    <details className={TT_STAKING_PAGE_L5.registryDetails} data-tt-staking-registry-collapsible="1">
      <summary id={summaryId} className={TT_STAKING_PAGE_L5.registrySummary}>
        {t("staking_registry_collapsible_summary")}
        <StakingRegistryEligibilityBadge />
      </summary>
      <div className="mt-4 space-y-3">
        <StakingRegistryPanel panelVariant={panelVariant} />
        <p className={TT_STAKING_PAGE_L5.metaProse} role="note">
          {t("staking_registry_ineligible_hint")}
        </p>
      </div>
    </details>
  );
}
