import { describe, expect, it } from "vitest";
import { requestFailedHttpBucket, requestFailedHttpUserText } from "./requestFailedHttp";

describe("requestFailedHttpBucket", () => {
  it("returns null for non-matching messages", () => {
    expect(requestFailedHttpBucket("")).toBeNull();
    expect(requestFailedHttpBucket("login_required")).toBeNull();
    expect(requestFailedHttpBucket("request_failed")).toBeNull();
    expect(requestFailedHttpBucket("request_failed_abc")).toBeNull();
    expect(requestFailedHttpBucket("request_failed_200")).toBeNull();
  });

  it("classifies HTTP status placeholders", () => {
    expect(requestFailedHttpBucket("request_failed_401")).toBe("login_required");
    expect(requestFailedHttpBucket("request_failed_403")).toBe("forbidden");
    expect(requestFailedHttpBucket("request_failed_404")).toBe("not_found");
    expect(requestFailedHttpBucket("request_failed_409")).toBe("conflict");
    expect(requestFailedHttpBucket("request_failed_422")).toBe("invalid_request");
    expect(requestFailedHttpBucket("request_failed_408")).toBe("server_error");
    expect(requestFailedHttpBucket("request_failed_429")).toBe("rate_limited");
    expect(requestFailedHttpBucket("request_failed_501")).toBe("not_implemented");
    expect(requestFailedHttpBucket("request_failed_500")).toBe("server_error");
    expect(requestFailedHttpBucket("request_failed_400")).toBe("invalid_request");
  });
});

describe("requestFailedHttpUserText", () => {
  const t = (k: string) => k;

  it("returns null when not an HTTP placeholder", () => {
    expect(requestFailedHttpUserText("", t)).toBeNull();
    expect(requestFailedHttpUserText("login_required", t)).toBeNull();
  });

  it("maps buckets to i18n keys via t()", () => {
    expect(requestFailedHttpUserText("request_failed_404", t)).toBe("common_apiHttpNotFound");
    expect(requestFailedHttpUserText("request_failed_429", t)).toBe("common_apiRateLimitExceeded");
    expect(requestFailedHttpUserText("request_failed_401", t)).toBe("order_error_login_required");
    expect(requestFailedHttpUserText("request_failed_501", t)).toBe("common_apiNotImplemented");
  });
});
