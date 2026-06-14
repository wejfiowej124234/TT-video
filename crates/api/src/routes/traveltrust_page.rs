//! `GET /api/v1/traveltrust/page-brief` — **04** §3.3 / §3.4 **B-191** 只读机读锚（与 **85**、**`governance_doc_reference`** 同源字段）。
//!
//! 体为静态 JSON：**不**复制 **84** `phase1_countries` 全文；全量数字仍以 **`GET /api/v1/governance/protocol-reference`** 为准。

use axum::routing::get;
use axum::{Json, Router};
use serde_json::{json, Value};

use crate::routes::governance_doc_reference;
use crate::state::ApiMetaState;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/traveltrust/page-brief",
        get(get_traveltrust_page_brief),
    )
}

/// 与 handler 同源 JSON，供单测与契约对读（**v6** · 与 **`frontend/lib/traveltrustPageBrief.ts`** 同源）。
pub fn traveltrust_page_brief_json() -> Value {
    json!({
        "status": "ok",
        "page": {
            "canonical_path": "/traveltrust",
            "alias_paths": ["/network"],
            "ia_version": "v6",
            "sections": [
                "pulse",
                "hero",
                "roles",
                "liquidity",
                "trust",
                "settlement",
                "faq",
                "start"
            ],
            "spec_doc_ref": "docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md"
        },
        "allocation_ssot": {
            "protocol_reference_doc_version": governance_doc_reference::DOC_VERSION,
            "protocol_reference_path": "/api/v1/governance/protocol-reference",
            "rule": "Consume full 84 numeric / phase1_countries via GET /api/v1/governance/protocol-reference; this endpoint does not embed phase1_countries."
        },
        "cta_contract": {
            "primary_target": "#start",
            "secondary_target": "/governance",
            "in_page_anchors": [
                "#pulse",
                "#roles",
                "#liquidity",
                "#trust",
                "#settlement",
                "#faq",
                "#start",
                "#fee-router"
            ],
            "analytics_events": [
                "traveltrust_plan_trip_click",
                "traveltrust_role_enter_click",
                "traveltrust_role_tab_click",
                "traveltrust_role_video_play",
                "traveltrust_scroll_to_roles",
                "traveltrust_secondary_cta_click",
                "traveltrust_globe_pin_click"
            ]
        },
        "media": {
            "hero_loop_env": "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP",
            "hero_loop_poster_env": "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP_POSTER",
            "role_video_env_keys": [
                "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER",
                "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE",
                "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT",
                "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION",
                "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD"
            ],
            "default_role_media_prefix": "/media/traveltrust/roles/"
        },
        "liquidity_contract": {
            "schema_version": 1,
            "pair_type": "stablecoin_to_governance_token",
            "pay_stablecoins": ["USDC"],
            "default_pay_stable": "USDC",
            "receive_symbol": "TTG",
            "receive_token_role": "governance",
            "not_pair_types": ["stablecoin_to_stablecoin"],
            "quote_path": "/api/v1/governance/ttg-exchange/quote",
            "onboarding_fee_quote_path": "/api/v1/onboarding/quote",
            "escrow_pay_path": "/pay",
            "governance_hub_path": "/governance",
            "implementation_status": "contract_only",
            "spec_doc_ref": "docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md"
        }
    })
}

async fn get_traveltrust_page_brief() -> Json<Value> {
    Json(traveltrust_page_brief_json())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn page_brief_doc_version_matches_protocol_reference() {
        let brief = traveltrust_page_brief_json();
        let pref = governance_doc_reference::protocol_reference_json();
        assert_eq!(brief["status"], "ok");
        assert_eq!(brief["page"]["ia_version"], "v6");
        assert_eq!(
            brief["allocation_ssot"]["protocol_reference_doc_version"],
            pref["doc_version"]
        );
        assert_eq!(
            brief["page"]["canonical_path"].as_str(),
            Some("/traveltrust")
        );
        let aliases = brief["page"]["alias_paths"].as_array().expect("alias_paths");
        assert!(aliases.iter().any(|v| v.as_str() == Some("/network")));
        let sections = brief["page"]["sections"].as_array().expect("sections");
        assert_eq!(sections.len(), 8);
        assert_eq!(brief["liquidity_contract"]["receive_symbol"], "TTG");
    }
}
