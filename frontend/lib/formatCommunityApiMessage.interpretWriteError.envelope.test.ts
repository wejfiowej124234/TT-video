import { describe, expect, it } from "vitest";
import { interpretCommunityWriteError } from "./formatCommunityApiMessage";
import { formatCommunityApiMessageTestT as t } from "./formatCommunityApiMessage.vitestShared";

describe("interpretCommunityWriteError · envelope & root/field", () => {
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
});
