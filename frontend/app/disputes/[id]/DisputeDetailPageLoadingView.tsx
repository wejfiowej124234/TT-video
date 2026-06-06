"use client";

import LoadingText from "@/components/LoadingText";
import { DisputesL5FooterLinks } from "@/components/disputes/DisputesL5FooterLinks";
import { DisputesL5PageShell } from "@/components/disputes/DisputesL5PageShell";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";

export function DisputeDetailPageLoadingView({ t }: Pick<DisputeDetailPageModel, "t">) {
  return (
    <DisputesL5PageShell t={t} ariaLabel={t("dispute_detailTitle")} variant="detail">
      <div
        className="flex min-h-[240px] flex-col items-center justify-center gap-4"
        aria-busy="true"
        data-tt-dispute-detail-page="1"
      >
        <LoadingText />
      </div>
      <DisputesL5FooterLinks t={t} showList />
    </DisputesL5PageShell>
  );
}
