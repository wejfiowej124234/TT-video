"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import EscrowDraftTravelNotice from "./EscrowDraftTravelNotice";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_ESCROW_EXPERIENCE_ZONE,
  escrowExperienceFooterLinkClass,
  escrowExperienceSecondaryBtnClass,
} from "@/lib/escrowExperienceUi";

export interface EscrowDetailLoadErrorViewProps {
  message: string;
  onRetry: () => void;
  cancelPolicyHeadingId: string;
  t: (key: string) => string;
  /** 草稿 pre-escrow：暖色 Experience + 短合规，无协议全量风险栈 */
  variantExperience?: boolean;
  orderGetRateLimited?: boolean;
}

export default function EscrowDetailLoadErrorView({
  message,
  onRetry,
  cancelPolicyHeadingId,
  t,
  variantExperience = true,
  orderGetRateLimited = false,
}: EscrowDetailLoadErrorViewProps) {
  const displayMessage = orderGetRateLimited ? t("escrow_orderGetRateLimited") : message;

  return (
    <main className="space-y-6" aria-label={t("escrow_detailAria")} data-tt-escrow-detail-page="1">
      <h1 className="sr-only">{t("escrow_errorTitle")}</h1>
      <div
        data-zone="order-experience"
        className={`${TT_ESCROW_EXPERIENCE_ZONE} min-h-[40vh]`}
        role="region"
        aria-label={t("order_protocolZoneAria")}
      >
        <ApiErrorAlert message={displayMessage} tone="dark" />
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onRetry();
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} ${escrowExperienceSecondaryBtnClass} px-4 py-2 text-small focus-visible:ring-offset-ink-950`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} px-4 py-2 text-small ${escrowExperienceFooterLinkClass}`}
          >
            {t("escrow_backToOrders")}
          </Link>
        </div>
        <EscrowDraftTravelNotice compact />
      </div>
      <ProductCrossNav ariaLabelKey="escrow_detail_relatedNav_aria" showGuides />
    </main>
  );
}
