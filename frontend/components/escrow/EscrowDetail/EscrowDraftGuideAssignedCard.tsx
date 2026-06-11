"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getGuide } from "@/lib/apiClient";
import { isAssignedGuideId } from "@/lib/isAssignedGuideId";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { marketHrefForEscrowGuideBind } from "@/lib/ordersGuideDeepLink";
import type { GuideCardItem } from "@/lib/marketTypes";
import {
  TT_ESCROW_EXPERIENCE_PANEL,
  escrowExperienceMetaClass,
  escrowExperienceMutedLinkClass,
} from "@/lib/escrowExperienceUi";

export interface EscrowDraftGuideAssignedCardProps {
  guideId: string;
  orderId: string;
  /** P03：已绑向导，待向导接单 */
  waitingGuideAccept?: boolean;
}

/** 已选向导：展示市场卡片级摘要（① 真 API，非假数据） */
export default function EscrowDraftGuideAssignedCard({
  guideId,
  orderId,
  waitingGuideAccept = false,
}: EscrowDraftGuideAssignedCardProps) {
  const { t } = useTranslation();
  const [guide, setGuide] = useState<GuideCardItem | null>(null);

  useEffect(() => {
    if (!isAssignedGuideId(guideId)) {
      setGuide(null);
      return;
    }
    let cancelled = false;
    void getGuide(guideId)
      .then((raw) => {
        if (cancelled) return;
        setGuide(raw as GuideCardItem);
      })
      .catch(() => {
        if (!cancelled) setGuide(null);
      });
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  const name = guide ? formatGuideDisplayName(t, guide) : `${guideId.slice(0, 8)}…`;
  const city = guide?.city?.trim() || t("ui_em_dash");
  const langs = Array.isArray(guide?.languages) ? guide.languages.slice(0, 2).join(" / ") : "";

  return (
    <section
      className={`${TT_ESCROW_EXPERIENCE_PANEL} p-3 space-y-2`}
      aria-label={t("escrow_draftGuideAssigned_cardAria")}
    >
      <p className={`${escrowExperienceMetaClass} m-0`}>
        {waitingGuideAccept
          ? t("escrow_draftGuideAssigned_waitAccept")
          : t("escrow_draftGuideAssigned_line")}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-small font-semibold text-white/95">{name}</p>
          <p className="m-0 text-meta text-white/60 mt-0.5">
            {city}
            {langs ? ` · ${langs}` : ""}
          </p>
        </div>
        <Link
          href={`/guides/${encodeURIComponent(guideId)}`}
          className={`${escrowExperienceMutedLinkClass} shrink-0 text-meta font-medium`}
        >
          {t("escrow_draftGuideViewProfile")}
        </Link>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link
          href={marketHrefForEscrowGuideBind(orderId)}
          className={`${escrowExperienceMutedLinkClass} text-meta font-medium`}
        >
          {t("escrow_draftGuideChangeGuide")}
        </Link>
        <Link
          href={`/community/messages?orderId=${encodeURIComponent(orderId)}`}
          className={`${escrowExperienceMutedLinkClass} text-meta font-medium`}
        >
          {t("order_messageLinkCta_experience")}
        </Link>
      </div>
    </section>
  );
}
