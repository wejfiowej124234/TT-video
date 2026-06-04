import { adminApiErrorUserText } from "@/lib/adminFetchDisplay";
import type { LocaleTranslateFn } from "@/lib/i18n";

export const ABUSE_POLICY_KEYS = [
  "comment_rate_window_sec",
  "comment_max_per_window",
  "comment_min_interval_sec",
  "comment_duplicate_lookback_sec",
  "post_rate_window_sec",
  "post_max_per_window",
  "post_min_interval_sec",
  "post_duplicate_lookback_sec",
  "report_rate_window_sec",
  "report_max_per_window",
  "report_min_interval_sec",
  "report_duplicate_target_lookback_sec",
] as const;

export type AbusePolicyKey = (typeof ABUSE_POLICY_KEYS)[number];

export type AbusePolicyDraft = Record<AbusePolicyKey, string>;

export function emptyAbusePolicyDraft(): AbusePolicyDraft {
  const o = {} as AbusePolicyDraft;
  for (const k of ABUSE_POLICY_KEYS) o[k] = "";
  return o;
}

export type CommunityAbusePolicyPatchRes = { status?: string; error?: string; policy?: unknown };

export function abusePolicyErr(code: string | undefined, t: LocaleTranslateFn): string {
  switch (code) {
    case "abuse_policy_patch_empty":
      return t("admin_abuse_errEmpty");
    case "abuse_policy_no_effective_change":
      return t("admin_abuse_errNoChange");
    default:
      return adminApiErrorUserText(code, t);
  }
}
