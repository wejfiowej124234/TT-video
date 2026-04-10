//! **Task C-1**：**`GET /api/v1/admin/cross-check`** 的只读多源对拍体。
//!
//! 通过 **并行调用** 既有 **`governance`** handler（**不**改 **B-084 Σ**、**B-115**、**B-116**、**P5-5** 实现），将三源 JSON 分槽包装，避免根级键混用。

use axum::extract::{Query, State};
use axum::response::IntoResponse;
use http_body_util::BodyExt;
use serde_json::{json, Value};

use crate::routes::governance::{self, FeePoolAggregatesQuery};
use crate::source_kind::{validate_body_matches_source_kind, SourceKind};
use crate::state::ApiMetaState;

/// **B-084 / P5-5**：对比 **`fee-pool-aggregates`** 根级 **`cross_check`** 与由当前 **`protocol-reference`** 体 **即时重算** 的预期切片（**只读**，不写库）。
#[must_use]
pub fn summarize_fee_pool_protocol_drift(fee_body: &Value, pref_body: &Value) -> Value {
    const FIELDS: &[&str] = &[
        "protocol_reference_doc_version",
        "phase1_open_fee_points_sum",
        "phase1_countries_count",
        "fee_router_layer1_country_bucket_percent",
    ];

    let expected_full = governance::fee_pool_cross_check_from_pref(pref_body);
    let Some(exp_obj) = expected_full.as_object() else {
        return json!({
            "drift_detected": true,
            "delta": [json!({
                "field": "protocol_reference_derivation",
                "expected": "object",
                "actual": expected_full,
            })],
        });
    };

    let Some(actual_obj) = fee_body.get("cross_check").and_then(|v| v.as_object()) else {
        return json!({
            "drift_detected": true,
            "delta": [json!({
                "field": "cross_check",
                "expected": "object",
                "actual": fee_body.get("cross_check").cloned().unwrap_or(Value::Null),
            })],
        });
    };

    let mut delta = Vec::new();
    for &field in FIELDS {
        let exp = exp_obj.get(field).cloned().unwrap_or(Value::Null);
        let act = actual_obj.get(field).cloned().unwrap_or(Value::Null);
        if exp != act {
            delta.push(json!({
                "field": field,
                "expected": exp,
                "actual": act,
            }));
        }
    }

    json!({
        "drift_detected": !delta.is_empty(),
        "delta": delta,
    })
}

async fn into_json_value(res: axum::response::Response, leg: &'static str) -> Result<Value, String> {
    let status = res.status();
    let bytes = res
        .into_body()
        .collect()
        .await
        .map_err(|e| format!("{leg}: collect body failed: {e}"))?
        .to_bytes();
    if !status.is_success() {
        return Err(format!("{leg}: HTTP {status}"));
    }
    serde_json::from_slice(&bytes).map_err(|e| format!("{leg}: invalid json: {e}"))
}

/// 与 **`GET …/admin/cross-check`** 成功体同源（不含 **`meta.build`** / 审计）。
pub async fn build_admin_cross_check_value(state: &ApiMetaState) -> Result<Value, String> {
    let fee_res = governance::get_governance_fee_pool_aggregates(
        State(state.clone()),
        Query(FeePoolAggregatesQuery::default()),
    )
    .await
    .into_response();
    let fee_v = into_json_value(fee_res, "fee_pool_aggregates").await?;

    let pool_res = governance::get_governance_pool(State(state.clone()))
        .await
        .into_response();
    let pool_v = into_json_value(pool_res, "governance_pool").await?;

    let pref_res = governance::get_protocol_reference().await.into_response();
    let pref_v = into_json_value(pref_res, "protocol_reference").await?;

    validate_body_matches_source_kind(SourceKind::Projection, &fee_v, "fee_pool_projection.body")?;
    validate_body_matches_source_kind(
        SourceKind::ChainSSOT,
        &pool_v,
        "governance_pool_chain.body",
    )?;
    validate_body_matches_source_kind(
        SourceKind::Reference,
        &pref_v,
        "protocol_reference.body",
    )?;

    let drift_summary = summarize_fee_pool_protocol_drift(&fee_v, &pref_v);

    Ok(json!({
        "status": "ok",
        "fee_pool_projection": {
            "source_kind": SourceKind::Projection.as_str(),
            "body": fee_v,
        },
        "governance_pool_chain": {
            "source_kind": SourceKind::ChainSSOT.as_str(),
            "body": pool_v,
        },
        "protocol_reference": {
            "source_kind": SourceKind::Reference.as_str(),
            "body": pref_v,
        },
        "drift_summary": drift_summary,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn cross_check_envelopes_projection_chain_ssot_reference() {
        let st = crate::state::test_support::api_meta_state(None);
        let v = build_admin_cross_check_value(&st)
            .await
            .expect("cross_check value");
        assert_eq!(v["fee_pool_projection"]["source_kind"], "projection");
        assert_eq!(
            v["governance_pool_chain"]["source_kind"],
            "chain_ssot"
        );
        assert_eq!(v["protocol_reference"]["source_kind"], "reference");
    }

    #[tokio::test]
    async fn cross_check_includes_drift_summary_no_drift_when_consistent() {
        let st = crate::state::test_support::api_meta_state(None);
        let v = build_admin_cross_check_value(&st)
            .await
            .expect("cross_check value");
        let d = &v["drift_summary"];
        assert_eq!(d["drift_detected"], false);
        assert_eq!(d["delta"].as_array().map(Vec::is_empty), Some(true));
    }

    #[test]
    fn drift_detected_when_cross_check_field_differs_from_protocol_reference() {
        let pref = crate::routes::governance_doc_reference::protocol_reference_json();
        let mut fee = json!({
            "cross_check": governance::fee_pool_cross_check_from_pref(&pref),
            "data_source": "placeholder",
        });
        fee["cross_check"]["protocol_reference_doc_version"] = json!("999.0.0");
        let s = summarize_fee_pool_protocol_drift(&fee, &pref);
        assert_eq!(s["drift_detected"], true);
        let delta = s["delta"].as_array().expect("delta array");
        assert!(
            delta
                .iter()
                .any(|x| x["field"] == "protocol_reference_doc_version"),
            "expected doc_version mismatch in delta: {delta:?}"
        );
    }

    #[tokio::test]
    async fn cross_check_bodies_are_not_rule_version_confused() {
        let st = crate::state::test_support::api_meta_state(None);
        let v = build_admin_cross_check_value(&st)
            .await
            .expect("cross_check value");
        let fee = &v["fee_pool_projection"]["body"];
        let pool = &v["governance_pool_chain"]["body"];
        let pref = &v["protocol_reference"]["body"];

        let fee_rv = fee["rule_version"].as_str();
        assert!(
            fee_rv == Some("fee_pool_aggregates_projection_v1")
                || fee["data_source"].as_str() == Some("placeholder"),
            "fee_pool_projection.body must be fee-pool-aggregates lineage"
        );
        let pool_rv = pool["rule_version"].as_str();
        assert!(
            pool_rv == Some("governance_pool_v1") || pool_rv.is_none(),
            "governance/pool lineage: DB/链上成功体带 governance_pool_v1；占位体可无 rule_version"
        );

        assert_ne!(fee_rv, Some("governance_pool_v1"));
        assert_ne!(pool_rv, Some("fee_pool_aggregates_projection_v1"));
        assert!(pref.get("doc_ref").is_some(), "protocol mirror must have doc_ref");
        assert!(pref.get("doc_version").is_some());
        assert!(
            pref.get("fee_router").is_some(),
            "protocol_reference.body must stay 84 mirror shape"
        );
        assert!(
            fee.get("doc_ref").is_none(),
            "fee_pool_projection must not carry protocol-reference doc_ref"
        );
        assert!(
            pool.get("phase1_countries").is_none(),
            "governance_pool must not carry protocol_reference phase1_countries"
        );
    }
}
