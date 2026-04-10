use std::collections::{HashMap, HashSet};

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::{Duration, Utc};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db;

pub(super) const LIST_LIMIT: i64 = 100;
pub(super) const FEED_LIMIT: i64 = 20;

/// 160：`mute`/`ban`/`shadow_ban` 且未过期时拦截社区 UGC 写；DB 异常 fail-closed（与无 pool 区分：`service_unavailable`）。
pub(super) fn response_community_penalty_active(penalty_action: &str, errors_field: &str) -> Response {
    Json(json!({
        "status": "error",
        "error": "community_penalty_active",
        "message": "community_penalty_active",
        "penalty_action": penalty_action,
        "errors": { errors_field: "community_penalty_active" }
    }))
    .into_response()
}

pub(super) async fn enforce_no_active_write_penalty(
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
pub(super) fn response_community_abuse(message: &'static str, errors_field: &'static str) -> Response {
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
pub(super) async fn community_abuse_reject(
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

pub(super) async fn enforce_community_comment_abuse(
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

pub(super) async fn enforce_community_post_abuse(
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
pub(super) async fn enforce_community_report_abuse(
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
pub(super) type AuthorEnrich = (String, Option<String>, String, bool, Option<String>);
pub(super) fn json_profiles_to_author_map(profiles: Vec<serde_json::Value>) -> HashMap<Uuid, AuthorEnrich> {
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

pub(super) async fn posts_json_with_engagement_counts(
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

pub(super) async fn user_ids_to_json_profiles(
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

pub(super) fn display_nickname_for_user(id: Uuid, nick: Option<&str>) -> String {
    nick.map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| id.to_string().chars().take(8).collect())
}
pub(super) fn placeholder_ok(items_key: &str, empty: serde_json::Value) -> axum::response::Response {
    Json(json!({
        "status": "ok",
        items_key: empty,
        "note": "50-O-31 占位；无 DB 或未鉴权"
    }))
    .into_response()
}
pub(super) fn normalize_comment_sort(sort: Option<&str>) -> &'static str {
    match sort.map(str::trim) {
        Some(s) if s.eq_ignore_ascii_case("latest") => "latest",
        Some(s) if s.eq_ignore_ascii_case("hot") => "hot",
        _ => "chronological",
    }
}

/// 一级评论按 `sort` 排序，二级回复仍按时间升序跟在对应根评论后；其余孤儿行按时间升序附尾。
pub(super) fn order_comments_thread(rows: Vec<db::CommentRow>, sort: &str) -> Vec<db::CommentRow> {
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

pub(super) fn comment_body_visible_to_viewer(
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

