"use client";

import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";

export type IntentSignFactsAction = "confirm_completion" | "open_dispute" | "execute_resolution";

export type IntentSignFactsProps = {
  expectedChainId: number;
  escrowAddress: string;
  orderId: string;
  action: IntentSignFactsAction;
  disputeId?: string;
  /** 争议说明文本或 reasonHash 片段，供用户签名前核对 */
  disputeSummaryOrHash?: string;
  /** 订单协议区深色底时与 panelClass 一致 */
  variantDid?: boolean;
};

/** 05 §九 9.0.5 / 06 §五：钱包 EIP-712 签名前展示订单、链、合约与意向类型 */
export default function IntentSignFacts({
  expectedChainId,
  escrowAddress,
  orderId,
  action,
  disputeId,
  disputeSummaryOrHash,
  variantDid,
}: IntentSignFactsProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const actionLabel =
    action === "confirm_completion"
      ? t("escrow_intentFactActionConfirm")
      : action === "open_dispute"
        ? t("escrow_intentFactActionDispute")
        : t("escrow_intentFactActionExecuteResolution");

  const summaryLine =
    action === "open_dispute"
      ? disputeSummaryOrHash?.trim() || t("escrow_intentFactDash")
      : action === "execute_resolution"
        ? disputeSummaryOrHash?.trim() || t("escrow_intentFactDash")
        : null;

  const isDid = !!variantDid;
  const boxClass = isDid
    ? "rounded-[var(--radius-sm)] border border-slate-600/50 bg-slate-800/50 p-3 space-y-2"
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/50 p-3 space-y-2";
  const titleClass = isDid ? "text-small font-semibold text-slate-200" : "text-small font-semibold text-ink-800";
  const noteClass = isDid ? "text-meta text-slate-300" : "text-meta text-ink-600";
  const dlClass = isDid ? "text-meta font-mono text-slate-300 space-y-1.5" : "text-meta font-mono text-ink-700 space-y-1.5";
  const dtClass = isDid ? "text-slate-300" : "text-ink-500";
  const actionDdClass = isDid ? "font-sans text-small text-slate-200" : "font-sans text-small text-ink-800";
  const zeroHintClass = isDid ? "text-meta text-slate-300 font-sans pt-1" : "text-meta text-ink-500 font-sans pt-1";

  return (
    <div className={boxClass} role="region" aria-labelledby={titleId}>
      <p id={titleId} className={titleClass}>
        {t("escrow_intentFactsTitle")}
      </p>
      <p className={noteClass}>{t("escrow_intentFactsNote")}</p>
      <dl className={dlClass}>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className={dtClass}>{t("escrow_intentFactOrder")}</dt>
          <dd className="break-all">{orderId}</dd>
        </div>
        {disputeId ? (
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
            <dt className={dtClass}>{t("escrow_intentFactDispute")}</dt>
            <dd className="break-all">{disputeId}</dd>
          </div>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className={dtClass}>{t("escrow_intentFactChain")}</dt>
          <dd>{expectedChainId}</dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className={dtClass}>{t("escrow_intentFactContract")}</dt>
          <dd className="break-all">{escrowAddress}</dd>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
          <dt className={dtClass}>{t("escrow_intentFactAction")}</dt>
          <dd className={actionDdClass}>{actionLabel}</dd>
        </div>
        {summaryLine !== null ? (
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,auto)_1fr] gap-x-2 gap-y-0.5">
            <dt className={dtClass}>{t("escrow_intentFactDisputeSummary")}</dt>
            <dd className="break-all">{summaryLine}</dd>
          </div>
        ) : null}
        {action === "open_dispute" && !disputeSummaryOrHash?.trim() ? (
          <p className={zeroHintClass}>{t("escrow_intentFactZeroReasonHint")}</p>
        ) : null}
      </dl>
    </div>
  );
}
