"use client";

import { disputeListStatusPresentation } from "@/lib/disputeListStatusPresentation";
import type { DisputeDetail } from "./disputeDetailPageTypes";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";

type Props = Pick<DisputeDetailPageModel, "t"> & {
  dispute: DisputeDetail;
};

export function DisputeDetailPageHeader({ t, dispute }: Props) {
  const statusPill = disputeListStatusPresentation(dispute.status, t);
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-h4 font-semibold text-slate-100">
        {t("dispute_detailTitle")}
        {dispute.id?.slice(0, 8)}
      </h1>
      <span className={`text-small px-2 py-1 rounded-[var(--radius-sm)] ${statusPill.className}`}>
        {statusPill.label}
      </span>
    </div>
  );
}
