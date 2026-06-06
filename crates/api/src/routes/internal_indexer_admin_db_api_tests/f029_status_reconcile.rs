use std::sync::Arc;

use axum::body::Body;
use axum::extract::State;
use axum::http::{header, Request, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use tokio::sync::RwLock;
use tower::ServiceExt;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::internal;
use crate::routes::internal::{indexer_reconcile, IndexerReconcileBody};
use crate::state::test_support::api_meta_state;

use super::helpers::*;

#[tokio::test]
async fn matrix_93_d_idx_001_f029_get_internal_indexer_status_ok_shape_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001_f029_get_internal_indexer_status_ok_shape_pg (DATABASE_URL unset)"
        );
        return;
    }
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let app = internal::router().with_state(api_meta_state(Some(co)));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/internal/indexer-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("indexer").is_some());
    assert!(v.get("state").is_some());
    assert!(v.get("reorg_recovery").is_some());
}

/// **93 · D-IDX-001** → **§8.2 · F-029**：**`GET /api/v1/internal/indexer-status`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let app = app_stack_router(pool.clone());

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/internal/indexer-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("indexer").is_some());
    assert!(v.get("state").is_some());
    assert!(v.get("reorg_recovery").is_some());
}

/// **93 · D-IDX-001** → **§8.2 · F-029**：**`GET /api/v1/internal/indexer-status`** **200** **且** **`_sqlx_migrations`** **`COUNT(*)>0`**（**已迁移 PG** 与 **internal 探针** 同事务锚定）。
#[tokio::test]
async fn matrix_93_d_idx_001_f029_internal_indexer_status_ok_and_sqlx_migrations_applied_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001_f029_internal_indexer_status_ok_and_sqlx_migrations_applied_pg (DATABASE_URL unset)"
        );
        return;
    }
    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-IDX-001 PG anchor: expected at least one applied sqlx migration"
    );

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let app = internal::router().with_state(api_meta_state(Some(co)));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/internal/indexer-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("indexer").is_some());
}

/// **F-029**：**`POST /api/v1/internal/indexer-reconcile`** **`persist:false`** **200**（**`indexer_reconcile`** + **真 `DATABASE_URL`**；**`reconcile_orders_projection_vs_orders`**）。
#[tokio::test]
async fn matrix_93_d_idx_001_f029_post_internal_indexer_reconcile_persist_false_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001_f029_post_internal_indexer_reconcile_persist_false_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let meta = meta_indexer_reconcile_with_pool(pool);
    let mut body = IndexerReconcileBody::default();
    body.persist = false;
    let resp = indexer_reconcile(State(meta), Some(Json(body)))
        .await
        .into_response();

    assert_eq!(resp.status(), StatusCode::OK, "{:?}", resp.status());
    let v = response_json(resp).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["task"].as_str(),
        Some("indexer_reconcile_orders_projection")
    );
    assert!(v.get("stats").is_some());
    assert!(v.get("chain_context").is_some());
}

/// **93 · D-IDX-001** → **§8.2 · F-029**：**`POST /api/v1/internal/indexer-reconcile`** **`persist:false`** **`200`**（**`router::app`**；与 **`indexer_reconcile` handler 直连** **互补**）。
#[tokio::test]
async fn matrix_93_d_idx_001e_f029_post_internal_indexer_reconcile_persist_false_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001e_f029_post_internal_indexer_reconcile_persist_false_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let meta = meta_indexer_reconcile_with_pool(pool.clone());
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/internal/indexer-reconcile")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"persist":false}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK, "{:?}", res.status());
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["task"].as_str(),
        Some("indexer_reconcile_orders_projection")
    );
    assert!(v.get("stats").is_some());
    assert!(v.get("chain_context").is_some());
}

/// **93 · D-IDX-003** → **§8.2 · F-029**：**`POST /api/v1/internal/indexer-reconcile`** **`persist:true`** **`200`**（**`router::app`**；**`reconciliation_reports`** **写回** + **体** **`report_id`/`orders_chain_health_trend_snapshot`**）。
#[tokio::test]
async fn matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let meta = meta_indexer_reconcile_with_pool(pool.clone());
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/internal/indexer-reconcile")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"persist":true}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK, "{:?}", res.status());
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["task"].as_str(),
        Some("indexer_reconcile_orders_projection")
    );
    assert!(v.get("stats").is_some());
    assert!(v.get("chain_context").is_some());
    assert!(
        v.get("report_id")
            .and_then(|x| x.as_str())
            .is_some_and(|s| !s.is_empty()),
        "persist:true should return non-empty report_id: {v:?}"
    );
    assert!(
        v.get("orders_chain_health_trend_snapshot").is_some(),
        "persist:true should include orders_chain_health_trend_snapshot: {v:?}"
    );
}
