"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { marketHrefForEscrowGuideBind } from "@/lib/ordersGuideDeepLink";
import {
  TT_ESCROW_EXPERIENCE_PANEL,
  escrowExperienceLinkClass,
  escrowExperienceMetaClass,
  escrowExperiencePrimaryCtaClass,
} from "@/lib/escrowExperienceUi";

export interface EscrowDraftGuideEmptyCardProps {
  /** 单行横幅，不占首屏大块 */
  compact?: boolean;
  /** 行程目的地，用于市场 CTA 上下文（可选） */
  destinationLabel?: string;
  /** 为既有草稿订单选向导（深链市场） */
  orderId?: string;
  /** 已保存并发布到 discover（Created） */
  publishedToMarket?: boolean;
}

/** 草稿态无向导：市场 CTA（① Experience） */
export default function EscrowDraftGuideEmptyCard({
  compact = true,
  destinationLabel,
  orderId,
  publishedToMarket = false,
}: EscrowDraftGuideEmptyCardProps) {
  const { t } = useTranslation();
  const marketHref = orderId?.trim()
    ? marketHrefForEscrowGuideBind(orderId.trim())
    : "/market?view=split";

  if (compact) {
    return (
      <div
        className={`${TT_ESCROW_EXPERIENCE_PANEL} flex flex-wrap items-center justify-between gap-2 px-3 py-2.5`}
        role="status"
        aria-label={t("escrow_draftGuideEmptyTitle")}
      >
        <div className={`${escrowExperienceMetaClass} m-0 min-w-0 flex-1 space-y-1`}>
          <p className="m-0">
            <span className="font-medium text-ref-sun/95">{t("escrow_draftGuideEmptyTitle")}</span>
            <span className="text-white/60 mx-1.5" aria-hidden>
              ·
            </span>
            <span>
              {destinationLabel
                ? t("escrow_draftGuideEmptyDesc_compactDest").replace("{{dest}}", destinationLabel)
                : t("escrow_draftGuideEmptyDesc_compact")}
            </span>
          </p>
          <p className="m-0 text-white/55 text-meta">
            {publishedToMarket
              ? t("escrow_draftGuideTrust_published")
              : t("escrow_draftGuideTrust_saveFirst")}
          </p>
        </div>
        <Link
          href={marketHref}
          className={`${escrowExperienceLinkClass} shrink-0 font-semibold whitespace-nowrap`}
        >
          {t("escrow_draftGuideMarketLink")}
        </Link>
      </div>
    );
  }

  return (
    <section
      className={`${TT_ESCROW_EXPERIENCE_PANEL} p-4 space-y-3`}
      aria-labelledby="escrow-draft-guide-empty-heading"
    >
      <h2 id="escrow-draft-guide-empty-heading" className="text-small font-semibold text-ref-sun/95">
        {t("escrow_draftGuideEmptyTitle")}
      </h2>
      <p className={escrowExperienceMetaClass}>{t("escrow_draftGuideEmptyDesc")}</p>
      <Link href={marketHref} className={`${escrowExperiencePrimaryCtaClass} inline-flex justify-center text-center`}>
        {t("escrow_draftGuideMarketLink")}
      </Link>
    </section>
  );
}
