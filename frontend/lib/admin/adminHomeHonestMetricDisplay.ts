/**
 * Batch-11 HU-324 · 工作台指标诚实展示（禁裸 `…` / `---` 无说明）。
 * Batch-12 HU-440 · loading/empty 对齐三态字典键。
 */
import {
  ADMIN_HOME_EMPTY_STATE_EMPTY_KEY,
  ADMIN_HOME_EMPTY_STATE_LOADING_KEY,
} from "@/lib/admin/adminHomeEmptyStateDict";

export type AdminHomeHonestMetricKind =
  | "loading"
  | "denied"
  | "error"
  | "empty"
  | "value";

export function adminHomeHonestMetricKind(input: {
  loading: boolean;
  denied?: boolean;
  error?: boolean;
  value: string | number | null | undefined;
}): AdminHomeHonestMetricKind {
  if (input.loading) return "loading";
  if (input.denied) return "denied";
  if (input.error) return "error";
  if (input.value === null || input.value === undefined || input.value === "") return "empty";
  return "value";
}

export function adminHomeHonestMetricLabelKey(kind: AdminHomeHonestMetricKind): string | null {
  if (kind === "loading") return ADMIN_HOME_EMPTY_STATE_LOADING_KEY;
  if (kind === "denied") return "admin_home_metric_denied";
  if (kind === "error") return "admin_home_metric_error";
  if (kind === "empty") return ADMIN_HOME_EMPTY_STATE_EMPTY_KEY;
  return null;
}

export function adminHomeHonestMetricDisplay(
  t: (key: string, vars?: Record<string, string | number>) => string,
  input: {
    loading: boolean;
    denied?: boolean;
    error?: boolean;
    value: string | number | null | undefined;
  },
): string {
  const kind = adminHomeHonestMetricKind(input);
  const key = adminHomeHonestMetricLabelKey(kind);
  if (key) return t(key);
  return String(input.value);
}
