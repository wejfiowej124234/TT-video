"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import {
  deepShellInlineLinkFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { normalizeChainSyncReadStatus } from "@/components/escrow/EscrowDetail/types";

/**
 * 链上事件时间线（28 §8.3 Console 组件）
 * EscrowCreated / Funded / Released / Refunded / DisputeOpened 等；无数据时占位，待后端索引接数据。
 */
export interface OnchainEventItem {
  type: string;
  block?: number;
  txHash?: string;
  at?: string;
}

export interface OnchainEventTimelineProps {
  /** 链上事件列表；空或未传时显示占位 */
  events?: OnchainEventItem[] | null;
  /** 区块浏览器 base URL（用于 txHash 链接），如 https://polygonscan.com/tx/ */
  explorerTxUrl?: string;
  /** 标题；不传则用 i18n 默认 */
  title?: string;
  /** 订单协议区深色底时用浅色字（与 EscrowDetail 30-DID 一致） */
  variantDid?: boolean;
  /** B-038：与 `chain_sync.status` 同源；pending 时在列表下展示「未足 finality」说明 */
  readModelSyncStatusRaw?: string | null;
}

export default function OnchainEventTimeline({
  events,
  explorerTxUrl,
  title: titleProp,
  variantDid,
  readModelSyncStatusRaw = null,
}: OnchainEventTimelineProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const title = titleProp ?? t("escrow_txHistory");
  const hasEvents = Array.isArray(events) && events.length > 0;
  const isDid = !!variantDid;
  const readSt =
    readModelSyncStatusRaw != null && String(readModelSyncStatusRaw).trim()
      ? normalizeChainSyncReadStatus(String(readModelSyncStatusRaw))
      : null;

  const titleClass = isDid ? "text-small font-medium text-slate-300" : "text-small font-medium text-ink-500";
  const liClass = isDid
    ? "flex items-start gap-2 text-small text-slate-300 border-l-2 border-slate-600/60 pl-3 py-1"
    : "flex items-start gap-2 text-small text-ink-700 border-l-2 border-ink-200 pl-3 py-1";
  const typeClass = isDid ? "font-medium text-slate-200" : "font-medium text-ink-800";
  const metaClass = isDid ? "text-meta text-slate-300" : "text-meta text-ink-500";
  const linkClass = isDid
    ? `${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline text-meta ${deepShellInlineLinkFocusClasses}`
    : `${touchTargetLink44Classes} text-travel-500 underline text-meta ${travelFocusRingOffset2Classes}`;
  const emptyClass = isDid ? "text-small text-slate-300 mt-1 leading-relaxed" : "text-small text-ink-600 mt-1";

  return (
    <div role="region" aria-labelledby={titleId}>
      <h4 id={titleId} className={titleClass}>
        {title}
      </h4>
      {hasEvents ? (
        <ul className="mt-2 space-y-2" role="list">
          {events!.map((evt, i) => (
            <li key={i} className={liClass}>
              <span className={typeClass}>{evt.type}</span>
              {evt.block != null && (
                <span className={metaClass}>{t("escrow_blockLabel").replace("{{n}}", String(evt.block))}</span>
              )}
              {evt.at && <span className={metaClass}>{evt.at}</span>}
              {evt.txHash && explorerTxUrl && (
                <a
                  href={`${explorerTxUrl}${evt.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                  title={evt.txHash}
                  aria-label={t("escrow_viewTxAria").replace(
                    "{{hash}}",
                    shortEvmAddress(evt.txHash, 6, 4)
                  )}
                >
                  {t("escrow_viewTx")}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={emptyClass}>
          {t("escrow_eventsPlaceholder")}
        </p>
      )}
      {hasEvents && readSt === "pending" ? (
        <p className={`${emptyClass} border-t ${isDid ? "border-slate-600/50 pt-2 mt-2" : "border-ink-200 pt-2 mt-2"}`} role="status">
          {t("escrow_txHistory_pendingFinalityDisclaimer")}
        </p>
      ) : null}
      {hasEvents && readSt === "confirmed" ? (
        <p className={`${metaClass} border-t ${isDid ? "border-slate-600/50 pt-2 mt-2" : "border-ink-200 pt-2 mt-2"}`} role="status">
          {t("escrow_txHistory_confirmedFinalityDisclaimer")}
        </p>
      ) : null}
    </div>
  );
}
