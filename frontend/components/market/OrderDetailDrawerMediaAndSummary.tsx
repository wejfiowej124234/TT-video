"use client";

import Image from "next/image";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import {
  orderProjectionDivergesFromOrderState,
  orderProjectionTerminalDegraded,
} from "@/lib/orderProjectionDisplayStatus";
import {
  marketDetailDrawerHeroMedia,
  marketDetailDrawerSubtle,
} from "@/components/market/marketDetailDrawerClasses";
import type { OrderDetailItem } from "./orderDetailDrawerModel";

export function OrderDetailDrawerMediaAndSummary({
  displayOrder,
  t,
  dest,
  statusText,
  orderHeroImageSrc,
  imageAlt,
}: {
  displayOrder: OrderDetailItem;
  t: (key: string) => string;
  dest: string;
  statusText: string | null;
  orderHeroImageSrc: string;
  imageAlt: string;
}) {
  return (
    <>
      {orderHeroImageSrc ? (
        <div className={marketDetailDrawerHeroMedia}>
          <Image
            src={orderHeroImageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const next = e.currentTarget.nextElementSibling;
              if (next) next.classList.remove("hidden");
            }}
            unoptimized={communityMediaNextImageUnoptimized(orderHeroImageSrc)}
          />
          <div
            className="hidden absolute inset-0 z-[1] flex items-center justify-center text-meta text-slate-400"
            aria-hidden="true"
          >
            {t("order_imageLoadFailed")}
          </div>
        </div>
      ) : null}
      <section className="space-y-1">
        <p className="text-h4 font-semibold text-white">{dest}</p>
        <p className={`text-small ${marketDetailDrawerSubtle}`}>
          {statusText && <span className="mr-2">{statusText}</span>}
          {displayOrder.days != null ? `${displayOrder.days}${t("order_dayUnit")}` : ""}
          {displayOrder.headcount != null && displayOrder.headcount > 0
            ? ` · ${displayOrder.headcount}${t("order_personUnit")}`
            : ""}
          {" · "}
          {t("order_versionLabel").replace("{{n}}", String(displayOrder.version ?? 1))}
        </p>
        {orderProjectionDivergesFromOrderState(displayOrder) || orderProjectionTerminalDegraded(displayOrder) ? (
          <p className="text-meta text-warning/95 mt-1 leading-snug" role="note">
            {orderProjectionTerminalDegraded(displayOrder)
              ? t("orders_projection_ssot_degraded")
              : t("orders_projection_ssot_notice_divergent")}
          </p>
        ) : null}
      </section>
    </>
  );
}
