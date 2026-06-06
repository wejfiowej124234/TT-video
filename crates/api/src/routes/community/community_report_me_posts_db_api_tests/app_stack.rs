use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::{
    app_stack_report_pool, cleanup_users_posts_and_reports, db_it_lock, pool_or_skip,
    response_json, run_d_com_009_me_posts_flow, run_d_com_010_report_flow,
};

/// **93 · D-COM-010** → **§8.2 · F-018**（**`router::app`**；与 **`matrix_93_d_com_010_post_report_persists_pg_row`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app_stack_report_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

/// **93 · D-COM-010** → **§8.2 · F-018**：**`POST …/reports`** 后 **无身份头** **`GET …/posts/:id`** **公开读**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let app = app_stack_report_pool(pool.clone());
    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app.clone()).await;

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post detail unauthenticated after report app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"], "report target body");
    assert!(
        gj["post"].get("liked_by_me").is_none(),
        "anonymous viewer must not receive liked_by_me"
    );
    assert!(
        gj["post"].get("collected_by_me").is_none(),
        "anonymous viewer must not receive collected_by_me"
    );

    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

/// **93 · D-COM-009** → **§8.2 · F-019**（**`router::app`**；与 **`matrix_93_d_com_009_get_me_posts_lists_own_post`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (uid, post_id) =
        run_d_com_009_me_posts_flow(&pool, app_stack_report_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[uid], &[post_id]).await;
}

/// **93 · D-COM-009（门闸）** → **§8.2 · F-019**：**`router::app`** **`GET /api/v1/community/me/posts`** **无** **`Authorization`/`X-User-Id`** **→** **401** **`unauthorized`**（**`auth_placeholder_layer`**）。
#[tokio::test]
async fn matrix_93_d_com_009f_f019_get_me_posts_unauthorized_without_bearer_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009f_f019_get_me_posts_unauthorized_without_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let app = app_stack_report_pool(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/posts?limit=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let j = response_json(res).await;
    assert_eq!(j["error"], "unauthorized");
    assert_eq!(j["message"], "unauthorized");
}
