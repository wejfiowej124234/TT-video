import { describe, it, expect } from "vitest";
import { COMMUNITY_ABUSE_429_CODES } from "../../communityApiMessageCodes";
import {
  getApiRetryAfterSeconds,
  parseResponse,
} from ".";

describe("parseResponse (Phase 4/5 API 契约)", () => {

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

  it("maps 429 rate_limit_exceeded and fills retryAfterSeconds from JSON when Retry-After header missing", async () => {
    const res = new Response(
      JSON.stringify({ error: "rate_limit_exceeded", message: "请求过于频繁", retry_after_seconds: 60 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toMatchObject({ message: "rate_limit_exceeded" });
      expect(getApiRetryAfterSeconds(e)).toBe(60);
    }
  });

  it("429 Retry-After header wins over JSON retry_after_seconds", async () => {
    const res = new Response(
      JSON.stringify({ error: "rate_limit_exceeded", message: "x", retry_after_seconds: 99 }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "12" },
      }
    );
    try {
      await parseResponse(res);
      expect.fail("expected throw");
    } catch (e) {
      expect(getApiRetryAfterSeconds(e)).toBe(12);
    }
  });

  it("429 without header coalesces JSON retry_after_sec before retry_after_seconds", async () => {
    const res = new Response(
      JSON.stringify({
        error: "rate_limit_exceeded",
        message: "x",
        retry_after_sec: 7,
        retry_after_seconds: 88,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
      expect.fail("expected throw");
    } catch (e) {
      expect(getApiRetryAfterSeconds(e)).toBe(7);
    }
  });

  it("429 generic community-style body uses retry_after_sec when header missing", async () => {
    const res = new Response(
      JSON.stringify({
        status: "error",
        error: "post_rate_limited",
        message: "post_rate_limited",
        retry_after_sec: 25,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
      expect.fail("expected throw");
    } catch (e) {
      expect((e as Error).message).toBe("post_rate_limited");
      expect(getApiRetryAfterSeconds(e)).toBe(25);
    }
  });
});
