/**
 * 管理端列表/详情 fetch 失败时：不向用户展示 API 原文；控制台保留详情（13-1）。
 */

import { fetchJsonWithApiStatusLog, logApiJsonStatusNotOk } from "./apiClient/core";
import { type RequestFailedHttpBucket, requestFailedHttpBucket } from "./requestFailedHttp";

/** 管理端 JSON 解析后：HTTP 200 但根级 `status !== "ok"` 时控制台排障（07 / 13-1）。 */
export function adminLogApiJsonStatus(context: string, body: unknown): void {
  logApiJsonStatusNotOk(context, body);
}

/**
 * 管理端统一 fetch：同 `fetchJsonWithApiStatusLog`（07 / 13-1）。
 */
export async function adminFetchJson<T>(
  context: string,
  input: string | URL,
  init?: RequestInit
): Promise<{ res: Response; body: T }> {
  return fetchJsonWithApiStatusLog<T>(context, input, init);
}

/** 与 `crates/api/src/routes/admin.rs` require_admin_actor / admin_db_pool_required 等 JSON `error` 对齐（70 / 13-1）。 */
export type AdminFetchErrorKind =
  | "forbidden"
  | "login_required"
  | "user_not_found"
  | "admin_required"
  | "super_admin_required"
  | "admin_db_required"
  | "not_found"
  | "conflict"
  | "invalid_request"
  | "not_implemented"
  | "server_error"
  | "failed";

function adminErrorIsConflict(msg: string): boolean {
  return (
    msg.includes("_version_conflict") ||
    msg === "approval_request_apply_conflict" ||
    msg.endsWith("_publish_race") ||
    msg.endsWith("_review_race") ||
    msg.endsWith("_update_race") ||
    msg === "admin_community_moderation_race"
  );
}

function adminErrorIsInvalidRequest(msg: string): boolean {
  return (
    msg.startsWith("invalid_") ||
    msg.startsWith("unsupported_") ||
    msg === "abuse_policy_patch_empty" ||
    msg === "abuse_policy_no_effective_change" ||
    msg === "penalty_subject_required" ||
    msg === "community_penalty_only_when_resolved" ||
    msg === "role_unchanged" ||
    msg.endsWith("_not_pending") ||
    msg === "self_approval_not_allowed"
  );
}

const REQUEST_FAILED_TO_ADMIN_KIND: Record<RequestFailedHttpBucket, AdminFetchErrorKind> = {
  login_required: "login_required",
  forbidden: "forbidden",
  not_found: "not_found",
  conflict: "conflict",
  invalid_request: "invalid_request",
  not_implemented: "not_implemented",
  server_error: "server_error",
  rate_limited: "server_error",
};

function adminErrorIsServerError(msg: string): boolean {
  return (
    msg.endsWith("_query_failed") ||
    msg.endsWith("_publish_failed") ||
    msg.endsWith("_apply_failed") ||
    msg.endsWith("_lookup_failed") ||
    msg.endsWith("_summary_failed") ||
    msg.endsWith("_insert_failed") ||
    msg.endsWith("_tx_failed") ||
    msg.endsWith("_commit_failed") ||
    msg.endsWith("_update_failed") ||
    msg.endsWith("_review_failed") ||
    msg.endsWith("_enqueue_failed") ||
    msg === "fee_router_stats_failed" ||
    msg === "fee_router_list_failed"
  );
}

export function adminFetchErrorKind(e: unknown): AdminFetchErrorKind {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === "login_required") return "login_required";
  if (msg === "user_not_found") return "user_not_found";
  if (msg === "admin_required") return "admin_required";
  if (msg === "super_admin_required") return "super_admin_required";
  if (msg === "admin_db_required") return "admin_db_required";
  if (msg === "forbidden") return "forbidden";
  {
    const b = requestFailedHttpBucket(msg);
    if (b != null) return REQUEST_FAILED_TO_ADMIN_KIND[b];
  }
  if (msg === "community_report_not_found_for_penalty" || msg.endsWith("_not_found")) return "not_found";
  if (adminErrorIsConflict(msg)) return "conflict";
  if (adminErrorIsInvalidRequest(msg)) return "invalid_request";
  if (adminErrorIsServerError(msg)) return "server_error";
  return "failed";
}

export function logAdminFetch(context: string, e: unknown): void {
  if (typeof window !== "undefined") {
    console.error(`[${context}]`, e);
  }
}

export function adminErrorUserText(kind: AdminFetchErrorKind, t: (key: string) => string): string {
  switch (kind) {
    case "forbidden":
      return t("admin_observability_forbidden");
    case "login_required":
      return t("admin_error_login_required");
    case "user_not_found":
      return t("admin_error_user_not_found");
    case "admin_required":
      return t("admin_error_admin_required");
    case "super_admin_required":
      return t("admin_error_super_admin_required");
    case "admin_db_required":
      return t("admin_error_admin_db_required");
    case "not_found":
      return t("admin_error_not_found");
    case "conflict":
      return t("admin_error_conflict");
    case "invalid_request":
      return t("admin_error_invalid_request");
    case "not_implemented":
      return t("common_apiNotImplemented");
    case "server_error":
      return t("admin_error_server");
    default:
      return t("admin_requestFailed");
  }
}

/** 根级 JSON `error` 字符串（与 `adminFetchErrorKind(new Error(code))` 同源）→ 用户可见文案；不向用户暴露原始 code。 */
export function adminApiErrorUserText(
  code: string | undefined,
  t: (key: string) => string
): string {
  if (code == null || code === "") {
    return t("admin_requestFailed");
  }
  return adminErrorUserText(adminFetchErrorKind(new Error(code)), t);
}
