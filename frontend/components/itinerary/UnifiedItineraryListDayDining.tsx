"use client";

import Image from "next/image";
import type { DiningItem, UnifiedDayRow } from "@/lib/itineraryUnified";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
  outboundUrlFromPersisted,
} from "@/lib/communityMediaClientUrl";
import { PLACEHOLDER_IMAGE_DINING } from "./placeholders";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListDayDiningProps = {
  row: UnifiedDayRow;
  t: (k: string) => string;
  u: UnifiedItineraryListChrome;
  displayCurrency: string;
};

export default function UnifiedItineraryListDayDining({ row, t, u, displayCurrency }: UnifiedItineraryListDayDiningProps) {
  if (!Array.isArray(row.dining) || row.dining.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <span className={u.label}>{t("escrow_catering")?.replace(": ", "") ?? "Dining"}</span>
      {row.dining.map((d, i) => {
        const item =
          typeof d === "string"
            ? { name: d, description: undefined, image: undefined, price: undefined }
            : (d as DiningItem);
        const imgSrc = item.image ?? PLACEHOLDER_IMAGE_DINING;
        return (
          <div key={i} className={u.attrCard}>
            <span className={`${u.imgWrap} shrink-0`}>
              <Image
                src={communityMediaAbsoluteUrlForRender(imgSrc)}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={communityMediaNextImageUnoptimized(communityMediaAbsoluteUrlForRender(imgSrc))}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={u.strong}>{item.name}</p>
                {item.price != null ? (
                  <span className={u.priceMeta}>
                    {item.price} {displayCurrency}
                  </span>
                ) : null}
              </div>
              {item.description ? <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{item.description}</p> : null}
              {item.open_hours ? (
                <p className={`${u.metaDim} mt-1`}>
                  {t("itin_openHours")}: {item.open_hours}
                </p>
              ) : null}
              {item.reservation_link ? (
                <a
                  href={outboundUrlFromPersisted(item.reservation_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${u.link} mt-0.5`}
                >
                  {t("itin_reservationLink")}
                </a>
              ) : null}
              {item.map_link ? (
                <a
                  href={outboundUrlFromPersisted(item.map_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${u.link} mt-1`}
                >
                  {t("itin_viewOnMap")}
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
