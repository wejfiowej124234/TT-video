use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_session, insert_user};
use crate::state::test_support::api_meta_state;

use crate::routes::guides;

use super::helpers::{
    app_stack_f023, auth_bearer, cleanup_guide_user, db_it_lock, pool_or_skip, response_json,
};

#[tokio::test]
async fn matrix_93_b_gde_001_f023_post_guide_get_detail_and_availability() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_001_f023_post_guide_get_detail_and_availability (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_{}", Uuid::new_v4());
    let email = format!("guides-f023-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
        None,
        "guide",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = guides::router().with_state(api_meta_state(Some(co)));

    let post_body = json!({
        "city": "Hangzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_001"
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let get_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_json = response_json(get_res).await;
    assert_eq!(get_json["status"], "ok");
    assert_eq!(get_json["guide"]["city"], "Hangzhou");

    let av_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}/availability"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(av_res.status(), StatusCode::OK);
    let av_json = response_json(av_res).await;
    assert_eq!(av_json["status"], "ok");
    assert_eq!(av_json["guide_id"], guide_id_str);
    assert!(av_json["occupied_ranges"].is_array());

    cleanup_guide_user(&pool, guide_user_id).await;
}
#[tokio::test]
async fn matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_app_{}", Uuid::new_v4());
    let email = format!("guides-f023-app-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
        None,
        "guide",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Hangzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_001_app_stack"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let get_res = router
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_json = response_json(get_res).await;
    assert_eq!(get_json["status"], "ok");
    assert_eq!(get_json["guide"]["city"], "Hangzhou");

    cleanup_guide_user(&pool, guide_user_id).await;
}
#[tokio::test]
async fn matrix_93_b_gde_001c_f023_post_guide_get_detail_bio_matches_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_001c_f023_post_guide_get_detail_bio_matches_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_bio_{}", Uuid::new_v4());
    let email = format!("guides-f023-bio-{guide_user_id}@traveltrust.test");
    let bio = "matrix_93_b_gde_001c_bio_roundtrip";

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
        None,
        "guide",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Suzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": bio
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let get_res = router
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_json = response_json(get_res).await;
    assert_eq!(get_json["status"], "ok");
    assert_eq!(get_json["guide"]["bio"], bio);

    cleanup_guide_user(&pool, guide_user_id).await;
}
