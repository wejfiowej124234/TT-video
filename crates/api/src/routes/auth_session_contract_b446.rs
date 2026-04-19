//! **B-446**：**`db_pool`** **下** **sessions** **持久化** **与** **`auth_login`** **换发** **token** **的** **机读** **契约** **（** **与** **「** **前端** **登录** **后** **只** **保留** **最新** **token** **」** **产品** **心智** **区分** **：****服务端** **默认** **不** **因** **新** **登录** **删除** **同** **用户** **其它** **session** **行** **）** **。**
//!
//! 直接调用 **`extract_user_with_session_check`** **/** **`get_me_impl`** **/** **`auth_login`** **（** **与** **HTTP** **路由** **同源** **）** **，** **避免** **Axum** **`Router`**** **`oneshot`** **与** **tower** **版本** **组合** **差异** **。**

use axum::http::{header, HeaderMap};
use axum::Json;
use chrono::Utc;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::chain_off::{
    auth_login, get_me_impl, AuthLoginBody, ChainOffConfig, ChainOffState, ChainOffStore,
};
use crate::db::{insert_session, insert_user};
use crate::state::{extract_user_with_session_check, test_support::api_meta_state, ApiMetaState};
use crate::startup::hydrate_from_db;

const B446_PASSWORD: &str = "B446SecurePw!9";

async fn pool_or_skip() -> Option<PgPool> {
    let url = std::env::var("DATABASE_URL").ok()?.trim().to_string();
    if url.is_empty() {
        return None;
    }
    Some(
        PgPoolOptions::new()
            .max_connections(4)
            .connect(&url)
            .await
            .expect("DATABASE_URL connect"),
    )
}

async fn cleanup_user_sessions(pool: &PgPool, uid: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(pool)
        .await;
}

fn bearer_headers(token: &str) -> HeaderMap {
    let mut h = HeaderMap::new();
    h.insert(
        header::AUTHORIZATION,
        format!("Bearer {}", token).parse().expect("auth header"),
    );
    h
}

fn make_state(pool: PgPool, store: ChainOffStore) -> ApiMetaState {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    api_meta_state(Some(co))
}

#[tokio::test]
async fn b446_hydrated_legacy_token_authenticates_get_me() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: b446_hydrated_legacy_token_authenticates_get_me (DATABASE_URL unset)");
        return;
    };

    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("b446-{uid}@traveltrust.test");
    let token_legacy = format!("tts_b446_legacy_{}", Uuid::new_v4());
    let hash = bcrypt::hash(B446_PASSWORD, bcrypt::DEFAULT_COST).expect("bcrypt");

    cleanup_user_sessions(&pool, uid).await;

    insert_user(
        &pool,
        uid,
        &email,
        Some(&hash),
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
    insert_session(&pool, &token_legacy, uid)
        .await
        .expect("insert_session legacy");

    let mut store = ChainOffStore::default();
    hydrate_from_db(&pool, &mut store)
        .await
        .expect("hydrate_from_db");

    let state = make_state(pool.clone(), store);
    let co = state.chain_off.clone().expect("chain_off");

    let uid_from_auth = extract_user_with_session_check(&state, &bearer_headers(&token_legacy))
        .await
        .expect("Bearer must resolve user_id via sessions (db_pool path)");
    assert_eq!(uid_from_auth, uid);

    let Ok(Json(me_v)) = get_me_impl(co.clone(), uid_from_auth).await else {
        panic!("get_me_impl expected Ok");
    };
    assert_eq!(me_v["user"]["email"], email);

    cleanup_user_sessions(&pool, uid).await;
}

#[tokio::test]
async fn b446_login_issues_distinct_token_prior_session_row_remains_valid() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: b446_login_issues_distinct_token_prior_session_row_remains_valid (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("b446-login-{uid}@traveltrust.test");
    let token_prior = format!("tts_b446_prior_{}", Uuid::new_v4());
    let hash = bcrypt::hash(B446_PASSWORD, bcrypt::DEFAULT_COST).expect("bcrypt");

    cleanup_user_sessions(&pool, uid).await;

    insert_user(
        &pool,
        uid,
        &email,
        Some(&hash),
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
    insert_session(&pool, &token_prior, uid)
        .await
        .expect("insert_session prior");

    let mut store = ChainOffStore::default();
    hydrate_from_db(&pool, &mut store)
        .await
        .expect("hydrate_from_db");

    let state = make_state(pool.clone(), store);
    let co = state.chain_off.clone().expect("chain_off");

    let Ok(Json(login_j)) = auth_login(
        co.clone(),
        Json(AuthLoginBody {
            email: email.clone(),
            password: B446_PASSWORD.to_string(),
        }),
    )
    .await
    else {
        panic!("auth_login expected Ok");
    };
    let token_new = login_j["token"].as_str().expect("login token");
    assert_ne!(
        token_new, token_prior,
        "B-446: login must issue a new opaque token string"
    );

    let u_prior = extract_user_with_session_check(&state, &bearer_headers(&token_prior))
        .await
        .expect("prior token still valid (sessions row not revoked by login)");
    let u_new = extract_user_with_session_check(&state, &bearer_headers(token_new))
        .await
        .expect("new token valid");
    assert_eq!(u_prior, uid);
    assert_eq!(u_new, uid);

    let _ = get_me_impl(co.clone(), uid).await.expect("get_me with hydrated user");

    let n_sessions: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM sessions WHERE user_id = $1")
            .bind(uid)
            .fetch_one(&pool)
            .await
            .expect("count sessions");
    assert!(
        n_sessions >= 2,
        "expected at least prior + login session rows for same user, got {n_sessions}"
    );

    cleanup_user_sessions(&pool, uid).await;
}
