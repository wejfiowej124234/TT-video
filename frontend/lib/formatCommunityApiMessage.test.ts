import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import {
  formatCommunityApiMessage,
  interpretCommunityWriteError,
  messageForCommunityActionResponse,
  parseCommunityApiErrors,
} from "./formatCommunityApiMessage";

const t = (k: string) => {
  if (k === "community_api_msg_empty_body") return "正文不能为空";
  if (k === "fb") return "FB";
  return k;
};

describe("formatCommunityApiMessage", () => {
  it("uses fallback when code empty", () => {
    expect(formatCommunityApiMessage("", t, "fb")).toBe("FB");
    expect(formatCommunityApiMessage(null, t, "fb")).toBe("FB");
  });

  it("uses localized string when t returns non-identity", () => {
    expect(formatCommunityApiMessage("empty_body", t, "fb")).toBe("正文不能为空");
  });

  it("humanizes unknown codes when no i18n match", () => {
    expect(formatCommunityApiMessage("unknown_code_here", t, "fb")).toBe("unknown code here");
  });

  it("maps request_failed_<HTTP> like order/admin paths (shared requestFailedHttpUserText)", () => {
    expect(formatCommunityApiMessage("request_failed_404", t, "fb")).toBe("common_apiHttpNotFound");
    expect(formatCommunityApiMessage("request_failed_429", t, "fb")).toBe("common_apiRateLimitExceeded");
  });

  it("maps community.rs snake codes via shared mapOrderWriteError when applicable", () => {
    expect(formatCommunityApiMessage("unauthorized", t, "fb")).toBe("order_error_login_required");
    expect(formatCommunityApiMessage("forbidden", t, "fb")).toBe("order_error_forbidden");
    expect(formatCommunityApiMessage("not_found", t, "fb")).toBe("common_apiHttpNotFound");
    expect(formatCommunityApiMessage("content_required", t, "fb")).toBe("order_error_message_content_required");
  });

  it("normalizes spaced messages to snake_case before chain-off lookup", () => {
    expect(formatCommunityApiMessage("invalid user id", t, "fb")).toBe("common_apiHttpInvalid");
  });

  it("prefers community_api_msg_* over mapOrderWriteError when locale defines the key", () => {
    const tLoc = (k: string) => {
      if (k === "community_api_msg_unauthorized") return "UA_C";
      if (k === "community_api_msg_not_found") return "NF_THREAD";
      if (k === "community_api_msg_invalid_id") return "INV_ID_COMM";
      return t(k);
    };
    expect(formatCommunityApiMessage("unauthorized", tLoc, "fb")).toBe("UA_C");
    expect(formatCommunityApiMessage("not_found", tLoc, "fb")).toBe("NF_THREAD");
    expect(formatCommunityApiMessage("invalid_id", tLoc, "fb")).toBe("INV_ID_COMM");
  });

  it("maps spaced backend phrases via normalization to community_api_msg_*", () => {
    const tSp = (k: string) => {
      if (k === "community_api_msg_not_found_or_forbidden") return "NFOF";
      if (k === "community_api_msg_db_error") return "DBE";
      if (k === "community_api_msg_invalid_visibility_status") return "IVS";
      return k;
    };
    expect(formatCommunityApiMessage("not found or forbidden", tSp, "fb")).toBe("NFOF");
    expect(formatCommunityApiMessage("db error", tSp, "fb")).toBe("DBE");
    expect(formatCommunityApiMessage("invalid visibility_status", tSp, "fb")).toBe("IVS");
  });
});

describe("parseCommunityApiErrors", () => {
  it("returns null for invalid shapes", () => {
    expect(parseCommunityApiErrors(null)).toBeNull();
    expect(parseCommunityApiErrors({})).toBeNull();
    expect(parseCommunityApiErrors({ errors: null })).toBeNull();
    expect(parseCommunityApiErrors({ errors: {} })).toBeNull();
  });

  it("collects string field codes", () => {
    expect(parseCommunityApiErrors({ errors: { content: "empty_body", x: "  " } })).toEqual({
      content: "empty_body",
    });
  });
});

describe("interpretCommunityWriteError", () => {
  it("null data uses fallback top message", () => {
    expect(interpretCommunityWriteError(null, t, "fb")).toEqual({ topMessage: "FB", fieldMessages: {} });
  });

  it("non-error status returns null top", () => {
    expect(interpretCommunityWriteError({ status: "ok" }, t, "fb")).toEqual({
      topMessage: null,
      fieldMessages: {},
    });
  });

  it("error with root message", () => {
    const r = interpretCommunityWriteError({ status: "error", message: "empty_body" }, t, "fb");
    expect(r.topMessage).toBe("正文不能为空");
    expect(r.fieldMessages).toEqual({});
  });

  it("error with request_failed_<HTTP> root message uses shared HTTP placeholder mapping", () => {
    const r = interpretCommunityWriteError({ status: "error", message: "request_failed_502" }, t, "fb");
    expect(r.topMessage).toBe("common_apiHttpServer");
    expect(r.fieldMessages).toEqual({});
  });

  it("uses root `error` when `message` absent (forward-compatible envelope)", () => {
    const r = interpretCommunityWriteError({ status: "error", error: "not_found" }, t, "fb");
    expect(r.topMessage).toBe("common_apiHttpNotFound");
    expect(r.fieldMessages).toEqual({});
  });

  it("prefers `error` over `message` when both set (aligned with throwUnlessApiOk)", () => {
    const r = interpretCommunityWriteError({ status: "error", message: "empty_body", error: "not_found" }, t, "fb");
    expect(r.topMessage).toBe("common_apiHttpNotFound");
    expect(r.fieldMessages).toEqual({});
  });

  it("error with field errors maps fields and sets top from first field", () => {
    const r = interpretCommunityWriteError(
      { status: "error", errors: { content: "empty_body", media_urls: "too_many" } },
      t,
      "fb"
    );
    expect(r.fieldMessages.content).toBe("正文不能为空");
    expect(r.fieldMessages.media_urls).toBe("too many");
    expect(r.topMessage).toBe("正文不能为空");
  });

  it("error without message uses fallback when no field errors", () => {
    const r = interpretCommunityWriteError({ status: "error" }, t, "fb");
    expect(r.topMessage).toBe("FB");
    expect(r.fieldMessages).toEqual({});
  });

  /** B-056 / community.rs `response_community_abuse`：429 体含 `errors.body` 与根级 `error` 同码 */
  it.each(["comment_rate_limited", "comment_too_fast", "comment_duplicate"] as const)(
    "maps comment abuse code %s to locale community_api_msg_* (field + root)",
    (code) => {
      const dict = zh as Record<string, string>;
      const tZh = (k: string) => dict[k] ?? k;
      const expected = dict[`community_api_msg_${code}`];
      expect(expected?.trim().length).toBeGreaterThan(0);
      const payload = {
        status: "error",
        error: code,
        message: code,
        errors: { body: code },
      };
      const r = interpretCommunityWriteError(payload, tZh, "community_comment_send_failed");
      expect(r.fieldMessages.body).toBe(expected);
      expect(r.topMessage).toBe(expected);
    }
  );
});

describe("messageForCommunityActionResponse", () => {
  it("null or non-object returns fallback", () => {
    expect(messageForCommunityActionResponse(null, t, "fb")).toBe("FB");
    expect(messageForCommunityActionResponse("x", t, "fb")).toBe("FB");
  });

  it("non-error object returns fallback", () => {
    expect(messageForCommunityActionResponse({ status: "ok" }, t, "fb")).toBe("FB");
  });

  it("error object returns interpreted top message", () => {
    expect(messageForCommunityActionResponse({ status: "error", message: "empty_body" }, t, "fb")).toBe(
      "正文不能为空"
    );
  });
});
