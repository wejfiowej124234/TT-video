"use client";

import Link from "next/link";
import { ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import type { BookGuideResolve } from "./ordersListPageModel";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

export function OrdersBookGuideBannerSection({
  t,
  bookGuideParam,
  bookGuideResolve,
}: {
  t: (key: string) => string;
  bookGuideParam: string;
  bookGuideResolve: BookGuideResolve;
}) {
  if (!bookGuideParam) return null;
  return (
    <>
      {bookGuideResolve === "checking" ? (
        <div className={TT_ORDERS_LIST_L5.bookGuideCheckingPanel} role="status" aria-live="polite" aria-busy="true">
          <div className="space-y-2">
            <div className={`h-4 w-48 max-w-full ${TT_ORDERS_LIST_L5.skeletonShimmer}`} aria-hidden />
            <div className={`h-3 w-full max-w-md ${TT_ORDERS_LIST_L5.skeletonShimmer}`} aria-hidden />
          </div>
          <p className="sr-only">{t("orders_bookGuide_checking")}</p>
        </div>
      ) : null}
      {bookGuideResolve === "invalid_not_found" ||
      bookGuideResolve === "invalid_load" ||
      bookGuideResolve === "invalid_book_guide_id" ? (
        <div className={TT_ORDERS_LIST_L5.bookGuideInvalidPanel} role="alert" aria-live="polite">
          <p className={`${TT_ORDERS_LIST_L5.panelTitle} mb-1`}>
            {bookGuideResolve === "invalid_book_guide_id"
              ? t("orders_bookGuide_badIdTitle")
              : bookGuideResolve === "invalid_not_found"
                ? t("orders_bookGuide_invalidTitle")
                : t("orders_bookGuide_verifyFailedTitle")}
          </p>
          <p className={`${TT_ORDERS_LIST_L5.panelBodyMuted} mb-4`}>
            {bookGuideResolve === "invalid_book_guide_id"
              ? t("orders_bookGuide_badIdDesc")
              : bookGuideResolve === "invalid_not_found"
                ? t("orders_bookGuide_invalidDesc")
                : t("orders_bookGuide_verifyFailedDesc")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/guides" className={TT_ORDERS_LIST_L5.bookGuideCtaPrimary}>
              {t("orders_guides")}
            </Link>
            <Link href="/market" className={TT_ORDERS_LIST_L5.bookGuideCtaSecondary}>
              {t("orders_market")}
            </Link>
            <Link href="/orders" className={TT_ORDERS_LIST_L5.bookGuideCtaSecondary}>
              {t("orders_bookGuide_clearParam")}
            </Link>
          </div>
        </div>
      ) : null}
      {bookGuideResolve === "valid" ? (
        <div className={TT_ORDERS_LIST_L5.bookGuideValidOuter}>
          <div className={TT_ORDERS_LIST_L5.heroFrame}>
            <div className={TT_ORDERS_LIST_L5.bookGuideValidInner} role="status">
              <div className="space-y-1">
                <p className={TT_ORDERS_LIST_L5.panelTitle}>{t("orders_bookingHint")}</p>
                <p className={TT_ORDERS_LIST_L5.panelBodyMuted}>{t("orders_bookingDesc")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={ordersNewHrefForGuide(bookGuideParam)} className={TT_ORDERS_LIST_L5.bookGuideCtaPrimary}>
                  {t("orders_bookingQuickCreate")}
                </Link>
                <Link href="/" className={TT_ORDERS_LIST_L5.bookGuideCtaSecondary}>
                  {t("orders_goCreateItin")}
                </Link>
                <Link
                  href={`/itinerary/new?guide_id=${encodeURIComponent(bookGuideParam)}`}
                  className={TT_ORDERS_LIST_L5.bookGuideCtaSecondary}
                >
                  {t("orders_createDraft")}
                </Link>
                <Link href="/market" className={TT_ORDERS_LIST_L5.bookGuideCtaSecondary}>
                  {t("orders_backMarket")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
