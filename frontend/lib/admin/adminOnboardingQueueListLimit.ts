/** V65-PROD-003-G089 · Admin onboarding queue list page size (mirrors BE default). */
export const ADMIN_ONBOARDING_QUEUE_LIST_LIMIT = 100;

export function appendAdminOnboardingQueueListLimit(url: string, limit = ADMIN_ONBOARDING_QUEUE_LIST_LIMIT): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}limit=${encodeURIComponent(String(limit))}`;
}

/** True when BE applied_filters reports truncation (items clipped to limit). */
export function isAdminOnboardingQueueListTruncated(
  appliedFilters: Record<string, unknown> | null | undefined,
  itemsLength: number,
): boolean {
  if (!appliedFilters || typeof appliedFilters !== "object") return false;
  if (appliedFilters.truncated === true) return true;
  const matched = appliedFilters.matched_before_limit;
  if (typeof matched === "number" && matched > itemsLength) return true;
  if (typeof matched === "string") {
    const n = Number(matched);
    return Number.isFinite(n) && n > itemsLength;
  }
  return false;
}
