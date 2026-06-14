"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { FOCUS_RING } from "@/components/me/constants";
import {
  PROVIDER_WORKBENCH_L5_PROBE,
  type ProviderWorkbenchInboxSnapshot,
  type ProviderWorkbenchNextOrder,
} from "@/lib/provider/providerWorkbenchInboxModel";
import { stashEscrowOrderPrefetchFromListItem } from "@/lib/orderEscrowPrefetch";
import type { OrderListItem } from "@/lib/apiClient";
import { merchantOrdersInProgressHref } from "@/lib/provider/merchantOrderCorridorModel";
import type { MerchantInboxEmptyGuidance } from "@/lib/provider/providerWorkbenchWorkspaceL5";
import { workspaceEscrowHref } from "@/lib/workspace/workspaceOrderBus";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type ProviderWorkbenchInboxCardProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  inbox: ProviderWorkbenchInboxSnapshot;
  ordersLoading: boolean;
  ordersError: string | null;
  onRetry: () => void;
  nextOrderListItem?: OrderListItem | null;
  showInboxEmpty?: boolean;
  inboxEmptyGuidance: MerchantInboxEmptyGuidance;
};

function InboxStat({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className={`${TT_WORKSPACE_L5.statTile} min-w-[7rem]`}>
      <p className={`${TT_WORKSPACE_L5.statValue} ${accentClass}`}>{value}</p>
      <p className={TT_WORKSPACE_L5.statLabel}>{label}</p>
    </div>
  );
}

function ProviderNextOrderSummaryCard({
  t,
  nextOrder,
  enterHref,
  onEnterClick,
}: {
  t: ProviderWorkbenchInboxCardProps["t"];
  nextOrder: ProviderWorkbenchNextOrder;
  enterHref: string;
  onEnterClick: () => void;
}) {
  const buyer =
    nextOrder.buyerLabel.trim() !== "" ? nextOrder.buyerLabel : t("provider_workbench_buyer_unknown");
  const amount =
    nextOrder.amountLine.trim() !== "" ? nextOrder.amountLine : t("ui_em_dash");

  return (
    <div
      className={TT_WORKSPACE_L5.nextOrderCard}
      data-tt-provider-workbench-next-order="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <p className="text-meta text-slate-400">{t("provider_workbench_next_order_kicker")}</p>
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-meta font-medium border bg-ref-sun/15 text-ref-sun border-ref-sun/40">
          {t(nextOrder.statusLabelKey)}
        </span>
      </div>
      <p className="text-body font-semibold text-slate-100">{buyer}</p>
      <p className="text-small text-slate-200 mt-1">{nextOrder.destinationLabel}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-meta">
        <div>
          <dt className="text-slate-500">{t("provider_workbench_next_order_date")}</dt>
          <dd className="text-slate-200 font-mono tabular-nums mt-0.5">
            {nextOrder.travelDateLine?.trim() ? nextOrder.travelDateLine : t("ui_em_dash")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("provider_workbench_next_order_amount")}</dt>
          <dd className="text-ref-sun font-mono tabular-nums mt-0.5">{amount}</dd>
        </div>
      </dl>
      <Link
        href={enterHref}
        onClick={onEnterClick}
        className={`mt-4 inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-full border border-ref-sun/55 bg-ref-sun/20 px-5 py-2.5 text-small font-semibold text-ref-sun hover:bg-ref-sun/30 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
      >
        {t("provider_workbench_enter_order")}
      </Link>
    </div>
  );
}

/** 商家工作台收件箱（① · Sprint v1） */
export default function ProviderWorkbenchInboxCard({
  t,
  inbox,
  ordersLoading,
  ordersError,
  onRetry,
  nextOrderListItem,
  showInboxEmpty = true,
  inboxEmptyGuidance,
}: ProviderWorkbenchInboxCardProps) {
  const { pendingFulfillmentCount, inProgressCount, nextOrder } = inbox;
  const ordersListHref = merchantOrdersInProgressHref();

  const enterHref = nextOrder?.id ? workspaceEscrowHref(nextOrder.id) : ordersListHref;

  const stashPrefetch = () => {
    if (nextOrderListItem?.id) {
      stashEscrowOrderPrefetchFromListItem(nextOrderListItem);
    }
  };

  return (
    <section
      className={`${TT_WORKSPACE_L5.inboxSection} mb-1`}
      aria-label={t("provider_workbench_inbox_aria")}
      data-tt-provider-workbench-inbox="1"
      data-tt-provider-workbench-l5={PROVIDER_WORKBENCH_L5_PROBE}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-small font-semibold text-slate-100">{t("provider_workbench_inbox_title")}</h2>
          <p className="text-meta text-slate-400 mt-0.5">{t("provider_workbench_inbox_subtitle")}</p>
        </div>
        {ordersLoading ? (
          <span className="text-meta text-slate-400" role="status">
            {t("provider_workbench_inbox_syncing")}
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
          label={t("provider_workbench_pending_fulfillment")}
          value={pendingFulfillmentCount}
          accentClass="text-ref-sun"
        />
        <InboxStat
          label={t("provider_workbench_in_progress")}
          value={inProgressCount}
          accentClass="text-ref-sun"
        />
      </div>

      {nextOrder ? (
        <ProviderNextOrderSummaryCard
          t={t}
          nextOrder={nextOrder}
          enterHref={enterHref}
          onEnterClick={stashPrefetch}
        />
      ) : showInboxEmpty && !ordersLoading && !ordersError ? (
        <div
          className="mb-4 rounded-xl border border-dashed border-ref-sun/16 bg-ref-sun/[0.02] px-4 py-3"
          data-tt-provider-workbench-inbox-empty="1"
          data-tt-provider-workbench-inbox-empty-variant={inboxEmptyGuidance.variant}
        >
          <p className="text-meta text-slate-400 leading-relaxed">{t("provider_workbench_inbox_empty")}</p>
          {inboxEmptyGuidance.bodyKey ? (
            <p className="text-meta text-slate-500 mt-1.5 leading-relaxed">{t(inboxEmptyGuidance.bodyKey)}</p>
          ) : null}
        </div>
      ) : null}

      <Link href={ordersListHref} className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}>
        {t("provider_workbench_view_all_orders")}
      </Link>
    </section>
  );
}
