#[cfg(test)]
mod tests {
    use super::super::feedback_reports::post_community_report_appeal;
    use super::super::posts::{get_public_posts_by_tag_count, TagPostStatsQuery};
    use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
    use axum::extract::{Path, Query, State};
    use axum::http::{header::AUTHORIZATION, HeaderMap, HeaderValue, StatusCode};
    use axum::response::IntoResponse;
    use axum::Json;
    use chrono::Utc;
    use http_body_util::BodyExt;
    use serde_json::json;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use uuid::Uuid;

    async fn body_json(resp: axum::response::Response) -> serde_json::Value {
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        serde_json::from_slice(&body).expect("json body")
    }

    fn build_state() -> ApiMetaState {
        ApiMetaState {
            strict_ssot: false,
            ssot_version: "test".to_string(),
            ssot_sha256_expected: None,
            ssot_sha256_computed: None,
            ssot_sha256_match: true,
            chargeback_policy: "warn".to_string(),
            finality_n: 12,
            indexer_state_path: "test".to_string(),
            indexer_checkpoint: ProjectorCheckpoint {
                block_number: 10,
                log_index: 1,
            },
            indexer_last_seen_finality_n: 12,
            indexer_replay_required: false,
            pause_mode: false,
            pause_api_allowlist: "".to_string(),
            degraded_mode: false,
            authority_source: "db_projection".to_string(),
            indexer_lag_blocks: 0,
            indexer_lag_max_blocks: 0,
            reorg_detected: false,
            evidence_timestamp_policy: "backend_signed".to_string(),
            evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
                last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
            })),
            evidence_time_state_path: "test".to_string(),
            evidence_receipt_hmac_key: None,
            reconcile_export_ed25519_key: None,
            order_deadline_clock: Arc::new(crate::order_deadline_clock::SystemOrderDeadlineClock),
            chain_off: None,
            jurisdiction_country_ledger_registry: Arc::new(
                crate::jurisdiction_country_ledger_template::JurisdictionCountryLedgerRegistry::empty(),
            ),
            chain_config: None,
            resolution_outbox: None,
            indexer_state: None,
            indexer_tick_fail_skip_bucket_obs_last: Arc::new(RwLock::new(None)),
            guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[tokio::test]
    async fn post_community_report_appeal_requires_login() {
        let resp = post_community_report_appeal(
            Path(Uuid::new_v4().to_string()),
            State(build_state()),
            HeaderMap::new(),
            Some(Json(json!({ "body": "x" }))),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "error");
        assert_eq!(body["message"], "unauthorized");
    }

    #[tokio::test]
    async fn post_community_report_appeal_invalid_report_id() {
        let mut headers = HeaderMap::new();
        let uid = Uuid::new_v4();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer bearer_{}", uid)).expect("auth"),
        );
        let resp = post_community_report_appeal(
            Path("not-uuid".to_string()),
            State(build_state()),
            headers,
            Some(Json(json!({ "body": "reason" }))),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["message"], "invalid_report_id");
    }

    #[tokio::test]
    async fn get_public_posts_by_tag_count_no_db_ok() {
        let resp = get_public_posts_by_tag_count(
            State(build_state()),
            Query(TagPostStatsQuery {
                tag: Some("smoke".to_string()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "ok");
        assert_eq!(body["post_count"], 0);
    }

    #[tokio::test]
    async fn get_public_posts_by_tag_count_tag_required() {
        let resp = get_public_posts_by_tag_count(
            State(build_state()),
            Query(TagPostStatsQuery { tag: None }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "error");
        assert_eq!(body["message"], "tag_required");
    }

    #[tokio::test]
    async fn get_public_posts_by_tag_count_tag_too_long() {
        let long = "x".repeat(65);
        let resp = get_public_posts_by_tag_count(
            State(build_state()),
            Query(TagPostStatsQuery {
                tag: Some(long.clone()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "error");
        assert_eq!(body["message"], "tag_too_long");
    }
}
