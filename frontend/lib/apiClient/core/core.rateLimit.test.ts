import { describe, it, expect } from "vitest";
import {
  coalesceRetryAfterSecondsFromJson,
  retryAfterSecondsFrom429Response,
  waitMsFromRateLimitHttpSnapshot,
  RATE_LIMIT_HTTP_BACKOFF_DEFAULT_MS,
} from ".";

describe("coalesceRetryAfterSecondsFromJson", () => {
  it("returns null for non-object", () => {
    expect(coalesceRetryAfterSecondsFromJson(null)).toBeNull();
    expect(coalesceRetryAfterSecondsFromJson(undefined)).toBeNull();
    expect(coalesceRetryAfterSecondsFromJson("x")).toBeNull();
  });

  it("prefers retry_after_sec over retry_after_seconds", () => {
    expect(
      coalesceRetryAfterSecondsFromJson({ retry_after_sec: 3, retry_after_seconds: 90 })
    ).toBe(3);
  });

  it("uses retry_after_seconds when retry_after_sec absent", () => {
    expect(coalesceRetryAfterSecondsFromJson({ retry_after_seconds: 45 })).toBe(45);
  });
});

describe("waitMsFromRateLimitHttpSnapshot (Playwright / 429 退避)", () => {
  it("uses Retry-After header as (sec+1) seconds in ms, clamped", () => {
    expect(waitMsFromRateLimitHttpSnapshot({ "retry-after": "10" }, "{}")).toBe(11_000);
  });

  it("header wins over JSON body", () => {
    expect(
      waitMsFromRateLimitHttpSnapshot(
        { "retry-after": "3" },
        JSON.stringify({ retry_after_seconds: 99 })
      )
    ).toBe(4_000);
  });

  it("JSON coalesce retry_after_sec before retry_after_seconds", () => {
    expect(
      waitMsFromRateLimitHttpSnapshot(
        {},
        JSON.stringify({ retry_after_sec: 5, retry_after_seconds: 90 })
      )
    ).toBe(6_000);
  });

  it("falls back to default when no hint", () => {
    expect(waitMsFromRateLimitHttpSnapshot({}, "not json")).toBe(RATE_LIMIT_HTTP_BACKOFF_DEFAULT_MS);
  });
});

describe("retryAfterSecondsFrom429Response", () => {
  it("returns null when status is not 429", () => {
    expect(retryAfterSecondsFrom429Response(new Response(null, { status: 200 }))).toBeNull();
  });

  it("returns null when headers are missing (partial Response mock)", () => {
    expect(
      retryAfterSecondsFrom429Response({
        status: 429,
        json: async () => ({}),
      } as unknown as Response),
    ).toBeNull();
  });

  it("reads Retry-After on fetch-like Response", () => {
    const res = new Response(null, { status: 429, headers: { "Retry-After": "12" } });
    expect(retryAfterSecondsFrom429Response(res)).toBe(12);
  });
});
