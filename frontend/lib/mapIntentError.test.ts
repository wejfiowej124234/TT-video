import { describe, expect, it } from "vitest";
import { mapIntentError } from "./mapIntentError";

const t = (k: string) => k;

describe("mapIntentError", () => {
  it("maps wallet_required", () => {
    expect(mapIntentError(new Error("wallet_required"), t)).toBe("escrow_intentConnectWallet");
  });
  it("maps outbox_persist_failed", () => {
    expect(mapIntentError(new Error("outbox_persist_failed"), t)).toBe("escrow_intentOutboxFailed");
  });
  it("maps user rejection", () => {
    expect(mapIntentError(new Error("User rejected the request."), t)).toBe("escrow_intentRejected");
  });
  it("maps order_db_persist_failed", () => {
    expect(mapIntentError(new Error("order_db_persist_failed"), t)).toBe("escrow_orderDbUnavailable");
  });
  it("maps rate_limit_exceeded", () => {
    expect(mapIntentError(new Error("rate_limit_exceeded"), t)).toBe("common_apiRateLimitExceeded");
  });
  it("maps rate_limit_unavailable", () => {
    expect(mapIntentError(new Error("rate_limit_unavailable"), t)).toBe("common_apiRateLimitUnavailable");
  });
  it("maps critical_write_rate_limit_exceeded", () => {
    expect(mapIntentError(new Error("critical_write_rate_limit_exceeded"), t)).toBe("common_apiCriticalWriteRateLimit");
  });
  it("maps evidence_rate_limit_exceeded", () => {
    expect(mapIntentError(new Error("evidence_rate_limit_exceeded"), t)).toBe("common_apiEvidenceRateLimit");
  });
  it("maps review_rate_limit_exceeded", () => {
    expect(mapIntentError(new Error("review_rate_limit_exceeded"), t)).toBe("escrow_reviewRateLimited");
  });
  it("maps allowance-like forwarded or RPC messages to escrow_allowanceHint", () => {
    expect(mapIntentError(new Error("ERC20InsufficientAllowance()"), t)).toBe("escrow_allowanceHint");
    expect(mapIntentError(new Error("transfer amount exceeds allowance"), t)).toBe("escrow_allowanceHint");
  });
  it("maps request_failed_<HTTP> like mapOrderWriteError", () => {
    expect(mapIntentError(new Error("request_failed_401"), t)).toBe("order_error_login_required");
    expect(mapIntentError(new Error("request_failed_429"), t)).toBe("common_apiRateLimitExceeded");
    expect(mapIntentError(new Error("request_failed_503"), t)).toBe("common_apiHttpServer");
  });
  it("delegates other chain-off codes to mapOrderWriteError after intent-specific rules", () => {
    expect(mapIntentError(new Error("unauthorized"), t)).toBe("order_error_login_required");
    expect(mapIntentError(new Error("forbidden"), t)).toBe("order_error_forbidden");
    expect(mapIntentError(new Error("not_found"), t)).toBe("common_apiHttpNotFound");
    expect(mapIntentError(new Error("version_conflict"), t)).toBe("escrow_versionConflict");
  });
  it("normalizes spaced messages before mapOrderWriteError (legacy API / other routes)", () => {
    expect(mapIntentError(new Error("invalid user id"), t)).toBe("common_apiHttpInvalid");
    expect(mapIntentError(new Error("invalid id"), t)).toBe("common_apiHttpInvalid");
  });
  it("uses fallback key for unknown non-Error", () => {
    expect(mapIntentError(null, t, { fallbackKey: "dispute_resolveFailed" })).toBe("dispute_resolveFailed");
  });
  it("falls back for unknown Error (no raw passthrough)", () => {
    expect(mapIntentError(new Error("custom_api"), t)).toBe("escrow_requestFailed");
    expect(mapIntentError(new Error("custom_api"), t, { fallbackKey: "dispute_uploadFailed" })).toBe(
      "dispute_uploadFailed"
    );
  });
});
