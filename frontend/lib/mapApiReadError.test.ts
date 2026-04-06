import { describe, expect, it } from "vitest";
import { mapApiReadError } from "./mapApiReadError";

const t = (k: string) => k;

describe("mapApiReadError", () => {
  it("returns raw message for compliance errors (403 substring)", () => {
    expect(mapApiReadError(new Error("HTTP 403 blocked"), t, "fb")).toBe("HTTP 403 blocked");
  });

  it("returns raw message for compliance errors (风控/合规 copy)", () => {
    expect(mapApiReadError(new Error("因合规限制无法展示"), t, "fb")).toBe("因合规限制无法展示");
  });

  it("uses fallbackKey for compliance-looking non-Error values", () => {
    expect(mapApiReadError("403 string", t, "my_fallback")).toBe("my_fallback");
  });

  it("delegates to mapOrderWriteError for request_failed_<HTTP> placeholders", () => {
    expect(mapApiReadError(new Error("request_failed_404"), t, "fb")).toBe("common_apiHttpNotFound");
    expect(mapApiReadError(new Error("request_failed_429"), t, "fb")).toBe("common_apiRateLimitExceeded");
  });

  it("delegates to mapOrderWriteError for known API codes", () => {
    expect(mapApiReadError(new Error("not_found"), t, "fb")).toBe("common_apiHttpNotFound");
    expect(mapApiReadError(new Error("unauthorized"), t, "fb")).toBe("order_error_login_required");
    expect(mapApiReadError(new Error("login_required"), t, "fb")).toBe("order_error_login_required");
    expect(mapApiReadError(new Error("order_not_found"), t, "fb")).toBe("order_error_order_not_found");
    expect(mapApiReadError(new Error("rate_limit_exceeded"), t, "fb")).toBe("common_apiRateLimitExceeded");
    expect(mapApiReadError(new Error("rate_limit_unavailable"), t, "fb")).toBe("common_apiRateLimitUnavailable");
    expect(mapApiReadError(new Error("invalid_state"), t, "fb")).toBe("order_error_state_conflict");
    expect(mapApiReadError(new Error("invalid_cursor"), t, "fb")).toBe("order_error_invalid_cursor");
    expect(mapApiReadError(new Error("invalid_limit"), t, "fb")).toBe("order_error_invalid_limit");
    expect(mapApiReadError(new Error("chain_off_unavailable"), t, "fb")).toBe("common_apiHttpServer");
    expect(mapApiReadError(new Error("not_implemented"), t, "fb")).toBe("common_apiNotImplemented");
    expect(mapApiReadError(new Error("payment_window_expired"), t, "fb")).toBe("order_error_payment_window_expired");
    expect(mapApiReadError(new Error("draft_cap_exceeded"), t, "fb")).toBe("itinerary_error_draft_cap_exceeded");
    expect(mapApiReadError(new Error("invalid_guide_id"), t, "fb")).toBe("itin_error_invalid_guide_id");
    expect(mapApiReadError(new Error("invalid_country_code"), t, "fb")).toBe("guide_error_invalid_country_code");
    expect(mapApiReadError(new Error("invalid_destination_country"), t, "fb")).toBe(
      "itinerary_error_invalid_destination_country"
    );
    expect(mapApiReadError(new Error("invalid_city_for_country"), t, "fb")).toBe(
      "itinerary_error_invalid_city_for_country"
    );
    expect(mapApiReadError(new Error("invalid_creator_type"), t, "fb")).toBe("itinerary_error_invalid_creator_type");
    expect(mapApiReadError(new Error("city_required"), t, "fb")).toBe("guide_error_city_required");
    expect(mapApiReadError(new Error("already_guide"), t, "fb")).toBe("guide_error_already_guide");
    expect(mapApiReadError(new Error("guide_db_persist_failed"), t, "fb")).toBe("guide_error_db_persist_failed");
    expect(mapApiReadError(new Error("invalid_credentials"), t, "fb")).toBe("auth_error_invalid_credentials");
    expect(mapApiReadError(new Error("content_hash_required"), t, "fb")).toBe("evidence_error_content_hash_required");
    expect(mapApiReadError(new Error("invalid_quote_hash"), t, "fb")).toBe("evidence_error_invalid_quote_hash");
    expect(mapApiReadError(new Error("invalid_order_state"), t, "fb")).toBe("dispute_error_invalid_order_state");
    expect(mapApiReadError(new Error("review_db_persist_failed"), t, "fb")).toBe("escrow_reviewDbUnavailable");
  });

  it("uses fallbackKey for unknown errors", () => {
    expect(mapApiReadError(new Error("totally_unknown"), t, "orders_requestFailed")).toBe("orders_requestFailed");
  });
});
