"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { formatUserFacingDateTime } from "@/lib/formatUserFacingDateTime";
import type { DisputeDetail } from "./disputeDetailPageTypes";import type { DisputeDetailPageModel } from "./useDisputeDetailPage";
import { DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";

type Props = Pick<DisputeDetailPageModel, "t"> & {
  dispute: DisputeDetail;
  isResolved: boolean;
};

export function DisputeDetailTimelineSection({ t, dispute, isResolved }: Props) {
  const { locale } = useTranslation();
  const fmt = (iso?: string | null) => formatUserFacingDateTime(iso, locale, t("ui_em_dash"));

  return (    <section className={DISPUTE_DETAIL_SECTION_CLASS}>
      <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_timeline")}</h2>
      <ul className={TT_DISPUTES_L5.sectionList}>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ref-sun" />
          {t("dispute_createdAt")}
          <time dateTime={dispute.created_at ?? undefined}>{fmt(dispute.created_at)}</time>        </li>
        {dispute.arbitrator_id ? (
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            {t("dispute_arbAssigned")}
          </li>
        ) : null}
        {isResolved ? (
          <>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              {t("dispute_resolvedAt")}
              <time dateTime={dispute.resolved_at ?? undefined}>{fmt(dispute.resolved_at)}</time>            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              {t("dispute_execRecord")}
            </li>
          </>
        ) : null}
      </ul>
    </section>
  );
}
