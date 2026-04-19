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

/// 与 handler 同源 JSON，供单测与契约对读。
pub fn traveltrust_page_brief_json() -> Value {
    json!({
        "status": "ok",
        "page": {
            "canonical_path": "/traveltrust",
            "alias_paths": ["/network"],
            "spec_doc_ref": "docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md"
        },
        "allocation_ssot": {
            "protocol_reference_doc_version": governance_doc_reference::DOC_VERSION,
            "protocol_reference_path": "/api/v1/governance/protocol-reference",
            "rule": "Consume full 84 numeric / phase1_countries via GET /api/v1/governance/protocol-reference; this endpoint does not embed phase1_countries."
        },
        "cta_contract": {
            "p1_target": "#allocation",
            "p2_target": "/market",
            "analytics_events": [
                "traveltrust_p1_early_access_click",
                "traveltrust_p2_market_click"
            ]
        },
        "live_stats": {
            "presentation": "illustrative"
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
    }
}
