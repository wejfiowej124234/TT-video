import { DEFAULT_COUNTRY, getPricingForCountry } from "@/lib/countries";
import { MAX_AMOUNT } from "./constants";
import type { CustomItineraryForm } from "./types";
import { guideHasMinimumInterest, touristHasMinimumInterest } from "./itineraryInterestValidation";

function uniqueKeys(keys: string[]): string[] {
  return [...new Set(keys)];
}

/** 与 `validateAndBuildGuide` 未通过项对齐（不含仅服务端错误） */
export function customItineraryGuideBlockedKeys(
  form: CustomItineraryForm,
  opts: { sessionOk: boolean; coverFileTooBig: boolean },
): string[] {
  const keys: string[] = [];
  if (!opts.sessionOk) keys.push("action_gate_item_login");
  if (opts.coverFileTooBig) keys.push("action_gate_itin_cover_too_big");
  const amountStr = form.amount.trim();
  if (!amountStr) keys.push("action_gate_itin_amount_empty");
  else {
    const amountNum = parseFloat(amountStr.replace(/,/g, ""));
    if (Number.isNaN(amountNum) || amountNum <= 0) keys.push("action_gate_itin_amount_invalid");
    else if (amountNum > MAX_AMOUNT) keys.push("action_gate_itin_amount_too_large");
  }
  if (!guideHasMinimumInterest(form)) keys.push("action_gate_itin_interest_required");
  return uniqueKeys(keys);
}

/** 与 `validateAndBuildTourist` 未通过项对齐 */
export function customItineraryTouristBlockedKeys(
  form: CustomItineraryForm,
  opts: { sessionOk: boolean; coverFileTooBig: boolean; suggestedTransportFee: number },
): string[] {
  const keys: string[] = [];
  if (!opts.sessionOk) keys.push("action_gate_item_login");
  if (opts.coverFileTooBig) keys.push("action_gate_itin_cover_too_big");

  const country = form.country.trim();
  if (!country) keys.push("action_gate_itin_tourist_country");

  const daysNum = form.totalDays;
  if (daysNum < 1 || daysNum > 30) keys.push("action_gate_itin_days");

  if (daysNum >= 1 && daysNum <= 30) {
    const slice = form.dayPlans.slice(0, daysNum);
    if (slice.some((d) => !d.city.trim())) keys.push("action_gate_itin_tourist_cities");
  }

  const amountStr = form.amount.trim();
  if (!amountStr) keys.push("action_gate_itin_amount_empty");
  else {
    const amountNum = parseFloat(amountStr.replace(/,/g, ""));
    if (Number.isNaN(amountNum) || amountNum <= 0) keys.push("action_gate_itin_amount_invalid");
    else if (amountNum > MAX_AMOUNT) keys.push("action_gate_itin_amount_too_large");
  }

  const hc = Number(form.headcount);
  if (!Number.isFinite(hc) || hc < 1 || hc > 20) keys.push("action_gate_itin_headcount");

  if (country && daysNum >= 1 && daysNum <= 30) {
    const suggestedGuideFee =
      (getPricingForCountry(form.country || DEFAULT_COUNTRY).guideLevelsSuggestedPerDay[form.needGuide] ?? 0) * daysNum;
    const guideFeeNum = suggestedGuideFee;
    const transportFeeNum = opts.suggestedTransportFee > 0 ? opts.suggestedTransportFee : undefined;
    if (guideFeeNum < 0 || (transportFeeNum != null && transportFeeNum < 0)) keys.push("action_gate_itin_fee_invalid");
    if (guideFeeNum > MAX_AMOUNT || (transportFeeNum != null && transportFeeNum > MAX_AMOUNT)) {
      keys.push("action_gate_itin_fee_too_large");
    }
  }

  if (!touristHasMinimumInterest(form)) keys.push("action_gate_itin_interest_required");

  return uniqueKeys(keys);
}
