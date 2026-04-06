"use client";

import { useId, useState } from "react";
import Image from "next/image";
import {
  type UnifiedDayRow,
  type AmountBreakdownUnified,
  type AttractionItem,
  type DiningItem,
  getDayDescription,
  getDayImages,
} from "@/lib/itineraryUnified";
import { resolveEvenSplitPerDay } from "@/lib/itineraryEvenSplit";
import { PLACEHOLDER_IMAGE_SCENIC, PLACEHOLDER_IMAGE_HOTEL, PLACEHOLDER_IMAGE_DINING } from "./placeholders";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes, travelFocusRingOffset1Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
export interface UnifiedItineraryListProps {
  /** 52 §3.1 按日行程行数组（兼容 content_text / content_images） */
  days: UnifiedDayRow[];
  /** 52 §3.2 费用分项 + 总价；可选，有则展示在下方 */
  amountBreakdown?: AmountBreakdownUnified | null;
  currency?: string;
  /** 是否支持折叠（多日时） */
  collapsible?: boolean;
  /** 52 §3.4 Escrow 内用 Trust 轴、银行级无玻璃；did = 订单协议区 30-DID 深色底上的浅色字（54-S1/P54-001） */
  variant?: "travel" | "trust" | "did";
  /** 文案：住宿/餐饮/…/合计 */
  t?: (key: string) => string;
}

const AMOUNT_KEYS: { key: keyof AmountBreakdownUnified; i18n: string }[] = [
  { key: "hotel", i18n: "escrow_hotel" },
  { key: "catering", i18n: "escrow_catering" },
  { key: "tickets", i18n: "escrow_tickets" },
  { key: "guide_fee", i18n: "escrow_guideFee" },
  { key: "vehicle", i18n: "escrow_vehicle" },
  { key: "platform_fee", i18n: "escrow_platformFee" },
];

function formatAmount(v: number | undefined | null, dash: string): string {
  if (v == null || Number.isNaN(v)) return dash;
  const n = Math.round(v * 100) / 100;
  return n.toFixed(2);
}

export default function UnifiedItineraryList({
  days,
  amountBreakdown,
  currency,
  collapsible = true,
  variant = "trust",
  t = (k) => k,
}: UnifiedItineraryListProps) {
  const sectionLabelId = useId();
  const dash = t("ui_em_dash");
  const displayCurrency =
    typeof currency === "string" && currency.trim()
      ? currency.trim()
      : t("market_guide_hourly_currency_unspecified");
  const isTrust = variant === "trust";
  const isDid = variant === "did";
  const cardClass = isDid
    ? "rounded-[var(--radius-sm)] border border-cyan-500/25 bg-slate-900/60 backdrop-blur-sm p-4"
    : isTrust
      ? "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft p-4"
      : "rounded-[var(--radius-md)] border border-white/25 bg-white/5 p-4";

  /** 深色协议区（did）与浅色 Trust/Landing 的语义色 */
  const u = {
    sectionHead: isDid ? "text-small font-semibold text-slate-200" : "text-small font-semibold text-ink-800",
    dayTitle: isDid ? "text-small font-semibold text-slate-100" : "text-small font-semibold text-ink-800",
    body: isDid ? "text-small text-slate-300" : "text-small text-ink-700",
    metaMed: isDid ? "text-meta text-slate-300" : "text-meta text-ink-600",
    metaDim: isDid ? "text-meta text-slate-400" : "text-meta text-ink-500",
    label: isDid ? "text-meta font-medium text-slate-300" : "text-meta font-medium text-ink-700",
    strong: isDid ? "font-medium text-slate-100" : "font-medium text-ink-800",
    link: isDid
      ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline motion-sub rounded-[var(--radius-sm)] px-1 ${communityCardLinkFocus}`
      : `${touchTargetLink44Classes} text-meta text-travel-600 hover:underline underline-offset-2 ${travelFocusRingOffset2Classes}`,
    expandBtn: isDid
      ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 rounded-[var(--radius-sm)] px-1.5 py-0.5 shrink-0 transition-colors duration-200 ${communityCardLinkFocus}`
      : `${touchTargetLink44Classes} text-meta text-travel-500 hover:text-travel-600 ${travelFocusRingOffset1Classes} px-1.5 py-0.5 shrink-0 transition-colors duration-200`,
    expandAll: isDid
      ? `${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 hover:underline motion-sub rounded-[var(--radius-sm)] px-1 ${communityCardLinkFocus}`
      : `${touchTargetLink44Classes} text-meta text-travel-600 hover:text-travel-700 hover:underline motion-sub ${travelFocusRingOffset2Classes}`,
    attrCard: isDid
      ? "flex gap-3 rounded-[var(--radius-sm)] border border-slate-600/50 bg-slate-950/50 p-2.5 text-small text-slate-300"
      : "flex gap-3 rounded-[var(--radius-sm)] border border-ink-200/80 bg-bg-soft/50 p-2.5 text-small text-ink-700",
    imgWrap: isDid
      ? "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-slate-600 bg-slate-900/50"
      : "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-ink-200",
    thumbGrid: isDid
      ? "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-slate-600 bg-slate-900/50"
      : "relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-ink-200 bg-bg-soft",
    quoteHeading: isDid ? "text-small font-semibold text-cyan-200 mb-2" : "text-small font-semibold text-ink-800 mb-2",
    quoteList: isDid ? "text-meta text-slate-300 space-y-0.5" : "text-meta text-ink-600 space-y-0.5",
    quoteTotal: isDid
      ? "font-semibold text-slate-200 pt-1 border-t border-slate-600/50 mt-1"
      : "font-semibold text-ink-800 pt-1 border-t border-ink-200 mt-1",
    priceMeta: isDid ? "text-meta font-medium text-slate-300 shrink-0" : "text-meta font-medium text-ink-700 shrink-0",
  };

  const showCollapse = collapsible && days.length > 1;
  /** did 与 trust 同为 Escrow 内扁平列表，不用 travel 时间线轴 */
  const showTimelineAccent = !isTrust && !isDid && showCollapse;
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set());
  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex)) next.delete(dayIndex);
      else next.add(dayIndex);
      return next;
    });
  };
  const expandAll = () => setExpandedDays(new Set(days.map((d) => d.day_index)));
  const collapseAll = () => setExpandedDays(new Set());

  /** 52/53：尚无按日分项时，用总价÷天数给出可读估算（与 itin_dayCostEvenSplitHint 同读，避免误读为真实拆分） */
  const evenSplitPerDay = resolveEvenSplitPerDay(amountBreakdown?.total_budget, days.length);

  if (!days?.length) return null;

  return (
    <div className="space-y-4">
      {showCollapse && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={u.sectionHead} id={sectionLabelId}>{t("itin_section_daily") || "Daily itinerary"}</span>
          <div className="flex gap-2">
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                expandAll();
              }}
            >
              <button type="submit" className={u.expandAll} aria-label={t("itin_expandAll")}>
                {t("itin_expandAll")}
              </button>
            </form>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                collapseAll();
              }}
            >
              <button type="submit" className={u.expandAll} aria-label={t("itin_collapseAll")}>
                {t("itin_collapseAll")}
              </button>
            </form>
          </div>
        </div>
      )}
      <ul className="space-y-3" role="list" aria-labelledby={showCollapse ? sectionLabelId : undefined} aria-label={!showCollapse ? (t("itin_section_daily") || "Daily itinerary") : undefined}>
        {days.map((row, dayIdx) => {
          const desc = getDayDescription(row);
          const images = getDayImages(row);
          const dayLabel = row.date
            ? `${t("itin_day")?.replace("{{n}}", String(row.day_index))} · ${row.date}`
            : t("itin_day")?.replace("{{n}}", String(row.day_index)) ?? `Day ${row.day_index}`;
          const summaryLine = [row.city, dayLabel].filter(Boolean).join(" · ");
          const isExpanded = !showCollapse || expandedDays.has(row.day_index);
          const hasDetail = desc || images.length > 0 || (Array.isArray(row.attractions) && row.attractions.length > 0) || (Array.isArray(row.dining) && row.dining.length > 0) || row.hotel != null || row.price_note != null;
          const imageAlt = desc ? `${summaryLine}: ${desc.slice(0, 50)}${desc.length > 50 ? "…" : ""}` : `${summaryLine}`;

          const isLastDay = dayIdx === days.length - 1;
          return (
            <li key={row.day_index} className={showTimelineAccent ? "flex gap-3" : ""}>
              {showTimelineAccent && (
                <div className="shrink-0 flex flex-col items-center w-14 pt-0.5" aria-hidden="true">
                  <span className="inline-flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-travel-500/50 text-white text-meta font-semibold">
                    {row.day_index}
                  </span>
                  {row.date && (
                    <span className={`text-meta mt-1 text-center leading-tight ${isDid ? "text-slate-300" : "text-ink-500"}`}>{row.date}</span>
                  )}
                  {!isLastDay && (
                    <span className="w-0.5 flex-1 min-h-[12px] bg-travel-500/40 mt-1 rounded-full" />
                  )}
                </div>
              )}
              <div className={`flex-1 min-w-0 ${cardClass} ${showTimelineAccent ? "relative" : ""}`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={u.dayTitle} id={`itinerary-day-${row.day_index}-label`}>
                      {row.city ? `${row.city} · ` : ""}{dayLabel}
                    </span>
                    {row.price_note != null && (
                      <p className={`${u.metaMed} mt-0.5`} aria-label={t("itin_dayEstimate") || "Day estimate"}>
                        {typeof row.price_note === "number"
                          ? `${t("itin_dayEstimate") || "Est."} ${row.price_note} ${displayCurrency}`
                          : String(row.price_note)}
                      </p>
                    )}
                  </div>
                  {showCollapse && hasDetail && (
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        toggleDay(row.day_index);
                      }}
                    >
                      <button
                        type="submit"
                        aria-expanded={isExpanded}
                        aria-controls={`itinerary-day-${row.day_index}-body`}
                        aria-labelledby={`itinerary-day-${row.day_index}-label`}
                        className={u.expandBtn}
                      >
                        {isExpanded ? (t("order_detail_agreementCollapse") || "Collapse") : (t("order_detail_agreementExpand") || "Expand")}
                      </button>
                    </form>
                  )}
                </div>
                {!showCollapse && desc && (
                  <p className={`${u.body} whitespace-pre-wrap`}>{desc}</p>
                )}
                {showCollapse && hasDetail && (
                  <div
                    id={`itinerary-day-${row.day_index}-body`}
                    role="region"
                    aria-labelledby={`itinerary-day-${row.day_index}-label`}
                    aria-hidden={!isExpanded}
                    className="overflow-hidden transition-[max-height] duration-200 ease-out"
                    style={{ maxHeight: isExpanded ? 800 : 0 }}
                  >
                    {desc && (
                      <p className={`${u.body} whitespace-pre-wrap`}>{desc}</p>
                    )}
                    {(images.length > 0 || (desc && images.length === 0)) && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(images.length > 0 ? images : [PLACEHOLDER_IMAGE_SCENIC]).slice(0, 5).map((src, i) => (
                          <span
                            key={i}
                            className={u.thumbGrid}
                          >
                            <Image
                              src={src}
                              alt={i === 0 ? imageAlt : `${imageAlt} (${i + 1})`}
                              fill
                              className="object-cover"
                              sizes="80px"
                              unoptimized
                            />
                          </span>
                        ))}
                        {images.length > 5 && (
                          <span className={`${u.metaDim} self-center`}>+{images.length - 5}</span>
                        )}
                      </div>
                    )}
                    {/* 52 §3.0 行业最佳实践：图+文+价 单元卡片；无图时用占位图 */}
                    {Array.isArray(row.attractions) && row.attractions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <span className={u.label}>{t("order_tickets") ?? "Attractions"}</span>
                        {row.attractions.map((a, i) => {
                          const item = typeof a === "string" ? { name: a, intro: undefined, image: undefined } : a as AttractionItem;
                          const imgSrc = item.image ?? PLACEHOLDER_IMAGE_SCENIC;
                          return (
                            <div key={i} className={u.attrCard}>
                              <span className={`${u.imgWrap} shrink-0`}>
                                <Image src={imgSrc} alt={item.name} fill className="object-cover" sizes="80px" unoptimized />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className={u.strong}>{item.name}</p>
                                {item.intro && <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{item.intro}</p>}
                                {(item.duration_estimate || item.open_hours) && (
                                  <p className={`${u.metaDim} mt-1`}>
                                    {item.duration_estimate && <span>{t("itin_durationEstimate")}: {item.duration_estimate}</span>}
                                    {item.duration_estimate && item.open_hours && " · "}
                                    {item.open_hours && <span>{t("itin_openHours")}: {item.open_hours}</span>}
                                  </p>
                                )}
                                {item.reservation_link && (
                                  <a href={item.reservation_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-0.5`}>{t("itin_reservationLink")}</a>
                                )}
                                {item.map_link && (
                                  <a href={item.map_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-1`}>{t("itin_viewOnMap")}</a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {Array.isArray(row.dining) && row.dining.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <span className={u.label}>{t("escrow_catering")?.replace(": ", "") ?? "Dining"}</span>
                        {row.dining.map((d, i) => {
                          const item = typeof d === "string" ? { name: d, description: undefined, image: undefined, price: undefined } : d as DiningItem;
                          const imgSrc = item.image ?? PLACEHOLDER_IMAGE_DINING;
                          return (
                            <div key={i} className={u.attrCard}>
                              <span className={`${u.imgWrap} shrink-0`}>
                                <Image src={imgSrc} alt={item.name} fill className="object-cover" sizes="80px" unoptimized />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <p className={u.strong}>{item.name}</p>
                                  {item.price != null && <span className={u.priceMeta}>{item.price} {displayCurrency}</span>}
                                </div>
                                {item.description && <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{item.description}</p>}
                                {item.open_hours && (
                                  <p className={`${u.metaDim} mt-1`}>{t("itin_openHours")}: {item.open_hours}</p>
                                )}
                                {item.reservation_link && (
                                  <a href={item.reservation_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-0.5`}>{t("itin_reservationLink")}</a>
                                )}
                                {item.map_link && (
                                  <a href={item.map_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-1`}>{t("itin_viewOnMap")}</a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {row.hotel != null && (() => {
                      const h = typeof row.hotel === "string" ? { name: row.hotel, area: undefined, price: undefined, intro: undefined, image: undefined } : row.hotel;
                      const hotelImg = (h as { image?: string }).image ?? PLACEHOLDER_IMAGE_HOTEL;
                      return (
                        <div className="mt-3 space-y-2">
                          <span className={u.label}>{t("escrow_hotel")?.replace(": ", "") ?? "Accommodation"}</span>
                          <div className={u.attrCard}>
                            <span className={`${u.imgWrap} shrink-0`}>
                              <Image src={hotelImg} alt={(h as { name?: string }).name ?? ""} fill className="object-cover" sizes="80px" unoptimized />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className={u.strong}>{(h as { name?: string }).name ?? ""}</p>
                                {(h as { price?: number }).price != null && <span className={u.priceMeta}>{(h as { price?: number }).price} {displayCurrency}</span>}
                              </div>
                              {(h as { intro?: string }).intro && <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{(h as { intro?: string }).intro}</p>}
                              {(h as { area?: string }).area && <p className={`${u.metaDim} mt-1`}>{(h as { area?: string }).area}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {row.price_note != null && (
                      <p className={`${u.metaMed} mt-2`} role="text">
                        {typeof row.price_note === "number"
                          ? `${t("itin_daySubtotalEstimate") || "Day subtotal (est.)"}: ${row.price_note} ${displayCurrency}`
                          : String(row.price_note)}
                      </p>
                    )}
                    {isExpanded && row.price_note == null && evenSplitPerDay != null && (
                      <p className={`${u.metaMed} mt-2`} role="status">
                        <span className={u.strong}>{t("itin_dayCostEvenSplitLabel")}: </span>
                        {formatAmount(evenSplitPerDay, dash)} {displayCurrency}
                        <span className={`${u.metaDim} block sm:inline sm:ml-1 mt-0.5 sm:mt-0`}>
                          {t("itin_dayCostEvenSplitHint")}
                        </span>
                      </p>
                    )}
                    {isExpanded && row.price_note == null && evenSplitPerDay == null && (
                      <p className={`${u.metaDim} mt-2`} role="status">{t("itin_dayCostPlaceholder")}</p>
                    )}
                    {isExpanded && !(Array.isArray(row.attractions) && row.attractions.length > 0) && !(Array.isArray(row.dining) && row.dining.length > 0) && row.hotel == null && (desc || images.length > 0) && (
                      <p className={`${u.metaDim} mt-2`} role="status">{t("itin_dayNoDetail")}</p>
                    )}
                    {isExpanded && !desc && images.length === 0 && !(Array.isArray(row.attractions) && row.attractions.length > 0) && !(Array.isArray(row.dining) && row.dining.length > 0) && row.hotel == null && row.price_note == null && (
                      <p className={`${u.metaDim} mt-2`} aria-live="polite">{t("order_detail_emptyDayDetail") || "No day details yet."}</p>
                    )}
                  </div>
                )}
                {!showCollapse && (images.length > 0 || (desc && images.length === 0)) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(images.length > 0 ? images : [PLACEHOLDER_IMAGE_SCENIC]).slice(0, 5).map((src, i) => (
                      <span
                        key={i}
                        className={u.thumbGrid}
                      >
                        <Image
                          src={src}
                          alt={i === 0 ? imageAlt : `${imageAlt} (${i + 1})`}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized
                        />
                      </span>
                    ))}
                    {images.length > 5 && (
                      <span className={`${u.metaDim} self-center`}>+{images.length - 5}</span>
                    )}
                  </div>
                )}
                {!showCollapse && Array.isArray(row.attractions) && row.attractions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className={u.label}>{t("order_tickets") ?? "Attractions"}</span>
                    {row.attractions.map((a, i) => {
                      const item = typeof a === "string" ? { name: a, intro: undefined, image: undefined } : a as AttractionItem;
                      const imgSrc = item.image ?? PLACEHOLDER_IMAGE_SCENIC;
                      return (
                        <div key={i} className={u.attrCard}>
                          <span className={`${u.imgWrap} shrink-0`}>
                            <Image src={imgSrc} alt={item.name} fill className="object-cover" sizes="80px" unoptimized />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={u.strong}>{item.name}</p>
                            {item.intro && <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{item.intro}</p>}
                            {(item.duration_estimate || item.open_hours) && (
                              <p className={`${u.metaDim} mt-1`}>
                                {item.duration_estimate && <span>{t("itin_durationEstimate")}: {item.duration_estimate}</span>}
                                {item.duration_estimate && item.open_hours && " · "}
                                {item.open_hours && <span>{t("itin_openHours")}: {item.open_hours}</span>}
                              </p>
                            )}
                            {item.reservation_link && (
                              <a href={item.reservation_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-0.5`}>{t("itin_reservationLink")}</a>
                            )}
                            {item.map_link && (
                              <a href={item.map_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-1`}>{t("itin_viewOnMap")}</a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!showCollapse && row.price_note != null && (
                  <p className={`${u.metaMed} mt-2`}>
                    {typeof row.price_note === "number" ? `${t("itin_dayEstimate") || "Est."} ${row.price_note} ${displayCurrency}` : String(row.price_note)}
                  </p>
                )}
                {!showCollapse && row.price_note == null && evenSplitPerDay != null && (
                  <p className={`${u.metaMed} mt-2`} role="status">
                    <span className={u.strong}>{t("itin_dayCostEvenSplitLabel")}: </span>
                    {formatAmount(evenSplitPerDay, dash)} {displayCurrency}
                    <span className={`${u.metaDim} block sm:inline sm:ml-1 mt-0.5 sm:mt-0`}>
                      {t("itin_dayCostEvenSplitHint")}
                    </span>
                  </p>
                )}
                {!showCollapse && row.price_note == null && evenSplitPerDay == null && (
                  <p className={`${u.metaDim} mt-2`} role="status">{t("itin_dayCostPlaceholder") || "Day cost: —"}</p>
                )}
                {!showCollapse && Array.isArray(row.dining) && row.dining.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className={u.label}>{t("escrow_catering")?.replace(": ", "") ?? "Dining"}</span>
                    {row.dining.map((d, i) => {
                      const item = typeof d === "string" ? { name: d, description: undefined, image: undefined, price: undefined } : d as DiningItem;
                      const imgSrc = item.image ?? PLACEHOLDER_IMAGE_DINING;
                      return (
                        <div key={i} className={u.attrCard}>
                          <span className={`${u.imgWrap} shrink-0`}>
                            <Image src={imgSrc} alt={item.name} fill className="object-cover" sizes="80px" unoptimized />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className={u.strong}>{item.name}</p>
                              {item.price != null && <span className={u.priceMeta}>{item.price} {displayCurrency}</span>}
                            </div>
                            {item.description && <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{item.description}</p>}
                            {item.open_hours && (
                              <p className={`${u.metaDim} mt-1`}>{t("itin_openHours")}: {item.open_hours}</p>
                            )}
                            {item.reservation_link && (
                              <a href={item.reservation_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-0.5`}>{t("itin_reservationLink")}</a>
                            )}
                            {item.map_link && (
                              <a href={item.map_link} target="_blank" rel="noopener noreferrer" className={`${u.link} mt-1`}>{t("itin_viewOnMap")}</a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!showCollapse && row.hotel != null && (() => {
                  const h = typeof row.hotel === "string" ? { name: row.hotel, area: undefined, price: undefined, intro: undefined, image: undefined } : row.hotel;
                  const hotelImg = (h as { image?: string }).image ?? PLACEHOLDER_IMAGE_HOTEL;
                  return (
                    <div className="mt-3 space-y-2">
                      <span className={u.label}>{t("escrow_hotel")?.replace(": ", "") ?? "Accommodation"}</span>
                      <div className={u.attrCard}>
                        <span className={`${u.imgWrap} shrink-0`}>
                          <Image src={hotelImg} alt={(h as { name?: string }).name ?? ""} fill className="object-cover" sizes="80px" unoptimized />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className={u.strong}>{(h as { name?: string }).name ?? ""}</p>
                            {(h as { price?: number }).price != null && <span className={u.priceMeta}>{(h as { price?: number }).price} {displayCurrency}</span>}
                          </div>
                          {(h as { intro?: string }).intro && <p className={`${u.metaMed} mt-0.5 leading-relaxed`}>{(h as { intro?: string }).intro}</p>}
                          {(h as { area?: string }).area && <p className={`${u.metaDim} mt-1`}>{(h as { area?: string }).area}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              </div>
            </li>
          );
        })}
      </ul>
      {amountBreakdown && (
        <div className={cardClass}>
          <h4 className={u.quoteHeading}>{t("escrow_quoteSummary")}</h4>
          <ul className={u.quoteList} role="list">
            {AMOUNT_KEYS.map(({ key, i18n }) => {
              const v = amountBreakdown[key as keyof AmountBreakdownUnified];
              if (v == null) return null;
              return (
                <li key={key}>{t(i18n)} {formatAmount(v, dash)} {displayCurrency}</li>
              );
            })}
            {amountBreakdown.total_budget != null && (
              <li className={u.quoteTotal}>
                {t("escrow_totalBudget")} {formatAmount(amountBreakdown.total_budget, dash)} {displayCurrency}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
