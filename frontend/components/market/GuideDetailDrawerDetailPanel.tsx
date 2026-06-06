"use client";

import Image from "next/image";
import { TT_MARKETING_FOCUS_RING_DARK_SURFACE, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import type { GuideCardItem } from "./GuideCard";
import { touchTargetLink44Classes} from "@/lib/travelLinkFocus";
import {
  marketDetailDrawerAccentBlockLink,
  marketDetailDrawerBlockLink,
  marketDetailDrawerPrimaryCta,
  marketDetailDrawerSecondaryBtn,
  marketDetailDrawerSkeletonBlock,
  marketDetailDrawerSkeletonLine,
  marketDetailDrawerSubtle,
} from "@/components/market/marketDetailDrawerClasses";
import { isMarketGuideMockShowcaseId } from "@/lib/marketMockData";
import { trackMarketEvent } from "@/lib/analytics";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";

export type GuideDetailDrawerDetailPanelProps = {
  t: (key: string) => string;
  invalidId: boolean;
  notFound: boolean;
  fetchError: string | null;
  loadingDetail: boolean;
  setDetailFetchRetryTick: React.Dispatch<React.SetStateAction<number>>;
  shellGuide: GuideCardItem;
  name: string;
  langs: string;
  tags: string[];
  avatarAlt: string;
  shellAvatarResolved: string;
  dash: string;
  neutralActions: ReactNode;
  onClose: () => void;
  onInvite?: (guideId: string) => void;
};

/** 详情抽屉：无效 id / 404 / 同步错误 / 骨架 / 主档案区（从 `GuideDetailDrawer` 抽出以控行数） */
export function GuideDetailDrawerDetailPanel({
  t,
  invalidId,
  notFound,
  fetchError,
  loadingDetail,
  setDetailFetchRetryTick,
  shellGuide,
  name,
  langs,
  tags,
  avatarAlt,
  shellAvatarResolved,
  dash,
  neutralActions,
  onClose,
  onInvite,
}: GuideDetailDrawerDetailPanelProps) {
  return (
    <>
      {invalidId ? (
        <div className="space-y-3 py-1">
          <p className="text-body font-medium text-white">{t("market_guideDrawer_invalidId")}</p>
          <p className={marketDetailDrawerSubtle}>{t("market_guideDrawer_notFoundHint")}</p>
          {neutralActions}
        </div>
      ) : null}

      {!invalidId && notFound ? (
        <div className="space-y-3 py-1">
          <p className="text-body font-medium text-white">{t("guideDetail_notFound")}</p>
          <p className={marketDetailDrawerSubtle}>{t("market_guideDrawer_notFoundHint")}</p>
          {neutralActions}
        </div>
      ) : null}

      {!invalidId && !notFound ? (
        <>
          {fetchError ? (
            <div className="space-y-2" role="alert">
              <div className="rounded-[var(--radius-sm)] border border-danger/35 bg-danger/10 p-3 space-y-2">
                <p className="text-small font-semibold text-danger">{t("guide_detail_syncFailed_title")}</p>
                <p className="text-meta text-slate-200 leading-relaxed">{t("guide_detail_syncFailed_body")}</p>
                {process.env.NODE_ENV === "development" ? (
                  <details className="text-meta text-slate-400 pt-1 border-t border-ref-sun/16 mt-2">
                    <summary className="cursor-pointer select-none text-slate-300 hover:text-white pt-2">
                      {t("guide_detail_devHint_summary")}
                    </summary>
                    <p className="mt-2 text-slate-400 font-mono text-meta break-all">{fetchError}</p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-400">{t("api_error_backendHint")}</p>
                  </details>
                ) : null}
              </div>
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (loadingDetail) return;
                  setDetailFetchRetryTick((n) => n + 1);
                }}
              >
                <button
                  type="submit"
                  disabled={loadingDetail}
                  aria-busy={loadingDetail ? true : undefined}
                  aria-label={t("common_retry")}
                  className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ref-sun/12 px-4 py-2.5 text-small font-medium text-white hover:bg-ref-sun/14 disabled:opacity-50 disabled:cursor-not-allowed ${TT_MARKETING_FOCUS_RING_DARK_SURFACE}`}
                >
                  {loadingDetail ? t("common_retrying") : t("common_retry")}
                </button>
              </form>
            </div>
          ) : null}
          {loadingDetail && !fetchError ? (
            <div
              className="space-y-2"
              role="status"
              aria-live="polite"
              aria-busy={true}
              aria-label={t("common_loading")}
            >
              <p className="sr-only">{t("common_loading")}</p>
              <div className={`h-3 w-40 max-w-[55%] ${marketDetailDrawerSkeletonLine}`} />
              <div className={`h-12 w-full ${marketDetailDrawerSkeletonBlock}`} />
              <div className={`h-12 w-full ${marketDetailDrawerSkeletonBlock}`} />
            </div>
          ) : null}
          <div className={`flex items-center gap-3 ${loadingDetail ? "opacity-70" : ""}`}>
            {shellAvatarResolved ? (
              <>
                <Image
                  src={shellAvatarResolved}
                  alt={avatarAlt}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover shrink-0 ring-1 ring-ref-sun/22"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                  unoptimized={communityMediaNextImageUnoptimized(shellAvatarResolved)}
                />
                <div
                  className="hidden w-14 h-14 rounded-full bg-ref-sun/12 flex items-center justify-center text-h4 font-semibold text-ref-sun shrink-0 ring-1 ring-ref-sun/22"
                  aria-hidden="true"
                >
                  {shellGuide.city?.charAt(0) ?? "导"}
                </div>
              </>
            ) : (
              <div className="w-14 h-14 rounded-full bg-ref-sun/12 flex items-center justify-center text-h4 font-semibold text-ref-sun shrink-0 ring-1 ring-ref-sun/22">
                {shellGuide.city?.charAt(0) ?? "导"}
              </div>
            )}
            <div>
              <p className="text-body font-semibold text-white">{name}</p>
              <p className={`text-small ${marketDetailDrawerSubtle}`}>{shellGuide.city ?? dash}</p>
              <span className="inline-block mt-1 rounded-[var(--radius-sm)] border border-success/30 bg-success/15 text-success px-2 py-0.5 text-meta font-medium">
                {t("guide_detail_didVerified")}
              </span>
            </div>
          </div>
          {(shellGuide.rating != null || shellGuide.completedCount != null || shellGuide.responseSLA) && (
            <div className="flex flex-wrap gap-3 text-small text-slate-400">
              {shellGuide.rating != null && (
                <span>{t("guide_card_rating").replace("{{n}}", String(shellGuide.rating))}</span>
              )}
              {shellGuide.completedCount != null && (
                <span>{t("guide_card_completed").replace("{{n}}", String(shellGuide.completedCount))}</span>
              )}
              {shellGuide.responseSLA && (
                <span>{t("guide_card_response").replace("{{n}}", shellGuide.responseSLA)}</span>
              )}
            </div>
          )}
          {shellGuide.hourly_rate != null && shellGuide.hourly_rate !== "" && (
            <div>
              <p className={`${marketDetailDrawerSubtle} mb-0.5`}>{t("guide_detail_price")}</p>
              <p className="text-body font-semibold text-ref-sun/90">
                {t("guide_detail_perHour")
                  .replace("{{amount}}", String(shellGuide.hourly_rate))
                  .replace(
                    "{{currency}}",
                    typeof shellGuide.hourly_currency === "string" && shellGuide.hourly_currency.trim()
                      ? shellGuide.hourly_currency.trim()
                      : t("market_guide_hourly_currency_unspecified"),
                  )}
              </p>
              {(shellGuide.priceRange?.guideFeePerDay != null || shellGuide.priceRange?.carFeePerDay != null) && (
                <p className="text-meta text-slate-400 mt-1">
                  {shellGuide.priceRange.guideFeePerDay != null &&
                    t("guide_card_feePerDay").replace("{{amount}}", String(shellGuide.priceRange.guideFeePerDay))}
                  {shellGuide.priceRange.carFeePerDay != null &&
                    ` · ${t("guide_card_carPerDay").replace("{{amount}}", String(shellGuide.priceRange.carFeePerDay))}`}
                </p>
              )}
              <p className={marketDetailDrawerSubtle}>{t("guide_card_onChainNote")}</p>
            </div>
          )}
          <div>
            <p className={`${marketDetailDrawerSubtle} mb-0.5`}>{t("guide_card_lang").replace("：", "")}</p>
            <p className="text-small text-slate-200">{langs}</p>
          </div>
          {tags.length > 0 && (
            <div>
              <p className={`${marketDetailDrawerSubtle} mb-1`}>{t("guide_detail_specialty")}</p>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[var(--radius-sm)] border border-ref-sun/18 bg-ref-sun/12 text-slate-100 px-2 py-0.5 text-small"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className={`${marketDetailDrawerSubtle} mb-0.5`}>{t("guide_detail_bio")}</p>
            <p className="text-small text-slate-300 whitespace-pre-wrap">
              {shellGuide.bio || t("guide_detail_bioEmpty")}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {onInvite && (
              <form
                className="w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  trackMarketEvent("market_guide_drawer_book_click", { guideId: shellGuide.id });
                  onInvite(shellGuide.id);
                }}
              >
                <button
                  type="submit"
                  disabled={loadingDetail}
                  data-tt-guide-drawer-book-cta="1"
                  className={marketDetailDrawerPrimaryCta}
                >
                  {t("guide_card_book")}
                </button>
              </form>
            )}
            {isMarketGuideMockShowcaseId(String(shellGuide.id)) ? (
              <p className={`${marketDetailDrawerSubtle} text-center`}>{t("guide_detail_viewPage_demo")}</p>
            ) : (
              <Link
                href={`/guides/${encodeURIComponent(shellGuide.id)}`}
                onClick={() => onClose()}
                className={marketDetailDrawerBlockLink}
              >
                {t("guide_detail_viewPage")}
              </Link>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
