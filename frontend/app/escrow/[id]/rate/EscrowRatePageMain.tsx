"use client";

import Link from "next/link";

import ReviewBlock from "@/components/escrow/EscrowDetail/ReviewBlock";
import {
  escrowRatePanelClass as panelClass,
  escrowRateZoneClass as zoneClass,
} from "@/components/escrow/EscrowRateRouteSuspense";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  escrowRateFooterDividerClass,
  escrowRateFooterLinkClass,
  escrowRateHeadingClass,
  escrowRateLinkClass,
  escrowRateMetaClass,
  escrowRateOutlineBtnClass,
  escrowRateSectionHeadingClass,
  escrowRateSolidBtnClass,
  escrowRateTitleClass,
  escrowRateUploadZoneClass,
  TT_ESCROW_RATE_PAGE_SHELL,
} from "@/lib/escrowRateL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import {
  orderStateAllowsConfirmRating,
  orderStateAllowsOffChainTextReviews,
  RATE_NAV_FOCUS,
} from "./escrowRatePageModel";
import type { UseEscrowRatePageResult } from "./useEscrowRatePage";

export type EscrowRatePageMainProps = Pick<
  UseEscrowRatePageResult,
  | "t"
  | "id"
  | "order"
  | "phase"
  | "files"
  | "submitting"
  | "error"
  | "uploadServerSyncHint"
  | "uploadSubmitHintId"
  | "ratePageH1Id"
  | "rateUploadHeadingId"
  | "rateFileInputId"
  | "rateFileHintId"
  | "rateReleaseCtaHeadingId"
  | "stashEscrowMainPrefetch"
  | "onFileChange"
  | "submitUpload"
  | "confirmRating"
>;

export function EscrowRatePageMain({
  t,
  id,
  order,
  phase,
  files,
  submitting,
  error,
  uploadServerSyncHint,
  uploadSubmitHintId,
  ratePageH1Id,
  rateUploadHeadingId,
  rateFileInputId,
  rateFileHintId,
  rateReleaseCtaHeadingId,
  stashEscrowMainPrefetch,
  onFileChange,
  submitUpload,
  confirmRating,
}: EscrowRatePageMainProps) {
  const navLinkClass = `${touchTargetLink44Classes} inline-flex items-center ${escrowRateLinkClass} ${RATE_NAV_FOCUS}`;

  return (
    <main
      className={TT_ESCROW_RATE_PAGE_SHELL}
      aria-labelledby={ratePageH1Id}
      data-tt-escrow-rate-page="1"
      data-tt-escrow-rate-l5="1"
    >
      <div className="container py-8 md:py-12 max-w-5xl">
        <div data-zone="order-protocol" className={zoneClass}>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 id={ratePageH1Id} className={escrowRateTitleClass}>
              {t("rate_pageTitle")}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-end">
              <Link href={`/escrow/${encodeURIComponent(id)}`} onClick={stashEscrowMainPrefetch} className={navLinkClass}>
                ← {t("escrow_backToOrders")}
              </Link>
              <Link
                href={`/pay?orderId=${encodeURIComponent(id)}`}
                onClick={stashEscrowMainPrefetch}
                className={navLinkClass}
              >
                {t("orders_payHub")}
              </Link>
            </div>
          </header>
          <p className={escrowRateMetaClass} role="note">
            {t("rate_reviewWindowHint")}
          </p>
          {order?.rating_deadline &&
            phase !== "both_confirmed" &&
            phase !== "released" &&
            phase !== "review_only" &&
            !Number.isNaN(Date.parse(order.rating_deadline)) && (
              <p className={`${escrowRateMetaClass} mt-1`} role="note">
                {t("order_ratingDeadlineHint").replace(
                  "{{date}}",
                  new Date(order.rating_deadline).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  }),
                )}
              </p>
            )}

          {phase === "review_only" ? (
            <section className={panelClass} role="note" aria-labelledby={rateUploadHeadingId}>
              <h2 id={rateUploadHeadingId} className={`${escrowRateHeadingClass} mb-2`}>
                {t("rate_reviewOnlyTitle")}
              </h2>
              <p className={escrowRateMetaClass}>{t("rate_reviewOnlyBody")}</p>
            </section>
          ) : (
            <section className={panelClass} aria-labelledby={rateUploadHeadingId}>
              <h2 id={rateUploadHeadingId} className={`${escrowRateHeadingClass} mb-2`}>
                {t("rate_uploadTitle")}
              </h2>
              <p className={`${escrowRateMetaClass} mb-4`}>{t("rate_uploadHint")}</p>
              <div
                className={escrowRateUploadZoneClass}
                role="group"
                aria-label={t("rate_uploadTitle")}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={onFileChange}
                  className="sr-only"
                  id={rateFileInputId}
                  aria-label={t("rate_uploadInput_aria")}
                  aria-describedby={rateFileHintId}
                />
                <label htmlFor={rateFileInputId} className="cursor-pointer block">
                  <span className="text-small">{t("rate_uploadHint")}</span>
                </label>
                <p id={rateFileHintId} className="text-meta mt-2">
                  {files.length > 0 ? t("rate_filesSelected").replace("{{n}}", String(files.length)) : ""}
                </p>
              </div>
              {phase === "pending_upload" && (
                <>
                  <span id={uploadSubmitHintId} className="sr-only">
                    {t("rate_submitRequiresFiles")}
                  </span>
                  <form
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submitUpload();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={submitting || files.length === 0}
                      className={`mt-4 ${escrowRateSolidBtnClass}`}
                      aria-busy={submitting ? true : undefined}
                      aria-describedby={files.length === 0 && !submitting ? uploadSubmitHintId : undefined}
                    >
                      {submitting ? t("common_submitting") : t("rate_submitUpload")}
                    </button>
                  </form>
                  {uploadServerSyncHint ? (
                    <p className={`mt-3 ${escrowRateMetaClass}`} role="status">
                      {t("rate_uploadNoApiSyncHint")}
                    </p>
                  ) : null}
                </>
              )}
            </section>
          )}

          {orderStateAllowsOffChainTextReviews(order?.state) ? (
            <section className={panelClass} aria-label={t("escrow_reviews")}>
              <p className={`${escrowRateMetaClass} mb-3`}>{t("rate_reviewsSectionIntro")}</p>
              <ReviewBlock orderId={id} variantDid />
            </section>
          ) : null}

          <section className={panelClass} role="status" aria-live="polite">
            <h3 className={`${escrowRateSectionHeadingClass} mb-3`}>{t("rate_myStatus")}</h3>
            <p className={escrowRateMetaClass}>
              {phase === "pending_upload" && t("rate_statePendingUpload")}
              {phase === "under_review" && t("rate_stateUnderReview")}
              {phase === "waiting_other" && t("rate_stateWaitingOther")}
              {phase === "both_confirmed" && t("rate_stateBothConfirmed")}
              {phase === "released" && t("rate_stateReleased")}
              {phase === "review_only" && t("rate_stateReviewOnly")}
            </p>
            {phase !== "review_only" ? (
              <>
                <h3 className={`${escrowRateSectionHeadingClass} mt-4 mb-2`}>{t("rate_otherStatus")}</h3>
                <p className={escrowRateMetaClass}>
                  {phase === "released" && t("rate_stateReleased")}
                  {phase === "both_confirmed" && t("rate_stateBothConfirmed")}
                  {(phase === "pending_upload" || phase === "under_review" || phase === "waiting_other") &&
                    t("rate_stateWaitingOther")}
                </p>
              </>
            ) : null}
            {((phase === "under_review") ||
              (phase === "waiting_other" && orderStateAllowsConfirmRating(order?.state))) && (
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  void confirmRating();
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  className={`mt-4 ${escrowRateSolidBtnClass}`}
                  aria-label={t("rate_confirmCta")}
                  aria-busy={submitting ? true : undefined}
                >
                  {submitting ? t("common_submitting") : t("rate_confirmCta")}
                </button>
              </form>
            )}
            {error && (
              <p className="mt-3 text-small text-danger" role="alert">
                {error}
              </p>
            )}
          </section>

          {phase === "both_confirmed" && (
            <section className={panelClass} aria-labelledby={rateReleaseCtaHeadingId}>
              <h2 id={rateReleaseCtaHeadingId} className={`${escrowRateHeadingClass} mb-2`}>
                {t("rate_releaseCtaTitle")}
              </h2>
              <p className={`${escrowRateMetaClass} mb-4`}>{t("escrow_releaseAfterRatingHint")}</p>
              <Link
                href={`/escrow/${encodeURIComponent(id)}`}
                onClick={stashEscrowMainPrefetch}
                className={`inline-flex items-center ${escrowRateSolidBtnClass}`}
              >
                {t("rate_openEscrowToRelease")}
              </Link>
            </section>
          )}

          {phase === "released" && (
            <section className={panelClass} role="status" aria-live="polite">
              <p className="text-body font-semibold text-success">{t("rate_stateReleased")}</p>
              <p className={`${escrowRateMetaClass} mt-2 mb-4`}>{t("rate_releaseCompleteHint")}</p>
              <Link href="/orders" className={`inline-flex items-center ${escrowRateOutlineBtnClass}`}>
                {t("escrow_backToOrders")}
              </Link>
            </section>
          )}

          <ProductCrossNav
            ariaLabelKey="rate_relatedNav_aria"
            showGuides
            className={`mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300 pt-4 ${escrowRateFooterDividerClass}`}
            linkClassName={`inline-flex min-h-[44px] items-center justify-center ${escrowRateFooterLinkClass} ${RATE_NAV_FOCUS}`}
            separatorClassName="text-slate-500"
          />
        </div>
      </div>
    </main>
  );
}
