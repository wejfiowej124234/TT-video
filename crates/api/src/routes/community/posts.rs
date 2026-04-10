use std::collections::{HashMap, HashSet};

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::common::{
    comment_body_visible_to_viewer, display_nickname_for_user, enforce_community_comment_abuse,
    enforce_community_post_abuse, enforce_no_active_write_penalty, json_profiles_to_author_map,
    normalize_comment_sort, order_comments_thread, placeholder_ok,
    posts_json_with_engagement_counts, user_ids_to_json_profiles, AuthorEnrich, FEED_LIMIT,
    LIST_LIMIT,
};

// ---------- 帖子与 Feed（51-31-9 / 51-31-B1；51-31-B2 推荐流/关注流）----------
#[derive(serde::Deserialize)]
pub(super) struct FeedQuery {
    cursor: Option<String>,
    limit: Option<i64>,
    /// 51-31-B2 / 160 §3.4：`latest`|`recommend`（时间倒序，默认）、`hot`（赞+评降序）、`follow`（关注流，需登录）。`hot` 游标前缀 `H|`，与 `latest` 的 RFC3339 游标勿混用。
    mode: Option<String>,
    /// 与 `community_posts.tags` 某一元素 **精确相等**；空或超长（>64）忽略，不按标签过滤。
    tag: Option<String>,
    /// 31 §2.3：`GET …/me/posts` 与本人看自己的 `users/…/posts`：`all`|`public`|`private`|`archived`。
    visibility: Option<String>,
}

fn parse_post_list_visibility(raw: Option<&str>) -> Option<&'static str> {
    let s = raw.map(str::trim).filter(|s| !s.is_empty())?;
    match s.to_ascii_lowercase().as_str() {
        "all" => None,
        "public" => Some("public"),
        "private" => Some("private"),
        "archived" => Some("archived"),
        _ => None,
    }
}

pub(super) async fn create_post(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let body_text = j
        .get("body")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let post_type = j
        .get("post_type")
        .and_then(|v| v.as_str())
        .unwrap_or("photo")
        .to_string();
    let destination = j
        .get("destination")
        .and_then(|v| v.as_str())
        .map(String::from);
    let tags: Vec<String> = j
        .get("tags")
        .and_then(|v| v.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let media_urls: Vec<String> = j
        .get("media_urls")
        .and_then(|v| v.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let cover_url: Option<String> = j
        .get("cover_url")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.chars().take(2048).collect());
    let body_trim = body_text.trim();
    let pt_lc = post_type.to_ascii_lowercase();
    if pt_lc == "text" && body_trim.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "empty_body",
            "message": "empty_body",
            "errors": { "body": "empty_body" }
        }))
        .into_response();
    }
    if pt_lc != "text" && media_urls.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "media_required",
            "message": "media_required",
            "errors": { "media_urls": "media_required" }
        }))
        .into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "body").await {
        return resp;
    }
    if let Err(resp) = enforce_community_post_abuse(pool, uid, body_trim).await {
        return resp;
    }
    match db::insert_post(
        pool,
        uid,
        body_trim,
        post_type.as_str(),
        destination.as_deref(),
        &tags,
        &media_urls,
        cover_url.as_deref(),
    )
    .await
    {
        Ok(id) => Json(json!({ "status": "ok", "id": id.to_string() })).into_response(),
        Err(_) => Json(json!({"status": "error", "error": "create_post_failed", "message": "create_post_failed"})).into_response(),
    }
}

pub(super) async fn get_feed(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        return placeholder_ok("posts", json!([]));
    };
    let limit = q.limit.unwrap_or(FEED_LIMIT).min(100).max(1);
    let mode_raw = q
        .mode
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("recommend");
    let mode_lc = mode_raw.to_ascii_lowercase();
    let is_follow = mode_lc == "follow";
    let is_hot = mode_lc == "hot";
    let cursor_raw = q.cursor.as_deref();
    let feed_cursor = if is_hot {
        cursor_raw.filter(|c| c.starts_with("H|"))
    } else {
        cursor_raw.filter(|c| !c.starts_with("H|"))
    };
    let tag_filter = q
        .tag
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .and_then(|s| (s.len() <= 64).then_some(s));

    let viewer = extract_user_with_session_check(&state, &headers).await;

    if is_follow {
        let uid = match viewer {
            Some(u) => u,
            None => {
                return Json(
                    json!({ "status": "ok", "posts": [], "note": "51-31-B2 关注流需登录" }),
                )
                .into_response()
            }
        };
        match db::list_feed_by_following(pool, uid, feed_cursor, limit, tag_filter).await {
            Ok((posts, next_cursor)) => {
                let list = match posts_json_with_engagement_counts(pool, posts, Some(uid)).await {
                    Ok(l) => l,
                    Err(_) => return placeholder_ok("posts", json!([])),
                };
                let mut out = json!({ "status": "ok", "posts": list });
                if let Some(c) = next_cursor {
                    out["next_cursor"] = json!(c);
                }
                Json(out).into_response()
            }
            Err(_) => placeholder_ok("posts", json!([])),
        }
    } else if is_hot {
        match db::list_feed_hot(pool, feed_cursor, limit, tag_filter).await {
            Ok((posts, next_cursor)) => {
                let list = match posts_json_with_engagement_counts(pool, posts, viewer).await {
                    Ok(l) => l,
                    Err(_) => return placeholder_ok("posts", json!([])),
                };
                let mut out = json!({ "status": "ok", "posts": list });
                if let Some(c) = next_cursor {
                    out["next_cursor"] = json!(c);
                }
                Json(out).into_response()
            }
            Err(_) => placeholder_ok("posts", json!([])),
        }
    } else {
        match db::list_feed(pool, feed_cursor, limit, tag_filter).await {
            Ok((posts, next_cursor)) => {
                let list = match posts_json_with_engagement_counts(pool, posts, viewer).await {
                    Ok(l) => l,
                    Err(_) => return placeholder_ok("posts", json!([])),
                };
                let mut out = json!({ "status": "ok", "posts": list });
                if let Some(c) = next_cursor {
                    out["next_cursor"] = json!(c);
                }
                Json(out).into_response()
            }
            Err(_) => placeholder_ok("posts", json!([])),
        }
    }
}

/** 51-31-19：我的帖子（游标分页，当前用户） */
pub(super) async fn get_me_posts(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = extract_user_with_session_check(&state, &headers).await;
    let Some((pool, uid)) = pool.zip(uid) else {
        return placeholder_ok("posts", json!([]));
    };
    let limit = q.limit.unwrap_or(FEED_LIMIT).min(100).max(1);
    let cursor = q.cursor.as_deref();
    let vis = parse_post_list_visibility(q.visibility.as_deref());
    match db::list_posts_by_user(pool, uid, cursor, limit, true, false, vis).await {
        Ok((posts, next_cursor)) => {
            let list = match posts_json_with_engagement_counts(pool, posts, Some(uid)).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("posts", json!([])),
            };
            let mut out = json!({ "status": "ok", "posts": list });
            if let Some(c) = next_cursor {
                out["next_cursor"] = json!(c);
            }
            Json(out).into_response()
        }
        Err(_) => placeholder_ok("posts", json!([])),
    }
}

/// GET /api/v1/community/users/:user_id/posts — 指定用户的公开帖子（游标分页，无需登录）
pub(super) async fn get_user_posts(
    Path(user_id): Path<String>,
    State(state): State<ApiMetaState>,
    Query(q): Query<FeedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        return placeholder_ok("posts", json!([]));
    };
    let Ok(uid) = Uuid::parse_str(&user_id) else {
        return Json(
            json!({"status": "error", "error": "invalid_user_id", "message": "invalid_user_id"}),
        )
        .into_response();
    };
    let limit = q.limit.unwrap_or(FEED_LIMIT).min(100).max(1);
    let cursor = q.cursor.as_deref();
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let skip_limit_feed = viewer == Some(uid);
    let owner_view = viewer == Some(uid);
    let public_only = !owner_view;
    let vis = if owner_view {
        parse_post_list_visibility(q.visibility.as_deref())
    } else {
        None
    };
    match db::list_posts_by_user(pool, uid, cursor, limit, skip_limit_feed, public_only, vis).await
    {
        Ok((posts, next_cursor)) => {
            let list = match posts_json_with_engagement_counts(pool, posts, viewer).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("posts", json!([])),
            };
            let mut out = json!({ "status": "ok", "posts": list });
            if let Some(c) = next_cursor {
                out["next_cursor"] = json!(c);
            }
            Json(out).into_response()
        }
        Err(_) => placeholder_ok("posts", json!([])),
    }
}

pub(super) async fn get_post_detail(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        return Json(json!({"status": "ok", "post": null, "note": "50-O-31 占位"})).into_response();
    };
    let Ok(post_id) = Uuid::parse_str(&id) else {
        return Json(json!({"status": "error", "error": "invalid_id", "message": "invalid_id"}))
            .into_response();
    };
    match db::get_post_by_id(pool, post_id).await {
        Ok(Some(p)) => {
            let viewer = extract_user_with_session_check(&state, &headers).await;
            if p.visibility_status != "public" && viewer != Some(p.user_id) {
                return Json(json!({ "status": "ok", "post": null })).into_response();
            }
            let hide_for_limit_feed =
                match db::subject_has_active_limit_feed_penalty(pool, p.user_id).await {
                    Ok(v) => v,
                    Err(_) => true,
                };
            if hide_for_limit_feed && viewer != Some(p.user_id) {
                return Json(json!({ "status": "ok", "post": null })).into_response();
            }
            let (like_count, comment_count, collect_count) = tokio::join!(
                db::count_likes(pool, p.id),
                db::count_comments_on_post(pool, p.id),
                db::count_collects_for_post(pool, p.id),
            );
            let like_count = like_count.unwrap_or(0);
            let comment_count = comment_count.unwrap_or(0);
            let collect_count = collect_count.unwrap_or(0);
            let short8 = p.user_id.to_string().chars().take(8).collect::<String>();
            let (
                author_nickname,
                author_avatar_url,
                author_role,
                author_is_escrow_guide,
                author_wallet,
            ) = match user_ids_to_json_profiles(pool, vec![p.user_id]).await {
                Ok(prof) => {
                    let m = json_profiles_to_author_map(prof);
                    m.get(&p.user_id)
                        .map(|(n, a, role, esc, w)| {
                            let nn = if n.trim().is_empty() {
                                short8.clone()
                            } else {
                                n.clone()
                            };
                            (nn, a.clone(), role.clone(), *esc, w.clone())
                        })
                        .unwrap_or((short8.clone(), None, "tourist".to_string(), false, None))
                }
                Err(_) => (short8, None, "tourist".to_string(), false, None),
            };
            let mut post_json = json!({
                "id": p.id.to_string(),
                "user_id": p.user_id.to_string(),
                "body": p.body,
                "post_type": p.post_type,
                "destination": p.destination,
                "tags": p.tags,
                "media_urls": p.media_urls,
                "cover_url": p.cover_url,
                "visibility_status": p.visibility_status,
                "created_at": p.created_at.to_rfc3339(),
                "like_count": like_count,
                "comment_count": comment_count,
                "collect_count": collect_count,
                "author_nickname": author_nickname,
                "author_avatar_url": author_avatar_url,
                "author_role": author_role,
                "author_is_escrow_guide": author_is_escrow_guide,
                "author_default_wallet": author_wallet,
            });
            if let Some(uid) = viewer {
                let (liked, collected, author_followed) = tokio::join!(
                    db::user_liked_post(pool, uid, p.id),
                    db::user_collected_post(pool, uid, p.id),
                    async {
                        if uid == p.user_id {
                            Ok(false)
                        } else {
                            db::is_following(pool, uid, p.user_id).await
                        }
                    },
                );
                if let Some(m) = post_json.as_object_mut() {
                    m.insert("liked_by_me".to_string(), json!(liked.unwrap_or(false)));
                    m.insert(
                        "collected_by_me".to_string(),
                        json!(collected.unwrap_or(false)),
                    );
                    if uid != p.user_id {
                        m.insert(
                            "author_followed_by_me".to_string(),
                            json!(author_followed.unwrap_or(false)),
                        );
                    }
                }
            }
            Json(json!({ "status": "ok", "post": post_json })).into_response()
        }
        Ok(None) => Json(json!({"status": "ok", "post": null})).into_response(),
        Err(_) => Json(json!({"status": "error", "error": "db_error", "message": "db_error"}))
            .into_response(),
    }
}

// DELETE /api/v1/community/posts/:id（31 §2.3 删除自己的帖子）
pub(super) async fn delete_post(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(post_id) = Uuid::parse_str(&id) else {
        return Json(json!({"status": "error", "error": "invalid_id", "message": "invalid_id"}))
            .into_response();
    };
    match db::delete_post_owned(pool, post_id, uid).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "not_found_or_forbidden", "message": "not_found_or_forbidden"})),
        )
            .into_response(),
        Err(_) => Json(json!({"status": "error", "error": "delete_failed", "message": "delete_failed"})).into_response(),
    }
}

/// PATCH /api/v1/community/posts/:id — body `{ "visibility_status": "public"|"private"|"archived" }`（31 §2.3）
pub(super) async fn patch_post(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(post_id) = Uuid::parse_str(&id) else {
        return Json(json!({"status": "error", "error": "invalid_id", "message": "invalid_id"}))
            .into_response();
    };
    let empty = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let vis = j
        .get("visibility_status")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let Some(vis) = vis else {
        return Json(json!({"status": "error", "error": "visibility_status_required", "message": "visibility_status_required"})).into_response();
    };
    if !db::is_allowed_post_visibility_status(vis) {
        return Json(json!({"status": "error", "error": "invalid_visibility_status", "message": "invalid_visibility_status"})).into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "visibility_status").await {
        return resp;
    }
    match db::update_post_visibility_owned(pool, post_id, uid, vis).await {
        Ok(true) => Json(json!({"status": "ok", "visibility_status": vis})).into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "not_found_or_forbidden", "message": "not_found_or_forbidden"})),
        )
            .into_response(),
        Err(_) => Json(json!({"status": "error", "error": "update_failed", "message": "update_failed"})).into_response(),
    }
}

#[derive(serde::Deserialize)]
pub(super) struct TagPostStatsQuery {
    pub(super) tag: Option<String>,
}

/// GET /api/v1/community/stats/posts-by-tag?tag= — 公开帖子数（与 Feed `tag` 精确匹配）
pub(super) async fn get_public_posts_by_tag_count(
    State(state): State<ApiMetaState>,
    Query(q): Query<TagPostStatsQuery>,
) -> impl IntoResponse {
    let tag = q.tag.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let Some(tag) = tag else {
        return Json(
            json!({"status": "error", "error": "tag_required", "message": "tag_required"}),
        )
        .into_response();
    };
    if tag.len() > 64 {
        return Json(
            json!({"status": "error", "error": "tag_too_long", "message": "tag_too_long"}),
        )
        .into_response();
    }
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        return Json(json!({"status": "ok", "post_count": 0, "note": "50-O-31 占位"}))
            .into_response();
    };
    match db::count_public_posts_with_tag(pool, tag).await {
        Ok(n) => Json(json!({ "status": "ok", "tag": tag, "post_count": n })).into_response(),
        Err(_) => Json(json!({"status": "error", "error": "db_error", "message": "db_error"}))
            .into_response(),
    }
}

// POST/DELETE /api/v1/community/posts/:id/like（51-31-8）
pub(super) async fn post_like(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(post_id) = Uuid::parse_str(&id) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_post",
            "message": "invalid_post",
            "errors": { "post_id": "invalid_post" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "post_id").await {
        return resp;
    }
    match db::insert_like(pool, uid, post_id).await {
        Ok(()) => Json(json!({"status": "ok"})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "like_create_failed",
            "message": "like_create_failed",
            "errors": { "post_id": "like_create_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn delete_like(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(post_id) = Uuid::parse_str(&id) {
            let _ = db::delete_like(pool, uid, post_id).await;
        }
    }
    Json(json!({"status": "ok"})).into_response()
}

#[derive(serde::Deserialize, Default)]
pub(super) struct CommentsQuery {
    /// `chronological`（默认）| `latest` | `hot`（31 §2.2）
    sort: Option<String>,
}

// GET/POST /api/v1/community/posts/:id/comments
pub(super) async fn get_comments(
    Path(id): Path<String>,
    Query(q): Query<CommentsQuery>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        if let Ok(post_id) = Uuid::parse_str(&id) {
            if let Ok(rows) = db::list_comments(pool, post_id, LIST_LIMIT).await {
                let sort = normalize_comment_sort(q.sort.as_deref());
                let rows = order_comments_thread(rows, sort);
                let viewer_uid = extract_user_with_session_check(&state, &headers).await;
                let mut viewer_privileged = false;
                if let Some(uid) = viewer_uid {
                    if let Ok(Some(role)) = db::get_user_role_by_id(pool, uid).await {
                        viewer_privileged = role == "admin" || role == "super_admin";
                    }
                }
                let mut seen_u = HashSet::new();
                let mut commenter_ids: Vec<Uuid> = Vec::new();
                for r in &rows {
                    if seen_u.insert(r.user_id) {
                        commenter_ids.push(r.user_id);
                    }
                }
                let author_profiles: HashMap<Uuid, AuthorEnrich> =
                    match user_ids_to_json_profiles(pool, commenter_ids).await {
                        Ok(profiles) => json_profiles_to_author_map(profiles),
                        Err(_) => HashMap::new(),
                    };
                let comments: Vec<_> = rows
                    .into_iter()
                    .map(|r| {
                        let short8 = r.user_id.to_string().chars().take(8).collect::<String>();
                        let (
                            author_nickname,
                            author_avatar_url,
                            author_role,
                            author_is_escrow_guide,
                            author_wallet,
                        ) = author_profiles
                            .get(&r.user_id)
                            .map(|(n, a, role, esc, w)| {
                                let nn = if n.trim().is_empty() {
                                    short8.clone()
                                } else {
                                    n.clone()
                                };
                                (nn, a.clone(), role.clone(), *esc, w.clone())
                            })
                            .unwrap_or((short8, None, "tourist".to_string(), false, None));
                        let vis = r.visibility_status.as_str();
                        let show_body = comment_body_visible_to_viewer(
                            vis,
                            r.user_id,
                            viewer_uid,
                            viewer_privileged,
                        );
                        let body_out = if show_body {
                            r.body.clone()
                        } else {
                            String::new()
                        };
                        json!({
                            "id": r.id.to_string(),
                            "post_id": r.post_id.to_string(),
                            "user_id": r.user_id.to_string(),
                            "parent_id": r.parent_id.map(|u| u.to_string()),
                            "body": body_out,
                            "created_at": r.created_at.to_rfc3339(),
                            "visibility_status": vis,
                            "risk_level": r.risk_level,
                            "body_is_redacted": !show_body,
                            "author_nickname": author_nickname,
                            "author_avatar_url": author_avatar_url,
                            "author_role": author_role,
                            "author_is_escrow_guide": author_is_escrow_guide,
                            "author_default_wallet": author_wallet,
                        })
                    })
                    .collect();
                return Json(json!({ "status": "ok", "comments": comments })).into_response();
            }
        }
    }
    placeholder_ok("comments", json!([]))
}

pub(super) async fn post_comment(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let comment_body = j
        .get("body")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let parent_id = j
        .get("parent_id")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let comment_trim = comment_body.trim();
    if comment_trim.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "empty_body",
            "message": "empty_body",
            "errors": { "body": "empty_body" }
        }))
        .into_response();
    }
    let Some(pool) = pool else {
        return Json(json!({"status": "ok", "id": null, "note": "50-O-31 占位"})).into_response();
    };
    let Ok(post_id) = Uuid::parse_str(&id) else {
        return Json(
            json!({"status": "error", "error": "invalid_post", "message": "invalid_post"}),
        )
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "body").await {
        return resp;
    }
    if let Err(resp) = enforce_community_comment_abuse(pool, uid, post_id, comment_trim).await {
        return resp;
    }
    match db::insert_comment(pool, post_id, uid, parent_id, comment_trim).await {
        Ok(comment_id) => Json(json!({
            "status": "ok",
            "id": comment_id.to_string(),
            "visibility_status": "visible",
            "risk_level": 0,
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "comment_failed",
            "message": "comment_failed",
            "errors": { "body": "comment_failed" }
        }))
        .into_response(),
    }
}
