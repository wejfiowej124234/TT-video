import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchJsonWithApiStatusLog,
  getApiRetryAfterSeconds,
  isComplianceError,
  throwUnlessApiOk,
} from ".";

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

  it("false for internal_api_forbidden machine code (mapApiReadError → mapOrderWriteError i18n)", () => {
    expect(isComplianceError(new Error("internal_api_forbidden"))).toBe(false);
  });
});

describe("throwUnlessApiOk", () => {
  it("does nothing when status is ok", () => {
    expect(() => throwUnlessApiOk({ status: "ok" })).not.toThrow();
  });

  it("does nothing when root status is accepted (async intent 202 envelope)", () => {
    expect(() => throwUnlessApiOk({ status: "accepted", intent_id: "x" })).not.toThrow();
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

  it("GET comments error envelope uses message when error omitted (posts.rs JSON parity)", () => {
    expect(() =>
      throwUnlessApiOk({ status: "error", message: "invalid_comment_cursor" })
    ).toThrow("invalid_comment_cursor");
    expect(() =>
      throwUnlessApiOk({ status: "error", message: "comments_cursor_requires_chronological_sort" })
    ).toThrow("comments_cursor_requires_chronological_sort");
  });

  it("community PATCH/DELETE post DB failure envelopes throw stable codes (HTTP 200 + status:error, posts.rs)", () => {
    expect(() =>
      throwUnlessApiOk({ status: "error", error: "delete_failed", message: "delete_failed" })
    ).toThrow("delete_failed");
    expect(() =>
      throwUnlessApiOk({ status: "error", error: "update_failed", message: "update_failed" })
    ).toThrow("update_failed");
  });

  it("uses fallback when error missing", () => {
    expect(() => throwUnlessApiOk({ status: "fail" })).toThrow("unknown");
    expect(() => throwUnlessApiOk({ status: "fail" }, "custom")).toThrow("custom");
  });

  it("attaches retryAfterSeconds from envelope retry_after_sec when status is not ok", () => {
    try {
      throwUnlessApiOk({ status: "error", message: "delete_failed", retry_after_sec: 33 });
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toMatchObject({ message: "delete_failed", retryAfterSeconds: 33 });
    }
  });

  it("prefers retry_after_sec over retry_after_seconds on envelope error", () => {
    try {
      throwUnlessApiOk({
        status: "error",
        message: "x",
        retry_after_sec: 7,
        retry_after_seconds: 99,
      });
      expect.fail("expected throw");
    } catch (e) {
      expect(getApiRetryAfterSeconds(e)).toBe(7);
    }
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

  it("does not throw when res.ok and JSON root status is accepted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "accepted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    const { res, body } = await fetchJsonWithApiStatusLog<{ status: string }>("ctx", "https://x.test/y");
    expect(res.ok).toBe(true);
    expect(body.status).toBe("accepted");
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
