"use client";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { governanceRewardListItemLine, type RewardsRes } from "./governanceHubPageModel";

type Props = {
  rewards: RewardsRes | null;
  rewardsHttpError: string | null;
};

export function GovernanceHubRewardsSection({ rewards, rewardsHttpError }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-h4 font-medium text-ink-800">{t("governance_rewards_label")}</h2>
      {rewardsHttpError ? (
        <div className="mt-1">
          <ApiErrorAlert message={rewardsHttpError} />
        </div>
      ) : rewards?.items && rewards.items.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-body text-ink-700">
          {(rewards.items as unknown[]).map((item, i) => {
            const o = item && typeof item === "object" ? (item as { id?: string }) : null;
            return <li key={o?.id ?? i}>{governanceRewardListItemLine(item, t)}</li>;
          })}
        </ul>
      ) : rewards?.data_source === "placeholder" ? (
        <p className="mt-1 text-body text-ink-500">{t("governance_rewards_placeholder")}</p>
      ) : (
        <p className="mt-1 text-body text-ink-500">{t("governance_rewards_empty")}</p>
      )}
    </div>
  );
}
