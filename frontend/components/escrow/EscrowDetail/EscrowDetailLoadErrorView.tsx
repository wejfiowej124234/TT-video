"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import EscrowDraftTravelNotice from "./EscrowDraftTravelNotice";
import type { EscrowLoadErrorKind } from "./useEscrowDetail";
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
  /** P0：401/403 下一步引导（不放宽 ACL） */
  loadErrorKind?: EscrowLoadErrorKind | null;
  escrowId?: string;
}

export default function EscrowDetailLoadErrorView({
  message,
  onRetry,
  cancelPolicyHeadingId,
  t,
  variantExperience = true,
  orderGetRateLimited = false,
  loadErrorKind = null,
  escrowId,
}: EscrowDetailLoadErrorViewProps) {
  const displayMessage = orderGetRateLimited ? t("escrow_orderGetRateLimited") : message;
  const loginHref =
    escrowId && escrowId.trim()
      ? `/auth/login?returnUrl=${encodeURIComponent(`/escrow/${encodeURIComponent(escrowId.trim())}`)}`
      : "/auth/login";
  const showRetry = loadErrorKind !== "forbidden" && loadErrorKind !== "login";

  return (
    <main className="space-y-6" aria-label={t("escrow_detailAria")} data-tt-escrow-detail-page="1">
      <h1 className="sr-only">{t("escrow_errorTitle")}</h1>
      <div
        data-zone="order-experience"
        className={`${TT_ESCROW_EXPERIENCE_ZONE} min-h-[40vh]`}
        role="region"
        aria-label={t("order_protocolZoneAria")}
        data-tt-escrow-load-error-kind={loadErrorKind ?? "generic"}
      >
        <ApiErrorAlert message={displayMessage} tone="dark" />
        <div className="flex flex-wrap items-center gap-2">
          {showRetry ? (
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
          ) : null}
          {loadErrorKind === "login" ? (
            <Link
              href={loginHref}
              className={`${touchTargetLink44Classes} px-4 py-2 text-small ${escrowExperienceSecondaryBtnClass}`}
              data-tt-escrow-error-login="1"
            >
              {t("escrow_error_go_login")}
            </Link>
          ) : null}
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} px-4 py-2 text-small ${escrowExperienceFooterLinkClass}`}
            data-tt-escrow-error-orders="1"
          >
            {t("escrow_backToOrders")}
          </Link>
          {loadErrorKind === "forbidden" ? (
            <Link
              href="/market"
              className={`${touchTargetLink44Classes} px-4 py-2 text-small ${escrowExperienceFooterLinkClass}`}
              data-tt-escrow-error-market="1"
            >
              {t("escrow_backToMarket")}
            </Link>
          ) : null}
        </div>
        {loadErrorKind === "forbidden" ? (
          <p className="text-small text-slate-400 pt-1" role="status">
            {t("escrow_403_next_step_hint")}
          </p>
        ) : null}
        <EscrowDraftTravelNotice compact />
      </div>
      <ProductCrossNav ariaLabelKey="escrow_detail_relatedNav_aria" showGuides />
    </main>
  );
}
