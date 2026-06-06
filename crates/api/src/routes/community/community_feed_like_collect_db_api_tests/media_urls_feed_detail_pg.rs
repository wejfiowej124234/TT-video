//! **`media_urls[]`** on **Feed / detail** read paths (A1 · ① PG·IT).

use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

async fn insert_photo_post_multi_urls(
    pool: &sqlx::PgPool,
    user_id: uuid::Uuid,
    urls: &[String],
    body: &str,
) -> uuid::Uuid {
    let post_id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO community_posts (
            id, user_id, body, post_type, tags, media_urls, visibility_status
        ) VALUES ($1, $2, $3, 'photo', '{}', $4, 'public')"#,
    )
    .bind(post_id)
    .bind(user_id)
    .bind(body)
    .bind(urls)
    .execute(pool)
    .await
    .expect("insert community_posts photo");
    post_id
}

#[tokio::test]
async fn matrix_93_d_com_media_urls_dual_on_feed_and_detail_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: media_urls dual feed/detail (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid, _token) = seed_user_with_session(&pool).await;
    let url_a = format!("/api/v1/uploads/community-posts/{}.png", uuid::Uuid::new_v4());
    let url_b = format!("/api/v1/uploads/community-posts/{}.png", uuid::Uuid::new_v4());
    let urls = vec![url_a.clone(), url_b.clone()];
    let post_id = insert_photo_post_multi_urls(
        &pool,
        uid,
        &urls,
        "photo post media_urls dual probe",
    )
    .await;
    let app = app_with_pool(pool.clone());

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    let feed_row = fj["posts"]
        .as_array()
        .expect("posts")
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("feed row");
    let feed_urls = feed_row["media_urls"]
        .as_array()
        .expect("feed media_urls");
    assert_eq!(feed_urls.len(), 2);
    assert_eq!(feed_urls[0].as_str(), Some(url_a.as_str()));
    assert_eq!(feed_urls[1].as_str(), Some(url_b.as_str()));

    let detail = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("detail");
    let detail_st = detail.status();
    let dj = response_json(detail).await;
    assert_eq!(detail_st, StatusCode::OK, "{:?}", dj);
    let detail_urls = dj["post"]["media_urls"]
        .as_array()
        .expect("detail media_urls");
    assert_eq!(detail_urls.len(), 2);
    assert_eq!(detail_urls[0].as_str(), Some(url_a.as_str()));
    assert_eq!(detail_urls[1].as_str(), Some(url_b.as_str()));

    cleanup_user_and_posts(&pool, uid).await;
}
