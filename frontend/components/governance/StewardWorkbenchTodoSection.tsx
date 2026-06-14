"use client";

import Link from "next/link";
import { FOCUS_RING } from "@/components/me/constants";
import { STEWARD_B_TRACK_ADMISSION_ANCHOR } from "@/lib/steward/stewardBTrackModel";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";
import {
  formatStewardTodoBadgeValue,
  type StewardWorkbenchTodoCounts,
} from "@/lib/governance/stewardWorkbenchTodoModel";
import { GOVERNANCE_PROPOSAL_CREATE_FROM_STEWARD_HREF } from "@/lib/governance/governanceProposalsNavModel";

type TodoItem = {
  href: string;
  titleKey: string;
  descKey: string;
  countKey: keyof StewardWorkbenchTodoCounts;
  dataAttr: string;
};

const TODO_ITEMS: TodoItem[] = [
  {
    href: "/governance/proposals?from=steward_workbench",
    titleKey: "steward_workbench_todo_proposals",
    descKey: "steward_workbench_todo_proposals_desc",
    countKey: "proposals",
    dataAttr: "data-tt-steward-todo-proposals",
  },
  {
    href: "/governance/delegate?from=steward_workbench",
    titleKey: "steward_workbench_todo_delegate",
    descKey: "steward_workbench_todo_delegate_desc",
    countKey: "delegate",
    dataAttr: "data-tt-steward-todo-delegate",
  },
  {
    href: "/governance/distribution-claim?from=steward_workbench",
    titleKey: "steward_workbench_todo_claim",
    descKey: "steward_workbench_todo_claim_desc",
    countKey: "claim",
    dataAttr: "data-tt-steward-todo-claim",
  },
];

export type StewardWorkbenchTodoSectionProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  counts?: StewardWorkbenchTodoCounts | null;
  countsLoading?: boolean;
  dataSource?: string | null;
  /** 双轨门闸未满足时弱化待办，引导先完成 B/A */
  locked?: boolean;
  /** 准入区已在上方同页展示时，待办锁定区不再重复 B/A 跳转按钮 */
  lockedCompact?: boolean;
};

/** 主理人工作台 · 治理待办（① · 无 escrow inbox） */
export default function StewardWorkbenchTodoSection({
  t,
  counts = null,
  countsLoading = false,
  dataSource = null,
  locked = false,
  lockedCompact = false,
}: StewardWorkbenchTodoSectionProps) {
  return (
    <section
      className={`${TT_WORKSPACE_L5.inboxSection} mb-1 ${locked ? "relative" : ""}`}
      aria-label={t("steward_workbench_todo_aria")}
      data-tt-steward-workbench-todo="1"
      data-tt-steward-workbench-todo-locked={locked ? "1" : "0"}
    >
      {locked ? (
        <div
          className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3"
          role="note"
          data-tt-steward-workbench-todo-lock-notice="1"
        >
          <p className="text-meta font-semibold text-amber-100">{t("steward_workbench_todo_locked_title")}</p>
          <p className="mt-1 text-meta leading-relaxed text-slate-400">{t("steward_workbench_todo_locked_body")}</p>
          {!lockedCompact ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`#${STEWARD_B_TRACK_ADMISSION_ANCHOR}`}
                className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
              >
                {t("steward_workbench_staking_gate_cta_b_track")}
              </Link>
              <Link
                href={`#${STEWARD_WORKBENCH_STAKE_ANCHOR}`}
                className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
              >
                {t("steward_workbench_staking_gate_cta_stake_section")}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={locked ? "pointer-events-none select-none opacity-45" : undefined}>
      <div className="mb-4">
        <h2 className="text-small font-semibold text-slate-100">{t("steward_workbench_todo_title")}</h2>
        <p className="text-meta text-slate-400 mt-0.5">{t("steward_workbench_todo_subtitle")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {TODO_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${TT_WORKSPACE_L5.nextOrderCard} block motion-sub motion-reduce:transition-none hover:border-ref-sun/45 ${FOCUS_RING}`}
            {...{ [item.dataAttr]: "1" }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-body font-semibold text-slate-100">{t(item.titleKey)}</p>
              <span
                className="shrink-0 rounded-full border border-ref-sun/25 bg-ref-sun/10 px-2 py-0.5 text-meta font-mono text-ref-sun/90 tabular-nums"
                data-tt-steward-todo-badge="1"
                data-tt-steward-todo-badge-kind={item.countKey}
                aria-label={t(`steward_workbench_todo_badge_aria_${item.countKey}`)}
              >
                {formatStewardTodoBadgeValue(counts?.[item.countKey], countsLoading)}
              </span>
            </div>
            <p className="text-meta text-slate-400 mt-1.5">{t(item.descKey)}</p>
          </Link>
        ))}
      </div>
      {!locked ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={GOVERNANCE_PROPOSAL_CREATE_FROM_STEWARD_HREF}
            className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING} font-semibold text-ref-sun/90`}
            data-tt-steward-todo-create-proposal="1"
          >
            {t("steward_workbench_todo_create_proposal")}
          </Link>
        </div>
      ) : null}
      <p
        className="mt-3 rounded-xl border border-dashed border-ref-sun/16 bg-ref-sun/[0.02] px-4 py-2.5 text-meta text-slate-500 leading-relaxed"
        data-tt-steward-todo-data-source-note="1"
      >
        {countsLoading
          ? t("steward_workbench_todo_counts_loading")
          : t("steward_workbench_todo_counts_note", {
              source: dataSource?.trim() || t("steward_workbench_todo_counts_source_local"),
            })}
      </p>
      </div>
    </section>
  );
}
