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

/// **93 · B-GDE-003** → **§8.2 · F-024**：**`POST …/guides/:id/stake`** **同额** **连击** **`200`** ×2；**`guide_status`** 仍为 **`active`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_003c_f024_post_stake_twice_same_amount_ok_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_003c_f024_post_stake_twice_same_amount_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_003c_{}", Uuid::new_v4());
    let email = format!("guides-f024-003c-{guide_user_id}@traveltrust.test");

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

    let app = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_003c_app_stack"
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
    let guide_id = Uuid::parse_str(guide_id_str).unwrap();

    let stake_body = json!({ "amount": "100" });
    for n in 1..=2 {
        let stake_res = app
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
        assert_eq!(stake_res.status(), StatusCode::OK, "stake call {n}");
        let stake_json = response_json(stake_res).await;
        assert_eq!(stake_json["status"], "ok");
        assert_eq!(stake_json["stake_amount"], "100");
        assert_eq!(stake_json["guide_status"], "active");
    };    let row: (String, String) =
        sqlx::query_as("SELECT stake_amount, status FROM guides WHERE id = $1 LIMIT 1")
            .bind(guide_id)
            .fetch_one(&pool)
            .await
            .expect("guides row");
    assert_eq!(row.0, "100");
    assert_eq!(row.1, "active");

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001 / B-GDE-003** → **§8.2 · F-024**：**`POST …/stake`** 后 **`GET /api/v1/guides?city=`**（**无 Bearer**）**`items[]`** 命中行 **`stake_amount`** **`100`**、**`status`** **`active`**（**`router::app`**；**`GET …/guides/:id` 无会话** 仍 **401** 门闸 — **不**在本测强扭）。
#[tokio::test]
async fn matrix_93_b_gde_003d_f024_stake_then_public_list_shows_stake_amount_active_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_003d_f024_stake_then_public_list_shows_stake_amount_active_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_003d_{}", Uuid::new_v4());
    let email = format!("guides-f024-003d-{guide_user_id}@traveltrust.test");

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

    let app = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_003d_list_stake_fields"
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
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let stake_res = app
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

    let list_res = app
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
    let items = list_json["items"].as_array().expect("items");
    let card = items
        .iter()
        .find(|it| it["id"].as_str() == Some(guide_id_str))
        .unwrap_or_else(|| panic!("guide {guide_id_str} not in public list: {list_json:?}"));
    assert_eq!(card["stake_amount"], "100");
    assert_eq!(card["status"], "active");

    cleanup_guide_user(&pool, guide_user_id).await;
}
