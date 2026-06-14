import type { DayPlan } from "./types";

/** 日程卡折叠标题摘要 */
export function touristDayCardSummary(day: DayPlan, dayIndex: number, t: (key: string) => string): string {
  const dayLabel = t("market_dayN").replace("{n}", String(dayIndex + 1));
  if (!day.city?.trim()) {
    return `${dayLabel} · ${t("market_itinerary_day_not_configured")}`;
  }
  const parts = [day.city];
  const interestCount = (day.attractions?.length ?? 0) + (day.food?.length ?? 0) + (day.hotel ? 1 : 0);
  if (interestCount > 0) {
    parts.push(t("market_itinerary_selected_count").replace("{{n}}", String(interestCount)));
  }
  return `${dayLabel} · ${parts.join(" · ")}`;
}

export function isDayConfigured(day: DayPlan): boolean {
  return Boolean(day.city?.trim());
}
