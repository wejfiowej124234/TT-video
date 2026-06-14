"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getGuide } from "@/lib/apiClient";
import { isAssignedGuideId } from "@/lib/isAssignedGuideId";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import type { GuideCardItem } from "@/lib/marketTypes";
import {
  escrowProtocolMetaClass,
  escrowProtocolSubheadingClass,
  escrowProtocolLinkClass,
  TT_ESCROW_PROTOCOL_PANEL,
} from "@/lib/escrowProtocolUi";
import {
  formatEscrowStablecoinCurrency,
  resolveEscrowDisplayAmount,
  type EscrowAmountBreakdownLike,
} from "@/lib/escrowOrderAmountSsot";
import type { OrderRow } from "./types";

export interface EscrowConsumerSummaryCardProps {
  order: OrderRow;
  amount: string;
  currency: string;
  amountBreakdown?: EscrowAmountBreakdownLike | null;
}

export default function EscrowConsumerSummaryCard({
  order,
  amount,
  currency,
  amountBreakdown,
}: EscrowConsumerSummaryCardProps) {
  const { t } = useTranslation();
  const guideId = String(order.guide_id ?? "");
  const [guide, setGuide] = useState<GuideCardItem | null>(null);

  useEffect(() => {
    if (!isAssignedGuideId(guideId)) {
      setGuide(null);
      return;
    }
    let cancelled = false;
    void getGuide(guideId)
      .then((raw) => {
        if (!cancelled) setGuide(raw as GuideCardItem);
      })
      .catch(() => {
        if (!cancelled) setGuide(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  const resolved = resolveEscrowDisplayAmount(amount, amountBreakdown ?? null);
  const displayAmount = `${resolved.canonicalTotal ?? amount} ${formatEscrowStablecoinCurrency(currency)}`;
  const createdLabel = order.created_at
    ? new Date(order.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : t("ui_em_dash");
  const guideName = guide
    ? formatGuideDisplayName(t, guide)
    : isAssignedGuideId(guideId)
      ? `${guideId.slice(0, 8)}…`
      : t("escrow_guideUnassigned");
  const guideCity = guide?.city?.trim() || "";

  return (
    <section
      className={`${TT_ESCROW_PROTOCOL_PANEL} p-4 md:p-5 space-y-4`}
      aria-label={t("escrow_consumer_summary_aria")}
      data-tt-escrow-consumer-summary="1"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`${escrowProtocolMetaClass} m-0`}>{t("escrow_consumer_amount_label")}</p>
          <p className="m-0 text-h3 font-semibold tracking-tight text-ref-sun/95">{displayAmount}</p>
        </div>
        <div className="text-right">
          <p className={`${escrowProtocolMetaClass} m-0`}>{t("escrow_consumer_created_label")}</p>
          <p className="m-0 text-small text-white/85">{createdLabel}</p>
        </div>
      </div>

      <div className="border-t border-ref-sun/10 pt-3">
        <p className={`${escrowProtocolSubheadingClass} m-0 mb-1`}>{t("escrow_consumer_guide_label")}</p>
        {isAssignedGuideId(guideId) ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 text-small font-semibold text-white/95">{guideName}</p>
              {guideCity ? <p className="m-0 text-meta text-white/60 mt-0.5">{guideCity}</p> : null}
            </div>
            <Link href={`/guides/${encodeURIComponent(guideId)}`} className={`text-meta font-medium ${escrowProtocolLinkClass}`}>
              {t("escrow_draftGuideViewProfile")}
            </Link>
          </div>
        ) : (
          <p className={`${escrowProtocolMetaClass} m-0`}>{t("escrow_guideUnassigned")}</p>
        )}
      </div>
    </section>
  );
}
