import type { LocaleTranslateFn } from "@/lib/i18n";

const REASON_CODE_KEYS: Record<string, string> = {
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

const STATUS_KEYS: Record<string, string> = {
  open: "admin_reports_status_open",
  in_review: "admin_reports_status_in_review",
  resolved: "admin_reports_status_resolved",
  dismissed: "admin_reports_status_dismissed",
};

const PENALTY_KEYS: Record<string, string> = {
  warn: "admin_reports_penalty_warn",
  limit_feed: "admin_reports_penalty_limit_feed",
  mute: "admin_reports_penalty_mute",
  ban: "admin_reports_penalty_ban",
  shadow_ban: "admin_reports_penalty_shadow_ban",
  content_remove: "admin_reports_penalty_content_remove",
  other: "admin_reports_penalty_other",
};

export function reportReasonLabel(code: string | undefined, t: LocaleTranslateFn): string {
  const c = (code ?? "").trim().toLowerCase();
  if (!c) return t("admin_em_dash");
  const key = REASON_CODE_KEYS[c];
  return key ? t(key) : code ?? t("admin_em_dash");
}

export function reportStatusLabel(status: string | undefined, t: LocaleTranslateFn): string {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return t("admin_em_dash");
  const key = STATUS_KEYS[s];
  return key ? t(key) : status ?? t("admin_em_dash");
}

export function reportPenaltyActionLabel(action: string, t: LocaleTranslateFn): string {
  const key = PENALTY_KEYS[action.trim().toLowerCase()];
  return key ? t(key) : action;
}

export function formatReportsAppliedFiltersHuman(
  filters: Record<string, unknown> | null,
  t: LocaleTranslateFn,
): string {
  if (!filters) return "";
  const parts: string[] = [];
  const status = filters.status;
  if (typeof status === "string" && status.trim()) {
    parts.push(`${t("admin_community_reports_status")}: ${reportStatusLabel(status, t)}`);
  }
  const limit = filters.limit;
  if (limit != null) parts.push(`${t("admin_community_reports_limit")}: ${String(limit)}`);
  const reporter = filters.reporter_id;
  if (typeof reporter === "string" && reporter.trim()) {
    parts.push(`${t("admin_community_reports_reporter_id")}: ${reporter.slice(0, 8)}…`);
  }
  const tt = filters.target_type;
  if (typeof tt === "string" && tt.trim()) {
    parts.push(`${t("admin_community_reports_target_type")}: ${tt}`);
  }
  const rc = filters.reason_code;
  if (typeof rc === "string" && rc.trim()) {
    parts.push(`${t("admin_community_reports_reason_code")}: ${rc}`);
  }
  const tid = filters.target_id;
  if (typeof tid === "string" && tid.trim()) {
    parts.push(`${t("admin_community_reports_target_id")}: ${tid.slice(0, 8)}…`);
  }
  return parts.join(" · ");
}
