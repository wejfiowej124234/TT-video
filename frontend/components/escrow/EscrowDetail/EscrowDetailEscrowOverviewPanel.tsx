"use client";

import FinalityBadge from "../FinalityBadge";
import OnchainEventTimeline from "../OnchainEventTimeline";
import ChainSyncStatusPanel from "./ChainSyncStatusPanel";
import EscrowChainReadDegradedBanner from "./EscrowChainReadDegradedBanner";
import { normalizeChainSyncReadStatus, type OrderRow } from "./types";
import { orderStateToStep } from "../OrderFlowSteps";
import type { UseEscrowDetailResult } from "./escrowDetailHookModel";

export interface EscrowDetailEscrowOverviewPanelProps {
  order: OrderRow;
  data: Pick<
    UseEscrowDetailResult,
    | "amount"
    | "currency"
    | "hasEscrow"
    | "chainMismatch"
    | "chainContractReadDegraded"
    | "lastChainContractReadOkAt"
    | "chainSync"
    | "snapshotHash"
  >;
  panelClass: string;
  t: (key: string) => string;
}

export default function EscrowDetailEscrowOverviewPanel({
  order,
  data,
  panelClass,
  t,
}: EscrowDetailEscrowOverviewPanelProps) {
  return (
    <div className={`${panelClass} p-6 md:p-8 space-y-6`}>
      <div>
        <p className="text-small text-slate-300">{t("escrow_amountCurrency")}</p>
        <h2 className="text-h3 font-semibold tracking-tight font-mono text-cyan-300 drop-shadow-scifi-cyan-title">
          {data.amount} {data.currency}
        </h2>
      </div>
      <div>
        <p className="text-small text-slate-300">{t("escrow_participants")}</p>
        <ul className="text-small text-slate-300 space-y-1">
          <li>
            {t("escrow_tourist")}
            {order.tourist_id ? `${String(order.tourist_id).slice(0, 8)}…` : t("ui_em_dash")}
          </li>
          <li>
            {t("escrow_guide")}
            {order.guide_id && /[1-9a-fA-F]/.test(String(order.guide_id))
              ? `${String(order.guide_id).slice(0, 8)}…`
              : t("escrow_guideUnassigned")}
          </li>
          <li>
            {t("escrow_arbitrator")}
            {(order as OrderRow & { arbitrator_id?: string }).arbitrator_id
              ? `${String((order as OrderRow & { arbitrator_id?: string }).arbitrator_id).slice(0, 8)}…`
              : t("escrow_arbitratorUnassigned")}
          </li>
        </ul>
      </div>
      {data.hasEscrow && !data.chainMismatch && data.chainContractReadDegraded ? (
        <EscrowChainReadDegradedBanner lastChainContractReadOkAt={data.lastChainContractReadOkAt} t={t} />
      ) : null}
      <FinalityBadge
        finalityBlock={data.hasEscrow ? (order as OrderRow & { finality_block?: number | null }).finality_block : undefined}
        escrowBlockNumber={
          data.hasEscrow ? (order as OrderRow & { escrow_block_number?: number | null }).escrow_block_number : undefined
        }
        confirmBlocks={data.chainSync?.finalityN ?? 12}
        createdAt={order.created_at}
        variant="dark"
        readModelSyncStatus={data.chainSync ? normalizeChainSyncReadStatus(data.chainSync.syncStatus) : null}
      />
      {data.chainSync ? <ChainSyncStatusPanel chainSync={data.chainSync} t={t} variant="dark" /> : null}
      {data.hasEscrow && data.snapshotHash && (
        <div>
          <p className="text-small text-slate-300">{t("agree_label_snapshot_hash")}</p>
          <p className="text-meta font-mono text-slate-300 break-all">{data.snapshotHash}</p>
        </div>
      )}
      {data.hasEscrow && !data.snapshotHash && (
        <p className="text-meta text-slate-400 leading-relaxed" role="status">
          {t("escrow_snapshotHashMissingNeutral")}
        </p>
      )}
      {data.hasEscrow && (
        <OnchainEventTimeline
          events={
            (order as OrderRow & { onchain_events?: { type: string; block?: number; txHash?: string; at?: string }[] })
              .onchain_events
          }
          title={t("escrow_txHistory")}
          variantDid
          readModelSyncStatusRaw={data.chainSync?.syncStatus ?? null}
        />
      )}
      {order.chat_confirm_deadline && [2, 3].includes(orderStateToStep(order)) && (
        <p className="text-meta text-slate-300" role="status">
          {t("order_chatConfirmDeadlineHint").replace(
            "{{date}}",
            new Date(order.chat_confirm_deadline).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            }),
          )}
        </p>
      )}
      {order.payment_deadline && [4, 5].includes(orderStateToStep(order)) && (
        <p className="text-meta text-slate-300" role="status">
          {t("order_paymentDeadlineHint").replace(
            "{{date}}",
            new Date(order.payment_deadline).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            }),
          )}
        </p>
      )}
      {order.rating_deadline && orderStateToStep(order) === 7 && (
        <p className="text-meta text-slate-300" role="status">
          {t("order_ratingDeadlineHint").replace(
            "{{date}}",
            new Date(order.rating_deadline).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            }),
          )}
        </p>
      )}
    </div>
  );
}
