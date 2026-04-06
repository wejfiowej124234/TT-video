/**
 * 07 §5.3B：`community.rs` 的 `status:error` 机器码 ↔ `community_api_msg_*`（zh/en）全覆盖。
 * 新增后端错误码时须同步 locales 与本表，否则 Vitest 失败。
 */
import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";

/** `crates/api/src/routes/community.rs` 中 JSON `error`/`message` 使用的静态字符串（去重）。 */
const COMMUNITY_API_MESSAGE_CODES = [
  "appeal_body_required",
  "appeal_count_failed",
  "appeal_create_failed",
  "appeal_pending_exists",
  "appeal_permission_check_failed",
  "cannot_follow_self",
  "collect_create_failed",
  "comment_duplicate",
  "comment_failed",
  "comment_rate_limited",
  "comment_too_fast",
  "community_penalty_active",
  "content_required",
  "create_post_failed",
  "db_error",
  "delete_failed",
  "empty_body",
  "feedback_create_failed",
  "feedback_media_invalid",
  "feedback_media_scheme",
  "feedback_media_too_large",
  "feedback_media_too_many",
  "follow_create_failed",
  "forbidden",
  "friend_request_accept_failed",
  "friend_request_create_failed",
  "friend_request_not_found_or_forbidden",
  "friend_request_reject_failed",
  "invalid_conversation",
  "invalid_id",
  "invalid_post",
  "invalid_reason_code",
  "invalid_report_id",
  "invalid_request_id",
  "invalid_target_id",
  "invalid_target_type",
  "invalid_to_user_id",
  "invalid_user_id",
  "invalid_visibility_status",
  "like_create_failed",
  "list_failed",
  "media_required",
  "not_found",
  "not_found_or_forbidden",
  "post_duplicate_body",
  "post_rate_limited",
  "post_too_fast",
  "report_create_failed",
  "report_duplicate_target",
  "report_fields_required",
  "report_list_failed",
  "report_load_failed",
  "report_not_appealable",
  "report_not_found",
  "report_rate_limited",
  "report_target_lookup_failed",
  "report_target_not_found",
  "report_too_fast",
  "request_id_required",
  "send_failed",
  "service_unavailable",
  "tag_required",
  "tag_too_long",
  "to_user_id_required",
  "unauthorized",
  "update_failed",
  "visibility_status_required",
] as const;

describe("communityApiMessageKeys (07 §5.3B)", () => {
  it.each([
    { locale: "zh", dict: zh as Record<string, string> },
    { locale: "en", dict: en as Record<string, string> },
  ] as const)("every community.rs code has community_api_msg_* in %s", ({ locale, dict }) => {
    for (const code of COMMUNITY_API_MESSAGE_CODES) {
      const key = `community_api_msg_${code}`;
      const v = dict[key];
      expect(v, `${locale}: missing or empty ${key}`).toBeTruthy();
      expect(String(v).trim().length, `${locale}: empty string for ${key}`).toBeGreaterThan(0);
    }
  });
});
