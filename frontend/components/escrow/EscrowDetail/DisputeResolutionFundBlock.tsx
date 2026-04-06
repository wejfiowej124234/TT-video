"use client";

import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getDisputes, getDispute } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  computeDisputeResolutionFundSplit,
  formatSplitAmount,
  orderStateTriggersDisputeFundSplit,
} from "@/lib/disputeResolutionFundSplit";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  marketCyanInlineLinkFocusClasses,
} from "@/lib/travelLinkFocus";

type ListItem = { id?: string; order_id?: string; status?: string; resolved_at?: string | null };

function pickLatestResolvedDisputeId(items: unknown[], orderId: string): string | null {
  const rows = items.filter((x): x is ListItem => x != null && typeof x === "object");
  const matches = rows.filter(
    (r) => String(r.order_id ?? "") === orderId && String(r.status ?? "").toLowerCase() === "resolved",
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => {
    const ta = a.resolved_at ? Date.parse(String(a.resolved_at)) : 0;
    const tb = b.resolved_at ? Date.parse(String(b.resolved_at)) : 0;
    return tb - ta;
  });
  const id = matches[0]?.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

type DisputeDetail = {
  id?: string;
  status?: string;
  refund_ratio?: number | null;
  slash_guide?: boolean | null;
};

/** B-066：`GET /api/v1/disputes/:id` 为金额拆分 SSOT；仅订单处于 refunded / partially_refunded / slashed 时拉取 */
export default function DisputeResolutionFundBlock({
  orderId,
  orderAmountStr,
  currency,
  orderState,
  variantDid,
}: {
  orderId: string;
  orderAmountStr: string;
  currency: string;
  orderState: string;
  variantDid?: boolean;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const trigger = orderStateTriggersDisputeFundSplit(orderState);

  const load = useCallback(async () => {
    if (!trigger || !orderId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const items = await getDisputes();
      const did = pickLatestResolvedDisputeId(items, orderId);
      if (!did) {
        setDispute(null);
        return;
      }
      const d = (await getDispute(did)) as DisputeDetail;
      if (String(d?.status ?? "").toLowerCase() !== "resolved") {
        setDispute(null);
        return;
      }
      setDispute(d);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("DisputeResolutionFundBlock load:", err);
      }
      setDispute(null);
      setError(mapApiReadError(err, t, "dispute_fund_split_loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderId, t, trigger]);

  useEffect(() => {
    void load();
  }, [load, retryTick]);

  if (!trigger) return null;

  const panelClass = variantDid
    ? "rounded-[var(--radius-md)] border border-slate-700/80 bg-slate-900/50"
    : "rounded-[var(--radius-md)] border border-ink-200 bg-white";

  const textMuted = variantDid ? "text-meta text-slate-400" : "text-meta text-ink-600";
  const textBody = variantDid ? "text-small text-slate-200" : "text-small text-ink-800";
  const headingClass = variantDid ? "text-small font-semibold text-cyan-200" : "text-small font-semibold text-ink-900";
  const linkClass = variantDid
    ? `${touchTargetLink44Classes} text-small font-medium text-cyan-300 hover:text-cyan-100 ${marketCyanInlineLinkFocusClasses}`
    : `${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingCoreOffset2Classes}`;

  if (loading && !error && !dispute) {
    return (
      <section className={`${panelClass} p-4`} aria-labelledby={headingId}>
        <h3 id={headingId} className={headingClass}>
          {t("escrow_disputeResolutionFund_title")}
        </h3>
        <p className={`${textMuted} mt-2`} role="status">
          {t("common_loading")}
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${panelClass} p-4`} aria-labelledby={headingId}>
        <h3 id={headingId} className={headingClass}>
          {t("escrow_disputeResolutionFund_title")}
        </h3>
        <div className="mt-2 space-y-2">
          <ApiErrorAlert message={error} tone={variantDid ? "dark" : "default"} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loading) return;
              setRetryTick((n) => n + 1);
            }}
          >
            <button
              type="submit"
              disabled={loading}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${
                variantDid
                  ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700/80"
                  : "border-ink-300 bg-white text-ink-800 hover:bg-ink-50"
              } ${travelFocusRingCoreOffset2Classes}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (!dispute || dispute.refund_ratio == null || typeof dispute.refund_ratio !== "number") {
    return null;
  }

  const amt = parseFloat(String(orderAmountStr).replace(/,/g, ""));
  const ratio = dispute.refund_ratio;
  const slash = dispute.slash_guide === true;
  const split = computeDisputeResolutionFundSplit(amt, ratio, slash);

  const disputeId = typeof dispute.id === "string" && dispute.id.trim() ? dispute.id.trim() : null;

  return (
    <section className={`${panelClass} p-4`} aria-labelledby={headingId}>
      <h3 id={headingId} className={headingClass}>
        {t("escrow_disputeResolutionFund_title")}
      </h3>
      <p className={`${textMuted} mt-1 leading-relaxed`}>{t("escrow_disputeResolutionFund_ssotHint")}</p>
      <dl className={`mt-3 space-y-2 ${textBody}`}>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t("escrow_disputeResolutionFund_orderTotal")}</dt>
          <dd className="font-mono tabular-nums">{formatSplitAmount(amt, currency)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t("escrow_disputeResolutionFund_refundRatio")}</dt>
          <dd className="font-mono tabular-nums">{(ratio * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t("escrow_disputeResolutionFund_refundToTraveler")}</dt>
          <dd className="font-mono tabular-nums">{formatSplitAmount(split.tourist, currency)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t("escrow_disputeResolutionFund_toGuide")}</dt>
          <dd className="font-mono tabular-nums">{formatSplitAmount(split.guide, currency)}</dd>
        </div>
        {split.platformPool > 1e-9 ? (
          <div className="flex flex-wrap justify-between gap-2">
            <dt>{t("escrow_disputeResolutionFund_platformPool")}</dt>
            <dd className="font-mono tabular-nums">{formatSplitAmount(split.platformPool, currency)}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t("escrow_disputeResolutionFund_slashGuide")}</dt>
          <dd>{slash ? t("escrow_disputeResolutionFund_slashYes") : t("escrow_disputeResolutionFund_slashNo")}</dd>
        </div>
      </dl>
      {disputeId ? (
        <p className="mt-3">
          <Link href={`/disputes/${encodeURIComponent(disputeId)}`} className={linkClass}>
            {t("escrow_disputeResolutionFund_viewDispute")}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
