use axum::body::Body;
use axum::http::{header, HeaderValue, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::UserRow;
use crate::db::{insert_session, insert_user};

use super::helpers::{
    app_with_pool, app_with_pool_seeded_users, cleanup_admin_session_user, pool_or_skip,
    response_json, triple_lock, trust_growth_autopilot_gen_for_env,
};

/// **F-032**：**`POST /api/v1/trust-growth/ingest`** **200**（**`router::app`**；**`trust_growth_moment_view`**）。
#[tokio::test]
async fn matrix_93_b_tgr_001_f032_post_trust_growth_ingest_moment_view_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001_f032_post_trust_growth_ingest_moment_view_pg (DATABASE_URL unset)"
        );
        return;
    };
    let router = app_with_pool(pool);
    let run = Uuid::new_v4();
    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "moment": format!("f032_m_{run}"), "variant_id": format!("f032_v_{run}") }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["ok"], true);
    assert_eq!(v["status"], "ok");
    assert_eq!(v["pgrow3"]["storage"], "postgres");
}

/// **F-032**：**`GET /api/v1/admin/trust-growth/observability`** **200**（**`router::app`**；**Bearer** + **`sessions`**；**`trust_growth_observability_snapshot`**）。
#[tokio::test]
async fn matrix_93_b_tgr_001_f032_get_admin_trust_growth_observability_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001_f032_get_admin_trust_growth_observability_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f032-admin-obs-{admin_id}@traveltrust.test");
    let session_token = format!("f032_admin_obs_sess_{}", Uuid::new_v4());

    cleanup_admin_session_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin obs");
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin obs");

    let admin_row = UserRow {
        id: admin_id,
        email: email.clone(),
        password_hash: None,
        role: "admin".to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        created_at: now,
        updated_at: now,
    };
    let router = app_with_pool_seeded_users(pool.clone(), vec![admin_row]);
    let auth = format!("Bearer {}", session_token);
    let res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/trust-growth/observability")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["anchor"], "trust_growth_obs_v1");
    assert!(v["environment"].is_string());
    assert!(v["control"].is_object());
    assert!(v["metrics"].is_object());

    cleanup_admin_session_user(&pool, admin_id).await;
}

/// **93 · B-TGR-001** → **§8.2 · F-032**：**`PATCH /api/v1/admin/trust-growth/control`** **`200`**（**`router::app`**；**Admin Bearer** + **`sessions`**；**`weights_frozen`** **写回** **`trust_growth_control`**）。
#[tokio::test]
async fn matrix_93_b_tgr_002c_f032_patch_admin_trust_growth_control_weights_frozen_app_stack_ok_pg()
{
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_002c_f032_patch_admin_trust_growth_control_weights_frozen_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f032-admin-ctl-{admin_id}@traveltrust.test");
    let session_token = format!("f032_admin_ctl_sess_{}", Uuid::new_v4());

    cleanup_admin_session_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin trust growth control");
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin trust growth control");

    let admin_row = UserRow {
        id: admin_id,
        email: email.clone(),
        password_hash: None,
        role: "admin".to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        created_at: now,
        updated_at: now,
    };
    let router = app_with_pool_seeded_users(pool.clone(), vec![admin_row]);
    let auth = format!("Bearer {}", session_token);
    let patch = json!({ "weights_frozen": true });
    let res = router
        .oneshot(
            Request::builder()
                .method("PATCH")
                .uri("/api/v1/admin/trust-growth/control")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::from(patch.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["ok"], true);
    assert_eq!(v["control"]["weights_frozen"], true);
    assert!(v["runtime"]["autopilot_generation"].is_number());

    cleanup_admin_session_user(&pool, admin_id).await;
}

/// **93 · B-TGR-001** → **§8.2 · F-032**：**`GET /api/v1/trust-growth/config`** **`autopilot_generation`** **与** **`trust_growth_runtime_state`** **PG** 一致（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg (DATABASE_URL unset)"
        );
        return;
    };
    let tg_env = std::env::var("TRUST_GROWTH_ENV")
        .unwrap_or_else(|_| "default".to_string())
        .trim()
        .to_string();
    let gen_db = trust_growth_autopilot_gen_for_env(&pool, &tg_env).await;

    let router = app_with_pool(pool);
    let res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/trust-growth/config")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["ok"], true);
    assert_eq!(
        v["autopilot_generation"].as_i64(),
        Some(gen_db),
        "GET /trust-growth/config autopilot_generation should match trust_growth_runtime_state row"
    );
    assert_eq!(v["pgrow3"]["storage"], "postgres");
}

/// **93 · B-TGR-001** → **§8.2 · F-032**：**`POST /api/v1/trust-growth/ingest`**（**`moment_view`**）后 **`GET /api/v1/trust-growth/config`** **200**（**`router::app`**；**链式** **PG**）。
#[tokio::test]
async fn matrix_93_b_tgr_001b_f032_post_ingest_then_get_trust_growth_config_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001b_f032_post_ingest_then_get_trust_growth_config_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let tg_env = std::env::var("TRUST_GROWTH_ENV")
        .unwrap_or_else(|_| "default".to_string())
        .trim()
        .to_string();

    let router = app_with_pool(pool.clone());
    let run = Uuid::new_v4();
    let ingest_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "moment": format!("f032_chain_m_{run}"), "variant_id": format!("f032_chain_v_{run}") }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot ingest");

    assert_eq!(
        ingest_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(ingest_res).await
    );
    let vi = response_json(ingest_res).await;
    assert_eq!(vi["ok"], true);
    assert_eq!(vi["status"], "ok");
    assert_eq!(vi["pgrow3"]["storage"], "postgres");
    let gen_db_after_ingest = trust_growth_autopilot_gen_for_env(&pool, &tg_env).await;
    assert_eq!(
        vi["autopilot_generation"].as_i64(),
        Some(gen_db_after_ingest),
        "ingest response autopilot_generation should match PG trust_growth_runtime_state after commit"
    );

    let cfg_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/trust-growth/config")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot config");

    assert_eq!(
        cfg_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cfg_res).await
    );
    let vc = response_json(cfg_res).await;
    assert_eq!(vc["status"], "ok");
    assert_eq!(vc["ok"], true);
    assert_eq!(
        vc["autopilot_generation"].as_i64(),
        Some(gen_db_after_ingest),
        "GET /trust-growth/config after ingest should match PG trust_growth_runtime_state (same as ingest body)"
    );
    assert_eq!(vc["pgrow3"]["storage"], "postgres");
}
