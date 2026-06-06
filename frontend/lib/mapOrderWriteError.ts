import { requestFailedHttpUserText } from "./requestFailedHttp";

/**
 * 订单写接口（取消、双边确认、评分确认等）典型错误码 → 用户可见 i18n 文案（53 附录 C / 37 §2.4）
 */
export function mapOrderWriteError(
  e: unknown,
  t: (key: string) => string,
  opts?: { fallbackKey?: string }
): string {
  const code = e instanceof Error ? e.message : "";
  const fb = opts?.fallbackKey ?? "order_error_write_generic";

  {
    const httpText = requestFailedHttpUserText(code, t);
    if (httpText != null) return httpText;
  }

  if (code === "login_required") return t("order_error_login_required");
  if (code === "unauthorized") return t("order_error_login_required");
  if (code === "not_found") return t("common_apiHttpNotFound");
  if (code === "service_unavailable") return t("common_apiHttpServer");
  if (code === "chain_off_unavailable") return t("common_apiHttpServer");
  if (code === "not_implemented") return t("common_apiNotImplemented");
  if (code === "invalid_user_id" || code === "invalid_id") return t("common_apiHttpInvalid");
  if (code === "invalid_uuid" || code === "invalid_base64" || code === "invalid_filename") return t("common_apiHttpInvalid");
  if (code === "write_failed") return t("common_apiHttpServer");
  if (code === "invalid_email") return t("auth_error_invalid_email");
  if (code === "password_too_short") return t("auth_error_password_too_short");
  if (code === "password_too_long") return t("auth_error_password_too_long");
  if (code === "password_hash_failed") return t("auth_error_password_hash_failed");
  if (code === "email_already_registered") return t("auth_error_email_already_registered");
  if (code === "seed_test_accounts_disabled") return t("auth_error_seed_test_accounts_disabled");
  if (code === "auth_db_persist_failed") return t("auth_error_auth_db_persist_failed");
  if (code === "api_html_not_json") return t("auth_error_api_html_not_json");
  if (code === "api_invalid_json_body") return t("auth_error_api_invalid_json_body");
  if (code === "invalid_credentials") return t("auth_error_invalid_credentials");
  if (code === "refresh_token_required") return t("auth_error_refresh_token_required");
  if (code === "invalid_token") return t("auth_error_invalid_token");
  if (code === "db_error") return t("auth_error_db_error");
  if (code === "old_password_required") return t("auth_error_old_password_required");
  if (code === "user_not_found") return t("auth_error_user_not_found");
  if (code === "invalid_old_password") return t("auth_error_invalid_old_password");
  if (code === "proposal_not_found") return t("governance_error_proposal_not_found");
  if (code === "invalid_proposal_id") return t("governance_error_invalid_proposal_id");
  if (code === "invalid_vote") return t("governance_error_invalid_vote");
  if (code === "already_voted") return t("governance_error_already_voted");
  if (code === "delegation_active_cannot_vote") return t("governance_error_delegation_active_cannot_vote");
  if (code === "cannot_delegate_to_self") return t("governance_delegate_error_cannot_delegate_to_self");
  if (code === "invalid_delegate_to") return t("governance_delegate_error_invalid_delegate_to");
  if (code === "no_active_delegation") return t("governance_delegate_error_no_active_delegation");
  if (code === "order_not_found") return t("order_error_order_not_found");
  if (code === "forbidden") return t("order_error_forbidden");
  if (code === "not_guide") return t("order_error_not_guide");
  if (code === "trust_guide_pending_review") return t("order_error_trust_guide_pending_review");
  if (code === "trust_verification_pending") return t("order_error_trust_verification_pending");
  if (code === "trust_identity_restricted") return t("order_error_trust_identity_restricted");
  if (code === "trust_risk_too_high") return t("order_error_trust_risk_too_high");
  if (code === "not_tourist") return t("order_error_not_tourist");
  if (code === "guide_not_found") return t("order_error_guide_not_found");
  if (code === "invalid_guide_id") return t("itin_error_invalid_guide_id");
  if (code === "guide_not_active") return t("order_error_guide_not_active");
  if (code === "guide_has_active_order") return t("order_error_guide_has_active_order");
  if (code === "guide_required") return t("escrow_confirmBlocked_pickGuide");
  if (code === "guide_already_assigned") return t("order_error_guide_already_assigned");
  if (code === "invalid_country_code") return t("guide_error_invalid_country_code");
  if (code === "invalid_destination_country") return t("itinerary_error_invalid_destination_country");
  if (code === "invalid_city_for_country") return t("itinerary_error_invalid_city_for_country");
  if (code === "city_required") return t("guide_error_city_required");
  if (code === "city_too_long") return t("guide_error_city_too_long");
  if (code === "invalid_wallet_address") return t("guide_error_invalid_wallet_address");
  if (code === "wallet_too_long") return t("guide_error_wallet_too_long");
  if (code === "id_photo_required") return t("guide_error_id_photo_required");
  if (code === "real_name_too_long") return t("guide_error_real_name_too_long");
  if (code === "passport_number_too_long") return t("guide_error_passport_number_too_long");
  if (code === "bio_too_long") return t("guide_error_bio_too_long");
  if (code === "languages_invalid") return t("guide_error_languages_invalid");
  if (code === "service_types_invalid") return t("guide_error_service_types_invalid");
  if (code === "guide_license_url_invalid") return t("guide_error_license_url_invalid");
  if (code === "already_guide") return t("guide_error_already_guide");
  if (code === "guide_db_persist_failed") return t("guide_error_db_persist_failed");
  if (code === "accept_window_expired") return t("order_error_accept_window_expired");
  if (code === "payment_window_expired") return t("order_error_payment_window_expired");
  if (code === "schedule_conflict") return t("order_error_schedule_conflict");
  if (code === "dispute_already_open") return t("order_error_dispute_already_open");
  if (code === "invalid_order_state") return t("dispute_error_invalid_order_state");
  if (code === "insufficient_arb_fee") return t("order_error_insufficient_arb_fee");
  if (code === "order_not_draft") return t("order_error_order_not_draft");
  if (code === "order_not_editable") return t("order_error_order_not_editable");
  if (code === "already_confirmed") return t("order_error_already_confirmed");
  if (code === "itinerary_not_found") return t("order_error_itinerary_not_found");
  if (code === "itinerary_already_confirmed") return t("order_error_itinerary_already_confirmed");
  if (code === "draft_cap_exceeded") return t("itinerary_error_draft_cap_exceeded");
  if (code === "in_progress_cap_exceeded") return t("itinerary_error_in_progress_cap_exceeded");
  if (code === "invalid_days") return t("itinerary_error_invalid_days");
  if (code === "destination_and_city_required") return t("itinerary_error_destination_and_city_required");
  if (code === "invalid_creator_type") return t("itinerary_error_invalid_creator_type");
  if (code === "invalid_amount") return t("itinerary_error_invalid_amount");
  if (code === "invalid_escrow_address") return t("order_error_invalid_escrow_address");
  if (code === "invalid_cursor") return t("order_error_invalid_cursor");
  if (code === "invalid_limit") return t("order_error_invalid_limit");
  if (code === "dispute_not_found") return t("order_error_dispute_not_found");
  if (code === "refund_ratio_must_be_0_to_1") return t("order_error_refund_ratio_invalid");
  if (code === "only_arbitrator_can_resolve") return t("order_error_only_arbitrator_can_resolve");
  if (code === "already_resolved") return t("order_error_dispute_already_resolved");
  if (code === "rate_limit_exceeded") return t("common_apiRateLimitExceeded");
  if (code === "rate_limit_unavailable") return t("common_apiRateLimitUnavailable");
  if (code === "evidence_rate_limit_exceeded") return t("common_apiEvidenceRateLimit");
  if (code === "content_hash_required") return t("evidence_error_content_hash_required");
  if (code === "content_hash_too_long") return t("evidence_error_content_hash_too_long");
  if (code === "content_hash_must_be_hex") return t("evidence_error_content_hash_must_be_hex");
  if (code === "quote_canonical_too_long") return t("evidence_error_quote_canonical_too_long");
  if (code === "invalid_quote_hash") return t("evidence_error_invalid_quote_hash");
  if (code === "critical_write_rate_limit_exceeded") return t("common_apiCriticalWriteRateLimit");
  if (code === "outbox_persist_failed") return t("escrow_intentOutboxFailed");
  if (code === "invalid_state") return t("order_error_state_conflict");
  if (code === "review_window_expired") return t("order_error_rating_window_expired");
  if (code === "already_reviewed") return t("order_error_already_reviewed");
  if (code === "order_not_final_financial_state" || code === "order_has_no_completed_at") {
    return t("order_error_rating_not_ready");
  }
  if (code === "score_must_be_1_to_5") return t("order_error_score_range");
  if (code === "review_comment_required_for_low_score") return t("order_error_review_comment_required");
  if (code === "review_db_persist_failed") return t("escrow_reviewDbUnavailable");
  if (code === "review_rate_limit_exceeded") return t("escrow_reviewRateLimited");
  if (code === "order_db_persist_failed") return t("escrow_orderDbUnavailable");
  if (code === "dispute_open_db_persist_failed") return t("escrow_disputeOpenDbUnavailable");
  if (code === "itinerary_db_persist_failed") return t("escrow_itineraryDbUnavailable");
  if (code === "version_conflict") return t("escrow_versionConflict");
  if (code === "content_required") return t("order_error_message_content_required");
  if (code === "message_db_persist_failed") return t("escrow_chatDbUnavailable");
  if (code === "evidence_db_persist_failed") return t("dispute_evidenceDbUnavailable");
  if (code === "dispute_resolve_db_persist_failed") return t("dispute_resolveDbUnavailable");
  if (code === "acquisition_fulfillment_bond_required") return t("market_acquisition_fulfillment_bond_required");
  if (code === "acquisition_publish_bond_required") return t("market_acquisition_publish_bond_required");
  if (code === "acquisition_publish_suspended") return t("market_acquisition_publish_suspended");
  if (code === "acquisition_wallet_required") return t("market_acquisition_wallet_required");
  if (code === "acquisition_publish_rate_limited") return t("market_acquisition_publish_rate_limited");

  if (code === "onboarding_quote_rate_limited") return t("me_onboarding_error_quoteRateLimited");
  if (code === "onboarding_entitlements_read_failed") return t("me_onboarding_error_serverSide");
  if (code === "missing_onboarding_idempotency_key") return t("me_onboarding_error_missingIdempotencyKey");
  if (code === "onboarding_payment_intents_disabled") return t("me_onboarding_error_paymentIntentsDisabled");
  if (code === "onboarding_compliance_screening_unavailable") return t("me_onboarding_error_complianceScreeningUnavailable");
  if (code === "onboarding_idempotency_conflict") return t("me_onboarding_error_idempotencyConflict");
  if (code === "onboarding_forbidden_sanctions") return t("me_onboarding_error_complianceBlocked");
  if (code === "onboarding_user_write_rate_limited") return t("me_onboarding_error_userWriteRateLimited");
  if (code === "onboarding_payment_not_configured") return t("me_onboarding_error_paymentNotConfigured");
  if (code === "onboarding_psp_unavailable") return t("me_onboarding_error_pspUnavailable");
  if (code === "missing_return_url_for_stripe_checkout") return t("me_onboarding_error_missingReturnUrlCheckout");
  if (code === "invalid_return_url_for_stripe_checkout") return t("me_onboarding_error_invalidReturnUrlCheckout");
  if (code === "invalid_onboarding_idempotency_key") return t("me_onboarding_error_invalidIdempotencyKey");
  if (code === "onboarding_user_missing") return t("me_onboarding_error_serverSide");
  if (code === "onboarding_intent_user_read_failed") return t("me_onboarding_error_serverSide");
  if (code === "onboarding_intent_persist_failed") return t("me_onboarding_error_serverSide");
  if (code === "onboarding_entitlement_required") return t("me_onboarding_error_entitlementRequired");
  if (code === "onboarding_entitlement_lookup_failed") return t("me_onboarding_error_serverSide");
  if (code === "invalid_onboarding_role") return t("me_onboarding_error_invalidRole");
  if (code === "onboarding_role_confirm_user_read_failed") return t("me_onboarding_error_serverSide");
  if (code === "onboarding_role_confirm_read_failed") return t("me_onboarding_error_serverSide");
  if (code === "onboarding_role_confirm_write_failed") return t("me_onboarding_error_serverSide");

  return t(fb);
}
