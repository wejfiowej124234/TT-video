"use client";

import Link from "next/link";
import type { OrderListItem } from "@/lib/apiClient";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { FOCUS_RING } from "@/components/me/constants";
import {
  GUIDE_WORKBENCH_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_L5_FROZEN_MARKER,
  type GuideWorkbenchInboxNextOrder,
  type GuideWorkbenchInboxSnapshot,
} from "@/lib/guide/guideWorkbenchInboxModel";
import { stashEscrowOrderPrefetchFromListItem } from "@/lib/orderEscrowPrefetch";
import { guideOrdersInProgressHref } from "@/lib/guide/guideOrderCorridorModel";
import type { GuideInboxEmptyGuidance } from "@/lib/guide/guideWorkbenchWorkspaceL5";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GuideWorkbenchInboxCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  inbox: GuideWorkbenchInboxSnapshot;
  ordersLoading: boolean;
  ordersError: string | null;
  onRetry: () => void;
  /** 列表项用于预填 Escrow（可选；无则仅链 order id） */
  nextOrderListItem?: OrderListItem | null;
  /** 是否展示「暂无待办」空态（老向导 0 待办时隐藏） */
  showInboxEmpty?: boolean;
  /** 空态主/次 CTA（质押门闸 · 信任准入 SSOT） */
  inboxEmptyGuidance: GuideInboxEmptyGuidance;
};

function InboxStat({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className={`${TT_WORKSPACE_L5.statTile} min-w-[7rem]`}>
      <p className={`${TT_WORKSPACE_L5.statValue} ${valueClass}`}>{value}</p>
      <p className={TT_WORKSPACE_L5.statLabel}>{label}</p>
    </div>
  );
}

function statusPillClass(statusKey: string): string {
  if (statusKey === "guide_workbench_status_pending_accept") {
    return "bg-ref-sun/15 text-ref-sun border-ref-sun/45";
  }
  if (statusKey === "guide_workbench_status_pending_confirm") {
    return "bg-warning/15 text-warning/95 border-warning/40";
  }
  return "bg-cyan-500/15 text-cyan-200 border-cyan-400/40";
}

function GuideWorkbenchNextOrderSummaryCard({
  t,
  nextOrder,
  enterHref,
  enterLabel,
  onEnterClick,
}: {
  t: GuideWorkbenchInboxCardProps["t"];
  nextOrder: GuideWorkbenchInboxNextOrder;
  enterHref: string;
  enterLabel: string;
  onEnterClick: () => void;
}) {
  const traveler =
    nextOrder.travelerLabel.trim() !== ""
      ? nextOrder.travelerLabel
      : t("guide_workbench_traveler_unknown");
  const amount =
    nextOrder.amountLine.trim() !== "" ? nextOrder.amountLine : t("ui_em_dash");
  const statusLabel = t(nextOrder.statusLabelKey);

  return (
    <div
      className={TT_WORKSPACE_L5.nextOrderCard}
      data-tt-guide-workbench-next-order="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <p className="text-meta text-slate-400">{t("guide_workbench_next_order_kicker")}</p>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-meta font-medium border ${statusPillClass(nextOrder.statusLabelKey)}`}
        >
          {statusLabel}
        </span>
      </div>

      <p className="text-body font-semibold text-slate-100">{traveler}</p>
      <p className="text-small text-slate-200 mt-1">{nextOrder.destinationLabel}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-meta">
        <div>
          <dt className="text-slate-500">{t("guide_workbench_next_order_travel_date")}</dt>
          <dd className="text-slate-200 font-mono tabular-nums mt-0.5">
            {nextOrder.travelDateLine?.trim() ? nextOrder.travelDateLine : t("ui_em_dash")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("guide_workbench_next_order_amount")}</dt>
          <dd className="text-ref-sun font-mono tabular-nums mt-0.5">{amount}</dd>
        </div>
      </dl>

      <Link
        href={enterHref}
        onClick={onEnterClick}
        className={`mt-4 inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-full border border-ref-sun/55 bg-ref-sun/20 px-5 py-2.5 text-small font-semibold text-ref-sun hover:bg-ref-sun/30 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
      >
        {enterLabel}
      </Link>
    </div>
  );
}

/** 向导工作台首屏：待接单 / 今日待处理 / 下一单摘要（① · L5） */
export default function GuideWorkbenchInboxCard({
  t,
  inbox,
  ordersLoading,
  ordersError,
  onRetry,
  nextOrderListItem,
  showInboxEmpty = true,
  inboxEmptyGuidance,
}: GuideWorkbenchInboxCardProps) {
  const { pendingAcceptCount, todayPendingCount, nextOrder } = inbox;
  const ordersListHref = guideOrdersInProgressHref();

  const enterHref = nextOrder?.id ? `/escrow/${encodeURIComponent(nextOrder.id)}` : ordersListHref;
  const enterLabel =
    nextOrder?.primaryAction === "accept"
      ? t("guide_workbench_enter_accept")
      : t("guide_workbench_enter_order");

  const stashPrefetch = () => {
    if (nextOrderListItem?.id) {
      stashEscrowOrderPrefetchFromListItem(nextOrderListItem);
    }
  };

  return (
    <section
      className={`${TT_WORKSPACE_L5.inboxSection} mb-1`}
      aria-label={t("guide_workbench_inbox_aria")}
      data-tt-guide-workbench-inbox="1"
      data-tt-guide-workbench-l5-closure={GUIDE_WORKBENCH_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GUIDE_WORKBENCH_L5_FROZEN_MARKER}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-small font-semibold text-slate-100">{t("guide_workbench_inbox_title")}</h2>
          <p className="text-meta text-slate-400 mt-0.5">{t("guide_workbench_inbox_subtitle")}</p>
        </div>
        {ordersLoading ? (
          <span className="text-meta text-slate-400" role="status">
            {t("guide_workbench_inbox_syncing")}
          </span>
        ) : null}
      </div>

      {ordersError ? (
        <div className="mb-4 space-y-2">
          <ApiErrorAlert message={ordersError} />
          <button
            type="button"
            onClick={onRetry}
            className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}
          >
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 mb-4">
        <InboxStat
          label={t("guide_workbench_pending_accept")}
          value={pendingAcceptCount}
          valueClass="text-[#fde9a8]"
        />
        <InboxStat
          label={t("guide_workbench_today_pending")}
          value={todayPendingCount}
          valueClass="text-ref-sun"
        />
      </div>

      {nextOrder ? (
        <GuideWorkbenchNextOrderSummaryCard
          t={t}
          nextOrder={nextOrder}
          enterHref={enterHref}
          enterLabel={enterLabel}
          onEnterClick={stashPrefetch}
        />
      ) : showInboxEmpty && !ordersLoading && !ordersError ? (
        <div
          className="mb-4 rounded-xl border border-dashed border-ref-sun/16 bg-ref-sun/[0.02] px-4 py-3"
          data-tt-guide-workbench-inbox-empty="1"
          data-tt-guide-workbench-inbox-empty-variant={inboxEmptyGuidance.variant}
        >
          <p className="text-meta text-slate-400 leading-relaxed">{t("guide_workbench_inbox_empty")}</p>
          {inboxEmptyGuidance.bodyKey ? (
            <p className="text-meta text-slate-500 mt-1.5 leading-relaxed">{t(inboxEmptyGuidance.bodyKey)}</p>
          ) : null}
        </div>
      ) : null}

      <Link href={ordersListHref} className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}>
        {t("guide_workbench_view_all_orders")}
      </Link>
    </section>
  );
}
