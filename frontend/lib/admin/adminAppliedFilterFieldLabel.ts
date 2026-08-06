import type { LocaleTranslateFn } from "@/lib/i18n";

/** 常见 applied_filters 字段 → i18n 标签（Batch 30 · 非 JSON dump 补充）。 */
const FIELD_LABEL_KEYS: Record<string, string> = {
  limit: "admin_filter_field_limit",
  status: "admin_filter_field_status",
  state: "admin_filter_field_state",
  role: "admin_users_role_filter_label",
  kyc_status: "admin_users_kyc_filter_label",
  action: "admin_audit_list_action",
  actor_id: "admin_audit_list_actorId",
  resource_type: "admin_audit_list_resourceType",
  max_score: "admin_reviews_maxScore",
  min_score: "admin_reviews_minScore",
  release_key: "admin_filter_field_release_key",
  report_type: "admin_filter_field_report_type",
  reason_code: "admin_filter_field_reason_code",
  target_type: "admin_filter_field_target_type",
  url_scope: "admin_filter_field_url_scope",
  job_type: "admin_filter_field_job_type",
  chain_id: "admin_filter_field_chain_id",
  report_id: "admin_filter_field_report_id",
  subject_user_id: "admin_filter_field_subject_user_id",
  feed_mode: "admin_filter_field_feed_mode",
  policy_code: "admin_filter_field_policy_code",
  scope_type: "admin_filter_field_scope_type",
  binding_role: "admin_filter_field_binding_role",
  api_version: "admin_filter_field_api_version",
  q: "admin_guides_q_label",
  city: "admin_guides_city_filter_label",
  country_code: "admin_guides_country_filter_label",
};

export function adminAppliedFilterFieldLabel(key: string, t: LocaleTranslateFn): string {
  const labelKey = FIELD_LABEL_KEYS[key];
  if (labelKey) return t(labelKey);
  return key.replace(/_/g, " ");
}
