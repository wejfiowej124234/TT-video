"use client";

import type { ItineraryBlock, OrderRow } from "./types";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  getDailyItineraryOutline,
  getFirstDayImage,
  type DailyItemForSummary,
} from "@/components/landing/itineraryResultsUtils";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";

type ChatItineraryMicroRibbonProps = {
  inline: { order: OrderRow; itinerary: ItineraryBlock | null } | null | undefined;
  isDid: boolean;
  t: (key: string, vars?: LocaleInterpolationVars) => string;
};

/** 53-S7 可选增强：消息区上方微型行程条（与 OrderChatContextCard 同源数据，免二次请求） */
export function ChatItineraryMicroRibbon({ inline, isDid, t }: ChatItineraryMicroRibbonProps) {
  if (!inline?.order?.id) return null;
  const daily = inline.itinerary?.daily_itinerary as DailyItemForSummary[] | undefined;
  const hasDays = (daily?.length ?? 0) > 0;
  const dest = typeof inline.order.destination === "string" ? inline.order.destination.trim() : "";
  const city = typeof inline.order.city === "string" ? inline.order.city.trim() : "";
  const headline = [dest, city].filter(Boolean).join(" · ");
  if (!hasDays && !headline) return null;

  const dash = t("ui_em_dash");
  const outline = hasDays ? getDailyItineraryOutline(daily, dash, t, 3) : "";
  const orderImg = inline.order.image;
  const coverRaw =
    getFirstDayImage(daily) ?? (typeof orderImg === "string" && orderImg.trim() !== "" ? orderImg.trim() : null);
  const cover = coverRaw ? communityMediaAbsoluteUrlForRender(coverRaw) : null;

  const shell = isDid
    ? "rounded-[var(--radius-md)] border border-slate-600/40 bg-ink-700/25 px-2 py-1.5 mb-2 flex gap-2 items-center"
    : "rounded-[var(--radius-md)] border border-ink-200/60 bg-bg-soft/40 px-2 py-1.5 mb-2 flex gap-2 items-center";

  return (
    <div className={shell} role="note" aria-label={t("escrow_chat_microItinerary_aria")}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- 行程图任意 HTTPS
        <img
          src={cover}
          alt={headline ? t("escrow_chat_microItinerary_thumb_alt", { headline }) : t("escrow_chat_microItinerary_thumb_alt_generic")}
          className="h-11 w-11 rounded-[var(--radius-sm)] object-cover shrink-0 border border-slate-600/30"
          fetchPriority="high"
          decoding="async"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={`text-meta font-medium truncate ${isDid ? "text-slate-300" : "text-ink-600"}`}>
          {t("escrow_chat_microItinerary_label")}
        </p>
        {headline ? (
          <p className={`text-small truncate ${isDid ? "text-slate-200" : "text-ink-800"}`}>{headline}</p>
        ) : null}
        {outline ? (
          <p className={`text-meta truncate ${isDid ? "text-slate-300" : "text-ink-500"}`}>{outline}</p>
        ) : null}
      </div>
    </div>
  );
}
