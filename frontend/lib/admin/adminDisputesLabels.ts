import type { LocaleTranslateFn } from "@/lib/i18n";

export const DISPUTE_STATUS_FILTER_OPTIONS = [
  "",
  "open",
  "resolved",
  "cancelled",
] as const;

const DISPUTE_STATUS_KEYS: Record<string, string> = {
  open: "admin_disputes_status_open",
  resolved: "admin_disputes_status_resolved",
  cancelled: "admin_disputes_status_cancelled",
};

export function disputeStatusLabelKey(status: string | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  return DISPUTE_STATUS_KEYS[s] ?? "admin_disputes_status_other";
}

export function formatDisputesAppliedFiltersHuman(
  applied: Record<string, unknown> | null | undefined,
  t: LocaleTranslateFn,
): string {
  if (!applied || typeof applied !== "object") return "";
  const parts: string[] = [];
  if (applied.limit != null && applied.limit !== "") {
    parts.push(`${t("admin_disputes_limit_label")} ${String(applied.limit)}`);
  }
  const status = applied.status;
  if (typeof status === "string" && status.trim()) {
    parts.push(`${t("admin_disputes_status_filter_label")} ${t(disputeStatusLabelKey(status))}`);
  }
  return parts.join(" · ");
}

/** ① 争议状态机示意（本地只读；与链上/仲裁真值以 API 为准）。 */
export const DISPUTE_STATUS_FLOW = ["open", "resolved", "cancelled"] as const;
