import type { LocaleTranslateFn } from "@/lib/i18n";

/** 常见 status/state 枚举 → 已有 i18n 标签（Batch 34 · applied_filters 值人话）。 */
const STATUS_VALUE_KEYS: Record<string, string> = {
  open: "admin_reports_status_open",
  in_review: "admin_reports_status_in_review",
  resolved: "admin_reports_status_resolved",
  dismissed: "admin_reports_status_dismissed",
  draft: "admin_config_releases_status_draft",
  published: "admin_config_releases_status_published",
  rolled_back: "admin_config_releases_status_rolled_back",
  accepted: "admin_appeal_review_opt_accepted",
  rejected: "admin_appeal_review_opt_rejected",
  visible: "admin_comment_vis_opt_visible",
  hidden: "admin_comment_vis_opt_hidden",
  removed: "admin_comment_vis_opt_removed",
};

const REASON_CODE_VALUE_KEYS: Record<string, string> = {
  spam: "admin_reports_reason_spam",
  harassment: "admin_reports_reason_harassment",
  hate: "admin_reports_reason_hate",
  violence: "admin_reports_reason_violence",
  nudity: "admin_reports_reason_nudity",
  misinformation: "admin_reports_reason_misinformation",
  impersonation: "admin_reports_reason_impersonation",
  scam: "admin_reports_reason_scam",
  other: "admin_reports_reason_other",
};

const ACTION_VALUE_KEYS: Record<string, string> = {
  issue_ok: "admin_filter_value_action_issue_ok",
  read_ok: "admin_filter_value_action_read_ok",
  read_expired: "admin_filter_value_action_read_expired",
};

const TARGET_TYPE_VALUE_KEYS: Record<string, string> = {
  post: "admin_filter_value_target_post",
  comment: "admin_filter_value_target_comment",
  user: "admin_filter_value_target_user",
};

const URL_SCOPE_VALUE_KEYS: Record<string, string> = {
  read: "admin_filter_value_url_scope_read",
  download: "admin_filter_value_url_scope_download",
};

const ENUM_VALUE_FIELDS = new Set(["status", "state", "visibility_status", "decision"]);

function lookupValueMap(
  map: Record<string, string>,
  raw: string,
  t: LocaleTranslateFn,
): string | null {
  const key = map[raw.toLowerCase()];
  return key ? t(key) : null;
}

export function adminAppliedFilterValueLabel(
  field: string,
  value: unknown,
  t: LocaleTranslateFn,
): string | null {
  if (value == null || value === "") return null;
  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) return null;
  if (field === "reason_code") return lookupValueMap(REASON_CODE_VALUE_KEYS, raw, t);
  if (field === "action") return lookupValueMap(ACTION_VALUE_KEYS, raw, t);
  if (field === "target_type") return lookupValueMap(TARGET_TYPE_VALUE_KEYS, raw, t);
  if (field === "url_scope") return lookupValueMap(URL_SCOPE_VALUE_KEYS, raw, t);
  if (!ENUM_VALUE_FIELDS.has(field)) return null;
  return lookupValueMap(STATUS_VALUE_KEYS, raw, t);
}
