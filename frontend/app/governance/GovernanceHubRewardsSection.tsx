"use client";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  governanceHubSectionTokens,
  type GovernanceHubSectionVariant,
} from "@/lib/governance/governanceHubSectionTokens";
import { governanceRewardListItemLine, type RewardsRes } from "./governanceHubPageModel";

type Props = {
  rewards: RewardsRes | null;
  rewardsHttpError: string | null;
  variant?: GovernanceHubSectionVariant;
  showTitle?: boolean;
};

export function GovernanceHubRewardsSection({
  rewards,
  rewardsHttpError,
  variant = "hub",
  showTitle = true,
}: Props) {
  const { t } = useTranslation();
  const tok = governanceHubSectionTokens(variant);

  return (
    <div>
      {showTitle ? <h2 className={tok.title}>{t("governance_rewards_label")}</h2> : null}
      {rewardsHttpError ? (
        <div className="mt-1">
          <ApiErrorAlert message={rewardsHttpError} />
        </div>
      ) : rewards?.items && rewards.items.length > 0 ? (
        <ul className={tok.list}>
          {(rewards.items as unknown[]).map((item, i) => {
            const o = item && typeof item === "object" ? (item as { id?: string }) : null;
            return <li key={o?.id ?? i}>{governanceRewardListItemLine(item, t)}</li>;
          })}
        </ul>
      ) : rewards?.data_source === "placeholder" ? (
        <p className={`${showTitle ? "mt-1" : ""} ${tok.metaMuted}`}>{t("governance_rewards_placeholder")}</p>
      ) : (
        <p className={`${showTitle ? "mt-1" : ""} ${tok.metaMuted}`}>{t("governance_rewards_empty")}</p>
      )}
    </div>
  );
}
