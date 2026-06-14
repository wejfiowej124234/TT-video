import type { CustomItineraryForm } from "./types";

/** 与 defaultForm 对比，判断用户是否已编辑（关闭/切换角色前确认） */
export function customItineraryFormFingerprint(form: CustomItineraryForm): string {
  return JSON.stringify({
    creatorType: form.creatorType,
    country: form.country,
    totalDays: form.totalDays,
    title: form.title,
    amount: form.amount,
    description: form.description,
    image: form.image,
    headcount: form.headcount,
    needGuide: form.needGuide,
    dayPlans: form.dayPlans,
    guideDayPlans: form.guideDayPlans,
  });
}
