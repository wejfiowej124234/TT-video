import type { LocaleTranslateFn } from "@/lib/i18n";

export const ORDER_STATE_FILTER_OPTIONS = [
  "",
  "draft",
  "escrowed",
  "disputed",
  "completed",
  "cancelled",
  "paid",
  "accepted",
] as const;

const ORDER_STATE_KEYS: Record<string, string> = {
  draft: "admin_orders_state_draft",
  escrowed: "admin_orders_state_escrowed",
  disputed: "admin_orders_state_disputed",
  completed: "admin_orders_state_completed",
  cancelled: "admin_orders_state_cancelled",
  paid: "admin_orders_state_paid",
  accepted: "admin_orders_state_accepted",
};

export function orderStateLabelKey(state: string | undefined): string {
  const s = (state ?? "").trim().toLowerCase();
  return ORDER_STATE_KEYS[s] ?? "admin_orders_state_other";
}

export function formatOrdersAppliedFiltersHuman(
  applied: Record<string, unknown> | null | undefined,
  t: LocaleTranslateFn,
): string {
  if (!applied || typeof applied !== "object") return "";
  const parts: string[] = [];
  if (applied.limit != null && applied.limit !== "") {
    parts.push(`${t("admin_orders_limit_label")} ${String(applied.limit)}`);
  }
  const state = applied.state;
  if (typeof state === "string" && state.trim()) {
    parts.push(`${t("admin_orders_state_label")} ${t(orderStateLabelKey(state))} (${state.trim()})`);
  }
  return parts.join(" · ");
}
