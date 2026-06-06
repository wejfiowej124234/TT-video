import { describe, it, expect } from "vitest";
import { COMMUNITY_ABUSE_429_CODES } from "../../communityApiMessageCodes";
import {
  getApiRetryAfterSeconds,
  parseResponse,
} from ".";

describe("parseResponse (Phase 4/5 API 契约)", () => {

  it("429 with unlisted machine error preserves error key and attaches retry_after_sec (forward-compat)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "new_rl_key_reserved_for_backend",
        message: "new_rl_key_reserved_for_backend",
        retry_after_sec: 9,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
      expect.fail("expected throw");
    } catch (e) {
      expect((e as Error).message).toBe("new_rl_key_reserved_for_backend");
      expect(getApiRetryAfterSeconds(e)).toBe(9);
    }
  });

  it("maps 429 critical_write_rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "critical_write_rate_limit_exceeded", message: "关键操作过于频繁" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("critical_write_rate_limit_exceeded");
  });

  it("429 critical_write_rate_limit_exceeded attaches retryAfterSeconds from dual JSON (middleware parity)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "critical_write_rate_limit_exceeded",
        message: "critical_write_rate_limit_exceeded",
        retry_after_sec: 60,
        retry_after_seconds: 60,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
    } catch (e) {
      expect((e as Error).message).toBe("critical_write_rate_limit_exceeded");
      expect(getApiRetryAfterSeconds(e)).toBe(60);
      return;
    }
    throw new Error("expected parseResponse to reject");
  });

  it("maps 429 evidence_rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "evidence_rate_limit_exceeded" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("evidence_rate_limit_exceeded");
  });

  it("429 evidence_rate_limit_exceeded reads retry_after_sec from JSON (chain_off parity)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "evidence_rate_limit_exceeded",
        message: "evidence_rate_limit_exceeded",
        max_per_minute: 10,
        retry_after_sec: 60,
        retry_after_seconds: 60,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
    } catch (e) {
      expect((e as Error).message).toBe("evidence_rate_limit_exceeded");
      expect(getApiRetryAfterSeconds(e)).toBe(60);
      return;
    }
    throw new Error("expected parseResponse to reject");
  });

  it("maps 429 review_rate_limit_exceeded to stable error code", async () => {
    const res = new Response(
      JSON.stringify({ error: "review_rate_limit_exceeded", max_per_minute: 2 }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("review_rate_limit_exceeded");
  });

  it("429 review_rate_limit_exceeded reads retry_after_sec from JSON (chain_off parity)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "review_rate_limit_exceeded",
        message: "review_rate_limit_exceeded",
        max_per_minute: 2,
        retry_after_sec: 60,
        retry_after_seconds: 60,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
    } catch (e) {
      expect((e as Error).message).toBe("review_rate_limit_exceeded");
      expect(getApiRetryAfterSeconds(e)).toBe(60);
      return;
    }
    throw new Error("expected parseResponse to reject");
  });

  it("maps 429 auth_login_per_email_rate_limited and reads retry_after_sec from JSON body", async () => {
    const res = new Response(
      JSON.stringify({
        status_code: 429,
        error: "auth_login_per_email_rate_limited",
        message: "auth_login_per_email_rate_limited",
        retry_after_sec: 120,
        retry_after_seconds: 120,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe("auth_login_per_email_rate_limited");
      expect(getApiRetryAfterSeconds(e)).toBe(120);
      return;
    }
    throw new Error("expected parseResponse to reject");
  });

  it("maps 429 auth_login_per_ip_rate_limited and reads retry_after from JSON body", async () => {
    const res = new Response(
      JSON.stringify({
        status_code: 429,
        error: "auth_login_per_ip_rate_limited",
        message: "auth_login_per_ip_rate_limited",
        retry_after_sec: 900,
        retry_after_seconds: 900,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
    } catch (e) {
      expect((e as Error).message).toBe("auth_login_per_ip_rate_limited");
      expect(getApiRetryAfterSeconds(e)).toBe(900);
      return;
    }
    throw new Error("expected parseResponse to reject");
  });

  it("maps 429 auth_login_global_rate_limited and reads retry_after from JSON body", async () => {
    const res = new Response(
      JSON.stringify({
        status_code: 429,
        error: "auth_login_global_rate_limited",
        message: "auth_login_global_rate_limited",
        retry_after_sec: 60,
        retry_after_seconds: 60,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
    try {
      await parseResponse(res);
    } catch (e) {
      expect((e as Error).message).toBe("auth_login_global_rate_limited");
      expect(getApiRetryAfterSeconds(e)).toBe(60);
      return;
    }
    throw new Error("expected parseResponse to reject");
  });

  it("community 429 abuse codes (04 §3.3) attach Retry-After for getApiRetryAfterSeconds", async () => {
    let retryAfter = 17;
    for (const code of COMMUNITY_ABUSE_429_CODES) {
      const res = new Response(
        JSON.stringify({
          status: "error",
          error: code,
          message: code,
          errors: { body: code },
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
        }
      );
      try {
        await parseResponse(res);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe(code);
        expect(getApiRetryAfterSeconds(e)).toBe(retryAfter);
        retryAfter += 1;
        continue;
      }
      throw new Error(`expected parseResponse to reject for ${code}`);
    }
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

  it("maps 403 review_window_expired when only message carries the machine key", async () => {
    const res = new Response(JSON.stringify({ message: "review_window_expired" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("review_window_expired");
  });

  it("maps 403 onboarding_forbidden_sanctions when only message carries the machine key", async () => {
    const res = new Response(JSON.stringify({ message: "onboarding_forbidden_sanctions" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("onboarding_forbidden_sanctions");
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

  it("maps generic 500 empty JSON body to request_failed_500 for i18n mapping", async () => {
    const res = new Response("{}", {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("request_failed_500");
  });

  it("uses JSON detail when message/error absent (502)", async () => {
    const res = new Response(JSON.stringify({ detail: "upstream timeout" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("upstream timeout");
  });
});
