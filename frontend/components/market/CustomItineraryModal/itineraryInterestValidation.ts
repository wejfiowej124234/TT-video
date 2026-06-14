import type { CustomItineraryForm } from "./types";

const MIN_DESCRIPTION_CHARS = 10;

/** 旅行者：至少 1 项兴趣（景区/美食/酒店）或 ≥10 字行程说明 */
export function touristHasMinimumInterest(form: CustomItineraryForm): boolean {
  if (form.description.trim().length >= MIN_DESCRIPTION_CHARS) return true;
  const days = form.dayPlans.slice(0, form.totalDays);
  return days.some(
    (d) => d.attractions.length > 0 || d.food.length > 0 || Boolean(d.hotel?.trim()),
  );
}

/** 向导：至少 1 日有图文兴趣点或 ≥10 字总说明 */
export function guideHasMinimumInterest(form: CustomItineraryForm): boolean {
  if (form.description.trim().length >= MIN_DESCRIPTION_CHARS) return true;
  const plans = (form.guideDayPlans ?? []).slice(0, form.totalDays);
  return plans.some((p) => {
    const text = [p.attractions, p.food, p.hotel].some((s) => Boolean(s?.trim()));
    const media = Boolean(p.attractionImage?.trim()) || Boolean(p.foodImage?.trim());
    return text || media;
  });
}

/** 已配置城市的天数（用于进度条） */
export function countItineraryDaysConfigured(form: CustomItineraryForm): number {
  const n = Math.max(1, Math.min(30, form.totalDays));
  if (form.creatorType === "guide") {
    return (form.guideDayPlans ?? []).slice(0, n).filter((p) => Boolean(p.city?.trim())).length;
  }
  return form.dayPlans.slice(0, n).filter((d) => Boolean(d.city?.trim())).length;
}
