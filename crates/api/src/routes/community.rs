//! 50-O-31 / 51-31-9：31 社区扩展与 04 对接（31 附录 §7、§11）
//! 有 DB 时从 community_* 表读写；无 DB 时返回占位。帖子/Feed/点赞 51-31-9、51-31-B1、51-31-8。

use std::collections::{HashMap, HashSet};

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use chrono::{Duration, Utc};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

const LIST_LIMIT: i64 = 100;
const FEED_LIMIT: i64 = 20;

/// 160：`mute`/`ban`/`shadow_ban` 且未过期时拦截社区 UGC 写；DB 异常 fail-closed（与无 pool 区分：`service_unavailable`）。
fn response_community_penalty_active(penalty_action: &str, errors_field: &str) -> Response {
    Json(json!({
        "status": "error",
        "error": "community_penalty_active",
        "message": "community_penalty_active",
        "penalty_action": penalty_action,
        "errors": { errors_field: "community_penalty_active" }
    }))
    .into_response()
}

async fn enforce_no_active_write_penalty(
    pool: &PgPool,
    uid: Uuid,
    errors_field: &str,
) -> Result<(), Response> {
    match db::active_write_blocking_penalty_action(pool, uid).await {
        Ok(None) => Ok(()),
        Ok(Some(action)) => Err(response_community_penalty_active(&action, errors_field)),
        Err(_) => Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response()),
    }
}

/// 160 §3.3：反刷评/反灌水（`community_abuse_policy`）；**HTTP 429** + 明确 `message`。
fn response_community_abuse(message: &'static str, errors_field: &'static str) -> Response {
    (
        StatusCode::TOO_MANY_REQUESTS,
        Json(json!({
            "status": "error",
            "error": message,
            "message": message,
            "errors": { errors_field: message }
        })),
    )
        .into_response()
}

/// 160 §5：`community_risk_signals` 留痕（best-effort）+ **HTTP 429**。
async fn community_abuse_reject(
    pool: &PgPool,
    subject_user_id: Uuid,
    code: &'static str,
    errors_field: &'static str,
    ctx: serde_json::Value,
) -> Response {
    db::insert_community_risk_signal(pool, subject_user_id, code, "community_abuse", "low", ctx)
        .await;
    response_community_abuse(code, errors_field)
}

async fn enforce_community_comment_abuse(
    pool: &PgPool,
    user_id: Uuid,
    post_id: Uuid,
    body: &str,
) -> Result<(), Response> {
    let p = db::get_community_abuse_policy(pool).await;
    let now = Utc::now();
    let window_start = now - Duration::seconds(i64::from(p.comment_rate_window_sec.max(1)));
    let n = match db::count_user_comments_since(pool, user_id, window_start).await {
        Ok(c) => c,
        Err(_) => {
            return Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response());
        }
    };
    if n >= i64::from(p.comment_max_per_window) {
        return Err(community_abuse_reject(
            pool,
            user_id,
            "comment_rate_limited",
            "body",
            json!({ "post_id": post_id.to_string(), "kind": "comment" }),
        )
        .await);
    }
    if p.comment_min_interval_sec > 0 {
        if let Ok(Some(last)) = db::latest_user_comment_created_at(pool, user_id).await {
            if now.signed_duration_since(last).num_seconds() < i64::from(p.comment_min_interval_sec)
            {
                return Err(community_abuse_reject(
                    pool,
                    user_id,
                    "comment_too_fast",
                    "body",
                    json!({ "post_id": post_id.to_string(), "kind": "comment" }),
                )
                .await);
            }
        }
    }
    if p.comment_duplicate_lookback_sec > 0 {
        let dup_since = now - Duration::seconds(i64::from(p.comment_duplicate_lookback_sec));
        match db::duplicate_comment_exists(pool, post_id, user_id, body, dup_since).await {
            Ok(true) => {
                return Err(community_abuse_reject(
                    pool,
                    user_id,
                    "comment_duplicate",
                    "body",
                    json!({ "post_id": post_id.to_string(), "kind": "comment" }),
                )
                .await);
            }
            Ok(false) => {}
            Err(_) => {
                return Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response());
            }
        }
    }
    Ok(())
}

async fn enforce_community_post_abuse(
    pool: &PgPool,
    user_id: Uuid,
    body_trim: &str,
) -> Result<(), Response> {
    let p = db::get_community_abuse_policy(pool).await;
    let now = Utc::now();
    let window_start = now - Duration::seconds(i64::from(p.post_rate_window_sec.max(1)));
    let n = match db::count_user_posts_since(pool, user_id, window_start).await {
        Ok(c) => c,
        Err(_) => {
            return Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response());
        }
    };
    if n >= i64::from(p.post_max_per_window) {
        return Err(community_abuse_reject(
            pool,
            user_id,
            "post_rate_limited",
            "body",
            json!({ "kind": "post" }),
        )
        .await);
    }
    if p.post_min_interval_sec > 0 {
        if let Ok(Some(last)) = db::latest_user_post_created_at(pool, user_id).await {
            if now.signed_duration_since(last).num_seconds() < i64::from(p.post_min_interval_sec) {
                return Err(community_abuse_reject(
                    pool,
                    user_id,
                    "post_too_fast",
                    "body",
                    json!({ "kind": "post" }),
                )
                .await);
            }
        }
    }
    if p.post_duplicate_lookback_sec > 0 && !body_trim.is_empty() {
        let dup_since = now - Duration::seconds(i64::from(p.post_duplicate_lookback_sec));
        match db::duplicate_post_body_exists(pool, user_id, body_trim, dup_since).await {
            Ok(true) => {
                return Err(community_abuse_reject(
                    pool,
                    user_id,
                    "post_duplicate_body",
                    "body",
                    json!({ "kind": "post" }),
                )
                .await);
            }
            Ok(false) => {}
            Err(_) => {
                return Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response());
            }
        }
    }
    Ok(())
}

/// 160 §3.3：举报窗频 / 最短间隔 / 同目标重复举报（`community_abuse_policy`）。
async fn enforce_community_report_abuse(
    pool: &PgPool,
    reporter_id: Uuid,
    target_type: &str,
    target_id: Uuid,
) -> Result<(), Response> {
    let p = db::get_community_abuse_policy(pool).await;
    let now = Utc::now();
    let window_start = now - Duration::seconds(i64::from(p.report_rate_window_sec.max(60)));
    let n = match db::count_user_community_reports_since(pool, reporter_id, window_start).await {
        Ok(c) => c,
        Err(_) => {
            return Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response());
        }
    };
    if n >= i64::from(p.report_max_per_window) {
        return Err(community_abuse_reject(
            pool,
            reporter_id,
            "report_rate_limited",
            "body",
            json!({
                "target_type": target_type,
                "target_id": target_id.to_string(),
                "kind": "report",
            }),
        )
        .await);
    }
    if p.report_min_interval_sec > 0 {
        if let Ok(Some(last)) = db::latest_user_community_report_created_at(pool, reporter_id).await
        {
            if now.signed_duration_since(last).num_seconds() < i64::from(p.report_min_interval_sec)
            {
                return Err(community_abuse_reject(
                    pool,
                    reporter_id,
                    "report_too_fast",
                    "body",
                    json!({
                        "target_type": target_type,
                        "target_id": target_id.to_string(),
                        "kind": "report",
                    }),
                )
                .await);
            }
        }
    }
    if p.report_duplicate_target_lookback_sec > 0 {
        let dup_since = now - Duration::seconds(i64::from(p.report_duplicate_target_lookback_sec));
        match db::duplicate_community_report_on_target_exists(
            pool,
            reporter_id,
            target_type,
            target_id,
            dup_since,
        )
        .await
        {
            Ok(true) => {
                return Err(community_abuse_reject(
                    pool,
                    reporter_id,
                    "report_duplicate_target",
                    "body",
                    json!({
                        "target_type": target_type,
                        "target_id": target_id.to_string(),
                        "kind": "report",
                    }),
                )
                .await);
            }
            Ok(false) => {}
            Err(_) => {
                return Err(Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response());
            }
        }
    }
    Ok(())
}

/// `(raw_nickname, avatar, role, is_escrow_guide, default_wallet_address)` — 昵称可能为空，发帖时再 fallback short8。
type AuthorEnrich = (String, Option<String>, String, bool, Option<String>);

fn json_profiles_to_author_map(profiles: Vec<serde_json::Value>) -> HashMap<Uuid, AuthorEnrich> {
    profiles
        .into_iter()
        .filter_map(|v| {
            let id_str = v.get("id")?.as_str()?;
            let uid = Uuid::parse_str(id_str).ok()?;
            let nick = v
                .get("nickname")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            let av = v
                .get("avatar_url")
                .and_then(|x| x.as_str())
                .map(str::to_string);
            let role = v
                .get("role")
                .and_then(|x| x.as_str())
                .unwrap_or("tourist")
                .to_string();
            let is_escrow = v
                .get("is_escrow_guide")
                .and_then(|x| x.as_bool())
                .unwrap_or(false);
            let wallet = v
                .get("default_wallet_address")
                .and_then(|x| x.as_str())
                .filter(|s| !s.is_empty())
                .map(str::to_string);
            Some((uid, (nick, av, role, is_escrow, wallet)))
        })
        .collect()
}

async fn posts_json_with_engagement_counts(
    pool: &PgPool,
    posts: Vec<db::PostRow>,
    viewer_id: Option<Uuid>,
) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let (likes_r, comments_r, collects_r) = tokio::join!(
        db::count_likes_for_posts(pool, &ids),
        db::count_comments_for_posts(pool, &ids),
        db::count_collects_for_posts(pool, &ids),
    );
    let likes = likes_r?;
    let comments = comments_r?;
    let collects = collects_r?;
    let lm: HashMap<Uuid, i64> = likes.into_iter().collect();
    let cm: HashMap<Uuid, i64> = comments.into_iter().collect();
    let colm: HashMap<Uuid, i64> = collects.into_iter().collect();
    let (liked_set, collected_set): (HashSet<Uuid>, HashSet<Uuid>) = match viewer_id {
        Some(uid) if !ids.is_empty() => {
            let (lr, cr) = tokio::join!(
                db::user_liked_posts_in_set(pool, uid, &ids),
                db::user_collected_posts_in_set(pool, uid, &ids),
            );
            (lr.unwrap_or_default(), cr.unwrap_or_default())
        }
        _ => (HashSet::new(), HashSet::new()),
    };

    let mut seen_authors = HashSet::new();
    let mut author_ids: Vec<Uuid> = Vec::new();
    for p in &posts {
        if seen_authors.insert(p.user_id) {
            author_ids.push(p.user_id);
        }
    }
    let author_profiles: HashMap<Uuid, AuthorEnrich> =
        match user_ids_to_json_profiles(pool, author_ids.clone()).await {
            Ok(profiles) => json_profiles_to_author_map(profiles),
            Err(_) => HashMap::new(),
        };

    let followed_authors: HashSet<Uuid> = match viewer_id {
        Some(vid) if !author_ids.is_empty() => {
            db::followed_following_ids_in_set(pool, vid, &author_ids)
                .await
                .unwrap_or_default()
        }
        _ => HashSet::new(),
    };

    Ok(posts
        .into_iter()
        .map(|p| {
            let lc = *lm.get(&p.id).unwrap_or(&0);
            let cc = *cm.get(&p.id).unwrap_or(&0);
            let coll = *colm.get(&p.id).unwrap_or(&0);
            let short8 = p.user_id.to_string().chars().take(8).collect::<String>();
            let (
                author_nickname,
                author_avatar_url,
                author_role,
                author_is_escrow_guide,
                author_wallet,
            ) = author_profiles
                .get(&p.user_id)
                .map(|(n, a, role, esc, w)| {
                    let nn = if n.trim().is_empty() {
                        short8.clone()
                    } else {
                        n.clone()
                    };
                    (nn, a.clone(), role.clone(), *esc, w.clone())
                })
                .unwrap_or((short8, None, "tourist".to_string(), false, None));
            let mut row = json!({
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
                "like_count": lc,
                "comment_count": cc,
                "collect_count": coll,
                "author_nickname": author_nickname,
                "author_avatar_url": author_avatar_url,
                "author_role": author_role,
                "author_is_escrow_guide": author_is_escrow_guide,
                "author_default_wallet": author_wallet,
            });
            if viewer_id.is_some() {
                row["liked_by_me"] = json!(liked_set.contains(&p.id));
                row["collected_by_me"] = json!(collected_set.contains(&p.id));
            }
            if let (Some(vid), Some(obj)) = (viewer_id, row.as_object_mut()) {
                if vid != p.user_id {
                    obj.insert(
                        "author_followed_by_me".to_string(),
                        json!(followed_authors.contains(&p.user_id)),
                    );
                }
            }
            row
        })
        .collect())
}

async fn user_ids_to_json_profiles(
    pool: &PgPool,
    ids: Vec<Uuid>,
) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    if ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = db::users_public_by_ids(pool, &ids).await?;
    let hm: HashMap<Uuid, (Option<String>, Option<String>, String, bool, Option<String>)> = rows
        .into_iter()
        .map(|(id, n, a, role, esc, w)| (id, (n, a, role, esc, w)))
        .collect();
    Ok(ids
        .into_iter()
        .map(|id| {
            let short8 = id.to_string().chars().take(8).collect::<String>();
            let (nick, av, role, is_escrow_guide, wallet) =
                hm.get(&id)
                    .cloned()
                    .unwrap_or((None, None, "tourist".to_string(), false, None));
            let nickname = nick
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(String::from)
                .unwrap_or(short8);
            json!({
                "id": id.to_string(),
                "nickname": nickname,
                "avatar_url": av,
                "role": role,
                "is_escrow_guide": is_escrow_guide,
                "default_wallet_address": wallet,
            })
        })
        .collect())
}

fn display_nickname_for_user(id: Uuid, nick: Option<&str>) -> String {
    nick.map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| id.to_string().chars().take(8).collect())
}

fn placeholder_ok(items_key: &str, empty: serde_json::Value) -> axum::response::Response {
    Json(json!({
        "status": "ok",
        items_key: empty,
        "note": "50-O-31 占位；无 DB 或未鉴权"
    }))
    .into_response()
}

// ---------- 帖子与 Feed（51-31-9 / 51-31-B1；51-31-B2 推荐流/关注流）----------
#[derive(serde::Deserialize)]
struct FeedQuery {
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

async fn create_post(
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

async fn get_feed(
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
async fn get_me_posts(
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
async fn get_user_posts(
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

async fn get_post_detail(
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
async fn delete_post(
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
async fn patch_post(
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
struct TagPostStatsQuery {
    tag: Option<String>,
}

/// GET /api/v1/community/stats/posts-by-tag?tag= — 公开帖子数（与 Feed `tag` 精确匹配）
async fn get_public_posts_by_tag_count(
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
async fn post_like(
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

async fn delete_like(
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
struct CommentsQuery {
    /// `chronological`（默认）| `latest` | `hot`（31 §2.2）
    sort: Option<String>,
}

fn normalize_comment_sort(sort: Option<&str>) -> &'static str {
    match sort.map(str::trim) {
        Some(s) if s.eq_ignore_ascii_case("latest") => "latest",
        Some(s) if s.eq_ignore_ascii_case("hot") => "hot",
        _ => "chronological",
    }
}

/// 一级评论按 `sort` 排序，二级回复仍按时间升序跟在对应根评论后；其余孤儿行按时间升序附尾。
fn order_comments_thread(rows: Vec<db::CommentRow>, sort: &str) -> Vec<db::CommentRow> {
    let n = rows.len();
    if n == 0 {
        return rows;
    }
    let mut row_map: HashMap<Uuid, db::CommentRow> = rows.into_iter().map(|r| (r.id, r)).collect();
    let mut root_ids: Vec<Uuid> = row_map
        .values()
        .filter(|r| r.parent_id.is_none())
        .map(|r| r.id)
        .collect();

    match sort {
        "latest" => {
            root_ids.sort_by(|a, b| row_map[b].created_at.cmp(&row_map[a].created_at));
        }
        "hot" => {
            root_ids.sort_by(|a, b| {
                let ca = row_map.values().filter(|c| c.parent_id == Some(*a)).count();
                let cb = row_map.values().filter(|c| c.parent_id == Some(*b)).count();
                cb.cmp(&ca)
                    .then_with(|| row_map[b].created_at.cmp(&row_map[a].created_at))
            });
        }
        _ => {
            root_ids.sort_by_key(|id| row_map[id].created_at);
        }
    }

    let mut out = Vec::with_capacity(n);
    for rid in root_ids {
        let Some(root) = row_map.remove(&rid) else {
            continue;
        };
        out.push(root);
        let mut child_ids: Vec<Uuid> = row_map
            .iter()
            .filter(|(_, c)| c.parent_id == Some(rid))
            .map(|(i, _)| *i)
            .collect();
        child_ids.sort_by_key(|id| row_map[id].created_at);
        for cid in child_ids {
            if let Some(c) = row_map.remove(&cid) {
                out.push(c);
            }
        }
    }
    let mut rest: Vec<db::CommentRow> = row_map.into_values().collect();
    rest.sort_by_key(|c| c.created_at);
    out.extend(rest);
    out
}

fn comment_body_visible_to_viewer(
    visibility_status: &str,
    comment_author: Uuid,
    viewer: Option<Uuid>,
    viewer_is_privileged: bool,
) -> bool {
    if visibility_status == "visible" {
        return true;
    }
    if viewer_is_privileged {
        return true;
    }
    viewer == Some(comment_author)
}

// GET/POST /api/v1/community/posts/:id/comments
async fn get_comments(
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

async fn post_comment(
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

// GET /api/v1/community/conversations
async fn get_conversations(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(rows) = db::list_conversations_enriched_for_user(pool, uid, LIST_LIMIT).await {
            let mut seen_peers = HashSet::new();
            let mut peer_ids: Vec<Uuid> = Vec::new();
            for r in &rows {
                let peer = if r.user1_id == uid {
                    r.user2_id
                } else {
                    r.user1_id
                };
                if seen_peers.insert(peer) {
                    peer_ids.push(peer);
                }
            }
            let peer_profiles: HashMap<Uuid, AuthorEnrich> =
                match user_ids_to_json_profiles(pool, peer_ids).await {
                    Ok(profiles) => json_profiles_to_author_map(profiles),
                    Err(_) => HashMap::new(),
                };
            let list: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    let peer_id = if r.user1_id == uid {
                        r.user2_id
                    } else {
                        r.user1_id
                    };
                    let short8 = peer_id.to_string().chars().take(8).collect::<String>();
                    let (
                        peer_nickname,
                        peer_avatar_url,
                        peer_role,
                        peer_is_escrow_guide,
                        peer_wallet,
                    ) = peer_profiles
                        .get(&peer_id)
                        .map(|(n, a, role, esc, w)| {
                            let nn = if n.trim().is_empty() {
                                short8.clone()
                            } else {
                                n.clone()
                            };
                            (nn, a.clone(), role.clone(), *esc, w.clone())
                        })
                        .unwrap_or((short8, None, "tourist".to_string(), false, None));
                    json!({
                        "id": r.id.to_string(),
                        "user1_id": r.user1_id.to_string(),
                        "user2_id": r.user2_id.to_string(),
                        "created_at": r.created_at.to_rfc3339(),
                        "last_message": r.last_message_body.unwrap_or_default(),
                        "last_message_at": r.last_message_at.map(|t| t.to_rfc3339()),
                        "last_sender_id": r.last_sender_id.map(|u| u.to_string()),
                        "unread_count": r.unread_count,
                        "peer_id": peer_id.to_string(),
                        "peer_nickname": peer_nickname,
                        "peer_avatar_url": peer_avatar_url,
                        "peer_role": peer_role,
                        "peer_is_escrow_guide": peer_is_escrow_guide,
                        "peer_default_wallet": peer_wallet,
                    })
                })
                .collect();
            return Json(json!({ "status": "ok", "conversations": list })).into_response();
        }
    }
    placeholder_ok("conversations", json!([]))
}

async fn get_conversation_messages(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = extract_user_with_session_check(&state, &headers).await;
    if let Some(pool) = pool {
        if let Ok(conv_id) = Uuid::parse_str(&id) {
            if let Ok(rows) = db::list_dm_messages(pool, conv_id, LIST_LIMIT).await {
                if let Some(u) = uid {
                    if let Ok(Some(conv)) = db::get_conversation_by_id(pool, conv_id).await {
                        if conv.user1_id == u || conv.user2_id == u {
                            let _ = db::upsert_dm_read_state_now(pool, u, conv_id).await;
                        }
                    }
                }
                let list: Vec<_> = rows
                    .into_iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "conversation_id": r.conversation_id.to_string(),
                            "sender_id": r.sender_id.to_string(),
                            "body": r.body,
                            "created_at": r.created_at.to_rfc3339(),
                        })
                    })
                    .collect();
                return Json(json!({ "status": "ok", "messages": list })).into_response();
            }
        }
    }
    placeholder_ok("messages", json!([]))
}

async fn post_conversation_message(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let msg_raw = j.get("body").and_then(|v| v.as_str()).unwrap_or("");
    let msg_body = msg_raw.trim();
    let sender_id = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "ok", "id": null, "note": "50-O-31 占位"})).into_response();
    };
    if msg_body.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "empty_body",
            "message": "empty_body",
            "errors": { "body": "empty_body" }
        }))
        .into_response();
    }
    let Ok(conv_id) = Uuid::parse_str(&id) else {
        return Json(json!({"status": "error", "error": "invalid_conversation", "message": "invalid_conversation"})).into_response();
    };
    let Ok(Some(conv)) = db::get_conversation_by_id(pool, conv_id).await else {
        return Json(json!({"status": "error", "error": "not_found", "message": "not_found"}))
            .into_response();
    };
    let in_conv = conv.user1_id == sender_id || conv.user2_id == sender_id;
    if !in_conv {
        return Json(json!({"status": "error", "error": "forbidden", "message": "forbidden"}))
            .into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, sender_id, "body").await {
        return resp;
    }
    match db::insert_dm_message(pool, conv_id, sender_id, msg_body).await {
        Ok(msg_id) => Json(json!({ "status": "ok", "id": msg_id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "send_failed",
            "message": "send_failed",
            "errors": { "body": "send_failed" }
        }))
        .into_response(),
    }
}

// POST/DELETE /api/v1/community/users/:id/follow
async fn post_follow(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let follower_id = match extract_user_with_session_check(&state, &headers).await {
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
    let Ok(following_id) = Uuid::parse_str(&id) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_user_id",
            "message": "invalid_user_id",
            "errors": { "user_id": "invalid_user_id" }
        }))
        .into_response();
    };
    if follower_id == following_id {
        return Json(json!({
            "status": "error",
            "error": "cannot_follow_self",
            "message": "cannot_follow_self",
            "errors": { "user_id": "cannot_follow_self" }
        }))
        .into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, follower_id, "user_id").await {
        return resp;
    }
    match db::insert_follow(pool, follower_id, following_id).await {
        Ok(()) => Json(json!({"status": "ok"})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "follow_create_failed",
            "message": "follow_create_failed",
            "errors": { "user_id": "follow_create_failed" }
        }))
        .into_response(),
    }
}

async fn delete_follow(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(follower_id)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(following_id) = Uuid::parse_str(&id) {
            let _ = db::delete_follow(pool, follower_id, following_id).await;
        }
    }
    Json(json!({"status": "ok"})).into_response()
}

async fn get_me_following(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(ids) = db::list_following(pool, uid, LIST_LIMIT).await {
            let list = match user_ids_to_json_profiles(pool, ids).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("following", json!([])),
            };
            return Json(json!({ "status": "ok", "following": list })).into_response();
        }
    }
    placeholder_ok("following", json!([]))
}

async fn get_me_followers(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(ids) = db::list_followers(pool, uid, LIST_LIMIT).await {
            let list = match user_ids_to_json_profiles(pool, ids).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("followers", json!([])),
            };
            return Json(json!({ "status": "ok", "followers": list })).into_response();
        }
    }
    placeholder_ok("followers", json!([]))
}

async fn post_friends_request(
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
    let to_str = j
        .get("to_user_id")
        .or_else(|| j.get("user_id"))
        .and_then(|v| v.as_str());
    let Some(to_str) = to_str else {
        return Json(json!({
            "status": "error",
            "error": "to_user_id_required",
            "message": "to_user_id_required",
            "errors": { "to_user_id": "to_user_id_required" }
        }))
        .into_response();
    };
    let Ok(to_id) = Uuid::parse_str(to_str) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_to_user_id",
            "message": "invalid_to_user_id",
            "errors": { "to_user_id": "invalid_to_user_id" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "to_user_id").await {
        return resp;
    }
    match db::insert_friend_request(pool, uid, to_id).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => Json(json!({"status": "ok", "note": "duplicate or self"})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "friend_request_create_failed",
            "message": "friend_request_create_failed",
            "errors": { "to_user_id": "friend_request_create_failed" }
        }))
        .into_response(),
    }
}

async fn post_friends_accept(
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
    let rid = j.get("request_id").and_then(|v| v.as_str());
    let Some(rid) = rid else {
        return Json(json!({
            "status": "error",
            "error": "request_id_required",
            "message": "request_id_required",
            "errors": { "request_id": "request_id_required" }
        }))
        .into_response();
    };
    let Ok(req_id) = Uuid::parse_str(rid) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_request_id",
            "message": "invalid_request_id",
            "errors": { "request_id": "invalid_request_id" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "request_id").await {
        return resp;
    }
    match db::accept_friend_request(pool, req_id, uid).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => Json(json!({
            "status": "error",
            "error": "friend_request_not_found_or_forbidden",
            "message": "friend_request_not_found_or_forbidden",
            "errors": { "request_id": "friend_request_not_found_or_forbidden" }
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "friend_request_accept_failed",
            "message": "friend_request_accept_failed",
            "errors": { "request_id": "friend_request_accept_failed" }
        }))
        .into_response(),
    }
}

async fn post_friends_reject(
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
    let rid = j.get("request_id").and_then(|v| v.as_str());
    let Some(rid) = rid else {
        return Json(json!({
            "status": "error",
            "error": "request_id_required",
            "message": "request_id_required",
            "errors": { "request_id": "request_id_required" }
        }))
        .into_response();
    };
    let Ok(req_id) = Uuid::parse_str(rid) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_request_id",
            "message": "invalid_request_id",
            "errors": { "request_id": "invalid_request_id" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "request_id").await {
        return resp;
    }
    match db::reject_friend_request(pool, req_id, uid).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => Json(json!({
            "status": "error",
            "error": "friend_request_not_found_or_forbidden",
            "message": "friend_request_not_found_or_forbidden",
            "errors": { "request_id": "friend_request_not_found_or_forbidden" }
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "friend_request_reject_failed",
            "message": "friend_request_reject_failed",
            "errors": { "request_id": "friend_request_reject_failed" }
        }))
        .into_response(),
    }
}

async fn get_friends_list(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(ids) = db::list_friend_ids(pool, uid, LIST_LIMIT).await {
            let list = match user_ids_to_json_profiles(pool, ids).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("friends", json!([])),
            };
            return Json(json!({ "status": "ok", "friends": list })).into_response();
        }
    }
    placeholder_ok("friends", json!([]))
}

async fn get_friends_requests(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(rows) = db::list_friend_requests_to_user(pool, uid, "pending", LIST_LIMIT).await {
            let mut uids: Vec<Uuid> = rows.iter().map(|r| r.from_user_id).collect();
            uids.sort_unstable();
            uids.dedup();
            let hm: HashMap<Uuid, (Option<String>, Option<String>, String, bool, Option<String>)> =
                match db::users_public_by_ids(pool, &uids).await {
                    Ok(p) => p
                        .into_iter()
                        .map(|(id, n, a, role, esc, w)| (id, (n, a, role, esc, w)))
                        .collect(),
                    Err(_) => HashMap::new(),
                };
            let list: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    let (nick, av, from_role, from_is_escrow_guide, from_wallet) = hm
                        .get(&r.from_user_id)
                        .cloned()
                        .unwrap_or((None, None, "tourist".to_string(), false, None));
                    let from_nickname = display_nickname_for_user(r.from_user_id, nick.as_deref());
                    json!({
                        "id": r.id.to_string(),
                        "from_user_id": r.from_user_id.to_string(),
                        "to_user_id": r.to_user_id.to_string(),
                        "status": r.status,
                        "created_at": r.created_at.to_rfc3339(),
                        "from_nickname": from_nickname,
                        "from_avatar_url": av,
                        "from_role": from_role,
                        "from_is_escrow_guide": from_is_escrow_guide,
                        "from_default_wallet": from_wallet,
                    })
                })
                .collect();
            return Json(json!({ "status": "ok", "requests": list })).into_response();
        }
    }
    placeholder_ok("requests", json!([]))
}

async fn get_friends_requests_sent(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(rows) = db::list_friend_requests_from_user(pool, uid, "pending", LIST_LIMIT).await
        {
            let mut uids: Vec<Uuid> = rows.iter().map(|r| r.to_user_id).collect();
            uids.sort_unstable();
            uids.dedup();
            let hm: HashMap<Uuid, (Option<String>, Option<String>, String, bool, Option<String>)> =
                match db::users_public_by_ids(pool, &uids).await {
                    Ok(p) => p
                        .into_iter()
                        .map(|(id, n, a, role, esc, w)| (id, (n, a, role, esc, w)))
                        .collect(),
                    Err(_) => HashMap::new(),
                };
            let list: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    let (nick, av, to_role, to_is_escrow_guide, to_wallet) = hm
                        .get(&r.to_user_id)
                        .cloned()
                        .unwrap_or((None, None, "tourist".to_string(), false, None));
                    let to_nickname = display_nickname_for_user(r.to_user_id, nick.as_deref());
                    json!({
                        "id": r.id.to_string(),
                        "from_user_id": r.from_user_id.to_string(),
                        "to_user_id": r.to_user_id.to_string(),
                        "status": r.status,
                        "created_at": r.created_at.to_rfc3339(),
                        "to_nickname": to_nickname,
                        "to_avatar_url": av,
                        "to_role": to_role,
                        "to_is_escrow_guide": to_is_escrow_guide,
                        "to_default_wallet": to_wallet,
                    })
                })
                .collect();
            return Json(json!({ "status": "ok", "requests": list })).into_response();
        }
    }
    placeholder_ok("requests", json!([]))
}

async fn get_me_likes_received(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(n) = db::count_likes_received_for_user(pool, uid).await {
            return Json(json!({ "status": "ok", "likes_received": n })).into_response();
        }
    }
    Json(json!({ "status": "ok", "likes_received": 0 })).into_response()
}

// POST/DELETE /api/v1/community/posts/:id/collect
async fn post_collect(
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
    match db::insert_collect(pool, uid, post_id).await {
        Ok(()) => Json(json!({"status": "ok"})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "collect_create_failed",
            "message": "collect_create_failed",
            "errors": { "post_id": "collect_create_failed" }
        }))
        .into_response(),
    }
}

async fn delete_collect(
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
            let _ = db::delete_collect(pool, uid, post_id).await;
        }
    }
    Json(json!({"status": "ok"})).into_response()
}

async fn get_me_collects(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(post_ids) = db::list_collects_post_ids(pool, uid, LIST_LIMIT).await {
            let list: Vec<_> = post_ids
                .into_iter()
                .map(|id| json!({ "post_id": id.to_string() }))
                .collect();
            return Json(json!({ "status": "ok", "collects": list })).into_response();
        }
    }
    placeholder_ok("collects", json!([]))
}

// ---------- 反馈/建议（55-S10 / 54-S19）----------
const FEEDBACK_MEDIA_MAX: usize = 4;
const FEEDBACK_MEDIA_ITEM_MAX_BYTES: usize = 950_000;

/// 可选 `media_urls`：最多 4 条；每条须为 `http(s)://` 或 `data:image/`、`data:video/`；单条 UTF-8 字节长度上限防滥用。
fn parse_feedback_media_urls(v: Option<&serde_json::Value>) -> Result<Vec<String>, &'static str> {
    let Some(val) = v else {
        return Ok(Vec::new());
    };
    if val.is_null() {
        return Ok(Vec::new());
    }
    let Some(arr) = val.as_array() else {
        return Err("feedback_media_invalid");
    };
    if arr.len() > FEEDBACK_MEDIA_MAX {
        return Err("feedback_media_too_many");
    }
    let mut out = Vec::new();
    for el in arr {
        let s = el.as_str().ok_or("feedback_media_invalid")?.trim();
        if s.is_empty() {
            continue;
        }
        if s.len() > FEEDBACK_MEDIA_ITEM_MAX_BYTES {
            return Err("feedback_media_too_large");
        }
        let ok = s.starts_with("https://")
            || s.starts_with("http://")
            || s.starts_with("data:image/")
            || s.starts_with("data:video/");
        if !ok {
            return Err("feedback_media_scheme");
        }
        out.push(s.to_string());
    }
    Ok(out)
}

async fn get_feedback(State(state): State<ApiMetaState>, headers: HeaderMap) -> impl IntoResponse {
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
    match db::list_feedback_by_user(pool, uid, LIST_LIMIT).await {
        Ok(rows) => {
            let items: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    json!({
                        "id": r.id.to_string(),
                        "category": r.category,
                        "content": r.content,
                        "status": r.status,
                        "official_reply": r.official_reply,
                        "media_urls": r.media_urls,
                        "created_at": r.created_at.to_rfc3339(),
                        "updated_at": r.updated_at.to_rfc3339()
                    })
                })
                .collect();
            Json(json!({ "status": "ok", "items": items })).into_response()
        }
        Err(_) => {
            Json(json!({"status": "error", "error": "list_failed", "message": "list_failed"}))
                .into_response()
        }
    }
}

fn community_report_target_type_ok(s: &str) -> bool {
    matches!(s, "post" | "user" | "comment" | "message" | "other")
}

fn community_report_reason_ok(s: &str) -> bool {
    matches!(
        s,
        "spam" | "harassment" | "scam" | "illegal" | "hate" | "other"
    )
}

async fn post_community_report(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let target_type = j
        .get("target_type")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    let reason_code = j
        .get("reason_code")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    let target_id_str = j
        .get("target_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    if target_type.is_empty() || reason_code.is_empty() || target_id_str.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "report_fields_required",
            "message": "report_fields_required",
            "errors": { "body": "report_fields_required" }
        }))
        .into_response();
    }
    if !community_report_target_type_ok(target_type) {
        return Json(json!({
            "status": "error",
            "error": "invalid_target_type",
            "message": "invalid_target_type",
            "errors": { "target_type": "invalid_target_type" }
        }))
        .into_response();
    }
    if !community_report_reason_ok(reason_code) {
        return Json(json!({
            "status": "error",
            "error": "invalid_reason_code",
            "message": "invalid_reason_code",
            "errors": { "reason_code": "invalid_reason_code" }
        }))
        .into_response();
    }
    let Ok(target_id) = Uuid::parse_str(target_id_str) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_target_id",
            "message": "invalid_target_id",
            "errors": { "target_id": "invalid_target_id" }
        }))
        .into_response();
    };
    let details = j
        .get("details")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let evidence_ref = j
        .get("evidence_ref")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::community_report_target_exists(pool, target_type, target_id).await {
        Ok(true) => {}
        Ok(false) => {
            return Json(json!({
                "status": "error",
                "error": "report_target_not_found",
                "message": "report_target_not_found",
                "errors": { "target_id": "report_target_not_found" }
            }))
            .into_response();
        }
        Err(_) => {
            return Json(json!({
                "status": "error",
                "error": "report_target_lookup_failed",
                "message": "report_target_lookup_failed",
                "errors": { "target_id": "report_target_lookup_failed" }
            }))
            .into_response();
        }
    }
    if let Err(resp) = enforce_community_report_abuse(pool, uid, target_type, target_id).await {
        return resp;
    }
    match db::insert_community_report(
        pool,
        uid,
        target_type,
        target_id,
        reason_code,
        details,
        evidence_ref,
    )
    .await
    {
        Ok(id) => Json(json!({ "status": "ok", "id": id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "report_create_failed",
            "message": "report_create_failed",
            "errors": { "body": "report_create_failed" }
        }))
        .into_response(),
    }
}

async fn get_community_report_detail(
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
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(rid) = Uuid::parse_str(id.trim()) else {
        return Json(json!({"status": "error", "error": "invalid_report_id", "message": "invalid_report_id"})).into_response();
    };
    let row = match db::get_community_report_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "report_load_failed", "message": "report_load_failed"})).into_response();
        }
    };
    let Some(r) = row else {
        return Json(
            json!({"status": "error", "error": "report_not_found", "message": "report_not_found"}),
        )
        .into_response();
    };
    if r.reporter_id != uid {
        return Json(json!({"status": "error", "error": "forbidden", "message": "forbidden"}))
            .into_response();
    }
    Json(json!({
        "status": "ok",
        "report": {
            "id": r.id.to_string(),
            "target_type": r.target_type,
            "target_id": r.target_id.to_string(),
            "reason_code": r.reason_code,
            "details": r.details,
            "evidence_ref": r.evidence_ref,
            "status": r.status,
            "created_at": r.created_at.to_rfc3339(),
            "updated_at": r.updated_at.to_rfc3339(),
        }
    }))
    .into_response()
}

#[derive(serde::Deserialize, Default)]
struct MeReportsQuery {
    limit: Option<i64>,
}

async fn get_me_community_reports(
    Query(q): Query<MeReportsQuery>,
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
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let mut lim = q.limit.unwrap_or(30);
    if lim < 1 {
        lim = 1;
    } else if lim > 100 {
        lim = 100;
    }
    let rows = match db::list_community_reports_for_reporter(pool, uid, lim).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "report_list_failed", "message": "report_list_failed"})).into_response();
        }
    };
    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "target_type": r.target_type,
                "target_id": r.target_id.to_string(),
                "reason_code": r.reason_code,
                "details": r.details,
                "evidence_ref": r.evidence_ref,
                "status": r.status,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    Json(json!({ "status": "ok", "items": items })).into_response()
}

async fn post_community_report_appeal(
    Path(report_id_raw): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<Json<serde_json::Value>>,
) -> impl IntoResponse {
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Ok(rid) = Uuid::parse_str(report_id_raw.trim()) else {
        return Json(json!({"status": "error", "error": "invalid_report_id", "message": "invalid_report_id"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let appeal_body = j.get("body").and_then(|v| v.as_str()).unwrap_or("").trim();
    if appeal_body.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "appeal_body_required",
            "message": "appeal_body_required",
            "errors": { "body": "appeal_body_required" }
        }))
        .into_response();
    }
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let row = match db::get_community_report_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "report_load_failed", "message": "report_load_failed"})).into_response();
        }
    };
    let Some(report) = row else {
        return Json(
            json!({"status": "error", "error": "report_not_found", "message": "report_not_found"}),
        )
        .into_response();
    };
    if !db::community_report_status_allows_user_appeal(&report.status) {
        return Json(json!({
            "status": "error",
            "error": "report_not_appealable",
            "message": "report_not_appealable",
            "errors": { "report_id": "report_not_appealable" }
        }))
        .into_response();
    }
    let may = match db::community_user_may_file_appeal(pool, &report, uid).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "appeal_permission_check_failed", "message": "appeal_permission_check_failed"}))
                .into_response();
        }
    };
    if !may {
        return Json(json!({"status": "error", "error": "forbidden", "message": "forbidden"}))
            .into_response();
    }
    let pending = match db::count_pending_appeals_for_report(pool, rid).await {
        Ok(n) => n,
        Err(_) => {
            return Json(json!({"status": "error", "error": "appeal_count_failed", "message": "appeal_count_failed"})).into_response();
        }
    };
    if pending > 0 {
        return Json(json!({
            "status": "error",
            "error": "appeal_pending_exists",
            "message": "appeal_pending_exists",
            "errors": { "report_id": "appeal_pending_exists" }
        }))
        .into_response();
    }
    match db::insert_community_report_appeal(pool, rid, uid, appeal_body).await {
        Ok(aid) => Json(json!({
            "status": "ok",
            "id": aid.to_string(),
            "report_id": rid.to_string(),
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "appeal_create_failed",
            "message": "appeal_create_failed",
            "errors": { "body": "appeal_create_failed" }
        }))
        .into_response(),
    }
}

async fn post_feedback(
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
    let category = j
        .get("category")
        .and_then(|v| v.as_str())
        .unwrap_or("other")
        .to_string();
    let content = j
        .get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let content_trim = content.trim();
    if content_trim.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "content_required",
            "message": "content_required",
            "errors": { "content": "content_required" }
        }))
        .into_response();
    }
    let media_urls = match parse_feedback_media_urls(j.get("media_urls")) {
        Ok(v) => v,
        Err(code) => {
            return Json(json!({
                "status": "error",
                "error": code,
                "message": code,
                "errors": { "media_urls": code }
            }))
            .into_response();
        }
    };
    match db::insert_feedback(pool, uid, &category, content_trim, &media_urls).await {
        Ok(id) => Json(json!({ "status": "ok", "id": id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "feedback_create_failed",
            "message": "feedback_create_failed",
            "errors": { "content": "feedback_create_failed" }
        }))
        .into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/community/feed", get(get_feed))
        .route(
            "/api/v1/community/stats/posts-by-tag",
            get(get_public_posts_by_tag_count),
        )
        .route("/api/v1/community/posts", post(create_post))
        .route(
            "/api/v1/community/posts/:id",
            get(get_post_detail).delete(delete_post).patch(patch_post),
        )
        .route(
            "/api/v1/community/posts/:id/like",
            post(post_like).delete(delete_like),
        )
        .route(
            "/api/v1/community/posts/:id/comments",
            get(get_comments).post(post_comment),
        )
        .route("/api/v1/community/conversations", get(get_conversations))
        .route(
            "/api/v1/community/conversations/:id/messages",
            get(get_conversation_messages).post(post_conversation_message),
        )
        .route(
            "/api/v1/community/users/:user_id/posts",
            get(get_user_posts),
        )
        .route(
            "/api/v1/community/users/:id/follow",
            post(post_follow).delete(delete_follow),
        )
        .route("/api/v1/community/me/following", get(get_me_following))
        .route("/api/v1/community/me/followers", get(get_me_followers))
        .route(
            "/api/v1/community/me/likes-received",
            get(get_me_likes_received),
        )
        .route(
            "/api/v1/community/friends/request",
            post(post_friends_request),
        )
        .route(
            "/api/v1/community/friends/accept",
            post(post_friends_accept),
        )
        .route(
            "/api/v1/community/friends/reject",
            post(post_friends_reject),
        )
        .route("/api/v1/community/friends/list", get(get_friends_list))
        .route(
            "/api/v1/community/friends/requests/sent",
            get(get_friends_requests_sent),
        )
        .route(
            "/api/v1/community/friends/requests",
            get(get_friends_requests),
        )
        .route(
            "/api/v1/community/posts/:id/collect",
            post(post_collect).delete(delete_collect),
        )
        .route("/api/v1/community/me/collects", get(get_me_collects))
        .route("/api/v1/community/me/posts", get(get_me_posts))
        .route(
            "/api/v1/community/me/reports",
            get(get_me_community_reports),
        )
        .route(
            "/api/v1/community/feedback",
            get(get_feedback).post(post_feedback),
        )
        .route("/api/v1/community/reports", post(post_community_report))
        .route(
            "/api/v1/community/reports/:id/appeals",
            post(post_community_report_appeal),
        )
        .route(
            "/api/v1/community/reports/:id",
            get(get_community_report_detail),
        )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
    use axum::extract::Query;
    use axum::http::{header::AUTHORIZATION, HeaderMap, HeaderValue, StatusCode};
    use chrono::Utc;
    use http_body_util::BodyExt;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tokio::sync::RwLock;

    async fn body_json(resp: axum::response::Response) -> serde_json::Value {
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        serde_json::from_slice(&body).expect("json body")
    }

    fn build_state() -> ApiMetaState {
        ApiMetaState {
            strict_ssot: false,
            ssot_version: "test".to_string(),
            ssot_sha256_expected: None,
            ssot_sha256_computed: None,
            ssot_sha256_match: true,
            chargeback_policy: "warn".to_string(),
            finality_n: 12,
            indexer_state_path: "test".to_string(),
            indexer_checkpoint: ProjectorCheckpoint {
                block_number: 10,
                log_index: 1,
            },
            indexer_last_seen_finality_n: 12,
            indexer_replay_required: false,
            pause_mode: false,
            pause_api_allowlist: "".to_string(),
            degraded_mode: false,
            authority_source: "db_projection".to_string(),
            indexer_lag_blocks: 0,
            indexer_lag_max_blocks: 0,
            reorg_detected: false,
            evidence_timestamp_policy: "backend_signed".to_string(),
            evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
                last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
            })),
            evidence_time_state_path: "test".to_string(),
            evidence_receipt_hmac_key: None,
            reconcile_export_ed25519_key: None,
            chain_off: None,
            chain_config: None,
            resolution_outbox: None,
            indexer_state: None,
            guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[tokio::test]
    async fn post_community_report_appeal_requires_login() {
        let resp = post_community_report_appeal(
            Path(Uuid::new_v4().to_string()),
            State(build_state()),
            HeaderMap::new(),
            Some(Json(json!({ "body": "x" }))),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "error");
        assert_eq!(body["message"], "unauthorized");
    }

    #[tokio::test]
    async fn post_community_report_appeal_invalid_report_id() {
        let mut headers = HeaderMap::new();
        let uid = Uuid::new_v4();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer bearer_{}", uid)).expect("auth"),
        );
        let resp = post_community_report_appeal(
            Path("not-uuid".to_string()),
            State(build_state()),
            headers,
            Some(Json(json!({ "body": "reason" }))),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["message"], "invalid_report_id");
    }

    #[tokio::test]
    async fn get_public_posts_by_tag_count_no_db_ok() {
        let resp = get_public_posts_by_tag_count(
            State(build_state()),
            Query(TagPostStatsQuery {
                tag: Some("smoke".to_string()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "ok");
        assert_eq!(body["post_count"], 0);
    }

    #[tokio::test]
    async fn get_public_posts_by_tag_count_tag_required() {
        let resp = get_public_posts_by_tag_count(
            State(build_state()),
            Query(TagPostStatsQuery { tag: None }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "error");
        assert_eq!(body["message"], "tag_required");
    }

    #[tokio::test]
    async fn get_public_posts_by_tag_count_tag_too_long() {
        let long = "x".repeat(65);
        let resp = get_public_posts_by_tag_count(
            State(build_state()),
            Query(TagPostStatsQuery {
                tag: Some(long.clone()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = body_json(resp).await;
        assert_eq!(body["status"], "error");
        assert_eq!(body["message"], "tag_too_long");
    }
}
