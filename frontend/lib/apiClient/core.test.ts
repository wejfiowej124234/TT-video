import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchJsonWithApiStatusLog, isComplianceError, parseResponse, throwUnlessApiOk } from "./core";

describe("parseResponse (Phase 4/5 API 契约)", () => {
  it("maps 401 login_required when error and message are aligned", async () => {
    const res = new Response(
      JSON.stringify({ error: "login_required", message: "login_required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("login_required");
  });

  it("maps 401 invalid_credentials to invalid_credentials (login page dedicated copy)", async () => {
    const res = new Response(
      JSON.stringify({ error: "invalid_credentials", message: "invalid_credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("invalid_credentials");
  });

  it("maps 401 invalid_old_password to stable code (PUT /me/password; mapOrderWriteError i18n)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "invalid_old_password",
        message: "old_password is incorrect",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("invalid_old_password");
  });

  it("maps 401 unauthorized (strict session gate) to login_required (same UX / catch path)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "unauthorized",
        detail: "需登录：请提供 X-User-Id 或 Authorization",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("login_required");
  });

  it("maps 400 discover/orders pagination errors to stable codes (error/message aligned)", async () => {
    const res = new Response(JSON.stringify({ error: "invalid_cursor", message: "invalid_cursor" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("invalid_cursor");
  });

  it("maps 400 invalid_limit via error field even if message were missing", async () => {
    const res = new Response(JSON.stringify({ error: "invalid_limit" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("invalid_limit");
  });

  it("maps 413 file_too_large to stable code", async () => {
    const res = new Response(
      JSON.stringify({ error: "file_too_large", message: "file_too_large", max_bytes: 819200 }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("file_too_large");
  });

  it("maps 403 forbidden JSON without being overwritten by generic 403 copy", async () => {
    const res = new Response(JSON.stringify({ error: "forbidden", message: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("forbidden");
  });

  it("maps 403 internal_api_forbidden to stable code", async () => {
    const res = new Response(
      JSON.stringify({
        error: "internal_api_forbidden",
        message: "internal_api_forbidden",
        detail: "INTERNAL_API_SECRET",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("internal_api_forbidden");
  });

  it("maps 403 seed_test_accounts_disabled to stable code", async () => {
    const res = new Response(
      JSON.stringify({ error: "seed_test_accounts_disabled", message: "seed_test_accounts_disabled" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("seed_test_accounts_disabled");
  });

  it("maps 403 trust_* gate codes to stable machine keys (90 / 04)", async () => {
    for (const code of [
      "trust_guide_pending_review",
      "trust_verification_pending",
      "trust_identity_restricted",
      "trust_risk_too_high",
    ]) {
      const res = new Response(JSON.stringify({ error: code, message: code }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
      await expect(parseResponse(res)).rejects.toThrow(code);
    }
  });

  it("maps 503 chain_off_unavailable to stable code", async () => {
    const res = new Response(JSON.stringify({ error: "chain_off_unavailable", message: "chain_off_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("chain_off_unavailable");
  });

  it("maps 503 database_required (270 media) to stable code", async () => {
    const res = new Response(JSON.stringify({ error: "database_required", message: "database_required" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("database_required");
  });

  it("maps 410 token_expired (media access) to stable code", async () => {
    const res = new Response(JSON.stringify({ error: "token_expired", message: "token_expired" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("token_expired");
  });

  it("maps 503 degraded_mode (authority_source_layer) to stable code", async () => {
    const res = new Response(
      JSON.stringify({
        status: "degraded_mode",
        error: "degraded_mode",
        message: "degraded_mode",
        detail: "degraded_mode 时冻结关键写操作",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("degraded_mode");
  });

  it("maps 503 api_paused (pause_gate_layer) via error or status paused", async () => {
    const viaError = new Response(
      JSON.stringify({
        status: "paused",
        error: "api_paused",
        message: "api_paused",
        detail: "PAUSE_MODE=1",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(viaError)).rejects.toThrow("api_paused");
    const viaStatusOnly = new Response(JSON.stringify({ status: "paused", rule: "PAUSE_MODE=1" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(viaStatusOnly)).rejects.toThrow("api_paused");
  });

  it("maps 501 not_implemented envelope to stable code", async () => {
    const res = new Response(
      JSON.stringify({
        status: "not_implemented",
        error: "not_implemented",
        message: "not_implemented",
        path: "/auth/login",
        doc: "04 §三",
      }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("not_implemented");
  });

  it("maps 501 not_implemented via error field when status omitted", async () => {
    const res = new Response(JSON.stringify({ error: "not_implemented", message: "not_implemented" }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("not_implemented");
  });

  it("maps 503 evidence_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({
        error: "evidence_db_persist_failed",
        rule: "TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE=1",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("evidence_db_persist_failed");
  });

  it("maps 503 message_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "message_db_persist_failed", rule: "TRAVELTRUST_STRICT_MESSAGE_DB_WRITE=1" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("message_db_persist_failed");
  });

  it("maps 503 review_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "review_db_persist_failed", rule: "TRAVELTRUST_STRICT_REVIEW_DB_WRITE=1" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("review_db_persist_failed");
  });

  it("maps 503 dispute_open_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({
        error: "dispute_open_db_persist_failed",
        rule: "TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE=1",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("dispute_open_db_persist_failed");
  });

  it("maps 503 dispute_resolve_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({
        error: "dispute_resolve_db_persist_failed",
        rule: "TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE=1",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("dispute_resolve_db_persist_failed");
  });

  it("maps 503 itinerary_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({
        error: "itinerary_db_persist_failed",
        rule: "TRAVELTRUST_STRICT_ITINERARY_DB_WRITE=1",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("itinerary_db_persist_failed");
  });

  it("maps 503 order_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "order_db_persist_failed", rule: "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("order_db_persist_failed");
  });

  it("maps 503 auth_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "auth_db_persist_failed", rule: "TRAVELTRUST_STRICT_AUTH_DB_WRITE=1" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("auth_db_persist_failed");
  });

  it("maps 503 guide_db_persist_failed to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "guide_db_persist_failed", rule: "TRAVELTRUST_STRICT_GUIDE_DB_WRITE=1" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("guide_db_persist_failed");
  });

  it("maps 503 outbox_persist_failed via error field (intent/evidence aligned body)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "outbox_persist_failed",
        message: "outbox_persist_failed",
        detail: "enqueue failed",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("outbox_persist_failed");
  });

  it("maps 500 fee_router_stats_failed to stable error code (admin FeeRouter)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "fee_router_stats_failed",
        message: "fee_router_stats_failed",
        detail: "db connection reset",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("fee_router_stats_failed");
  });

  it("maps 500 fee_router_list_failed to stable error code (admin FeeRouter)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "fee_router_list_failed",
        message: "fee_router_list_failed",
        detail: "syntax error at or near",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("fee_router_list_failed");
  });

  it("maps 429 rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "rate_limit_exceeded", message: "请求过于频繁", retry_after_seconds: 60 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("rate_limit_exceeded");
  });

  it("maps 429 critical_write_rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "critical_write_rate_limit_exceeded", message: "关键操作过于频繁" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("critical_write_rate_limit_exceeded");
  });

  it("maps 429 evidence_rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "evidence_rate_limit_exceeded" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("evidence_rate_limit_exceeded");
  });

  it("maps 429 review_rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "review_rate_limit_exceeded", max_per_minute: 2 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("review_rate_limit_exceeded");
  });

  it("maps 409 already_reviewed to stable error code", async () => {
    const res = new Response(JSON.stringify({ error: "already_reviewed" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("already_reviewed");
  });

  it("maps 400 review_comment_required_for_low_score to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "review_comment_required_for_low_score", min_chars: 20 }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("review_comment_required_for_low_score");
  });

  it("maps 403 review_window_expired to stable error code", async () => {
    const res = new Response(JSON.stringify({ error: "review_window_expired" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("review_window_expired");
  });

  it("rejects 2xx HTML body with api_html_not_json (proxy/API base misconfigured)", async () => {
    const res = new Response("<!DOCTYPE html><html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
    await expect(parseResponse(res)).rejects.toThrow("api_html_not_json");
  });

  it("rejects 2xx HTML with leading NBSP (trim alone would miss)", async () => {
    const res = new Response("\u00A0\u00A0<!DOCTYPE html><html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
    await expect(parseResponse(res)).rejects.toThrow("api_html_not_json");
  });

  it("rejects 2xx non-JSON with api_invalid_json_body", async () => {
    const res = new Response("not-json", { status: 200 });
    await expect(parseResponse(res)).rejects.toThrow("api_invalid_json_body");
  });

  it("rejects non-2xx HTML body with api_html_not_json (e.g. 500 error page)", async () => {
    const res = new Response("<!DOCTYPE html><html><body>error</body></html>", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
    await expect(parseResponse(res)).rejects.toThrow("api_html_not_json");
  });
});

describe("isComplianceError", () => {
  it("detects 403 in message", () => {
    expect(isComplianceError(new Error("请求失败 403"))).toBe(true);
  });

  it("detects 风控 / 合规限制 copy", () => {
    expect(isComplianceError(new Error("风控/合规限制"))).toBe(true);
    expect(isComplianceError(new Error("合规限制，暂停"))).toBe(true);
  });

  it("false for unrelated errors", () => {
    expect(isComplianceError(new Error("network"))).toBe(false);
    expect(isComplianceError("plain string")).toBe(false);
  });
});

describe("throwUnlessApiOk", () => {
  it("does nothing when status is ok", () => {
    expect(() => throwUnlessApiOk({ status: "ok" })).not.toThrow();
  });

  it("does nothing when root has no status property (auth-style envelope)", () => {
    expect(() => throwUnlessApiOk({ user_id: "u1", token: "t" })).not.toThrow();
  });

  it("throws when data is null", () => {
    expect(() => throwUnlessApiOk(null)).toThrow("unknown");
  });

  it("throws Error with body.error when status is not ok", () => {
    expect(() => throwUnlessApiOk({ status: "error", error: "invalid_state" })).toThrow("invalid_state");
  });

  it("uses body.message when error missing (community-style envelope)", () => {
    expect(() => throwUnlessApiOk({ status: "error", message: "rate_limit_exceeded" })).toThrow(
      "rate_limit_exceeded"
    );
  });

  it("community envelope with aligned error and message throws stable code", () => {
    expect(() =>
      throwUnlessApiOk({ status: "error", error: "empty_body", message: "empty_body" })
    ).toThrow("empty_body");
  });

  it("uses fallback when error missing", () => {
    expect(() => throwUnlessApiOk({ status: "fail" })).toThrow("unknown");
    expect(() => throwUnlessApiOk({ status: "fail" }, "custom")).toThrow("custom");
  });
});

describe("fetchJsonWithApiStatusLog", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed body and ok res", async () => {
    const { res, body } = await fetchJsonWithApiStatusLog<{ status: string }>("ctx", "https://x.test/y");
    expect(res.ok).toBe(true);
    expect(body.status).toBe("ok");
  });

  it("throws when res.ok but JSON root status is not ok (envelope)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "error", message: "gov_stub" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    await expect(fetchJsonWithApiStatusLog<{ status: string }>("ctx", "https://x.test/y")).rejects.toThrow("gov_stub");
  });

  it("does not throw envelope check when HTTP not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "error", message: "forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    const { res, body } = await fetchJsonWithApiStatusLog<{ status: string; message?: string }>("ctx", "https://x.test/y");
    expect(res.ok).toBe(false);
    expect(body.status).toBe("error");
  });
});
