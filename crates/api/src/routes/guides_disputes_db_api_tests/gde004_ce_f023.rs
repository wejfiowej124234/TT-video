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

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`POST …/guides`→`POST …/stake`→`GET /api/v1/guides?city=&languages=`** / **`?city=&service_types=`** **`items`** 仍含该 **`active`** 向导（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_004c_f023_public_get_guides_list_language_and_service_filters_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004c_f023_public_get_guides_list_language_and_service_filters_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_004c_{}", Uuid::new_v4());
    let email = format!("guides-f023-004c-{guide_user_id}@traveltrust.test");

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
        "bio": "matrix_93_b_gde_004c_filters"
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

    for q in [
        "/api/v1/guides?city=Shanghai&languages=zh",
        "/api/v1/guides?city=Shanghai&service_types=walking",
    ] {
        let list_res = router
            .clone()
            .oneshot(Request::builder().uri(q).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(list_res.status(), StatusCode::OK, "uri={q}");
        let list_json = response_json(list_res).await;
        assert_eq!(list_json["status"], "ok");
        let items = list_json["items"].as_array().unwrap();
        let found = items
            .iter()
            .any(|it| it["id"].as_str() == Some(guide_id_str));
        assert!(
            found,
            "GET {q} (router::app) should include staked active guide id={guide_id_str}"
        );
    }

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`POST …/guides`→`POST …/stake`→`GET /api/v1/guides?city=&language=`**（**单数** **`language`** **查询参数**）**`items`** 含 **`active`** 向导（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_004e_f023_public_get_guides_list_singular_language_param_zh_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004e_f023_public_get_guides_list_singular_language_param_zh_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_004e_{}", Uuid::new_v4());
    let email = format!("guides-f023-004e-{guide_user_id}@traveltrust.test");

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
        "bio": "matrix_93_b_gde_004e_language_param"
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

    let stake_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "amount": "100" }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);

    let list_res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai&language=zh")
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
        "GET ?city=Shanghai&language=zh should include staked guide id={guide_id_str}: {list_json:?}"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}
