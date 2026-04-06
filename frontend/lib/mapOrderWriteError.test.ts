import { describe, expect, it } from "vitest";
import { mapOrderWriteError } from "./mapOrderWriteError";

const t = (k: string) => k;

/** 与 mapOrderWriteError 分支一一对应，便于 53 附录 C / mapApiReadError 回归 */
const CASES: [string, string][] = [
  ["login_required", "order_error_login_required"],
  ["unauthorized", "order_error_login_required"],
  ["not_found", "common_apiHttpNotFound"],
  ["service_unavailable", "common_apiHttpServer"],
  ["chain_off_unavailable", "common_apiHttpServer"],
  ["not_implemented", "common_apiNotImplemented"],
  ["invalid_user_id", "common_apiHttpInvalid"],
  ["invalid_id", "common_apiHttpInvalid"],
  ["invalid_uuid", "common_apiHttpInvalid"],
  ["invalid_base64", "common_apiHttpInvalid"],
  ["invalid_filename", "common_apiHttpInvalid"],
  ["write_failed", "common_apiHttpServer"],
  ["invalid_email", "auth_error_invalid_email"],
  ["proposal_not_found", "governance_error_proposal_not_found"],
  ["password_too_short", "auth_error_password_too_short"],
  ["password_too_long", "auth_error_password_too_long"],
  ["password_hash_failed", "auth_error_password_hash_failed"],
  ["email_already_registered", "auth_error_email_already_registered"],
  ["seed_test_accounts_disabled", "auth_error_seed_test_accounts_disabled"],
  ["auth_db_persist_failed", "auth_error_auth_db_persist_failed"],
  ["invalid_credentials", "auth_error_invalid_credentials"],
  ["refresh_token_required", "auth_error_refresh_token_required"],
  ["invalid_token", "auth_error_invalid_token"],
  ["db_error", "auth_error_db_error"],
  ["old_password_required", "auth_error_old_password_required"],
  ["user_not_found", "auth_error_user_not_found"],
  ["invalid_old_password", "auth_error_invalid_old_password"],
  ["invalid_proposal_id", "governance_error_invalid_proposal_id"],
  ["invalid_vote", "governance_error_invalid_vote"],
  ["order_not_found", "order_error_order_not_found"],
  ["forbidden", "order_error_forbidden"],
  ["not_guide", "order_error_not_guide"],
  ["trust_guide_pending_review", "order_error_trust_guide_pending_review"],
  ["trust_verification_pending", "order_error_trust_verification_pending"],
  ["trust_identity_restricted", "order_error_trust_identity_restricted"],
  ["trust_risk_too_high", "order_error_trust_risk_too_high"],
  ["not_tourist", "order_error_not_tourist"],
  ["guide_not_found", "order_error_guide_not_found"],
  ["invalid_guide_id", "itin_error_invalid_guide_id"],
  ["guide_not_active", "order_error_guide_not_active"],
  ["guide_has_active_order", "order_error_guide_has_active_order"],
  ["invalid_country_code", "guide_error_invalid_country_code"],
  ["invalid_destination_country", "itinerary_error_invalid_destination_country"],
  ["invalid_city_for_country", "itinerary_error_invalid_city_for_country"],
  ["city_required", "guide_error_city_required"],
  ["city_too_long", "guide_error_city_too_long"],
  ["invalid_wallet_address", "guide_error_invalid_wallet_address"],
  ["wallet_too_long", "guide_error_wallet_too_long"],
  ["id_photo_required", "guide_error_id_photo_required"],
  ["real_name_too_long", "guide_error_real_name_too_long"],
  ["passport_number_too_long", "guide_error_passport_number_too_long"],
  ["bio_too_long", "guide_error_bio_too_long"],
  ["languages_invalid", "guide_error_languages_invalid"],
  ["service_types_invalid", "guide_error_service_types_invalid"],
  ["guide_license_url_invalid", "guide_error_license_url_invalid"],
  ["already_guide", "guide_error_already_guide"],
  ["guide_db_persist_failed", "guide_error_db_persist_failed"],
  ["accept_window_expired", "order_error_accept_window_expired"],
  ["payment_window_expired", "order_error_payment_window_expired"],
  ["schedule_conflict", "order_error_schedule_conflict"],
  ["dispute_already_open", "order_error_dispute_already_open"],
  ["invalid_order_state", "dispute_error_invalid_order_state"],
  ["insufficient_arb_fee", "order_error_insufficient_arb_fee"],
  ["order_not_draft", "order_error_order_not_draft"],
  ["order_not_editable", "order_error_order_not_editable"],
  ["already_confirmed", "order_error_already_confirmed"],
  ["itinerary_not_found", "order_error_itinerary_not_found"],
  ["itinerary_already_confirmed", "order_error_itinerary_already_confirmed"],
  ["draft_cap_exceeded", "itinerary_error_draft_cap_exceeded"],
  ["in_progress_cap_exceeded", "itinerary_error_in_progress_cap_exceeded"],
  ["invalid_days", "itinerary_error_invalid_days"],
  ["destination_and_city_required", "itinerary_error_destination_and_city_required"],
  ["invalid_creator_type", "itinerary_error_invalid_creator_type"],
  ["invalid_amount", "itinerary_error_invalid_amount"],
  ["invalid_escrow_address", "order_error_invalid_escrow_address"],
  ["invalid_cursor", "order_error_invalid_cursor"],
  ["invalid_limit", "order_error_invalid_limit"],
  ["dispute_not_found", "order_error_dispute_not_found"],
  ["refund_ratio_must_be_0_to_1", "order_error_refund_ratio_invalid"],
  ["only_arbitrator_can_resolve", "order_error_only_arbitrator_can_resolve"],
  ["already_resolved", "order_error_dispute_already_resolved"],
  ["rate_limit_exceeded", "common_apiRateLimitExceeded"],
  ["rate_limit_unavailable", "common_apiRateLimitUnavailable"],
  ["evidence_rate_limit_exceeded", "common_apiEvidenceRateLimit"],
  ["content_hash_required", "evidence_error_content_hash_required"],
  ["content_hash_too_long", "evidence_error_content_hash_too_long"],
  ["content_hash_must_be_hex", "evidence_error_content_hash_must_be_hex"],
  ["quote_canonical_too_long", "evidence_error_quote_canonical_too_long"],
  ["invalid_quote_hash", "evidence_error_invalid_quote_hash"],
  ["critical_write_rate_limit_exceeded", "common_apiCriticalWriteRateLimit"],
  ["outbox_persist_failed", "escrow_intentOutboxFailed"],
  ["invalid_state", "order_error_state_conflict"],
  ["review_window_expired", "order_error_rating_window_expired"],
  ["already_reviewed", "order_error_already_reviewed"],
  ["already_voted", "governance_error_already_voted"],
  ["delegation_active_cannot_vote", "governance_error_delegation_active_cannot_vote"],
  ["cannot_delegate_to_self", "governance_delegate_error_cannot_delegate_to_self"],
  ["invalid_delegate_to", "governance_delegate_error_invalid_delegate_to"],
  ["no_active_delegation", "governance_delegate_error_no_active_delegation"],
  ["order_not_final_financial_state", "order_error_rating_not_ready"],
  ["order_has_no_completed_at", "order_error_rating_not_ready"],
  ["score_must_be_1_to_5", "order_error_score_range"],
  ["review_comment_required_for_low_score", "order_error_review_comment_required"],
  ["review_db_persist_failed", "escrow_reviewDbUnavailable"],
  ["review_rate_limit_exceeded", "escrow_reviewRateLimited"],
  ["order_db_persist_failed", "escrow_orderDbUnavailable"],
  ["dispute_open_db_persist_failed", "escrow_disputeOpenDbUnavailable"],
  ["itinerary_db_persist_failed", "escrow_itineraryDbUnavailable"],
  ["version_conflict", "escrow_versionConflict"],
  ["content_required", "order_error_message_content_required"],
  ["message_db_persist_failed", "escrow_chatDbUnavailable"],
  ["evidence_db_persist_failed", "dispute_evidenceDbUnavailable"],
  ["dispute_resolve_db_persist_failed", "dispute_resolveDbUnavailable"],
];

describe("mapOrderWriteError", () => {
  it.each(CASES)("maps %s → %s", (code, key) => {
    expect(mapOrderWriteError(new Error(code), t)).toBe(key);
  });

  it("maps request_failed_<HTTP> placeholders (shared with admin envelope)", () => {
    expect(mapOrderWriteError(new Error("request_failed_401"), t)).toBe("order_error_login_required");
    expect(mapOrderWriteError(new Error("request_failed_403"), t)).toBe("order_error_forbidden");
    expect(mapOrderWriteError(new Error("request_failed_404"), t)).toBe("common_apiHttpNotFound");
    expect(mapOrderWriteError(new Error("request_failed_409"), t)).toBe("common_apiHttpConflict");
    expect(mapOrderWriteError(new Error("request_failed_422"), t)).toBe("common_apiHttpInvalid");
    expect(mapOrderWriteError(new Error("request_failed_408"), t)).toBe("common_apiHttpServer");
    expect(mapOrderWriteError(new Error("request_failed_429"), t)).toBe("common_apiRateLimitExceeded");
    expect(mapOrderWriteError(new Error("request_failed_502"), t)).toBe("common_apiHttpServer");
    expect(mapOrderWriteError(new Error("request_failed_400"), t)).toBe("common_apiHttpInvalid");
    expect(mapOrderWriteError(new Error("request_failed_501"), t)).toBe("common_apiNotImplemented");
  });

  it("uses default fallback for unknown Error message", () => {
    expect(mapOrderWriteError(new Error("unknown_code"), t)).toBe("order_error_write_generic");
  });

  it("uses opts.fallbackKey when provided", () => {
    expect(mapOrderWriteError(new Error("x"), t, { fallbackKey: "orders_requestFailed" })).toBe("orders_requestFailed");
  });

  it("treats non-Error as empty code → fallback", () => {
    expect(mapOrderWriteError(null, t)).toBe("order_error_write_generic");
    expect(mapOrderWriteError("not an error", t, { fallbackKey: "fb" })).toBe("fb");
  });
});
