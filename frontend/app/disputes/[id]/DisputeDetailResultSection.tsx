"use client";

import type { DisputeDetail } from "./disputeDetailPageTypes";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";
import { DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";

type Props = Pick<DisputeDetailPageModel, "t"> & { dispute: DisputeDetail };

export function DisputeDetailResultSection({ t, dispute }: Props) {
  return (
    <section className={DISPUTE_DETAIL_SECTION_CLASS}>
      <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_result")}</h2>
      <ul className={`${TT_DISPUTES_L5.sectionList} space-y-1`}>
        <li>
          {t("dispute_refundRatio")}
          {dispute.refund_ratio != null ? `${(dispute.refund_ratio * 100).toFixed(0)}%` : t("ui_em_dash")}
        </li>
        <li>
          {t("dispute_slashGuide")}
          {dispute.slash_guide ? t("dispute_yes") : t("dispute_no")}
        </li>
        <li>
          {t("dispute_resolvedAt")}
          {dispute.resolved_at ?? t("ui_em_dash")}
        </li>
      </ul>
    </section>
  );
}
