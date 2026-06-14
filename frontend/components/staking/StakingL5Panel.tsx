"use client";

import type { ReactNode } from "react";

import { StakingContractAddressRow } from "@/components/staking/StakingContractAddressRow";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export type StakingL5PanelProps = {
  title: string;
  titleId: string;
  subtitle?: string;
  address?: string | null;
  variant?: "warm" | "legacy";
  children: ReactNode;
  footer?: ReactNode;
};

/** 质押子面板 L5 壳（体验深壳 · 与首页 `/guide` 工作台同族） */
export function StakingL5Panel({
  title,
  titleId,
  subtitle,
  address,
  variant = "warm",
  children,
  footer,
}: StakingL5PanelProps) {
  const { t } = useTranslation();
  const shell = variant === "warm" ? TT_STAKING_PAGE_L5.panelCard : TT_STAKING_PAGE_L5.legacyPanel;

  return (
    <section className={shell} aria-labelledby={titleId}>
      <h2 id={titleId} className={TT_STAKING_PAGE_L5.panelTitle}>
        {title}
      </h2>
      {subtitle ? <p className={TT_STAKING_PAGE_L5.panelSubtitle}>{subtitle}</p> : null}
      {address ? (
        <dl className="mt-2">
          <StakingContractAddressRow label={t("staking_contract_poolAddress")} address={address} />
        </dl>
      ) : null}
      <div className="mt-4">{children}</div>
      {footer ? <div className={TT_STAKING_PAGE_L5.divider}>{footer}</div> : null}
    </section>
  );
}
