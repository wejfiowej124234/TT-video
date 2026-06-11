//! Phase ② · **C6** 社交图与互动 PG·IT（关注 · 粉丝 · 私信 · 通知 · Feed/Profile 关系）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::*;
use crate::db::{insert_session, insert_user};

async fn seed_user_named(pool: &sqlx::PgPool, label: &str) -> (Uuid, String) {
    let uid = Uuid::new_v4();
    let token = format!("tts_c6_{label}_{}", Uuid::new_v4());
    let now = chrono::Utc::now();
    let email = format!("c6-{label}-{uid}@example.com");
    insert_user(
        pool,
        uid,
        &email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
    insert_session(pool, &token, uid)
        .await
        .expect("insert_session");
    (uid, token)
}

async fn cleanup_social_user(pool: &sqlx::PgPool, user_id: Uuid) {
    let _ = sqlx::query(
        "DELETE FROM community_dm_read_state WHERE user_id = $1 OR conversation_id IN \
         (SELECT id FROM community_conversations WHERE user1_id = $1 OR user2_id = $1)",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        "DELETE FROM community_dm_messages WHERE conversation_id IN \
         (SELECT id FROM community_conversations WHERE user1_id = $1 OR user2_id = $1)",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        "DELETE FROM community_conversations WHERE user1_id = $1 OR user2_id = $1",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        "DELETE FROM community_follows WHERE follower_id = $1 OR following_id = $1",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        "DELETE FROM community_likes WHERE user_id = $1 OR post_id IN \
         (SELECT id FROM community_posts WHERE user_id = $1)",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    cleanup_user_and_posts(pool, user_id).await;
}

async fn post_follow(app: &axum::Router, follower_token: &str, target_id: Uuid) {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/users/{target_id}/follow"))
                .header(header::AUTHORIZATION, auth_bearer(follower_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("follow");
    assert_eq!(res.status(), StatusCode::OK);
}

#[tokio::test]
async fn matrix_93_d_com_c6_follow_followers_following_feed_profile_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c6 follow graph (DATABASE_URL unset)");
        return;
    };
    let _env = crate::test_env_serial::lock();
    let _serial = db_it_lock().lock().await;
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (uid_a, token_a) = seed_user_named(&pool, "follower").await;
    let (uid_b, token_b) = seed_user_named(&pool, "author").await;
    let app = app_stack_feed_pool(pool.clone());

    let marker = format!("c6-follow-feed-{}", Uuid::new_v4());
    let post_id = create_text_post(&app, &token_b, &marker).await;

    post_follow(&app, &token_a, uid_b).await;

    let following = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/following?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token_a))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("me/following");
    let fj = response_json(following).await;
    assert!(
        fj["following"]
            .as_array()
            .unwrap()
            .iter()
            .any(|u| u["id"].as_str() == Some(uid_b.to_string().as_str()))
    );

    let followers = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/followers?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token_b))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("me/followers");
    let folj = response_json(followers).await;
    assert!(
        folj["followers"]
            .as_array()
            .unwrap()
            .iter()
            .any(|u| u["id"].as_str() == Some(uid_a.to_string().as_str()))
    );

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?mode=follow&limit=30")
                .header(header::AUTHORIZATION, auth_bearer(&token_a))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("follow feed");
    let feedj = response_json(feed).await;
    assert!(
        feedj["posts"]
            .as_array()
            .unwrap()
            .iter()
            .any(|p| p["id"].as_str() == Some(post_id.to_string().as_str()))
    );

    let detail = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token_a))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("post detail");
    let dj = response_json(detail).await;
    assert_eq!(dj["post"]["author_followed_by_me"].as_bool(), Some(true));

    let profile = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/users/{uid_b}/posts?limit=20"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("profile posts");
    let pj = response_json(profile).await;
    assert!(
        pj["posts"]
            .as_array()
            .unwrap()
            .iter()
            .any(|p| p["id"].as_str() == Some(post_id.to_string().as_str()))
    );

    cleanup_social_user(&pool, uid_a).await;
    cleanup_social_user(&pool, uid_b).await;
    if let Some(v) = prev {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v);
    } else {
        std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE");
    }
}

#[tokio::test]
async fn matrix_93_d_com_c6_dm_conversation_unread_read_state_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c6 dm (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid_a, token_a) = seed_user_named(&pool, "dm-a").await;
    let (uid_b, token_b) = seed_user_named(&pool, "dm-b").await;
    let app = app_stack_feed_pool(pool.clone());

    let ensure = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/conversations/ensure")
                .header(header::AUTHORIZATION, auth_bearer(&token_a))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(format!(
                    r#"{{"peer_user_id":"{uid_b}"}}"#
                )))
                .unwrap(),
        )
        .await
        .expect("ensure");
    let ej = response_json(ensure).await;
    let conv_id = ej["id"].as_str().expect("conv id").to_string();

    let marker = format!("c6-dm-msg-{}", Uuid::new_v4());
    let send = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/conversations/{conv_id}/messages"))
                .header(header::AUTHORIZATION, auth_bearer(&token_a))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(format!(r#"{{"body":"{marker}"}}"#)))
                .unwrap(),
        )
        .await
        .expect("send dm");
    assert_eq!(send.status(), StatusCode::OK);

    let convs_before = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/conversations")
                .header(header::AUTHORIZATION, auth_bearer(&token_b))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("conversations");
    let cj = response_json(convs_before).await;
    let row = cj["conversations"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["id"].as_str() == Some(conv_id.as_str()))
        .expect("conv in list");
    assert!(row["unread_count"].as_i64().unwrap_or(0) >= 1);
    assert!(row["last_message"].as_str().unwrap_or("").contains(&marker));

    let msgs = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/conversations/{conv_id}/messages"))
                .header(header::AUTHORIZATION, auth_bearer(&token_b))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get messages");
    let mj = response_json(msgs).await;
    assert!(
        mj["messages"]
            .as_array()
            .unwrap()
            .iter()
            .any(|m| m["body"].as_str() == Some(marker.as_str()))
    );

    let convs_after = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/conversations")
                .header(header::AUTHORIZATION, auth_bearer(&token_b))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("conversations after read");
    let cj2 = response_json(convs_after).await;
    let row2 = cj2["conversations"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["id"].as_str() == Some(conv_id.as_str()))
        .expect("conv after read");
    assert_eq!(row2["unread_count"].as_i64(), Some(0));

    cleanup_social_user(&pool, uid_a).await;
    cleanup_social_user(&pool, uid_b).await;
}

#[tokio::test]
async fn matrix_93_d_com_c6_like_notification_likes_received_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c6 likes notification (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid_author, token_author) = seed_user_named(&pool, "like-author").await;
    let (uid_liker, token_liker) = seed_user_named(&pool, "liker").await;
    let app = app_stack_feed_pool(pool.clone());

    let post_id = create_text_post(&app, &token_author, "c6-like-notify-post").await;

    let likes_before = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/likes-received")
                .header(header::AUTHORIZATION, auth_bearer(&token_author))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("likes before");
    let lb = response_json(likes_before).await;
    let before = lb["likes_received"].as_i64().unwrap_or(0);

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token_liker))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like");
    assert_eq!(like.status(), StatusCode::OK);

    let likes_after = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/likes-received")
                .header(header::AUTHORIZATION, auth_bearer(&token_author))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("likes after");
    let la = response_json(likes_after).await;
    assert_eq!(la["likes_received"].as_i64(), Some(before + 1));

    cleanup_social_user(&pool, uid_author).await;
    cleanup_social_user(&pool, uid_liker).await;
}
