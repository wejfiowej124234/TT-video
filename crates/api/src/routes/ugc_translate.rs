//! `POST /api/v1/ugc/translate` · `GET /api/v1/ugc/translations` — UGC 翻译（① mock；②/③ DeepL/Google；GET 只读缓存）。

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db::{
    get_ugc_source_text, get_ugc_translation_cache, insert_ugc_translation_cache, UgcSourceError,
};
use crate::state::{extract_user_with_session_check, ApiMetaState};
use crate::ugc_translate::{
    parse_source_locale, parse_target_locale, provider_kind_from_env, require_non_empty_source,
    source_hash, translate_on_miss, validate_content_class_and_field, CacheStatus, TranslateError,
};

#[derive(Debug, Deserialize)]
pub struct PostUgcTranslateBody {
    content_class: String,
    content_id: String,
    field: String,
    target_locale: String,
    #[serde(default)]
    source_locale: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetUgcTranslationsQuery {
    content_class: String,
    content_id: String,
    field: String,
    target_locale: String,
}

fn login_required() -> impl IntoResponse {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"status": "error", "error": "login_required", "message": "login_required"})),
    )
}

fn err(code: StatusCode, key: &str) -> axum::response::Response {
    (
        code,
        Json(json!({"status": "error", "error": key, "message": key})),
    )
        .into_response()
}

fn pool_from_state(state: &ApiMetaState) -> Option<sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.clone()
}

pub async fn post_ugc_translate(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<PostUgcTranslateBody>,
) -> impl IntoResponse {
    if extract_user_with_session_check(&state, &headers)
        .await
        .is_none()
    {
        return login_required().into_response();
    }
    let Some(pool) = pool_from_state(&state) else {
        return err(StatusCode::SERVICE_UNAVAILABLE, "database_required");
    };
    let provider_kind = match provider_kind_from_env() {
        Ok(k) => k,
        Err(TranslateError::ProviderUnconfigured) => {
            return err(StatusCode::SERVICE_UNAVAILABLE, "translation_provider_unconfigured")
        }
        Err(_) => return err(StatusCode::SERVICE_UNAVAILABLE, "translation_provider_unconfigured"),
    };

    let target_locale = match parse_target_locale(&body.target_locale) {
        Ok(v) => v,
        Err(TranslateError::InvalidTargetLocale) => {
            return err(StatusCode::BAD_REQUEST, "invalid_target_locale")
        }
        Err(_) => return err(StatusCode::BAD_REQUEST, "invalid_target_locale"),
    };
    let content_class = body.content_class.trim();
    let field = body.field.trim();
    match validate_content_class_and_field(content_class, field) {
        Ok(()) => {}
        Err(TranslateError::DmNotThisSlice) => {
            return err(StatusCode::FORBIDDEN, "dm_not_this_slice")
        }
        Err(TranslateError::InvalidContentClass) => {
            return err(StatusCode::BAD_REQUEST, "invalid_content_class")
        }
        Err(TranslateError::InvalidField) => return err(StatusCode::BAD_REQUEST, "invalid_field"),
        Err(_) => return err(StatusCode::BAD_REQUEST, "invalid_content_class"),
    }
    let content_id = match Uuid::parse_str(body.content_id.trim()) {
        Ok(id) => id,
        Err(_) => return err(StatusCode::BAD_REQUEST, "invalid_content_id"),
    };
    let source_locale = parse_source_locale(body.source_locale.as_deref());

    let source_text = match get_ugc_source_text(&pool, content_class, content_id, field).await {
        Ok(s) => s,
        Err(UgcSourceError::NotFound) => return err(StatusCode::NOT_FOUND, "content_not_found"),
        Err(UgcSourceError::FieldNotText) => return err(StatusCode::BAD_REQUEST, "field_not_text"),
        Err(UgcSourceError::Db(_)) => return err(StatusCode::SERVICE_UNAVAILABLE, "database_error"),
    };
    if require_non_empty_source(&source_text).is_err() {
        return err(StatusCode::BAD_REQUEST, "empty_source");
    }
    let hash = source_hash(source_text.trim());
    let cached = match get_ugc_translation_cache(
        &pool,
        content_class,
        content_id,
        field,
        &hash,
        &target_locale,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => return err(StatusCode::SERVICE_UNAVAILABLE, "database_error"),
    };

    let resolved = if let Some(row) = cached {
        crate::ugc_translate::ResolvedTranslation {
            cache: CacheStatus::Hit,
            source_hash: row.source_hash,
            translated_text: row.translated_text,
            provider: row.provider,
        }
    } else {
        match translate_on_miss(provider_kind, source_text.trim(), &target_locale).await {
            Ok((text, provider)) => crate::ugc_translate::ResolvedTranslation {
                cache: CacheStatus::Miss,
                source_hash: hash.clone(),
                translated_text: text,
                provider: provider.to_string(),
            },
            Err(TranslateError::EmptySource) => return err(StatusCode::BAD_REQUEST, "empty_source"),
            Err(TranslateError::SourceTooLong) => {
                return err(StatusCode::BAD_REQUEST, "source_too_long")
            }
            Err(TranslateError::ProviderUnconfigured) => {
                return err(StatusCode::SERVICE_UNAVAILABLE, "translation_provider_unconfigured")
            }
            Err(TranslateError::UpstreamFailed) => {
                return err(StatusCode::BAD_GATEWAY, "translation_upstream_failed")
            }
            Err(_) => return err(StatusCode::BAD_REQUEST, "translate_failed"),
        }
    };

    if resolved.cache == CacheStatus::Miss {
        if insert_ugc_translation_cache(
            &pool,
            content_class,
            content_id,
            field,
            &resolved.source_hash,
            &source_locale,
            &target_locale,
            &resolved.translated_text,
            &resolved.provider,
        )
        .await
        .is_err()
        {
            return err(StatusCode::SERVICE_UNAVAILABLE, "database_error");
        }
    }

    Json(json!({
        "status": "ok",
        "cache": if resolved.cache == CacheStatus::Hit { "hit" } else { "miss" },
        "content_class": content_class,
        "content_id": content_id.to_string(),
        "field": field,
        "source_hash": resolved.source_hash,
        "source_locale": source_locale,
        "target_locale": target_locale,
        "translated_text": resolved.translated_text,
        "provider": resolved.provider,
    }))
    .into_response()
}

/// 公共缓存只读：游客可读；**不**调引擎。`dm_message` 仍 403。
pub async fn get_ugc_translations(
    State(state): State<ApiMetaState>,
    Query(q): Query<GetUgcTranslationsQuery>,
) -> impl IntoResponse {
    let Some(pool) = pool_from_state(&state) else {
        return err(StatusCode::SERVICE_UNAVAILABLE, "database_required");
    };
    let target_locale = match parse_target_locale(&q.target_locale) {
        Ok(v) => v,
        Err(TranslateError::InvalidTargetLocale) => {
            return err(StatusCode::BAD_REQUEST, "invalid_target_locale")
        }
        Err(_) => return err(StatusCode::BAD_REQUEST, "invalid_target_locale"),
    };
    let content_class = q.content_class.trim();
    let field = q.field.trim();
    match validate_content_class_and_field(content_class, field) {
        Ok(()) => {}
        Err(TranslateError::DmNotThisSlice) => {
            return err(StatusCode::FORBIDDEN, "dm_not_this_slice")
        }
        Err(TranslateError::InvalidContentClass) => {
            return err(StatusCode::BAD_REQUEST, "invalid_content_class")
        }
        Err(TranslateError::InvalidField) => return err(StatusCode::BAD_REQUEST, "invalid_field"),
        Err(_) => return err(StatusCode::BAD_REQUEST, "invalid_content_class"),
    }
    let content_id = match Uuid::parse_str(q.content_id.trim()) {
        Ok(id) => id,
        Err(_) => return err(StatusCode::BAD_REQUEST, "invalid_content_id"),
    };
    let source_text = match get_ugc_source_text(&pool, content_class, content_id, field).await {
        Ok(s) => s,
        Err(UgcSourceError::NotFound) => return err(StatusCode::NOT_FOUND, "content_not_found"),
        Err(UgcSourceError::FieldNotText) => return err(StatusCode::BAD_REQUEST, "field_not_text"),
        Err(UgcSourceError::Db(_)) => return err(StatusCode::SERVICE_UNAVAILABLE, "database_error"),
    };
    if require_non_empty_source(&source_text).is_err() {
        return Json(json!({
            "status": "ok",
            "cache": "miss",
            "content_class": content_class,
            "content_id": content_id.to_string(),
            "field": field,
            "target_locale": target_locale,
        }))
        .into_response();
    }
    let hash = source_hash(source_text.trim());
    let cached = match get_ugc_translation_cache(
        &pool,
        content_class,
        content_id,
        field,
        &hash,
        &target_locale,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => return err(StatusCode::SERVICE_UNAVAILABLE, "database_error"),
    };
    match cached {
        Some(row) => Json(json!({
            "status": "ok",
            "cache": "hit",
            "content_class": content_class,
            "content_id": content_id.to_string(),
            "field": field,
            "source_hash": row.source_hash,
            "source_locale": row.source_locale,
            "target_locale": target_locale,
            "translated_text": row.translated_text,
            "provider": row.provider,
        }))
        .into_response(),
        None => Json(json!({
            "status": "ok",
            "cache": "miss",
            "content_class": content_class,
            "content_id": content_id.to_string(),
            "field": field,
            "source_hash": hash,
            "target_locale": target_locale,
        }))
        .into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/ugc/translate", post(post_ugc_translate))
        .route("/api/v1/ugc/translations", get(get_ugc_translations))
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{header, Method, Request, StatusCode};
    use axum::Router;
    use http_body_util::BodyExt;
    use serde_json::{json, Value};
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use tower::ServiceExt;
    use uuid::Uuid;

    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use crate::routes::{auth, ugc_translate};
    use crate::state::test_support::api_meta_state;

    fn translate_router(chain_off: Option<ChainOffState>) -> Router {
        Router::new()
            .merge(auth::router())
            .merge(super::super::me::router())
            .merge(ugc_translate::router())
            .with_state(api_meta_state(chain_off))
    }

    fn chain_off_no_pool() -> ChainOffState {
        ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: None,
        }
    }

    async fn response_json(res: axum::response::Response) -> Value {
        let body = res.into_body().collect().await.unwrap().to_bytes();
        serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
    }

    #[tokio::test]
    async fn post_ugc_translate_without_session_returns_401() {
        let app = translate_router(Some(chain_off_no_pool()));
        let res = app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/ugc/translate")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "content_class": "community_post",
                            "content_id": Uuid::new_v4().to_string(),
                            "field": "body",
                            "target_locale": "en"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
        let v = response_json(res).await;
        assert_eq!(v["error"], "login_required");
    }

    #[tokio::test]
    async fn post_ugc_translate_same_hash_hits_cache_and_edit_invalidates_pg() {
        let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
            eprintln!(
                "skip: post_ugc_translate_same_hash_hits_cache_and_edit_invalidates_pg (DATABASE_URL unset)"
            );
            return;
        };

        let email = format!("ugc-tr-{}@traveltrust.test", Uuid::new_v4());
        let chain_off = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };
        let app = translate_router(Some(chain_off));

        let reg = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/auth/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "email": &email,
                            "password": "TestPass12!",
                            "nickname": "ugc-tr"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        let reg_json = response_json(reg).await;
        let token = reg_json["token"].as_str().expect("token").to_string();
        let user_id = Uuid::parse_str(reg_json["user_id"].as_str().expect("user_id")).unwrap();

        let post_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO community_posts (
                id, user_id, body, post_type, tags, media_urls, visibility_status
            ) VALUES ($1, $2, $3, 'photo', '{}', '{}', 'public')"#,
        )
        .bind(post_id)
        .bind(user_id)
        .bind("故宫讲解，含午门。")
        .execute(&pool)
        .await
        .expect("insert community_posts");

        let body = json!({
            "content_class": "community_post",
            "content_id": post_id.to_string(),
            "field": "body",
            "target_locale": "en",
            "source_locale": "zh"
        })
        .to_string();

        let miss = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/ugc/translate")
                    .header(header::CONTENT_TYPE, "application/json")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::from(body.clone()))
                    .unwrap(),
            )
            .await
            .unwrap();
        let miss_st = miss.status();
        let miss_json = response_json(miss).await;
        assert_eq!(miss_st, StatusCode::OK, "{miss_json:?}");
        assert_eq!(miss_json["cache"], "miss");
        assert_eq!(miss_json["provider"], "mock");
        let first_hash = miss_json["source_hash"].as_str().unwrap().to_string();
        let first_text = miss_json["translated_text"].as_str().unwrap().to_string();
        assert!(first_text.starts_with("[mock:en]"));

        let hit = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/ugc/translate")
                    .header(header::CONTENT_TYPE, "application/json")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::from(body))
                    .unwrap(),
            )
            .await
            .unwrap();
        let hit_json = response_json(hit).await;
        assert_eq!(hit_json["cache"], "hit");
        assert_eq!(hit_json["source_hash"], first_hash);
        assert_eq!(hit_json["translated_text"], first_text);

        let rows: (i64,) = sqlx::query_as(
            "SELECT COUNT(*)::bigint FROM ugc_translations WHERE content_id = $1",
        )
        .bind(post_id)
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(rows.0, 1, "same hash must not insert a second cache row");

        sqlx::query("UPDATE community_posts SET body = $1 WHERE id = $2")
            .bind("故宫讲解，已改文案。")
            .bind(post_id)
            .execute(&pool)
            .await
            .unwrap();

        let after_edit = app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/ugc/translate")
                    .header(header::CONTENT_TYPE, "application/json")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::from(
                        json!({
                            "content_class": "community_post",
                            "content_id": post_id.to_string(),
                            "field": "body",
                            "target_locale": "en",
                            "source_locale": "zh"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        let edit_json = response_json(after_edit).await;
        assert_eq!(edit_json["cache"], "miss");
        assert_ne!(edit_json["source_hash"].as_str().unwrap(), first_hash);
        assert_ne!(edit_json["translated_text"].as_str().unwrap(), first_text.as_str());
        assert!(edit_json["translated_text"]
            .as_str()
            .unwrap()
            .contains("已改文案"));

        let rows_after: (i64,) = sqlx::query_as(
            "SELECT COUNT(*)::bigint FROM ugc_translations WHERE content_id = $1",
        )
        .bind(post_id)
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(rows_after.0, 2);

        let _ = sqlx::query("DELETE FROM ugc_translations WHERE content_id = $1")
            .bind(post_id)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_posts WHERE id = $1")
            .bind(post_id)
            .execute(&pool)
            .await;
        let _ = sqlx::query(
            r#"DELETE FROM sessions USING users u
               WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
        )
        .bind(&email)
        .execute(&pool)
        .await;
        let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .execute(&pool)
            .await;
    }

    #[tokio::test]
    async fn get_ugc_translations_anonymous_miss_then_hit_after_post() {
        let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
            eprintln!(
                "skip: get_ugc_translations_anonymous_miss_then_hit_after_post (DATABASE_URL unset)"
            );
            return;
        };

        let email = format!("ugc-get-{}@traveltrust.test", Uuid::new_v4());
        let chain_off = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };
        let app = translate_router(Some(chain_off));

        let reg = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/auth/register")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "email": &email,
                            "password": "TestPass12!",
                            "nickname": "ugc-get"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        let reg_json = response_json(reg).await;
        let token = reg_json["token"].as_str().expect("token").to_string();
        let user_id = Uuid::parse_str(reg_json["user_id"].as_str().expect("user_id")).unwrap();

        let post_id = Uuid::new_v4();
        sqlx::query(
            r#"INSERT INTO community_posts (
                id, user_id, body, post_type, tags, media_urls, visibility_status
            ) VALUES ($1, $2, $3, 'photo', '{}', '{}', 'public')"#,
        )
        .bind(post_id)
        .bind(user_id)
        .bind("大阪城夜景。")
        .execute(&pool)
        .await
        .expect("insert community_posts");

        let q = format!(
            "/api/v1/ugc/translations?content_class=community_post&content_id={}&field=body&target_locale=en",
            post_id
        );
        let miss = app
            .clone()
            .oneshot(Request::builder().uri(&q).body(Body::empty()).unwrap())
            .await
            .unwrap();
        let miss_json = response_json(miss).await;
        assert_eq!(miss_json["status"], "ok", "{miss_json:?}");
        assert_eq!(miss_json["cache"], "miss");
        assert!(miss_json.get("translated_text").is_none());

        let posted = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/ugc/translate")
                    .header(header::CONTENT_TYPE, "application/json")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::from(
                        json!({
                            "content_class": "community_post",
                            "content_id": post_id.to_string(),
                            "field": "body",
                            "target_locale": "en",
                            "source_locale": "zh"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        let posted_json = response_json(posted).await;
        assert_eq!(posted_json["cache"], "miss", "{posted_json:?}");

        let hit = app
            .clone()
            .oneshot(Request::builder().uri(&q).body(Body::empty()).unwrap())
            .await
            .unwrap();
        let hit_json = response_json(hit).await;
        assert_eq!(hit_json["cache"], "hit", "{hit_json:?}");
        assert_eq!(hit_json["translated_text"], posted_json["translated_text"]);

        let dm = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!(
                        "/api/v1/ugc/translations?content_class=dm_message&content_id={}&field=body&target_locale=en",
                        Uuid::new_v4()
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(dm.status(), StatusCode::FORBIDDEN);

        let _ = sqlx::query("DELETE FROM ugc_translations WHERE content_id = $1")
            .bind(post_id)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_posts WHERE id = $1")
            .bind(post_id)
            .execute(&pool)
            .await;
        let _ = sqlx::query(
            r#"DELETE FROM sessions USING users u
               WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
        )
        .bind(&email)
        .execute(&pool)
        .await;
        let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .execute(&pool)
            .await;
    }
}

