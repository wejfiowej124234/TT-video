"use client";

import { useTranslation } from "@/components/LocaleProvider";

type Props = {
  className?: string;
};

/**
 * 治理执行前只读提示：Timelock 路径、**`data_source: chain_read`** 口径说明、模拟/只读边界。
 * **无**链写入、**无**假交易、**无**本地 mock 状态（纯文案 + 固定术语展示）。
 */
export default function GovernancePreExecutionHint({ className }: Props) {
  const { t } = useTranslation();
  const root = className?.trim() ? className : "";

  return (
    <aside
      className={`rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-400/25 dark:bg-amber-950/20 ${root}`}
      aria-label={t("governance_pre_exec_hint_aria")}
    >
      <p className="text-small font-semibold text-ink-900 dark:text-ink-50">
        {t("governance_pre_exec_timelock_lead")}
      </p>
      <p className="mt-2 text-body text-ink-800 dark:text-ink-100">{t("governance_pre_exec_timelock_detail")}</p>
      <p className="mt-4 text-small font-semibold text-ink-900 dark:text-ink-50">
        {t("governance_pre_exec_phases_heading")}
      </p>
      <p className="mt-2 text-body text-ink-800 dark:text-ink-100">{t("governance_pre_exec_phases_detail")}</p>
      <p className="mt-4 text-small font-medium text-ink-800 dark:text-ink-100">
        {t("governance_pre_exec_data_source_heading")}
      </p>
      <p className="mt-1 font-mono text-meta text-ink-900 dark:text-ink-100" translate="no">
        data_source: chain_read
      </p>
      <p className="mt-2 text-meta text-ink-700 dark:text-ink-200">{t("governance_pre_exec_data_source_explain")}</p>
      <p className="mt-4 text-body text-ink-800 dark:text-ink-100">{t("governance_pre_exec_simulation_explain")}</p>
      <p className="mt-2 text-meta text-ink-600 dark:text-ink-300">{t("governance_pre_exec_no_autotx")}</p>
    </aside>
  );
}
