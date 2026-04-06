/**
 * API 客户端公共能力：请求 id、响应解析、鉴权头（与 04 §三、14 一致）
 */

export function requestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** 50-F2：幂等键，所有 POST/PUT 写操作须带此头；未传时每请求生成新 key */
export function getIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** 50-F2：写请求统一头（含 x-request-id、鉴权、Idempotency-Key）；所有 POST/PUT 使用 */
export function writeRequestHeaders(idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = { "x-request-id": requestId(), ...getAuthHeaders() };
  const key = idempotencyKey ?? getIdempotencyKey();
  h["Idempotency-Key"] = key;
  h["X-Idempotency-Key"] = key;
  return h;
}

/** 统一处理响应：403 时解析 body 识别 OFAC/风控并抛出友好文案（13-1 §四、27-P22 生产级） */
export async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    let msg = `请求失败 ${res.status}`;
    try {
      const j = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
      // 401：invalid_credentials（登录页错密/无用户）与 login_required/unauthorized（严格会话门）分流
      if (res.status === 401 && j.error === "invalid_credentials") throw new Error("invalid_credentials");
      // PUT /me/password 旧密码错误（chain_off put_me_password）
      if (res.status === 401 && j.error === "invalid_old_password") throw new Error("invalid_old_password");
      if (res.status === 401 && (j.error === "login_required" || j.error === "unauthorized"))
        throw new Error("login_required");
      if (res.status === 429 && j.error === "rate_limit_exceeded") throw new Error("rate_limit_exceeded");
      if (res.status === 429 && j.error === "critical_write_rate_limit_exceeded")
        throw new Error("critical_write_rate_limit_exceeded");
      if (res.status === 429 && j.error === "evidence_rate_limit_exceeded") throw new Error("evidence_rate_limit_exceeded");
      if (res.status === 429 && j.error === "review_rate_limit_exceeded") throw new Error("review_rate_limit_exceeded");
      if (res.status === 409 && j.error === "already_reviewed") throw new Error("already_reviewed");
      if (res.status === 409 && j.error === "order_not_final_financial_state")
        throw new Error("order_not_final_financial_state");
      if (res.status === 409 && j.error === "order_has_no_completed_at") throw new Error("order_has_no_completed_at");
      if (res.status === 409 && j.error === "already_guide") throw new Error("already_guide");
      if (res.status === 409 && j.error === "email_already_registered") throw new Error("email_already_registered");
      if (res.status === 409 && j.error === "already_voted") throw new Error("already_voted");
      if (res.status === 404 && j.error === "proposal_not_found") throw new Error("proposal_not_found");
      if (res.status === 400 && j.error === "invalid_proposal_id") throw new Error("invalid_proposal_id");
      if (res.status === 400 && j.error === "invalid_vote") throw new Error("invalid_vote");
      if (res.status === 400 && j.error === "cannot_delegate_to_self") throw new Error("cannot_delegate_to_self");
      if (res.status === 400 && j.error === "invalid_delegate_to") throw new Error("invalid_delegate_to");
      if (res.status === 404 && j.error === "no_active_delegation") throw new Error("no_active_delegation");
      if (res.status === 503 && j.error === "evidence_db_persist_failed") throw new Error("evidence_db_persist_failed");
      if (res.status === 503 && j.error === "message_db_persist_failed") throw new Error("message_db_persist_failed");
      if (res.status === 503 && j.error === "review_db_persist_failed") throw new Error("review_db_persist_failed");
      if (res.status === 503 && j.error === "dispute_open_db_persist_failed")
        throw new Error("dispute_open_db_persist_failed");
      if (res.status === 503 && j.error === "dispute_resolve_db_persist_failed")
        throw new Error("dispute_resolve_db_persist_failed");
      if (res.status === 503 && j.error === "itinerary_db_persist_failed")
        throw new Error("itinerary_db_persist_failed");
      if (res.status === 503 && j.error === "order_db_persist_failed") throw new Error("order_db_persist_failed");
      if (
        res.status === 503 &&
        (j.status === "outbox_persist_failed" || j.error === "outbox_persist_failed")
      )
        throw new Error("outbox_persist_failed");
      if (res.status === 503 && j.error === "auth_db_persist_failed") throw new Error("auth_db_persist_failed");
      if (res.status === 503 && j.error === "guide_db_persist_failed") throw new Error("guide_db_persist_failed");
      if (res.status === 503 && j.error === "chain_off_unavailable") throw new Error("chain_off_unavailable");
      if (res.status === 503 && j.error === "database_required") throw new Error("database_required");
      if (
        res.status === 503 &&
        (j.error === "degraded_mode" || j.status === "degraded_mode")
      )
        throw new Error("degraded_mode");
      if (res.status === 503 && (j.error === "api_paused" || j.status === "paused")) throw new Error("api_paused");
      if (res.status === 410 && j.error === "token_expired") throw new Error("token_expired");
      if (res.status === 500 && j.error === "fee_router_stats_failed") throw new Error("fee_router_stats_failed");
      if (res.status === 500 && j.error === "fee_router_list_failed") throw new Error("fee_router_list_failed");
      if (res.status === 400 && j.error === "score_must_be_1_to_5") throw new Error("score_must_be_1_to_5");
      if (res.status === 400 && j.error === "review_comment_required_for_low_score")
        throw new Error("review_comment_required_for_low_score");
      const guideErrors = [
        "invalid_wallet_address",
        "city_required",
        "city_too_long",
        "file_too_large",
        "invalid_file_type",
        "invalid_email",
        "password_too_short",
        "password_too_long",
        "id_photo_required",
        "guide_license_url_invalid",
        "invalid_uuid",
        "invalid_base64",
        "invalid_filename",
        "invalid_registration_role",
      ];
      if (res.status === 400 && typeof j.error === "string" && guideErrors.includes(j.error)) throw new Error(j.error);
      if (res.status === 403 && j.error === "review_window_expired") throw new Error("review_window_expired");
      if (res.status === 403 && j.error === "seed_test_accounts_disabled") throw new Error("seed_test_accounts_disabled");
      if (res.status === 403 && j.error === "trust_guide_pending_review")
        throw new Error("trust_guide_pending_review");
      if (res.status === 403 && j.error === "trust_verification_pending")
        throw new Error("trust_verification_pending");
      if (res.status === 403 && j.error === "trust_identity_restricted")
        throw new Error("trust_identity_restricted");
      if (res.status === 403 && j.error === "trust_risk_too_high") throw new Error("trust_risk_too_high");
      if (res.status === 403 && j.error === "delegation_active_cannot_vote")
        throw new Error("delegation_active_cannot_vote");
      if (res.status === 403 && j.error === "forbidden") throw new Error("forbidden");
      if (res.status === 403 && j.error === "internal_api_forbidden")
        throw new Error("internal_api_forbidden");
      if (res.status === 400 && j.error === "invalid_limit") throw new Error("invalid_limit");
      if (res.status === 400 && j.error === "invalid_cursor") throw new Error("invalid_cursor");
      if (res.status === 413 && j.error === "file_too_large") throw new Error("file_too_large");
      if (
        res.status === 501 &&
        (j.status === "not_implemented" || j.error === "not_implemented")
      )
        throw new Error("not_implemented");
      if (typeof j.message === "string") msg = j.message;
      else if (typeof j.error === "string") msg = j.error;
    } catch (e) {
      if (e instanceof Error) {
        const rethrow = ["invalid_credentials", "invalid_old_password", "login_required", "rate_limit_exceeded", "critical_write_rate_limit_exceeded", "evidence_rate_limit_exceeded", "review_rate_limit_exceeded", "already_reviewed", "order_not_final_financial_state", "order_has_no_completed_at", "already_guide", "email_already_registered", "already_voted", "proposal_not_found", "invalid_proposal_id", "invalid_vote", "cannot_delegate_to_self", "invalid_delegate_to", "no_active_delegation", "delegation_active_cannot_vote", "evidence_db_persist_failed", "message_db_persist_failed", "review_db_persist_failed", "dispute_open_db_persist_failed", "dispute_resolve_db_persist_failed", "itinerary_db_persist_failed", "order_db_persist_failed", "auth_db_persist_failed", "guide_db_persist_failed", "chain_off_unavailable", "database_required", "degraded_mode", "api_paused", "token_expired", "fee_router_stats_failed", "fee_router_list_failed", "outbox_persist_failed", "score_must_be_1_to_5", "review_comment_required_for_low_score", "review_window_expired", "seed_test_accounts_disabled", "trust_guide_pending_review", "trust_verification_pending", "trust_identity_restricted", "trust_risk_too_high", "forbidden", "internal_api_forbidden", "invalid_limit", "invalid_cursor", "not_implemented", "invalid_wallet_address", "city_required", "city_too_long", "file_too_large", "invalid_file_type", "invalid_email", "password_too_short", "password_too_long", "id_photo_required", "guide_license_url_invalid", "invalid_uuid", "invalid_base64", "invalid_filename", "invalid_registration_role"];
        if (rethrow.includes(e.message)) throw e;
      }
    }
    if (res.status === 403) {
      try {
        const j = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
        const combined = [j.message, j.error, j.detail, String(j.code ?? "")].filter(Boolean).join(" ");
        if (j.code === "ofac" || /ofac|compliance|风控|合规/i.test(combined))
          msg = "风控/合规限制，当前操作不可用。如有疑问请联系客服。";
        else if (typeof j.message === "string" && !/forbidden|^请求失败\s*403$/i.test(j.message)) msg = j.message;
        else if (typeof j.error === "string" && !/forbidden/i.test(j.error)) msg = j.error;
        else msg = "您暂无权限查看该内容，请返回订单列表或自由市场。";
      } catch {
        msg = "您暂无权限查看该内容，请返回订单列表或自由市场。";
      }
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : {};
}

/** 判断是否为 API 返回的风控/合规类错误（便于 UI 高亮展示） */
export function isComplianceError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("403") || /风控|合规限制/i.test(msg);
}

/**
 * HTTP 已成功但 JSON 根级含 `status` 且不为 `ok` 时打控制台（13-1：仅供排障，勿直接展示给用户）。
 */
export function logApiJsonStatusNotOk(context: string, data: unknown): void {
  if (typeof window === "undefined" || data == null || typeof data !== "object") return;
  const status = (data as Record<string, unknown>).status;
  if (status !== undefined && status !== null && status !== "ok") {
    console.error(`${context} API status not ok:`, data);
  }
}

/**
 * `parseResponse` 在 HTTP 2xx 时仍可能返回根级 `status !== "ok"` 的 JSON；调用方在 `.catch` 里用 mapApiReadError 前须先抛错。
 * 若根对象**无**自有属性 `status`（如部分 auth 仅返回 `user_id`/`token`），则视为非 envelope 响应，不抛错。
 */
export function throwUnlessApiOk(data: unknown, fallbackCode = "unknown"): void {
  if (data == null || typeof data !== "object") {
    throw new Error(fallbackCode);
  }
  const d = data as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(d, "status")) return;
  if (d.status === "ok") return;
  const err = d.error;
  const msg = d.message;
  const code =
    typeof err === "string" && err.trim()
      ? err.trim()
      : typeof msg === "string" && msg.trim()
        ? msg.trim()
        : fallbackCode;
  throw new Error(code);
}

/**
 * `fetch` + 安全 `json()`（失败为 `{}`）+ `logApiJsonStatusNotOk`；页面层与 `adminFetchJson` 共用（07 / 13-1）。
 * HTTP **2xx** 时对 body 调用 **`throwUnlessApiOk`**（与 `parseResponse` 读路径一致）；非 2xx 不抛 envelope，便于调用方读 `body` + `interpretCommunityWriteError` 等。
 */
export async function fetchJsonWithApiStatusLog<T>(
  context: string,
  input: string | URL,
  init?: RequestInit
): Promise<{ res: Response; body: T }> {
  const res = await fetch(input, init);
  const body = (await res.json().catch(() => ({}))) as T;
  logApiJsonStatusNotOk(context, body);
  if (res.ok) throwUnlessApiOk(body);
  return { res, body };
}

export type AuthHeaders = { "X-User-Id"?: string; Authorization?: string };

/** 与 POST /auth/login、/auth/register 返回的 `token` 一致；有 DB 时为不透明 `tts_<uuid>`（见 crates/api 鉴权）。 */
export const AUTH_SESSION_TOKEN_KEY = "traveltrust_session_token";
export const AUTH_USER_ID_KEY = "traveltrust_user_id";

export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_ID_KEY);
  localStorage.removeItem(AUTH_SESSION_TOKEN_KEY);
}

/** 开发/链下模式可从 localStorage 或 env 取；登录后优先带 Bearer（DB 模式下须带 token，勿仅 X-User-Id）。 */
export function getAuthHeaders(): AuthHeaders {
  if (typeof window !== "undefined") {
    const tok = localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim();
    if (tok) return { Authorization: `Bearer ${tok}` };
    const uid = localStorage.getItem(AUTH_USER_ID_KEY);
    if (uid) return { "X-User-Id": uid };
  }
  const dev = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_USER_ID;
  if (dev) return { "X-User-Id": process.env.NEXT_PUBLIC_DEV_USER_ID! };
  return {};
}
