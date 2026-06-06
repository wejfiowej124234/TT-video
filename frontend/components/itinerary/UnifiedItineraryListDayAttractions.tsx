"use client";

import Image from "next/image";
import type { AttractionItem, UnifiedDayRow } from "@/lib/itineraryUnified";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
  outboundUrlFromPersisted,
} from "@/lib/communityMediaClientUrl";
import { PLACEHOLDER_IMAGE_SCENIC } from "./placeholders";
import type { UnifiedItineraryListChrome } from "./unifiedItineraryListChrome";

export type UnifiedItineraryListDayAttractionsProps = {
  row: UnifiedDayRow;
  t: (k: string) => string;
  u: UnifiedItineraryListChrome;
};

export default function UnifiedItineraryListDayAttractions({ row, t, u }: UnifiedItineraryListDayAttractionsProps) {
  if (!Array.isArray(row.attractions) || row.attractions.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <span className={u.label}>{t("order_tickets") ?? "Attractions"}</span>
      {row.attractions.map((a, i) => {
        const item = typeof a === "string" ? { name: a, intro: undefined, image: undefined } : (a as AttractionItem);
        const imgSrc = item.image ?? PLACEHOLDER_IMAGE_SCENIC;
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
              <p className={u.strong}>{item.name}</p>
              {item.intro ? <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{item.intro}</p> : null}
              {(item.duration_estimate || item.open_hours) && (
                <p className={`${u.metaDim} mt-1`}>
                  {item.duration_estimate ? (
                    <span>
                      {t("itin_durationEstimate")}: {item.duration_estimate}
                    </span>
                  ) : null}
                  {item.duration_estimate && item.open_hours ? " · " : null}
                  {item.open_hours ? (
                    <span>
                      {t("itin_openHours")}: {item.open_hours}
                    </span>
                  ) : null}
                </p>
              )}
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
