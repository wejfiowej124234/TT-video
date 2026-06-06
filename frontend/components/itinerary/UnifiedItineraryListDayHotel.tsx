"use client";

import Image from "next/image";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { PLACEHOLDER_IMAGE_HOTEL } from "./placeholders";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListDayHotelProps = {
  row: UnifiedDayRow;
  t: (k: string) => string;
  u: UnifiedItineraryListChrome;
  displayCurrency: string;
};

export default function UnifiedItineraryListDayHotel({ row, t, u, displayCurrency }: UnifiedItineraryListDayHotelProps) {
  if (row.hotel == null) return null;
  const h =
    typeof row.hotel === "string"
      ? { name: row.hotel, area: undefined, price: undefined, intro: undefined, image: undefined }
      : row.hotel;
  const hotelImg = (h as { image?: string }).image ?? PLACEHOLDER_IMAGE_HOTEL;
  return (
    <div className="mt-3 space-y-2">
      <span className={u.label}>{t("escrow_hotel")?.replace(": ", "") ?? "Accommodation"}</span>
      <div className={u.attrCard}>
        <span className={`${u.imgWrap} shrink-0`}>
          <Image
            src={communityMediaAbsoluteUrlForRender(hotelImg)}
            alt={(h as { name?: string }).name ?? ""}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={communityMediaNextImageUnoptimized(communityMediaAbsoluteUrlForRender(hotelImg))}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={u.strong}>{(h as { name?: string }).name ?? ""}</p>
            {(h as { price?: number }).price != null ? (
              <span className={u.priceMeta}>
                {(h as { price?: number }).price} {displayCurrency}
              </span>
            ) : null}
          </div>
          {(h as { intro?: string }).intro ? (
            <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{(h as { intro?: string }).intro}</p>
          ) : null}
          {(h as { area?: string }).area ? (
            <p className={`${u.metaDim} mt-1`}>{(h as { area?: string }).area}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
