"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { GovExecReadOnlyI18n, isGovernorStateLabelQueued } from "@/lib/governanceExecReadOnlyNarrative";

export type GovernanceProposalExecStatusEntry =
  | {
      state: "ok";
      status: string;
      is_chain_ssot: boolean;
      /** 与 `GET …/proposal-status` 体一致；链上 SSOT 成功体通常无此字段 */
      data_source?: string;
      note?: string;
    }
  | { state: "error" };

/** 与 Governor `state()` 标签对齐；未知值走 unknown 文案 */
export function governanceProposalExecStatusI18nKey(status: string):
  | "governance_proposal_exec_status_pending"
  | "governance_proposal_exec_status_active"
  | "governance_proposal_exec_status_canceled"
  | "governance_proposal_exec_status_defeated"
  | "governance_proposal_exec_status_succeeded"
  | "governance_proposal_exec_status_queued"
  | "governance_proposal_exec_status_executed"
  | "governance_proposal_exec_status_unknown" {
  switch (status.trim().toLowerCase()) {
    case "pending":
      return "governance_proposal_exec_status_pending";
    case "active":
      return "governance_proposal_exec_status_active";
    case "canceled":
    case "cancelled":
      return "governance_proposal_exec_status_canceled";
    case "defeated":
      return "governance_proposal_exec_status_defeated";
    case "succeeded":
      return "governance_proposal_exec_status_succeeded";
    case "queued":
      return "governance_proposal_exec_status_queued";
    case "executed":
      return "governance_proposal_exec_status_executed";
    default:
      return "governance_proposal_exec_status_unknown";
  }
}

/** 主标签（药丸）按执行态区分色相，便于列表扫读 */
function execStatusPillClasses(status: string): string {
  const s = status.trim().toLowerCase();
  const base =
    "rounded-full border px-2 py-0.5 font-medium dark:border-opacity-50";
  switch (s) {
    case "pending":
      return `${base} border-ink-200 bg-ink-50 text-ink-800 dark:border-ink-600/50 dark:bg-ink-900/40 dark:text-ink-100`;
    case "active":
      return `${base} border-travel-500/45 bg-travel-500/10 text-travel-900 dark:border-travel-400/35 dark:bg-travel-950/35 dark:text-travel-100`;
    case "succeeded":
      return `${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-950/25 dark:text-emerald-100`;
    case "executed":
      return `${base} border-teal-500/40 bg-teal-500/10 text-teal-950 dark:border-teal-400/35 dark:bg-teal-950/25 dark:text-teal-100`;
    case "queued":
      return `${base} border-amber-500/40 bg-amber-500/10 text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/30 dark:text-amber-100`;
    case "defeated":
    case "canceled":
    case "cancelled":
      return `${base} border-rose-300/80 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/25 dark:text-rose-100`;
    default:
      return `${base} border-ink-200 bg-ink-50 text-ink-800 dark:border-ink-600/50 dark:bg-ink-900/40 dark:text-ink-100`;
  }
}

export type GovernanceProposalExecStatusBadgeProps = {
  className?: string;
  /** `proposal-status` 批量请求进行中：不占位，避免闪烁假状态 */
  loading?: boolean;
  /** 已完成至少一轮批量请求（用于区分「未请求」与「单条失败」） */
  fetchSettled?: boolean;
  entry?: GovernanceProposalExecStatusEntry;
};

/**
 * 列表行：链上执行态 + SSOT 标记（纯展示）。
 */
export default function GovernanceProposalExecStatusBadge({
  className,
  loading,
  fetchSettled,
  entry,
}: GovernanceProposalExecStatusBadgeProps) {
  const { t } = useTranslation();
  const root = className?.trim() ? className : "";

  if (loading) return null;

  if (entry?.state === "ok") {
    const labelKey = governanceProposalExecStatusI18nKey(entry.status);
    const pillClass = execStatusPillClasses(entry.status);
    const groupTitle =
      entry.note?.trim() ||
      (entry.is_chain_ssot
        ? t(GovExecReadOnlyI18n.sourceChainGroupAria)
        : entry.data_source
          ? `${t(GovExecReadOnlyI18n.sourceProjectionGroupAria)} data_source=${entry.data_source}`
          : t(GovExecReadOnlyI18n.sourceProjectionGroupAria));
    return (
      <div
        className={`shrink-0 text-meta text-ink-600 ${root}`}
        role="group"
        aria-label={groupTitle}
      >
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5">
            <span className={pillClass} translate="no">
              {t(labelKey)}
            </span>
            {entry.is_chain_ssot ? (
              <span
                className="rounded border border-emerald-500/35 bg-emerald-500/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-950/30 dark:text-emerald-100"
                translate="no"
              >
                {t(GovExecReadOnlyI18n.sourceSsotBadge)}
              </span>
            ) : (
              <>
                <span
                  className="rounded border border-violet-500/30 bg-violet-500/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-violet-950 dark:border-violet-400/25 dark:bg-violet-950/35 dark:text-violet-100"
                  translate="no"
                >
                  {t(GovExecReadOnlyI18n.sourceProjectionLabel)}
                </span>
                {entry.data_source ? (
                  <span
                    className="max-w-[11rem] truncate rounded border border-ink-200/90 bg-ink-50/90 px-1.5 py-0.5 font-mono text-[10px] text-ink-800 dark:border-ink-600/50 dark:bg-ink-900/50 dark:text-ink-100"
                    title={entry.note?.trim() || undefined}
                    translate="no"
                  >
                    {entry.data_source}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <p className="max-w-[16rem] text-right text-[11px] leading-snug text-ink-500 dark:text-ink-400">
            {t(GovExecReadOnlyI18n.readonlyCaption)}
          </p>
          {isGovernorStateLabelQueued(entry.status) ? (
            <p className="max-w-[18rem] text-right text-[10px] leading-snug text-ink-500 dark:text-ink-400">
              {t(GovExecReadOnlyI18n.sharedListQueuedHint)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (fetchSettled && (entry == null || entry.state === "error")) {
    return (
      <div className={`shrink-0 text-meta text-ink-500 ${root}`}>
        <span>{t("governance_proposals_status_error")}</span>
      </div>
    );
  }

  return null;
}
