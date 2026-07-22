/**
 * Home `/` AI itinerary card gate (①).
 * Frosted preview only until country / cities / dates / party / budget are ready;
 * live order cards only after explicit「AI 生成行程」submit.
 */

export type LandingAiItineraryFormFields = {
  country: string;
  cities: readonly string[];
  startDate: string;
  endDate: string;
  partySize: number;
  budget: string;
};

/** Parse budget for gate + submit; empty / invalid → null. */
export function parseLandingAiBudget(budget: string): number | null {
  const trimmed = budget.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Form complete enough to allow generate + to reveal live results after generate. */
export function isLandingAiItineraryFormReady(fields: LandingAiItineraryFormFields): boolean {
  const { country, cities, startDate, endDate, partySize, budget } = fields;
  if (!country.trim()) return false;
  if (!cities.length) return false;
  if (!startDate.trim() || !endDate.trim()) return false;
  if (new Date(endDate) < new Date(startDate)) return false;
  if (!Number.isFinite(partySize) || partySize < 1) return false;
  if (parseLandingAiBudget(budget) == null) return false;
  return true;
}
