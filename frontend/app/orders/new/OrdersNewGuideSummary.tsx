"use client";

import Image from "next/image";

import { useTranslation } from "@/components/LocaleProvider";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { formatTripRangeLabel } from "@/lib/guideBookingDates";
import { communityMediaAbsoluteUrlForRender, communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import { TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";
import type { OrdersNewGuideRow } from "./ordersNewPageModel";

export function OrdersNewGuideSummary({
  guide,
  tripStart,
  tripEnd,
}: {
  guide: OrdersNewGuideRow;
  tripStart?: string;
  tripEnd?: string;
}) {
  const { t, locale } = useTranslation();
  const name = formatGuideDisplayName(t, guide);
  const avatarSrc = guide.avatar_url?.trim()
    ? communityMediaAbsoluteUrlForRender(guide.avatar_url.trim())
    : "";
  const tripLabel =
    tripStart?.trim() && tripEnd?.trim()
      ? formatTripRangeLabel(tripStart.trim(), tripEnd.trim(), locale)
      : null;

  return (
    <div className="flex items-start gap-3" data-tt-orders-new-guide-summary="1">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-ref-sun/25 bg-ink-800/80">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={t("guide_card_avatarAlt").replace("{{name}}", name)}
            width={56}
            height={56}
            className="h-full w-full object-cover"
            unoptimized={communityMediaNextImageUnoptimized(avatarSrc)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-meta text-slate-400">
            {name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${TT_ORDERS_NEW_L5.guideBannerTitle} break-words`}>{name}</p>
        {guide.city ? <p className={TT_ORDERS_NEW_L5.mutedText}>{guide.city}</p> : null}
        {typeof guide.rating === "number" ? (
          <p className={TT_ORDERS_NEW_L5.metaText}>
            {t("guide_card_rating").replace("{{n}}", String(guide.rating))}
          </p>
        ) : null}
        {tripLabel ? (
          <p className={`${TT_ORDERS_NEW_L5.metaText} mt-1`}>
            {t("orders_trip_dates_label").replace("{{range}}", tripLabel)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
