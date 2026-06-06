"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { escrowExperienceLinkClass } from "@/lib/escrowExperienceUi";
import {
  escrowProtocolLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolTitleClass,
} from "@/lib/escrowProtocolUi";
import StatusBadge from "../StatusBadge";
import {
  orderProjectionDivergesFromOrderState,
  orderProjectionTerminalDegraded,
} from "@/lib/orderProjectionDisplayStatus";
import { resolveStatusForEscrowBadge } from "./orderChainDisplayStatus";
import { experienceDraftHeaderMetaKey } from "@/lib/escrowDraftFlow";
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
  /** Draft pre-escrow Experience 顶栏 */
  variantExperience?: boolean;
  /** 草稿：是否已分配 guide_id（影响顶栏状态文案） */
  hasGuideAssigned?: boolean;
  /** Experience 草稿链：未上链 escrow 前的整段流程 */
  experiencePreEscrow?: boolean;
  /** 已保存并发布到 discover（Created） */
  publishedToDiscover?: boolean;
}

export default function EscrowDetailHeader({
  order,
  state,
  hasEscrow,
  isDraft,
  escrowId,
  chainSync,
  variantDid,
  variantExperience = false,
  hasGuideAssigned = false,
  experiencePreEscrow = false,
  publishedToDiscover = false,
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
  const isExperience = !!variantExperience;
  const isDid = !!variantDid && !isExperience;
  const titleClass = isExperience
    ? "text-h4 font-semibold text-ref-sun/95"
    : isDid
      ? escrowProtocolTitleClass
      : "text-h4 font-semibold text-ink-900";
  const metaClass = isExperience
    ? "text-small text-white/75"
    : isDid
      ? `text-small ${escrowProtocolMetaClass}`
      : "text-small text-ink-500";
  const linkClass = isExperience
    ? `${touchTargetLink44Classes} text-meta ${escrowExperienceLinkClass} motion-sub motion-reduce:transition-none print:hidden`
    : isDid
      ? `${touchTargetLink44Classes} text-meta ${escrowProtocolLinkClass} motion-sub motion-reduce:transition-none print:hidden`
      : `${touchTargetLink44Classes} text-meta text-travel-600 hover:text-travel-700 hover:underline motion-sub motion-reduce:transition-none print:hidden ${travelFocusRingOffset2Classes}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className={titleClass}>{t("escrow_orderTitle", { id: String(order.id).slice(0, 8) })}</h1>
        <p className={metaClass}>
          {hasEscrow
            ? t("escrow_onChain")
            : experiencePreEscrow
              ? t(
                  experienceDraftHeaderMetaKey({
                    publishedToDiscover,
                    hasGuideAssigned,
                  }),
                )
              : isDraft
                ? t("escrow_draft")
                : t("escrow_noEscrow")}
          {hasEscrow && order.escrow_address && (
            <span className="font-mono ml-2 text-meta opacity-90" title={String(order.escrow_address)}>
              {shortEvmAddress(String(order.escrow_address))}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {!isExperience ? (
          <>
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
          </>
        ) : null}
        <div className="flex flex-col items-end gap-1 max-w-[min(100%,18rem)]">
          {(orderProjectionDivergesFromOrderState(order) || orderProjectionTerminalDegraded(order)) ? (
            <p className="text-meta text-white text-right leading-snug" role="note">
              {orderProjectionTerminalDegraded(order)
                ? t("orders_projection_ssot_degraded")
                : t("orders_projection_ssot_notice_divergent")}
            </p>
          ) : null}
          {experiencePreEscrow && publishedToDiscover && !hasGuideAssigned ? null : !(isExperience && isDraft) ? (
            <StatusBadge
              status={resolveStatusForEscrowBadge(order, chainSync ?? null) || String(state ?? "")}
              sub_status={order.sub_status}
            />
          ) : (
            <span className="text-meta text-ref-sun/90 font-medium" role="status">
              {hasGuideAssigned ? t("escrow_draftStatus_waitingGuide") : t("escrow_draftStatus_pickGuide")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
