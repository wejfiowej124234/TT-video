import { describe, expect, it } from "vitest";
import { mapApiReadError } from "./mapApiReadError";

const t = (k: string) => k;

describe("mapApiReadError · delegation to mapOrderWriteError", () => {
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
    expect(mapApiReadError(new Error("post_rate_limited"), t, "fb")).toBe("community_api_msg_post_rate_limited");
    expect(mapApiReadError(new Error("comment_duplicate"), t, "fb")).toBe("community_api_msg_comment_duplicate");
    expect(mapApiReadError(new Error("community_penalty_active"), t, "fb")).toBe(
      "community_api_msg_community_penalty_active"
    );
    expect(mapApiReadError(new Error("commerce_fields_incomplete"), t, "fb")).toBe(
      "community_api_msg_commerce_fields_incomplete"
    );
    expect(mapApiReadError(new Error("empty_body"), t, "fb")).toBe("community_api_msg_empty_body");
    expect(mapApiReadError(new Error("unsupported_mime"), t, "fb")).toBe("community_api_msg_unsupported_mime");
    expect(mapApiReadError(new Error("mkdir_failed"), t, "fb")).toBe("community_api_msg_mkdir_failed");
    expect(mapApiReadError(new Error("internal_api_forbidden"), t, "fb")).toBe("common_error_internalApiForbidden");
  });
});
