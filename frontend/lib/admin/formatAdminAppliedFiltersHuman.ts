import type { LocaleTranslateFn } from "@/lib/i18n";

function displayFilterValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 32) return `${trimmed.slice(0, 8)}…`;
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value).slice(0, 32);
}

/** HON-03 · 通用 applied_filters 人话摘要（非 JSON dump · 社区/配置列表共用）。 */
export function formatAdminAppliedFiltersHuman(
  filters: Record<string, unknown> | null | undefined,
  _t: LocaleTranslateFn,
): string {
  if (!filters || typeof filters !== "object") return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    const display = displayFilterValue(value);
    if (!display) continue;
    parts.push(`${key.replace(/_/g, " ")}: ${display}`);
  }
  return parts.join(" · ");
}
