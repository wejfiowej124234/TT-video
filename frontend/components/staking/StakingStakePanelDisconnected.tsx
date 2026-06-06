"use client";

import type { LocaleTranslateFn } from "@/lib/i18n";

export function StakingStakePanelDisconnected({
  t,
  stakeTitleKey,
  titleId,
}: {
  t: LocaleTranslateFn;
  stakeTitleKey: string;
  titleId: string;
}) {
  return (
    <section
      className="mt-8 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body-l font-semibold text-ink-900">
        {t(stakeTitleKey)}
      </h2>
      <p className="mt-2 text-body text-ink-600">{t("staking_stake_connect")}</p>
    </section>
  );
}
