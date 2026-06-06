//! 成功体 JSON（与 **`POST /auth/seed-trust-gate-e2e`** **04 §3.4** 对拍）。

use serde_json::json;

use super::ids::TrustGateFixtureIds;
use super::prefix::SEED_PASSWORD;

pub(super) fn success_value(ids: &TrustGateFixtureIds) -> serde_json::Value {
    json!({
        "status": "ok",
        "password": SEED_PASSWORD,
        "users": {
            "tourist_pending": { "id": ids.u_pending.to_string(), "email": "tg_tourist_pending@trustgate-e2e.local" },
            "tourist_restricted": { "id": ids.u_restricted.to_string(), "email": "tg_tourist_restricted@trustgate-e2e.local" },
            "tourist_risk": { "id": ids.u_risk.to_string(), "email": "tg_tourist_risk@trustgate-e2e.local" },
            "tourist_clean": { "id": ids.u_clean.to_string(), "email": "tg_tourist_clean@trustgate-e2e.local" },
            "tourist_stranger": { "id": ids.u_stranger.to_string(), "email": "tg_tourist_stranger@trustgate-e2e.local" },
            "guide_main": { "id": ids.u_g_main.to_string(), "email": "tg_guide_main@trustgate-e2e.local" },
            "guide_second": { "id": ids.u_g_second.to_string(), "email": "tg_guide_second@trustgate-e2e.local" },
            "guide_pending": { "id": ids.u_g_pending.to_string(), "email": "tg_guide_pending@trustgate-e2e.local" },
            "guide_accept_trust": { "id": ids.u_g_accept_trust.to_string(), "email": "tg_guide_accept_trust@trustgate-e2e.local" },
            "guide_invalid": { "id": ids.u_g_inv.to_string(), "email": "tg_guide_invalid@trustgate-e2e.local" },
            "arbitrator": { "id": ids.u_arb.to_string(), "email": "tg_arbitrator@trustgate-e2e.local" },
        },
        "guide_rows": {
            "main": ids.gr_main.to_string(),
            "second": ids.gr_second.to_string(),
            "pending": ids.gr_pending.to_string(),
            "invalid_accept": ids.gr_inv.to_string(),
        },
        "orders": {
            "cancel_trust_pending": ids.o_cancel_pending.to_string(),
            "cancel_identity_restricted": ids.o_cancel_restricted.to_string(),
            "cancel_risk_too_high": ids.o_cancel_risk.to_string(),
            "cancel_forbidden_same": ids.o_cancel_pending.to_string(),
            "tourist_accept_not_guide": ids.o_tourist_accept.to_string(),
            "guide_accept_trust": ids.o_guide_pending_accept.to_string(),
            "accept_window_expired": ids.o_accept_expired.to_string(),
            "accept_schedule_conflict": ids.o_schedule_conflict.to_string(),
            "accept_invalid_state": ids.o_invalid_accept.to_string(),
            "confirm_completion_trust": ids.o_confirm_completion.to_string(),
            "guide_bilateral_trust": ids.o_bilateral.to_string(),
            "chat_draft_trust": ids.o_chat_draft.to_string(),
            "review_completed_trust": ids.o_review.to_string(),
            "dispute_offchain_trust": ids.o_dispute_offchain.to_string(),
            "evidence_trust_order": ids.o_evidence.to_string(),
            "resolve_carrier": ids.o_resolve_carrier.to_string(),
            "execute_intent_resolved": ids.o_exec.to_string(),
        },
        "disputes": {
            "evidence_open": ids.d_evidence.to_string(),
            "evidence_rate_limit": ids.d_evidence_rate.to_string(),
            "evidence_hex": ids.d_evidence_hex.to_string(),
            "resolve_open": ids.d_resolve_open.to_string(),
            "execute_resolved": ids.d_exec.to_string(),
        },
    })
}
