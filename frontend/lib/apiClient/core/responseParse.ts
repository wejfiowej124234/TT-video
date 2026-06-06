import { attach429RetryAfterToError } from "./rateLimitAndFetch";

/** 网关/错误页常返回 HTML；与 2xx/4xx/5xx 均可能出现。 */
function isLikelyHtmlResponseBody(text: string): boolean {
  // `trim()` 不删 NBSP(U+00A0)，错误页前导 NBSP 会导致误判为非 HTML 并在 JSON.parse 处抛 SyntaxError
  const raw = text.replace(/^[\uFEFF\u00A0\s]+/, "").trimStart();
  if (!raw) return false;
  const head = raw.slice(0, 512).toLowerCase();
  return (
    raw[0] === "<" &&
    (head.startsWith("<!doctype") ||
      head.startsWith("<html") ||
      head.startsWith("<head") ||
      head.startsWith("<body") ||
      /^<\s*html[\s>]/.test(head))
  );
}

/** `JSON.parse` 失败时二次判断：整页 HTML/XML 常被误判为「可解析 JSON」前的漏网之鱼 */
function looksLikeMarkupNotJson(text: string): boolean {
  const s = text.replace(/^[\uFEFF\u00A0\s]+/, "").trimStart();
  if (!s) return false;
  if (s[0] !== "<") return false;
  const head = s.slice(0, 800).toLowerCase();
  return (
    /<!doctype\s+html/i.test(head) ||
    /<\s*html[\s>]/.test(head) ||
    head.startsWith("<head") ||
    head.startsWith("<body") ||
    head.startsWith("<script") ||
    head.startsWith("<div")
  );
}

/** 错误响应体解析为对象；非法 JSON 或非 object 时返回 `{}`，不抛错。 */
function coerceJsonObjectFromResponseText(text: string): Record<string, unknown> {
  const raw = text.trim();
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    // ignore
  }
  return {};
}

/**
 * HTTP 2xx 体须为 JSON；若收到 HTML（常见于 NEXT_PUBLIC_API_BASE_URL 指到 Next 端口、rewrite 自指或网关返回整页），
 * 避免 `JSON.parse` 抛 SyntaxError，改为可映射的业务码。
 */
function parseSuccessJsonBody(text: string): unknown {
  const raw = text.trim();
  if (!raw) return {};
  if (isLikelyHtmlResponseBody(text)) {
    throw new Error("api_html_not_json");
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    if (looksLikeMarkupNotJson(text) || isLikelyHtmlResponseBody(text)) {
      throw new Error("api_html_not_json");
    }
    if (e instanceof SyntaxError && /<!doctype|<\s*html/i.test(raw.slice(0, 1200))) {
      throw new Error("api_html_not_json");
    }
    throw new Error("api_invalid_json_body");
  }
}

/**
 * 机读键可在根级 **`error`** 或（网关剥 **`error`** 时）**`message`** 整串承载，与 **`throwUnlessApiOk`**（先 **error** 再 **message**）一致（**①②③**）。
 */
function jsonHasMachineKey(j: Record<string, unknown>, key: string): boolean {
  return j.error === key || j.message === key;
}

/** 统一处理响应：403 时解析 body 识别 OFAC/风控并抛出友好文案（13-1 §四、27-P22 生产级） */
export async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    if (isLikelyHtmlResponseBody(text)) {
      throw new Error("api_html_not_json");
    }
    let msg = `请求失败 ${res.status}`;
    const j = coerceJsonObjectFromResponseText(text);
    try {
      // 401：invalid_credentials（登录页错密/无用户）与 login_required/unauthorized（严格会话门）分流
      if (res.status === 401 && jsonHasMachineKey(j, "invalid_credentials")) throw new Error("invalid_credentials");
      // PUT /me/password 旧密码错误（chain_off put_me_password）
      if (res.status === 401 && jsonHasMachineKey(j, "invalid_old_password")) throw new Error("invalid_old_password");
      if (res.status === 401 && (jsonHasMachineKey(j, "login_required") || jsonHasMachineKey(j, "unauthorized")))
        throw new Error("login_required");
      if (res.status === 429 && jsonHasMachineKey(j, "rate_limit_exceeded")) throw new Error("rate_limit_exceeded");
      if (res.status === 429 && jsonHasMachineKey(j, "critical_write_rate_limit_exceeded"))
        throw new Error("critical_write_rate_limit_exceeded");
      if (res.status === 429 && jsonHasMachineKey(j, "evidence_rate_limit_exceeded"))
        throw new Error("evidence_rate_limit_exceeded");
      if (res.status === 429 && jsonHasMachineKey(j, "review_rate_limit_exceeded"))
        throw new Error("review_rate_limit_exceeded");
      if (res.status === 429 && jsonHasMachineKey(j, "auth_login_per_email_rate_limited"))
        throw new Error("auth_login_per_email_rate_limited");
      if (res.status === 429 && jsonHasMachineKey(j, "auth_login_per_ip_rate_limited"))
        throw new Error("auth_login_per_ip_rate_limited");
      if (res.status === 429 && jsonHasMachineKey(j, "auth_login_global_rate_limited"))
        throw new Error("auth_login_global_rate_limited");
      if (res.status === 429 && jsonHasMachineKey(j, "onboarding_quote_rate_limited"))
        throw new Error("onboarding_quote_rate_limited");
      if (res.status === 429 && jsonHasMachineKey(j, "onboarding_user_write_rate_limited"))
        throw new Error("onboarding_user_write_rate_limited");
      if (res.status === 409 && jsonHasMachineKey(j, "already_reviewed")) throw new Error("already_reviewed");
      if (res.status === 409 && jsonHasMachineKey(j, "order_not_final_financial_state"))
        throw new Error("order_not_final_financial_state");
      if (res.status === 409 && jsonHasMachineKey(j, "order_has_no_completed_at"))
        throw new Error("order_has_no_completed_at");
      if (res.status === 409 && jsonHasMachineKey(j, "already_guide")) throw new Error("already_guide");
      if (res.status === 409 && jsonHasMachineKey(j, "email_already_registered"))
        throw new Error("email_already_registered");
      if (res.status === 409 && jsonHasMachineKey(j, "already_voted")) throw new Error("already_voted");
      if (res.status === 404 && jsonHasMachineKey(j, "proposal_not_found")) throw new Error("proposal_not_found");
      if (res.status === 400 && jsonHasMachineKey(j, "invalid_proposal_id")) throw new Error("invalid_proposal_id");
      if (res.status === 400 && jsonHasMachineKey(j, "invalid_vote")) throw new Error("invalid_vote");
      if (res.status === 400 && jsonHasMachineKey(j, "cannot_delegate_to_self"))
        throw new Error("cannot_delegate_to_self");
      if (res.status === 400 && jsonHasMachineKey(j, "invalid_delegate_to")) throw new Error("invalid_delegate_to");
      if (res.status === 404 && jsonHasMachineKey(j, "no_active_delegation")) throw new Error("no_active_delegation");
      if (res.status === 503 && jsonHasMachineKey(j, "evidence_db_persist_failed"))
        throw new Error("evidence_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "message_db_persist_failed"))
        throw new Error("message_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "review_db_persist_failed"))
        throw new Error("review_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "dispute_open_db_persist_failed"))
        throw new Error("dispute_open_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "dispute_resolve_db_persist_failed"))
        throw new Error("dispute_resolve_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "itinerary_db_persist_failed"))
        throw new Error("itinerary_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "order_db_persist_failed")) throw new Error("order_db_persist_failed");
      if (
        res.status === 503 &&
        (j.status === "outbox_persist_failed" || jsonHasMachineKey(j, "outbox_persist_failed"))
      )
        throw new Error("outbox_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "auth_db_persist_failed")) throw new Error("auth_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "guide_db_persist_failed")) throw new Error("guide_db_persist_failed");
      if (res.status === 503 && jsonHasMachineKey(j, "chain_off_unavailable")) throw new Error("chain_off_unavailable");
      if (res.status === 503 && jsonHasMachineKey(j, "database_required")) throw new Error("database_required");
      if (
        res.status === 503 &&
        (jsonHasMachineKey(j, "degraded_mode") || j.status === "degraded_mode")
      )
        throw new Error("degraded_mode");
      if (res.status === 503 && (jsonHasMachineKey(j, "api_paused") || j.status === "paused")) throw new Error("api_paused");
      if (res.status === 410 && jsonHasMachineKey(j, "token_expired")) throw new Error("token_expired");
      if (res.status === 500 && jsonHasMachineKey(j, "fee_router_stats_failed"))
        throw new Error("fee_router_stats_failed");
      if (res.status === 500 && jsonHasMachineKey(j, "fee_router_list_failed")) throw new Error("fee_router_list_failed");
      if (res.status === 500 && jsonHasMachineKey(j, "onboarding_entitlement_lookup_failed"))
        throw new Error("onboarding_entitlement_lookup_failed");
      if (res.status === 400 && jsonHasMachineKey(j, "score_must_be_1_to_5")) throw new Error("score_must_be_1_to_5");
      if (res.status === 400 && jsonHasMachineKey(j, "onboarding_entitlement_required"))
        throw new Error("onboarding_entitlement_required");
      if (res.status === 400 && jsonHasMachineKey(j, "review_comment_required_for_low_score"))
        throw new Error("review_comment_required_for_low_score");
      /** 证据 POST（`chain_off/evidence`）400：与 **04**、`mapOrderWriteError`、**`trust-gate-dispute-evidence`** 同源机读键 */
      if (res.status === 400 && jsonHasMachineKey(j, "content_hash_required"))
        throw new Error("content_hash_required");
      if (res.status === 400 && jsonHasMachineKey(j, "content_hash_too_long"))
        throw new Error("content_hash_too_long");
      if (res.status === 400 && jsonHasMachineKey(j, "content_hash_must_be_hex"))
        throw new Error("content_hash_must_be_hex");
      if (res.status === 400 && jsonHasMachineKey(j, "quote_canonical_too_long"))
        throw new Error("quote_canonical_too_long");
      if (res.status === 400 && jsonHasMachineKey(j, "invalid_quote_hash")) throw new Error("invalid_quote_hash");
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
      const matchedGuide = guideErrors.find((k) => jsonHasMachineKey(j, k));
      if (res.status === 400 && matchedGuide) throw new Error(matchedGuide);
      if (res.status === 403 && jsonHasMachineKey(j, "review_window_expired")) throw new Error("review_window_expired");
      if (res.status === 403 && jsonHasMachineKey(j, "seed_test_accounts_disabled"))
        throw new Error("seed_test_accounts_disabled");
      if (res.status === 403 && jsonHasMachineKey(j, "trust_guide_pending_review"))
        throw new Error("trust_guide_pending_review");
      if (res.status === 403 && jsonHasMachineKey(j, "trust_verification_pending"))
        throw new Error("trust_verification_pending");
      if (res.status === 403 && jsonHasMachineKey(j, "trust_identity_restricted"))
        throw new Error("trust_identity_restricted");
      if (res.status === 403 && jsonHasMachineKey(j, "trust_risk_too_high")) throw new Error("trust_risk_too_high");
      if (res.status === 403 && jsonHasMachineKey(j, "delegation_active_cannot_vote"))
        throw new Error("delegation_active_cannot_vote");
      if (res.status === 403 && jsonHasMachineKey(j, "not_guide")) throw new Error("not_guide");
      if (res.status === 403 && jsonHasMachineKey(j, "not_tourist")) throw new Error("not_tourist");
      if (res.status === 403 && jsonHasMachineKey(j, "forbidden")) throw new Error("forbidden");
      if (res.status === 403 && jsonHasMachineKey(j, "internal_api_forbidden")) {
        throw new Error("internal_api_forbidden");
      }
      if (res.status === 400 && jsonHasMachineKey(j, "invalid_limit")) throw new Error("invalid_limit");
      if (res.status === 400 && jsonHasMachineKey(j, "invalid_cursor")) throw new Error("invalid_cursor");
      if (res.status === 400 && jsonHasMachineKey(j, "video_too_long")) {
        const ds = (j as Record<string, unknown>).max_duration_sec;
        const d =
          typeof ds === "number" && Number.isFinite(ds) ? Math.floor(ds as number) : null;
        throw new Error(d != null && d > 0 ? `video_too_long|max_duration_sec=${d}` : "video_too_long");
      }
      if (res.status === 400 && jsonHasMachineKey(j, "video_metadata_unreadable")) {
        throw new Error("video_metadata_unreadable");
      }
      if (res.status === 413 && jsonHasMachineKey(j, "file_too_large")) {
        const mbRaw = (j as Record<string, unknown>).max_bytes;
        const mb =
          typeof mbRaw === "number" && Number.isFinite(mbRaw) ? Math.floor(mbRaw as number) : null;
        throw new Error(mb != null && mb > 0 ? `file_too_large|max_bytes=${mb}` : "file_too_large");
      }
      if (
        res.status === 501 &&
        (j.status === "not_implemented" || jsonHasMachineKey(j, "not_implemented"))
      )
        throw new Error("not_implemented");
      if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
      else if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim();
      else if (typeof j.detail === "string" && j.detail.trim()) msg = j.detail.trim();
      else if (typeof j.description === "string" && j.description.trim()) msg = j.description.trim();
    } catch (e) {
      if (e instanceof Error) {
        const rethrow = ["invalid_credentials", "invalid_old_password", "login_required", "rate_limit_exceeded", "critical_write_rate_limit_exceeded", "evidence_rate_limit_exceeded", "review_rate_limit_exceeded", "auth_login_per_email_rate_limited", "auth_login_per_ip_rate_limited", "auth_login_global_rate_limited", "onboarding_quote_rate_limited", "onboarding_user_write_rate_limited", "already_reviewed", "order_not_final_financial_state", "order_has_no_completed_at", "already_guide", "email_already_registered", "already_voted", "proposal_not_found", "invalid_proposal_id", "invalid_vote", "cannot_delegate_to_self", "invalid_delegate_to", "no_active_delegation", "delegation_active_cannot_vote", "evidence_db_persist_failed", "message_db_persist_failed", "review_db_persist_failed", "dispute_open_db_persist_failed", "dispute_resolve_db_persist_failed", "itinerary_db_persist_failed", "order_db_persist_failed", "auth_db_persist_failed", "guide_db_persist_failed", "chain_off_unavailable", "database_required", "degraded_mode", "api_paused", "token_expired", "fee_router_stats_failed", "fee_router_list_failed", "onboarding_entitlement_lookup_failed", "outbox_persist_failed", "score_must_be_1_to_5", "onboarding_entitlement_required", "review_comment_required_for_low_score", "review_window_expired", "seed_test_accounts_disabled", "trust_guide_pending_review", "trust_verification_pending", "trust_identity_restricted", "trust_risk_too_high", "forbidden", "internal_api_forbidden", "invalid_limit", "invalid_cursor", "not_implemented", "invalid_wallet_address", "city_required", "city_too_long", "file_too_large", "video_too_long", "video_metadata_unreadable", "invalid_file_type", "invalid_email", "password_too_short", "password_too_long", "id_photo_required", "guide_license_url_invalid", "invalid_uuid", "invalid_base64", "invalid_filename", "invalid_registration_role", "content_hash_required", "content_hash_too_long", "content_hash_must_be_hex", "quote_canonical_too_long", "invalid_quote_hash", "not_guide", "not_tourist"];
        if (
          rethrow.includes(e.message) ||
          /^file_too_large\|max_bytes=\d+$/.test(e.message) ||
          /^video_too_long\|max_duration_sec=\d+$/.test(e.message)
        ) {
          throw attach429RetryAfterToError(e, res, j);
        }
        /** 未来新增 **429** 机读键若未列入 **`rethrow`**，仍须带 **`retryAfterSeconds`**（与 **①②③** 头/体同源）。 */
        if (res.status === 429) {
          throw attach429RetryAfterToError(e, res, j);
        }
      }
      throw e;
    }
    if (res.status === 403 && jsonHasMachineKey(j, "onboarding_forbidden_sanctions")) {
      throw attach429RetryAfterToError(new Error("onboarding_forbidden_sanctions"), res, j);
    }
    if (res.status === 403) {
      const combined = [j.message, j.error, j.detail, String(j.code ?? "")].filter(Boolean).join(" ");
      if (j.code === "ofac" || /ofac|compliance|风控|合规/i.test(combined))
        msg = "风控/合规限制，当前操作不可用。如有疑问请联系客服。";
      else if (typeof j.message === "string" && !/forbidden|^请求失败\s*403$/i.test(j.message)) msg = j.message;
      else if (typeof j.error === "string" && !/forbidden/i.test(j.error)) msg = j.error;
      else msg = "您暂无权限查看该内容，请返回订单列表或自由市场。";
    }
    /** 网关/代理常返回空 JSON 体；`请求失败 N` 无法被 `requestFailedHttpUserText` 映射，改为稳定码供 i18n */
    if (msg === `请求失败 ${res.status}`) {
      msg = `request_failed_${res.status}`;
    }
    throw attach429RetryAfterToError(new Error(msg), res, j);
  }
  return parseSuccessJsonBody(text);
}
