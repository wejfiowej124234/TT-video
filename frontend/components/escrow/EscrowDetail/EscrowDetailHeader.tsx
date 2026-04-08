"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import {
  deepShellInlineLinkFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import StatusBadge from "../StatusBadge";
import {
  orderProjectionDivergesFromOrderState,
  orderProjectionTerminalDegraded,
} from "@/lib/orderProjectionDisplayStatus";
import { resolveStatusForEscrowBadge } from "./orderChainDisplayStatus";
import type { OrderChainSyncState, OrderRow } from "./types";

export interface EscrowDetailHeaderProps {
  order: OrderRow;
  state: string;
  hasEscrow: boolean;
  isDraft: boolean;
  escrowId: string;
  /** 110 §3.3：有条目时用于顶栏状态与链上最终事件对齐（订单行滞后时仍显示已结算等） */
  chainSync?: OrderChainSyncState | null;
  /** 53-S4：在协议控制台区（30-DID 赛博风）内时为 true */
  variantDid?: boolean;
}

export default function EscrowDetailHeader({
  order,
  state,
  hasEscrow,
  isDraft,
  escrowId,
  chainSync,
  variantDid,
}: EscrowDetailHeaderProps) {
  const { t } = useTranslation();
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [copyShareBusy, setCopyShareBusy] = useState(false);
  const copyShareLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/escrow/${escrowId}`;
    setCopyShareBusy(true);
    try {
      await window.navigator.clipboard.writeText(url);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 1500);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("EscrowDetailHeader copyShareLink:", err);
      }
    } finally {
      setCopyShareBusy(false);
    }
  }, [escrowId]);
  const handlePrintExport = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);
  const titleClass = variantDid ? "text-h4 font-semibold text-cyan-200" : "text-h4 font-semibold text-ink-900";
  const metaClass = variantDid ? "text-small text-slate-300" : "text-small text-ink-500";
  const linkClass = variantDid
    ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan motion-sub print:hidden ${deepShellInlineLinkFocusClasses}`
    : `${touchTargetLink44Classes} text-meta text-travel-600 hover:text-travel-700 hover:underline motion-sub print:hidden ${travelFocusRingOffset2Classes}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className={titleClass}>{t("escrow_orderTitle").replace("{{id}}", String(order.id).slice(0, 8))}</h1>
        <p className={metaClass}>
          {hasEscrow ? t("escrow_onChain") : isDraft ? t("escrow_draft") : t("escrow_noEscrow")}
          {hasEscrow && order.escrow_address && (
            <span className="font-mono ml-2 text-meta opacity-90" title={String(order.escrow_address)}>
              {shortEvmAddress(String(order.escrow_address))}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            handlePrintExport();
          }}
        >
          <button type="submit" className={linkClass} aria-label={t("escrow_printExport")}>
            {t("escrow_printExport")}
          </button>
        </form>
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            void copyShareLink();
          }}
        >
          <button
            type="submit"
            disabled={copyShareBusy}
            aria-busy={copyShareBusy ? true : undefined}
            className={`${linkClass} disabled:opacity-60 disabled:cursor-wait`}
            aria-label={shareLinkCopied ? t("escrow_shareLinkCopied") : t("escrow_shareLink")}
          >
            {shareLinkCopied ? t("escrow_shareLinkCopied") : t("escrow_shareLink")}
          </button>
        </form>
        <div className="flex flex-col items-end gap-1 max-w-[min(100%,18rem)]">
          {(orderProjectionDivergesFromOrderState(order) || orderProjectionTerminalDegraded(order)) ? (
            <p className="text-meta text-amber-800 text-right leading-snug" role="note">
              {orderProjectionTerminalDegraded(order)
                ? t("orders_projection_ssot_degraded")
                : t("orders_projection_ssot_notice_divergent")}
            </p>
          ) : null}
          <StatusBadge
            status={resolveStatusForEscrowBadge(order, chainSync ?? null) || String(state ?? "")}
            sub_status={order.sub_status}
          />
        </div>
      </div>
    </div>
  );
}
