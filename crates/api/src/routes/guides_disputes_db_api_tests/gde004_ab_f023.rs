use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};

use super::helpers::{
    app_stack_f023, auth_bearer, cleanup_guide_user, db_it_lock, pool_or_skip, response_json,
};

/// **93 · B-GDE-001（公开列表 · `router::app`）** → **§8.2 · F-023**：**`POST …/guides`→`POST …/stake`→`GET /api/v1/guides?city=`** **`items`** 含该向导（**主栈**；**ISS-007** 脚注 **`GET /guides` 公开列表** 窄收口）。
#[tokio::test]
async fn matrix_93_b_gde_004_f023_public_get_guides_list_includes_active_after_stake_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004_f023_public_get_guides_list_includes_active_after_stake_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_appstk_{}", Uuid::new_v4());
    let email = format!("guides-f023-list-{guide_user_id}@traveltrust.test");

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
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_004_app_stack"
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

    let stake_body = json!({ "amount": "100" });
    let stake_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(stake_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);
    let stake_json = response_json(stake_res).await;
    assert_eq!(stake_json["status"], "ok");
    assert_eq!(stake_json["guide_status"], "active");

    let list_res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        found,
        "GET /guides?city= (router::app) should include staked active guide"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`POST …/guides`** 后、**`POST …/stake` 前**，**`GET /api/v1/guides?city=Shanghai`** **`items`** **不含** **`pending`** 向导（**`router::app`**；与 **`matrix_93_b_gde_004_f023_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_gde_004b_f023_public_get_guides_list_excludes_pending_before_stake_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004b_f023_public_get_guides_list_excludes_pending_before_stake_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_004b_{}", Uuid::new_v4());
    let email = format!("guides-f023-004b-{guide_user_id}@traveltrust.test");

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
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_004b_pending_list"
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

    let list_res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        !found,
        "GET /guides?city= before stake must not list pending guide id={guide_id_str}: {list_json:?}"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}
