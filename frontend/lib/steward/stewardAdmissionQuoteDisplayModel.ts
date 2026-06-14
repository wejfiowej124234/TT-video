import type { OnboardingQuoteView } from "@/lib/me/meOnboardingViewModel";
import { formatOnboardingAmountMinor } from "@/lib/me/meOnboardingViewModel";

/** 对齐 onboarding-fee-schedule.v1 · jurisdiction_tier_map（仅展示 · 非计价 SSOT） */
const JURISDICTION_TIER: Record<string, "S" | "A" | "B"> = {
  CN: "S",
  US: "S",
  FR: "S",
  ES: "S",
  JP: "A",
  TH: "A",
  SG: "A",
  KR: "A",
  AU: "B",
  AE: "B",
};

const TIER_LIST_PRICE_MINOR: Record<"S" | "A" | "B", number> = {
  S: 49_900,
  A: 34_900,
  B: 24_900,
};

export type StewardAdmissionQuoteDisplay = {
  primaryJurisdiction: string;
  tier: "S" | "A" | "B";
  amountDueLabel: string;
  listPriceLabel: string;
  showListPriceCompare: boolean;
  feeScheduleVersion: string;
  sku: string;
  currency: string;
  isLocalDevZero: boolean;
};

export function resolveStewardAdmissionPrimaryJurisdiction(
  jurisdictions: readonly string[] | undefined | null,
): string {
  const first = jurisdictions?.find((j) => typeof j === "string" && j.trim().length > 0);
  return (first ?? "CN").trim().toUpperCase();
}

/** 客户向费率摘要（① 本地 · 对齐 fee_schedule_v1 草案展示） */
export function buildStewardAdmissionQuoteDisplay(input: {
  quote: OnboardingQuoteView;
  primaryJurisdiction?: string | null;
}): StewardAdmissionQuoteDisplay {
  const primaryJurisdiction = (input.primaryJurisdiction?.trim() || "CN").toUpperCase();
  const tier = JURISDICTION_TIER[primaryJurisdiction] ?? "S";
  const listMinor = TIER_LIST_PRICE_MINOR[tier];
  const listPriceLabel = formatOnboardingAmountMinor(listMinor, input.quote.currency || "USDC");
  const isLocalDevZero = input.quote.amountMinor === 0 || input.quote.isStub;

  return {
    primaryJurisdiction,
    tier,
    amountDueLabel: input.quote.amountLabel,
    listPriceLabel,
    showListPriceCompare: isLocalDevZero,
    feeScheduleVersion: input.quote.feeScheduleVersion,
    sku: input.quote.sku,
    currency: input.quote.currency,
    isLocalDevZero,
  };
}
