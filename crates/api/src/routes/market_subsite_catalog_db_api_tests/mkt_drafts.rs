use super::helpers::*;

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};
use tower::ServiceExt;

/// **93 · B-MKT-011** → **§8.2 · F-021**：**`router::app`** **`POST …/market/provider/listings/drafts`**（**Bearer**）→**`GET …/drafts/:draft_id`** **`payload`** **PG 读回**。
#[tokio::test]
async fn matrix_93_b_mkt_007b_f021_post_provider_draft_then_get_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_007b_f021_post_provider_draft_then_get_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_draft_prov_{}", Uuid::new_v4());
    let email = format!("mkt-draft-prov-{owner_id}@traveltrust.test");

    cleanup_drafts_sessions_user(&pool, owner_id).await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");
    seed_provider_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog(pool.clone());
    let title = "matrix_93_b_mkt_007b provider draft roundtrip";
    let post_body = json!({
        "payload": {
            "kind": "merchant_showcase_studio_v1",
            "title": title
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/provider/listings/drafts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let draft_id = post_j["draft_id"].as_str().expect("draft_id");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/market/provider/listings/drafts/{draft_id}"
                ))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j = response_json(get_res).await;
    assert_eq!(get_j["status"], "ok");
    assert_eq!(get_j["draft_id"], draft_id);
    assert_eq!(get_j["payload"]["title"], title);

    cleanup_drafts_sessions_user(&pool, owner_id).await;
}

/// **93 · B-MKT-012** → **§8.2 · F-022**：**`router::app`** **`POST …/market/acquisition/listings/drafts`**（**Bearer**）→**`GET …/drafts/:draft_id`** **`payload`** **PG 读回**。
#[tokio::test]
async fn matrix_93_b_mkt_008b_f022_post_acquisition_draft_then_get_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_008b_f022_post_acquisition_draft_then_get_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_draft_acq_{}", Uuid::new_v4());
    let email = format!("mkt-draft-acq-{owner_id}@traveltrust.test");

    cleanup_drafts_sessions_user(&pool, owner_id).await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog(pool.clone());
    let title = "matrix_93_b_mkt_008b acquisition draft roundtrip";
    let post_body = json!({
        "payload": {
            "kind": "acquisition_carry_studio_v1",
            "title": title
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings/drafts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let draft_id = post_j["draft_id"].as_str().expect("draft_id");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/market/acquisition/listings/drafts/{draft_id}"
                ))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j = response_json(get_res).await;
    assert_eq!(get_j["status"], "ok");
    assert_eq!(get_j["draft_id"], draft_id);
    assert_eq!(get_j["payload"]["title"], title);

    cleanup_drafts_sessions_user(&pool, owner_id).await;
}

/// **`market_listing_draft_payload_from_body`**：**`POST …/provider/listings/drafts`** JSON 根**无 **`payload`**（**`{}`**）→ **200** → **`GET …/drafts/:id`** **`payload`** **为 **`{}`**（PG 往返）。
#[tokio::test]
async fn matrix_93_b_mkt_007d_f021_post_provider_draft_empty_body_then_get_payload_empty_object_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_007d_f021_post_provider_draft_empty_body_then_get_payload_empty_object_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_draft_prov_empty_{}", Uuid::new_v4());
    let email = format!("mkt-draft-prov-empty-{owner_id}@traveltrust.test");

    cleanup_drafts_sessions_user(&pool, owner_id).await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");
    seed_provider_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = json!({});
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/provider/listings/drafts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let draft_id = post_j["draft_id"].as_str().expect("draft_id");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/market/provider/listings/drafts/{draft_id}"
                ))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j = response_json(get_res).await;
    assert_eq!(get_j["status"], "ok");
    assert_eq!(get_j["draft_id"], draft_id);
    assert_eq!(get_j["payload"], json!({}));

    cleanup_drafts_sessions_user(&pool, owner_id).await;
}
