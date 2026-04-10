"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  deriveExecutionActionSurface,
  type GovernanceExecutionReadiness,
} from "@/lib/governanceExecutionReadiness";
import { GovExecReadOnlyI18n } from "@/lib/governanceExecReadOnlyNarrative";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export const GOV_EXEC_ACTIONS_HEADING_ID = "gov-exec-actions-heading";

type Props = {
  className?: string;
  readiness: GovernanceExecutionReadiness;
};

/**
 * Timelock queue/execute 入口占位：不连接钱包、不组装交易；可点击时仅本页提示，无链上副作用。
 */
export default function GovernanceProposalExecutionActionsSkeleton({ className, readiness }: Props) {
  const { t } = useTranslation();
  const [placeholderAck, setPlaceholderAck] = useState(false);
  const surface = useMemo(() => deriveExecutionActionSurface(readiness), [readiness]);
  const root = className?.trim() ? className : "";

  const baseBtn = `min-h-[44px] rounded-[var(--radius-sm)] border px-4 py-2 text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`;
  const onStyle =
    "border-travel-500 bg-travel-500/10 text-travel-950 hover:bg-travel-500/15 dark:border-travel-400/40 dark:bg-travel-950/35 dark:text-travel-50";
  const offStyle =
    "cursor-not-allowed border-ink-300 bg-ink-100/50 text-ink-500 opacity-60 dark:border-ink-600/50 dark:bg-ink-900/35 dark:text-ink-400";

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-ink-200/80 bg-white/90 p-4 dark:border-ink-600/45 dark:bg-ink-950/25 ${root}`}
      aria-labelledby={GOV_EXEC_ACTIONS_HEADING_ID}
    >
      <h3 id={GOV_EXEC_ACTIONS_HEADING_ID} className="text-small font-semibold text-ink-900 dark:text-ink-50">
        {t("governance_exec_actions_section_heading")}
      </h3>
      <p className="mt-1 text-meta text-ink-600 dark:text-ink-300">{t("governance_exec_actions_section_lead")}</p>
      <aside
        className="mt-3 rounded-[var(--radius-sm)] border border-rose-400/35 bg-rose-500/[0.06] p-3 dark:border-rose-500/25 dark:bg-rose-950/25"
        aria-label={t("governance_exec_actions_limits_aria")}
      >
        <p className="text-small font-semibold text-ink-900 dark:text-ink-50">
          {t("governance_exec_actions_limits_heading")}
        </p>
        <p className="mt-1 text-meta leading-snug text-ink-800 dark:text-ink-200">
          {t(GovExecReadOnlyI18n.sharedLimitsSkeleton)}
        </p>
        {readiness.kind === "executable" ? (
          <p className="mt-2 text-meta leading-snug text-ink-800 dark:text-ink-200">
            {t(GovExecReadOnlyI18n.sharedQueuedExplanation)}
          </p>
        ) : null}
      </aside>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!surface.queueEnabled}
          title={surface.queueEnabled ? t("governance_exec_action_queue_enabled_hint") : t("governance_exec_action_queue_disabled_hint")}
          className={`${baseBtn} ${surface.queueEnabled ? onStyle : offStyle}`}
          onClick={() => {
            if (!surface.queueEnabled) return;
            setPlaceholderAck(true);
          }}
        >
          {t("governance_exec_action_queue_label")}
        </button>
        <button
          type="button"
          disabled={!surface.executeEnabled}
          title={
            surface.executeEnabled ? t("governance_exec_action_execute_enabled_hint") : t("governance_exec_action_execute_disabled_hint")
          }
          className={`${baseBtn} ${surface.executeEnabled ? onStyle : offStyle}`}
          onClick={() => {
            if (!surface.executeEnabled) return;
            setPlaceholderAck(true);
          }}
        >
          {t("governance_exec_action_execute_label")}
        </button>
      </div>
      {placeholderAck ? (
        <p className="mt-2 text-meta text-ink-600 dark:text-ink-300" role="status" aria-live="polite">
          {t("governance_exec_action_placeholder_ack")}
        </p>
      ) : null}
    </section>
  );
}
