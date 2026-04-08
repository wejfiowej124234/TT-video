//! /api/v1/disputes 与 /api/v1/orders/:id/dispute（48 §2.2 routes/disputes）
//!
//! **B-099 / TT-DISPUTES-LIST-DETAIL-POSTGRES-001**：**`chain_off.db_pool`** 存在时 **GET** 列表/详情走 **`db::list_disputes_public_page`** / **`db::get_dispute_public_detail`**（**`page.source=postgres`**、**`next_cursor`** 键集分页），与无库时 **`chain_off::*_impl`** 并列。
//! - **TT-B099-HTTP-LIST-POSTGRES-001**：列表 **`200`** 体由 **`db::disputes_public_list_ok_envelope`** 组装（**禁止**路由内平行映射）。
//! - **TT-B099-HTTP-DETAIL-PG-JOIN-001**：详情 **`200`** 体由 **`db::dispute_public_detail_envelope_from_join_row`**（经 **`get_dispute_public_detail`**）组装。
//!
//! **B-118 / TT-B118-HTTP-DISPUTES-PG-SAME-ENVELOPE-001**：PG 分支**仅** **`list_disputes_public_page` → `disputes_public_list_ok_envelope`** / **`get_dispute_public_detail`**（内部 **`dispute_public_detail_envelope_from_join_row`**），与 **`db::disputes_public_list_page_from_join_rows`**、**`encode_disputes_list_cursor`** 同源；单测见 **`routes/disputes::tests::b118_*`** 与 **`db::disputes::b099_disputes_pg_envelope_tests`**。


use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::chain;
use crate::chain_off;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

#[derive(Debug, Deserialize, Default)]
pub struct DisputesListQuery {
    /// 1～500，默认 100（**PostgreSQL** 列表路径）
    limit: Option<i64>,
    cursor: Option<String>,
}

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new()
        .route("/api/v1/orders/:id/dispute", post(order_open_dispute))
        .route("/api/v1/disputes", get(get_disputes))
        .route("/api/v1/disputes/:id", get(get_dispute_by_id))
        .route("/api/v1/disputes/:id/resolve", post(dispute_resolve))
}

pub async fn get_disputes(
    State(state): State<ApiMetaState>,
    Query(q): Query<DisputesListQuery>,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/disputes").into_response();
    };

    if let Some(ref pool) = co.db_pool {
        let mut limit = q.limit.unwrap_or(100);
        if limit < 1 {
            limit = 1;
        }
        if limit > 500 {
            limit = 500;
        }
        let cur = match crate::db::decode_disputes_list_cursor(q.cursor.as_deref()) {
            Ok(c) => c,
            Err(()) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "invalid_cursor", "message": "invalid_cursor"})),
                )
                    .into_response();
            }
        };
        return match crate::db::list_disputes_public_page(pool, limit, cur).await {
            Ok(page) => {
                let body = crate::db::disputes_public_list_ok_envelope(&page);
                Json(body).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "disputes_list_postgres_failed",
                    e.to_string(),
                )),
            )
                .into_response(),
        };
    }

    chain_off::disputes_list_impl(co.clone()).await.into_response()
}

pub async fn get_dispute_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/disputes/:id").into_response();
    };

    let Ok(did) = Uuid::parse_str(&id) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
        )
            .into_response();
    };

    if let Some(ref pool) = co.db_pool {
        return match crate::db::get_dispute_public_detail(pool, did).await {
            Ok(Some(v)) => Json(v).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("dispute_not_found")),
            )
                .into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "dispute_detail_postgres_failed",
                    e.to_string(),
                )),
            )
                .into_response(),
        };
    }

    match chain_off::dispute_get_impl(co.clone(), did).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn order_open_dispute(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    body: Option<Json<chain_off::OpenDisputeBody>>,
) -> impl IntoResponse {
    let body = body.unwrap_or(Json(chain_off::OpenDisputeBody {
        reason: None,
        arb_fee_paid: None,
    }));
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        let Ok(oid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::order_open_dispute_impl(co.clone(), oid, uid, body).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/orders/:id/dispute").into_response()
}

pub async fn dispute_resolve(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<chain_off::ResolveDisputeBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        let Ok(did) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        let refund_ratio = body.refund_ratio;
        let slash_guide = body.slash_guide;
        return match chain_off::dispute_resolve_impl(co.clone(), did, uid, Json(body)).await {
            Ok(j) => {
                if let (Some(_config), Some(ref outbox)) =
                    (&state.chain_config, &state.resolution_outbox)
                {
                    if let Some(entry) = chain_off::resolution_outbox_entry_for_dispute(
                        co,
                        did,
                        refund_ratio,
                        slash_guide,
                    )
                    .await
                    {
                        chain::outbox::push_resolution(outbox, entry).await;
                    }
                }
                j.into_response()
            }
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/disputes/:id/resolve").into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use crate::db::{
        decode_disputes_list_cursor, dispute_public_detail_envelope_from_join_row,
        disputes_public_list_ok_envelope, disputes_public_list_page_from_join_rows,
        DisputeDetailJoinRow, DisputeListJoinRow,
    };
    use crate::state::test_support::api_meta_state;
    use chrono::{TimeZone, Utc};
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::sync::RwLock;
    use tower::util::ServiceExt;

    #[tokio::test]
    async fn get_disputes_without_chain_off_is_501() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/disputes")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "not_implemented");
        assert_eq!(v["path"], "GET /api/v1/disputes");
    }

    #[tokio::test]
    async fn get_dispute_by_id_without_chain_off_is_501() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/disputes/00000000-0000-4000-8000-000000000099")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "not_implemented");
        assert_eq!(v["path"], "GET /api/v1/disputes/:id");
    }

    /// **TT-B099-HTTP-INVALID-CURSOR-001**：非法 **`cursor`** → **400** **`invalid_cursor`**（在命中 PG 之前短路，与 **`db::decode_disputes_list_cursor`** 同源）。
    #[tokio::test]
    async fn b099_get_disputes_invalid_cursor_returns_400_before_pg() {
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_millis(200))
            .connect_lazy("postgres://nouser:nopass@127.0.0.1:1/traveltrust_b099_gate")
            .expect("lazy dead pool");

        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool),
        };
        let app = router().with_state(api_meta_state(Some(co)));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/disputes?cursor=not_base64!!!")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "invalid_cursor");
    }

    /// **TT-B118-HTTP-GET-DISPUTES-PG-BODY-001**：**`GET /api/v1/disputes`** PG 成功体与 **`disputes_public_list_ok_envelope(list_disputes_public_page …)`** 契约一致（**`page.source=postgres`**，**`next_cursor`** 与末行键集一致）。
    #[test]
    fn b118_get_disputes_pg_success_body_matches_list_ok_envelope() {
        let t_new = Utc.with_ymd_and_hms(2025, 4, 1, 0, 0, 0).unwrap();
        let t_old = Utc.with_ymd_and_hms(2025, 3, 1, 0, 0, 0).unwrap();
        let id_new = Uuid::new_v4();
        let id_old = Uuid::new_v4();
        let page = disputes_public_list_page_from_join_rows(
            vec![
                DisputeListJoinRow {
                    id: id_new,
                    order_id: Uuid::new_v4(),
                    status: "open".into(),
                    resolved_at: None,
                    created_at: t_old,
                    updated_at: t_new,
                    order_tourist_id: None,
                },
                DisputeListJoinRow {
                    id: id_old,
                    order_id: Uuid::new_v4(),
                    status: "open".into(),
                    resolved_at: None,
                    created_at: t_old,
                    updated_at: t_old,
                    order_tourist_id: None,
                },
            ],
            1,
        );
        let body = disputes_public_list_ok_envelope(&page);
        assert_eq!(body["status"], "ok");
        assert_eq!(body["page"]["source"], "postgres");
        assert_eq!(body["page"]["has_more"], true);
        let nc = body["page"]["next_cursor"].as_str().expect("next_cursor");
        let dec = decode_disputes_list_cursor(Some(nc)).unwrap().unwrap();
        assert_eq!(dec.0, t_new);
        assert_eq!(dec.1, id_new);
    }

    /// **TT-B118-HTTP-GET-DISPUTE-ID-PG-BODY-001**：**`GET /api/v1/disputes/:id`** PG 成功体即 **`dispute_public_detail_envelope_from_join_row(join row)`**（与 SQL join 行同源）。
    #[test]
    fn b118_get_dispute_by_id_pg_success_body_matches_join_envelope() {
        let tid = Uuid::new_v4();
        let row = DisputeDetailJoinRow {
            id: Uuid::new_v4(),
            order_id: Uuid::new_v4(),
            status: "Open".into(),
            evidence_hashes: serde_json::json!([]),
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: Utc.with_ymd_and_hms(2025, 1, 1, 0, 0, 0).unwrap(),
            updated_at: Utc.with_ymd_and_hms(2025, 1, 2, 0, 0, 0).unwrap(),
            arb_fee_paid: None,
            dispute_sequence: 1,
            order_tourist_id: Some(tid),
        };
        let v = dispute_public_detail_envelope_from_join_row(row.clone());
        assert_eq!(v["status"], "ok");
        let d = &v["dispute"];
        assert_eq!(d["id"], row.id.to_string());
        assert_eq!(d["order_id"], row.order_id.to_string());
        assert_eq!(d["tourist_id"], tid.to_string());
        assert_eq!(d["traveler_id"], tid.to_string());
        assert_eq!(d["status"], row.status);
        assert_eq!(d["dispute_sequence"], row.dispute_sequence);
    }
}
