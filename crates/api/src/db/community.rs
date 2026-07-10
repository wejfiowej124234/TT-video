//! 50-O-31 / 51-31-9：社区扩展表读写（31 附录 §11、§7、04 对接）
//! 帖子、评论、关注、好友、收藏、点赞、私信；有 DB 时 routes/community 从此读写。

use std::collections::HashSet;

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

// ---------- 帖子（51-31-9 / 51-31-B1）----------
#[derive(Debug)]
pub struct PostRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub body: String,
    pub post_type: String,
    pub destination: Option<String>,
    pub tags: Vec<String>,
    pub media_urls: Vec<String>,
    /// 视频帖可选封面（HTTP(S) URL）；列表/卡片优先展示
    pub cover_url: Option<String>,
    /// S3 multipart 视频资产（`community_posts.primary_media_asset_id` · 04 A1）
    pub primary_media_asset_id: Option<Uuid>,
    /// `public` | `private` | `archived`（31 §2.3）
    pub visibility_status: String,
    pub created_at: DateTime<Utc>,
}

pub(crate) type PostSqlRow = (
    Uuid,
    Uuid,
    String,
    String,
    Option<String>,
    Vec<String>,
    Vec<String>,
    Option<String>,
    Option<Uuid>,
    String,
    DateTime<Utc>,
);

pub(crate) fn post_row_from_sql(row: &PostSqlRow) -> PostRow {
    PostRow {
        id: row.0,
        user_id: row.1,
        body: row.2.clone(),
        post_type: row.3.clone(),
        destination: row.4.clone(),
        tags: row.5.clone(),
        media_urls: row.6.clone(),
        cover_url: row.7.clone(),
        primary_media_asset_id: row.8,
        visibility_status: row.9.clone(),
        created_at: row.10,
    }
}

pub async fn insert_post(
    pool: &PgPool,
    user_id: Uuid,
    body: &str,
    post_type: &str,
    destination: Option<&str>,
    tags: &[String],
    media_urls: &[String],
    cover_url: Option<&str>,
    primary_media_asset_id: Option<Uuid>,
    data_origin: &str,
    commerce_showcase_kind: Option<&str>,
    commerce_market_listing_id: Option<Uuid>,
) -> Result<Uuid, sqlx::Error> {
    let display_status = super::governed_community_posts::display_status_for_new_post(data_origin);
    let display_origin = match data_origin {
        "production" => "REAL",
        "test" => "TEST",
        "demo" => "SHOWCASE",
        "official_seed" => "OFFICIAL",
        _ => "REAL",
    };
    let row = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO community_posts (
               user_id, body, post_type, destination, tags, media_urls, cover_url,
               primary_media_asset_id, data_origin, commerce_showcase_kind, commerce_market_listing_id,
               display_status, display_origin, display_source
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id"#,
    )
    .bind(user_id)
    .bind(body)
    .bind(post_type)
    .bind(destination)
    .bind(tags)
    .bind(media_urls)
    .bind(cover_url)
    .bind(primary_media_asset_id)
    .bind(data_origin)
    .bind(commerce_showcase_kind)
    .bind(commerce_market_listing_id)
    .bind(display_status)
    .bind(display_origin)
    .bind("api:create_post")
    .fetch_one(pool)
    .await?;
    Ok(row)
}

/// `commerce_showcase_kind` 合法枚举（与 migration CHECK 同源）。
pub fn commerce_showcase_kind_valid(kind: &str) -> bool {
    matches!(
        kind,
        "itinerary_led" | "lodging_led" | "acquisition_led" | "general_led"
    )
}

pub async fn user_owns_published_market_listing(
    pool: &PgPool,
    user_id: Uuid,
    listing_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT EXISTS(
            SELECT 1 FROM market_listings
            WHERE id = $1 AND owner_user_id = $2 AND status = 'published'
        )",
    )
    .bind(listing_id)
    .bind(user_id)
    .fetch_one(pool)
    .await
}

pub async fn commerce_fields_for_post_ids(
    pool: &PgPool,
    ids: &[Uuid],
) -> Result<std::collections::HashMap<Uuid, (Option<String>, Option<Uuid>)>, sqlx::Error> {
    use std::collections::HashMap;
    if ids.is_empty() {
        return Ok(HashMap::new());
    }
    let rows: Vec<(Uuid, Option<String>, Option<Uuid>)> = sqlx::query_as(
        "SELECT id, commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = ANY($1)",
    )
    .bind(ids)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|r| (r.0, (r.1, r.2))).collect())
}

pub async fn get_post_by_id(pool: &PgPool, post_id: Uuid) -> Result<Option<PostRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, PostSqlRow>(
        "SELECT id, user_id, body, post_type, destination, COALESCE(tags, '{}'), COALESCE(media_urls, '{}'), cover_url, primary_media_asset_id, visibility_status, created_at FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.as_ref().map(post_row_from_sql))
}

pub fn is_allowed_post_visibility_status(s: &str) -> bool {
    matches!(s, "public" | "private" | "archived")
}

/// 作者更新帖子可见性；返回是否更新到行。
pub async fn update_post_visibility_owned(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
    visibility_status: &str,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        "UPDATE community_posts SET visibility_status = $3 WHERE id = $1 AND user_id = $2",
    )
    .bind(post_id)
    .bind(user_id)
    .bind(visibility_status)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

/// 全站「公开」且 tags 精确命中（与 Feed `tag` 一致）的帖子数（31 §2.1 话题统计）
pub async fn count_public_posts_with_tag(pool: &PgPool, tag: &str) -> Result<i64, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM community_posts
           WHERE visibility_status = 'public' AND $1 = ANY(tags)"#,
    )
    .bind(tag)
    .fetch_one(pool)
    .await?;
    Ok(n)
}

/// 删除帖子（仅作者）；先清评论与收藏（历史表无 FK），再删帖；`community_likes` 对帖子有 ON DELETE CASCADE。
pub async fn delete_post_owned(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM community_posts WHERE id = $1 AND user_id = $2",
    )
    .bind(post_id)
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;
    if n == 0 {
        tx.rollback().await?;
        return Ok(false);
    }
    sqlx::query("DELETE FROM community_comments WHERE post_id = $1")
        .bind(post_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM community_collects WHERE post_id = $1")
        .bind(post_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM community_posts WHERE id = $1 AND user_id = $2")
        .bind(post_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(true)
}

/// ILIKE 通配符转义（`%` / `_` / `\`）并包 `%…%`。
fn feed_text_ilike_pattern(q: &str) -> String {
    let mut out = String::with_capacity(q.len() + 4);
    out.push('%');
    for c in q.chars().take(64) {
        match c {
            '%' | '_' | '\\' => {
                out.push('\\');
                out.push(c);
            }
            _ => out.push(c),
        }
    }
    out.push('%');
    out
}

/// `text_q`：trim 后空则 `None`；最长 64 字符（与 Feed `tag` 上限同量级）。
pub fn normalize_feed_text_q(raw: Option<&str>) -> Option<String> {
    let s = raw.map(str::trim).filter(|s| !s.is_empty())?;
    let trimmed: String = s.chars().take(64).collect();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

/// 游标分页：cursor 为上一页最后一条的 created_at (RFC3339) 或空；返回 (posts, next_cursor).
/// `tag_filter`：与 `tags` 数组某一元素 **精确相等** 时命中；`None` 不按标签过滤。
/// `text_q`：正文/目的地 ILIKE 子串（`None` 不筛）。
pub async fn list_feed(
    pool: &PgPool,
    cursor: Option<&str>,
    limit: i64,
    tag_filter: Option<&str>,
    production_only: bool,
    text_q: Option<&str>,
) -> Result<(Vec<PostRow>, Option<String>), sqlx::Error> {
    let text_q_norm = normalize_feed_text_q(text_q);
    let ilike_pat = text_q_norm.as_deref().map(feed_text_ilike_pattern);
    let limit_plus = limit + 1;
    let rows = if let Some(c) = cursor {
        let ts = chrono::DateTime::parse_from_rfc3339(c).ok();
        match ts {
            Some(t) => {
                sqlx::query_as::<_, PostSqlRow>(
                    r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.visibility_status, p.created_at
                       FROM community_posts p
                       WHERE p.created_at < $1
                         AND p.visibility_status = 'public'
                         AND NOT EXISTS (
                           SELECT 1 FROM community_penalties pen
                           WHERE pen.subject_user_id = p.user_id
                             AND pen.status = 'active'
                             AND pen.action = 'limit_feed'
                             AND (pen.expires_at IS NULL OR pen.expires_at > now())
                         )
                         AND ($3::text IS NULL OR $3 = ANY(p.tags))
                         AND ($4::bool = false OR p.data_origin = 'production')
                         AND ($5::text IS NULL OR (p.body ILIKE $5 OR COALESCE(p.destination, '') ILIKE $5))
                       ORDER BY p.created_at DESC
                       LIMIT $2"#,
                )
                .bind(t.with_timezone(&Utc))
                .bind(limit_plus)
                .bind(tag_filter)
                .bind(production_only)
                .bind(ilike_pat.as_deref())
                .fetch_all(pool)
                .await?
            }
            None => {
                list_feed_first_page(pool, limit_plus, tag_filter, production_only, ilike_pat.as_deref())
                    .await?
            }
        }
    } else {
        list_feed_first_page(pool, limit_plus, tag_filter, production_only, ilike_pat.as_deref()).await?
    };
    let has_more = rows.len() as i64 > limit;
    let posts: Vec<PostRow> = rows
        .iter()
        .take(limit as usize)
        .map(post_row_from_sql)
        .collect();
    let next = has_more
        .then(|| posts.last().map(|p| p.created_at.to_rfc3339()))
        .flatten();
    Ok((posts, next))
}

/// 公众 Feed 过滤 `production` 时，作者自己的 `test` 帖补入首页（① 种子账号 / 本地联调）。
pub async fn list_viewer_own_non_production_feed_supplement(
    pool: &PgPool,
    viewer_id: Uuid,
    tag_filter: Option<&str>,
    cap: i64,
) -> Result<Vec<PostRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, PostSqlRow>(
        r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.visibility_status, p.created_at
           FROM community_posts p
           WHERE p.user_id = $1
             AND p.visibility_status = 'public'
             AND p.data_origin <> 'production'
             AND ($2::text IS NULL OR $2 = ANY(p.tags))
           ORDER BY p.created_at DESC
           LIMIT $3"#,
    )
    .bind(viewer_id)
    .bind(tag_filter)
    .bind(cap)
    .fetch_all(pool)
    .await?;
    Ok(rows.iter().map(post_row_from_sql).collect())
}

/// 热门 Feed 游标：`H|{engagement}|{RFC3339}|{post_uuid}`（engagement = likes + comments，与排序一致）。
fn encode_hot_feed_cursor(engagement: i64, created_at: DateTime<Utc>, id: Uuid) -> String {
    format!("H|{}|{}|{}", engagement, created_at.to_rfc3339(), id)
}

fn decode_hot_feed_cursor(s: &str) -> Option<(i64, DateTime<Utc>, Uuid)> {
    let rest = s.strip_prefix("H|")?;
    let (e_str, rest) = rest.split_once('|')?;
    let e: i64 = e_str.parse().ok()?;
    let idx = rest.rfind('|')?;
    let ts_str = &rest[..idx];
    let id_str = &rest[idx + 1..];
    let ts = chrono::DateTime::parse_from_rfc3339(ts_str)
        .ok()?
        .with_timezone(&Utc);
    let id = Uuid::parse_str(id_str).ok()?;
    Some((e, ts, id))
}

/// 按互动总量（赞+评）降序，再按 `created_at`、`id` 打破平局；游标与 `list_feed` 的 RFC3339 互不混用。
pub async fn list_feed_hot(
    pool: &PgPool,
    cursor: Option<&str>,
    limit: i64,
    tag_filter: Option<&str>,
    production_only: bool,
) -> Result<(Vec<PostRow>, Option<String>), sqlx::Error> {
    let limit_plus = limit + 1;
    type HotRow = (
        Uuid,
        Uuid,
        String,
        String,
        Option<String>,
        Vec<String>,
        Vec<String>,
        Option<String>,
        Option<Uuid>,
        DateTime<Utc>,
        i64,
    );
    let rows: Vec<HotRow> = if let Some(c) = cursor.and_then(decode_hot_feed_cursor) {
        let (e_last, ts_last, id_last) = c;
        sqlx::query_as::<_, HotRow>(
            r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.created_at,
                      (COALESCE(lc.c, 0) + COALESCE(cc.c, 0)) AS engagement
               FROM community_posts p
               LEFT JOIN (SELECT post_id, COUNT(*)::bigint AS c FROM community_likes GROUP BY post_id) lc ON lc.post_id = p.id
               LEFT JOIN (SELECT post_id, COUNT(*)::bigint AS c FROM community_comments GROUP BY post_id) cc ON cc.post_id = p.id
               WHERE (COALESCE(lc.c, 0) + COALESCE(cc.c, 0), p.created_at, p.id) < ($1, $2, $3)
                 AND p.visibility_status = 'public'
                 AND NOT EXISTS (
                   SELECT 1 FROM community_penalties pen
                   WHERE pen.subject_user_id = p.user_id
                     AND pen.status = 'active'
                     AND pen.action = 'limit_feed'
                     AND (pen.expires_at IS NULL OR pen.expires_at > now())
                 )
                 AND ($5::text IS NULL OR $5 = ANY(p.tags))
                 AND ($6::bool = false OR p.data_origin = 'production')
               ORDER BY engagement DESC, p.created_at DESC, p.id DESC
               LIMIT $4"#,
        )
        .bind(e_last)
        .bind(ts_last)
        .bind(id_last)
        .bind(limit_plus)
        .bind(tag_filter)
        .bind(production_only)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, HotRow>(
            r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.created_at,
                      (COALESCE(lc.c, 0) + COALESCE(cc.c, 0)) AS engagement
               FROM community_posts p
               LEFT JOIN (SELECT post_id, COUNT(*)::bigint AS c FROM community_likes GROUP BY post_id) lc ON lc.post_id = p.id
               LEFT JOIN (SELECT post_id, COUNT(*)::bigint AS c FROM community_comments GROUP BY post_id) cc ON cc.post_id = p.id
               WHERE p.visibility_status = 'public'
               AND NOT EXISTS (
                 SELECT 1 FROM community_penalties pen
                 WHERE pen.subject_user_id = p.user_id
                   AND pen.status = 'active'
                   AND pen.action = 'limit_feed'
                   AND (pen.expires_at IS NULL OR pen.expires_at > now())
               )
               AND ($2::text IS NULL OR $2 = ANY(p.tags))
               AND ($3::bool = false OR p.data_origin = 'production')
               ORDER BY engagement DESC, p.created_at DESC, p.id DESC
               LIMIT $1"#,
        )
        .bind(limit_plus)
        .bind(tag_filter)
        .bind(production_only)
        .fetch_all(pool)
        .await?
    };
    let has_more = rows.len() as i64 > limit;
    let taken: Vec<HotRow> = rows.into_iter().take(limit as usize).collect();
    let posts: Vec<PostRow> = taken
        .iter()
        .map(|row| {
            post_row_from_sql(&(
                row.0,
                row.1,
                row.2.clone(),
                row.3.clone(),
                row.4.clone(),
                row.5.clone(),
                row.6.clone(),
                row.7.clone(),
                row.8,
                "public".to_string(),
                row.9,
            ))
        })
        .collect();
    let next = has_more
        .then(|| {
            taken
                .last()
                .map(|row| encode_hot_feed_cursor(row.10, row.9, row.0))
        })
        .flatten();
    Ok((posts, next))
}

/// 51-31-B2：关注流 — 仅返回当前用户关注的人发的帖子，游标分页。
pub async fn list_feed_by_following(
    pool: &PgPool,
    follower_id: Uuid,
    cursor: Option<&str>,
    limit: i64,
    tag_filter: Option<&str>,
    production_only: bool,
) -> Result<(Vec<PostRow>, Option<String>), sqlx::Error> {
    let limit_plus = limit + 1;
    let rows = if let Some(c) = cursor {
        let ts = chrono::DateTime::parse_from_rfc3339(c).ok();
        match ts {
            Some(t) => {
                sqlx::query_as::<_, PostSqlRow>(
                    r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.visibility_status, p.created_at
                       FROM community_posts p
                       INNER JOIN community_follows f ON f.following_id = p.user_id AND f.follower_id = $1
                       WHERE p.created_at < $2
                         AND p.visibility_status = 'public'
                         AND NOT EXISTS (
                           SELECT 1 FROM community_penalties pen
                           WHERE pen.subject_user_id = p.user_id
                             AND pen.status = 'active'
                             AND pen.action = 'limit_feed'
                             AND (pen.expires_at IS NULL OR pen.expires_at > now())
                         )
                         AND ($4::text IS NULL OR $4 = ANY(p.tags))
                         AND ($5::bool = false OR p.data_origin = 'production')
                       ORDER BY p.created_at DESC
                       LIMIT $3"#,
                )
                .bind(follower_id)
                .bind(t.with_timezone(&Utc))
                .bind(limit_plus)
                .bind(tag_filter)
                .bind(production_only)
                .fetch_all(pool)
                .await?
            }
            None => {
                list_feed_by_following_first_page(
                    pool,
                    follower_id,
                    limit_plus,
                    tag_filter,
                    production_only,
                )
                .await?
            }
        }
    } else {
        list_feed_by_following_first_page(
            pool,
            follower_id,
            limit_plus,
            tag_filter,
            production_only,
        )
        .await?
    };
    let has_more = rows.len() as i64 > limit;
    let posts: Vec<PostRow> = rows
        .iter()
        .take(limit as usize)
        .map(post_row_from_sql)
        .collect();
    let next = has_more
        .then(|| posts.last().map(|p| p.created_at.to_rfc3339()))
        .flatten();
    Ok((posts, next))
}

async fn list_feed_by_following_first_page(
    pool: &PgPool,
    follower_id: Uuid,
    limit: i64,
    tag_filter: Option<&str>,
    production_only: bool,
) -> Result<Vec<PostSqlRow>, sqlx::Error> {
    sqlx::query_as::<_, PostSqlRow>(
        r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.visibility_status, p.created_at
           FROM community_posts p
           INNER JOIN community_follows f ON f.following_id = p.user_id AND f.follower_id = $1
           WHERE p.visibility_status = 'public'
           AND NOT EXISTS (
             SELECT 1 FROM community_penalties pen
             WHERE pen.subject_user_id = p.user_id
               AND pen.status = 'active'
               AND pen.action = 'limit_feed'
               AND (pen.expires_at IS NULL OR pen.expires_at > now())
           )
           AND ($3::text IS NULL OR $3 = ANY(p.tags))
           AND ($4::bool = false OR p.data_origin = 'production')
           ORDER BY p.created_at DESC
           LIMIT $2"#,
    )
    .bind(follower_id)
    .bind(limit)
    .bind(tag_filter)
    .bind(production_only)
    .fetch_all(pool)
    .await
}

async fn list_feed_first_page(
    pool: &PgPool,
    limit: i64,
    tag_filter: Option<&str>,
    production_only: bool,
    text_ilike: Option<&str>,
) -> Result<Vec<PostSqlRow>, sqlx::Error> {
    sqlx::query_as::<_, PostSqlRow>(
        r#"SELECT p.id, p.user_id, p.body, p.post_type, p.destination, COALESCE(p.tags, '{}'), COALESCE(p.media_urls, '{}'), p.cover_url, p.primary_media_asset_id, p.visibility_status, p.created_at
           FROM community_posts p
           WHERE p.visibility_status = 'public'
           AND NOT EXISTS (
             SELECT 1 FROM community_penalties pen
             WHERE pen.subject_user_id = p.user_id
               AND pen.status = 'active'
               AND pen.action = 'limit_feed'
               AND (pen.expires_at IS NULL OR pen.expires_at > now())
           )
           AND ($2::text IS NULL OR $2 = ANY(p.tags))
           AND ($3::bool = false OR p.data_origin = 'production')
           AND ($4::text IS NULL OR (p.body ILIKE $4 OR COALESCE(p.destination, '') ILIKE $4))
           ORDER BY p.created_at DESC
           LIMIT $1"#,
    )
    .bind(limit)
    .bind(tag_filter)
    .bind(production_only)
    .bind(text_ilike)
    .fetch_all(pool)
    .await
}

/// `skip_limit_feed_exclusion`：为 `true` 时（通常当前用户即 `user_id`）不因 `limit_feed` 处罚隐藏帖子。
/// `public_only`：他人看主页时仅 `public`；`visibility_filter`：`Some("public"|"private"|"archived")` 时作者列表按状态筛。
pub async fn list_posts_by_user(
    pool: &PgPool,
    user_id: Uuid,
    cursor: Option<&str>,
    limit: i64,
    skip_limit_feed_exclusion: bool,
    public_only: bool,
    visibility_filter: Option<&str>,
) -> Result<(Vec<PostRow>, Option<String>), sqlx::Error> {
    let production_only = public_only && crate::chain_off::public_community_feed_filter_enabled();
    let limit_plus = limit + 1;
    type URow = PostSqlRow;
    let rows = if let Some(c) = cursor {
        let ts = chrono::DateTime::parse_from_rfc3339(c).ok();
        match ts {
            Some(t) => {
                sqlx::query_as::<_, URow>(
                    r#"SELECT id, user_id, body, post_type, destination, COALESCE(tags, '{}'), COALESCE(media_urls, '{}'), cover_url, primary_media_asset_id, visibility_status, created_at
                       FROM community_posts
                       WHERE user_id = $1
                         AND created_at < $2
                         AND ($4::bool OR NOT EXISTS (
                           SELECT 1 FROM community_penalties pen
                           WHERE pen.subject_user_id = $1
                             AND pen.status = 'active'
                             AND pen.action = 'limit_feed'
                             AND (pen.expires_at IS NULL OR pen.expires_at > now())
                         ))
                         AND ($5::bool = false OR visibility_status = 'public')
                         AND ($6::text IS NULL OR visibility_status = $6)
                         AND ($7::bool = false OR data_origin = 'production')
                       ORDER BY created_at DESC
                       LIMIT $3"#,
                )
                .bind(user_id)
                .bind(t.with_timezone(&Utc))
                .bind(limit_plus)
                .bind(skip_limit_feed_exclusion)
                .bind(public_only)
                .bind(visibility_filter)
                .bind(production_only)
                .fetch_all(pool)
                .await?
            }
            None => {
                list_posts_by_user_first(
                    pool,
                    user_id,
                    limit_plus,
                    skip_limit_feed_exclusion,
                    public_only,
                    visibility_filter,
                    production_only,
                )
                .await?
            }
        }
    } else {
        list_posts_by_user_first(
            pool,
            user_id,
            limit_plus,
            skip_limit_feed_exclusion,
            public_only,
            visibility_filter,
            production_only,
        )
        .await?
    };
    let has_more = rows.len() as i64 > limit;
    let posts: Vec<PostRow> = rows
        .iter()
        .take(limit as usize)
        .map(post_row_from_sql)
        .collect();
    let next = has_more
        .then(|| posts.last().map(|p| p.created_at.to_rfc3339()))
        .flatten();
    Ok((posts, next))
}

async fn list_posts_by_user_first(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    skip_limit_feed_exclusion: bool,
    public_only: bool,
    visibility_filter: Option<&str>,
    production_only: bool,
) -> Result<Vec<PostSqlRow>, sqlx::Error> {
    sqlx::query_as::<_, PostSqlRow>(
        r#"SELECT id, user_id, body, post_type, destination, COALESCE(tags, '{}'), COALESCE(media_urls, '{}'), cover_url, primary_media_asset_id, visibility_status, created_at
           FROM community_posts
           WHERE user_id = $1
             AND ($3::bool OR NOT EXISTS (
               SELECT 1 FROM community_penalties pen
               WHERE pen.subject_user_id = $1
                 AND pen.status = 'active'
                 AND pen.action = 'limit_feed'
                 AND (pen.expires_at IS NULL OR pen.expires_at > now())
             ))
             AND ($4::bool = false OR visibility_status = 'public')
             AND ($5::text IS NULL OR visibility_status = $5)
             AND ($6::bool = false OR data_origin = 'production')
           ORDER BY created_at DESC
           LIMIT $2"#,
    )
    .bind(user_id)
    .bind(limit)
    .bind(skip_limit_feed_exclusion)
    .bind(public_only)
    .bind(visibility_filter)
    .bind(production_only)
    .fetch_all(pool)
    .await
}

// ---------- 点赞（51-31-8）----------
pub async fn count_likes(pool: &PgPool, post_id: Uuid) -> Result<i64, sqlx::Error> {
    let row =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM community_likes WHERE post_id = $1")
            .bind(post_id)
            .fetch_one(pool)
            .await?;
    Ok(row)
}

/// 批量查询帖子点赞数（用于 Feed / 列表，避免 N+1）
pub async fn count_likes_for_posts(
    pool: &PgPool,
    post_ids: &[Uuid],
) -> Result<Vec<(Uuid, i64)>, sqlx::Error> {
    if post_ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = sqlx::query_as::<_, (Uuid, i64)>(
        "SELECT post_id, COUNT(*)::bigint FROM community_likes WHERE post_id = ANY($1) GROUP BY post_id",
    )
    .bind(post_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn count_comments_for_posts(
    pool: &PgPool,
    post_ids: &[Uuid],
) -> Result<Vec<(Uuid, i64)>, sqlx::Error> {
    if post_ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = sqlx::query_as::<_, (Uuid, i64)>(
        "SELECT post_id, COUNT(*)::bigint FROM community_comments WHERE post_id = ANY($1) AND visibility_status = 'visible' GROUP BY post_id",
    )
    .bind(post_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

/// 批量读取用户展示字段（社区关注/好友列表）；**role** 与 `users.role` 一致（04 / 01 用户表）。
/// 第五列：是否存在 `guides` 行且 `status = 'active'`（31 §2.4 Escrow 向导露出）。
/// 第六列：`default_wallet_address`（前端自行缩写展示）。
pub async fn users_public_by_ids(
    pool: &PgPool,
    user_ids: &[Uuid],
) -> Result<
    Vec<(
        Uuid,
        Option<String>,
        Option<String>,
        String,
        bool,
        Option<String>,
    )>,
    sqlx::Error,
> {
    if user_ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            Option<String>,
            Option<String>,
            String,
            bool,
            Option<String>,
        ),
    >(
        r#"SELECT u.id, u.nickname, u.avatar_url, u.role,
            EXISTS (
              SELECT 1 FROM guides g WHERE g.user_id = u.id AND g.status = 'active'
            ) AS is_escrow_guide,
            u.default_wallet_address
           FROM users u WHERE u.id = ANY($1)"#,
    )
    .bind(user_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

/// 当前用户所有帖子收到的点赞总数（去重按 like 行计数，非去重用户数）
pub async fn count_likes_received_for_user(
    pool: &PgPool,
    author_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let row = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*)::bigint FROM community_likes l
           INNER JOIN community_posts p ON p.id = l.post_id
           WHERE p.user_id = $1"#,
    )
    .bind(author_id)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn user_liked_post(
    pool: &PgPool,
    user_id: Uuid,
    post_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let liked = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM community_likes WHERE user_id = $1 AND post_id = $2)",
    )
    .bind(user_id)
    .bind(post_id)
    .fetch_one(pool)
    .await?;
    Ok(liked)
}

/// 在给定帖子 id 集合中，返回当前用户已点赞的帖子 id（Feed 批量 `liked_by_me`）
pub async fn user_liked_posts_in_set(
    pool: &PgPool,
    user_id: Uuid,
    post_ids: &[Uuid],
) -> Result<HashSet<Uuid>, sqlx::Error> {
    if post_ids.is_empty() {
        return Ok(HashSet::new());
    }
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT post_id FROM community_likes WHERE user_id = $1 AND post_id = ANY($2)",
    )
    .bind(user_id)
    .bind(post_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().collect())
}

pub async fn list_likes_post_ids(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT post_id FROM community_likes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn insert_like(pool: &PgPool, user_id: Uuid, post_id: Uuid) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        "INSERT INTO community_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING",
    )
    .bind(user_id)
    .bind(post_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn delete_like(pool: &PgPool, user_id: Uuid, post_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM community_likes WHERE user_id = $1 AND post_id = $2")
        .bind(user_id)
        .bind(post_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ---------- 评论 ----------
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommentRow {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub body: String,
    pub created_at: DateTime<Utc>,
    pub visibility_status: String,
    pub risk_level: i16,
}

pub async fn count_comments_on_post(pool: &PgPool, post_id: Uuid) -> Result<i64, sqlx::Error> {
    let n = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM community_comments WHERE post_id = $1 AND visibility_status = 'visible'",
    )
    .bind(post_id)
    .fetch_one(pool)
    .await?;
    Ok(n)
}

pub async fn list_comments(
    pool: &PgPool,
    post_id: Uuid,
    limit: i64,
) -> Result<Vec<CommentRow>, sqlx::Error> {
    sqlx::query_as::<_, CommentRow>(
        r#"SELECT id, post_id, user_id, parent_id, body, created_at, visibility_status, risk_level
           FROM community_comments WHERE post_id = $1 ORDER BY created_at ASC LIMIT $2"#,
    )
    .bind(post_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub fn is_allowed_comment_visibility_status(s: &str) -> bool {
    matches!(s, "visible" | "hidden" | "removed")
}

pub async fn update_comment_visibility_status(
    pool: &PgPool,
    comment_id: Uuid,
    visibility_status: &str,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("UPDATE community_comments SET visibility_status = $2 WHERE id = $1")
        .bind(comment_id)
        .bind(visibility_status)
        .execute(pool)
        .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn insert_comment(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
    parent_id: Option<Uuid>,
    body: &str,
) -> Result<Uuid, sqlx::Error> {
    let row = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO community_comments (post_id, user_id, parent_id, body) VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind(post_id)
    .bind(user_id)
    .bind(parent_id)
    .bind(body)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

/// 160 §3.3：`community_abuse_policy` 单例行；读失败或无行时用迁移默认值，避免误放行依赖失败静默。
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct CommunityAbusePolicyRow {
    pub comment_rate_window_sec: i32,
    pub comment_max_per_window: i32,
    pub comment_min_interval_sec: i32,
    pub comment_duplicate_lookback_sec: i32,
    pub post_rate_window_sec: i32,
    pub post_max_per_window: i32,
    pub post_min_interval_sec: i32,
    pub post_duplicate_lookback_sec: i32,
    pub report_rate_window_sec: i32,
    pub report_max_per_window: i32,
    pub report_min_interval_sec: i32,
    pub report_duplicate_target_lookback_sec: i32,
}

impl CommunityAbusePolicyRow {
    pub fn fallback() -> Self {
        Self {
            comment_rate_window_sec: 60,
            comment_max_per_window: 30,
            comment_min_interval_sec: 2,
            comment_duplicate_lookback_sec: 86400,
            post_rate_window_sec: 600,
            post_max_per_window: 15,
            post_min_interval_sec: 5,
            post_duplicate_lookback_sec: 86400,
            report_rate_window_sec: 3600,
            report_max_per_window: 30,
            report_min_interval_sec: 15,
            report_duplicate_target_lookback_sec: 604800,
        }
    }
}

pub async fn get_community_abuse_policy(pool: &PgPool) -> CommunityAbusePolicyRow {
    let row = sqlx::query_as::<_, CommunityAbusePolicyRow>(
        r#"SELECT comment_rate_window_sec, comment_max_per_window, comment_min_interval_sec, comment_duplicate_lookback_sec,
                  post_rate_window_sec, post_max_per_window, post_min_interval_sec, post_duplicate_lookback_sec,
                  report_rate_window_sec, report_max_per_window, report_min_interval_sec, report_duplicate_target_lookback_sec
           FROM community_abuse_policy WHERE id = 1"#,
    )
    .fetch_optional(pool)
    .await;
    match row {
        Ok(Some(p)) => p,
        _ => CommunityAbusePolicyRow::fallback(),
    }
}

pub async fn count_user_comments_since(
    pool: &PgPool,
    user_id: Uuid,
    since: DateTime<Utc>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM community_comments WHERE user_id = $1 AND created_at >= $2",
    )
    .bind(user_id)
    .bind(since)
    .fetch_one(pool)
    .await
}

pub async fn latest_user_comment_created_at(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    sqlx::query_scalar::<_, DateTime<Utc>>(
        "SELECT created_at FROM community_comments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

/// 规范化空白后比较正文（同帖、同用户、窗口内）；与 PG `[[:space:]]+` 规则一致。
pub async fn duplicate_comment_exists(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
    body: &str,
    since: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar::<_, bool>(
        r#"SELECT EXISTS(
            SELECT 1 FROM community_comments
            WHERE post_id = $1 AND user_id = $2 AND created_at >= $4
              AND lower(regexp_replace(trim(body), '[[:space:]]+', ' ', 'g'))
                  = lower(regexp_replace(trim($3), '[[:space:]]+', ' ', 'g'))
        )"#,
    )
    .bind(post_id)
    .bind(user_id)
    .bind(body)
    .bind(since)
    .fetch_one(pool)
    .await
}

pub async fn count_user_posts_since(
    pool: &PgPool,
    user_id: Uuid,
    since: DateTime<Utc>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM community_posts WHERE user_id = $1 AND created_at >= $2",
    )
    .bind(user_id)
    .bind(since)
    .fetch_one(pool)
    .await
}

pub async fn latest_user_post_created_at(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    sqlx::query_scalar::<_, DateTime<Utc>>(
        "SELECT created_at FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn duplicate_post_body_exists(
    pool: &PgPool,
    user_id: Uuid,
    body: &str,
    since: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar::<_, bool>(
        r#"SELECT EXISTS(
            SELECT 1 FROM community_posts
            WHERE user_id = $1 AND created_at >= $3
              AND lower(regexp_replace(trim(body), '[[:space:]]+', ' ', 'g'))
                  = lower(regexp_replace(trim($2), '[[:space:]]+', ' ', 'g'))
        )"#,
    )
    .bind(user_id)
    .bind(body)
    .bind(since)
    .fetch_one(pool)
    .await
}

/// 160 §3.3：重复帖 = **同正文 + 同 `post_type` + 同媒体指纹**（`primary_media_asset_id` 或首条 `media_urls`）。
/// 避免「同一句 caption + 不同视频/图片」被误判为重复（UGC 常见：短标题 + 新素材）。
pub async fn duplicate_post_content_exists(
    pool: &PgPool,
    user_id: Uuid,
    body: &str,
    post_type: &str,
    primary_media_asset_id: Option<Uuid>,
    first_media_url: Option<&str>,
    since: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    let first_url = first_media_url.map(str::trim).filter(|s| !s.is_empty());
    sqlx::query_scalar::<_, bool>(
        r#"SELECT EXISTS(
            SELECT 1 FROM community_posts
            WHERE user_id = $1 AND created_at >= $6
              AND lower(regexp_replace(trim(body), '[[:space:]]+', ' ', 'g'))
                  = lower(regexp_replace(trim($2), '[[:space:]]+', ' ', 'g'))
              AND lower(trim(post_type)) = lower(trim($3))
              AND (
                ($4::uuid IS NOT NULL AND primary_media_asset_id IS NOT DISTINCT FROM $4)
                OR (
                  $4::uuid IS NULL
                  AND $5::text IS NOT NULL AND btrim($5::text) <> ''
                  AND primary_media_asset_id IS NULL
                  AND cardinality(COALESCE(media_urls, '{}')) > 0
                  AND media_urls[1] = $5::text
                )
                OR (
                  $4::uuid IS NULL
                  AND ($5::text IS NULL OR btrim($5::text) = '')
                  AND primary_media_asset_id IS NULL
                  AND cardinality(COALESCE(media_urls, '{}')) = 0
                )
              )
        )"#,
    )
    .bind(user_id)
    .bind(body)
    .bind(post_type)
    .bind(primary_media_asset_id)
    .bind(first_url)
    .bind(since)
    .fetch_one(pool)
    .await
}

// ---------- 关注 ----------
pub async fn list_following(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT following_id FROM community_follows WHERE follower_id = $1 ORDER BY created_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn list_followers(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT follower_id FROM community_follows WHERE following_id = $1 ORDER BY created_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn insert_follow(
    pool: &PgPool,
    follower_id: Uuid,
    following_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO community_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT (follower_id, following_id) DO NOTHING",
    )
    .bind(follower_id)
    .bind(following_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_follow(
    pool: &PgPool,
    follower_id: Uuid,
    following_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM community_follows WHERE follower_id = $1 AND following_id = $2")
        .bind(follower_id)
        .bind(following_id)
        .execute(pool)
        .await?;
    Ok(())
}

/// `follower_id` 是否已关注 `following_id`（B-076 / 帖子详情对读）
pub async fn is_following(
    pool: &PgPool,
    follower_id: Uuid,
    following_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let v: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM community_follows WHERE follower_id = $1 AND following_id = $2)",
    )
    .bind(follower_id)
    .bind(following_id)
    .fetch_one(pool)
    .await?;
    Ok(v)
}

/// 批量：当前用户已关注的作者 id（Feed 行 `author_followed_by_me`）
pub async fn followed_following_ids_in_set(
    pool: &PgPool,
    follower_id: Uuid,
    candidates: &[Uuid],
) -> Result<HashSet<Uuid>, sqlx::Error> {
    if candidates.is_empty() {
        return Ok(HashSet::new());
    }
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT following_id FROM community_follows WHERE follower_id = $1 AND following_id = ANY($2)",
    )
    .bind(follower_id)
    .bind(candidates)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().collect())
}

// ---------- 收藏 ----------
pub async fn list_collects_post_ids(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT post_id FROM community_collects WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn insert_collect(
    pool: &PgPool,
    user_id: Uuid,
    post_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        "INSERT INTO community_collects (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING",
    )
    .bind(user_id)
    .bind(post_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn delete_collect(
    pool: &PgPool,
    user_id: Uuid,
    post_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM community_collects WHERE user_id = $1 AND post_id = $2")
        .bind(user_id)
        .bind(post_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn count_collects_for_post(pool: &PgPool, post_id: Uuid) -> Result<i64, sqlx::Error> {
    let row = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM community_collects WHERE post_id = $1",
    )
    .bind(post_id)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

/// 批量查询帖子收藏数（Feed / 列表）
pub async fn count_collects_for_posts(
    pool: &PgPool,
    post_ids: &[Uuid],
) -> Result<Vec<(Uuid, i64)>, sqlx::Error> {
    if post_ids.is_empty() {
        return Ok(vec![]);
    }
    let rows = sqlx::query_as::<_, (Uuid, i64)>(
        "SELECT post_id, COUNT(*)::bigint FROM community_collects WHERE post_id = ANY($1) GROUP BY post_id",
    )
    .bind(post_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn user_collected_post(
    pool: &PgPool,
    user_id: Uuid,
    post_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let collected = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM community_collects WHERE user_id = $1 AND post_id = $2)",
    )
    .bind(user_id)
    .bind(post_id)
    .fetch_one(pool)
    .await?;
    Ok(collected)
}

/// 在给定帖子 id 集合中，返回当前用户已收藏的帖子 id（Feed 批量 `collected_by_me`）
pub async fn user_collected_posts_in_set(
    pool: &PgPool,
    user_id: Uuid,
    post_ids: &[Uuid],
) -> Result<HashSet<Uuid>, sqlx::Error> {
    if post_ids.is_empty() {
        return Ok(HashSet::new());
    }
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT post_id FROM community_collects WHERE user_id = $1 AND post_id = ANY($2)",
    )
    .bind(user_id)
    .bind(post_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().collect())
}

// ---------- 私信会话与消息 ----------
#[derive(Debug)]
pub struct ConversationRow {
    pub id: Uuid,
    pub user1_id: Uuid,
    pub user2_id: Uuid,
    pub created_at: DateTime<Utc>,
}

pub async fn list_conversations_for_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<ConversationRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, DateTime<Utc>)>(
        "SELECT id, user1_id, user2_id, created_at FROM community_conversations WHERE user1_id = $1 OR user2_id = $1 ORDER BY created_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(id, user1_id, user2_id, created_at)| ConversationRow {
            id,
            user1_id,
            user2_id,
            created_at,
        })
        .collect())
}

/// 会话列表：最后一条消息预览、未读条数（对方发来且晚于 last_read_at）
#[derive(Debug)]
pub struct ConversationEnrichedRow {
    pub id: Uuid,
    pub user1_id: Uuid,
    pub user2_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub last_message_body: Option<String>,
    pub last_message_at: Option<DateTime<Utc>>,
    pub last_sender_id: Option<Uuid>,
    pub unread_count: i64,
}

pub async fn list_conversations_enriched_for_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<ConversationEnrichedRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            Uuid,
            Uuid,
            DateTime<Utc>,
            Option<String>,
            Option<DateTime<Utc>>,
            Option<Uuid>,
            i64,
        ),
    >(
        r#"
        SELECT c.id, c.user1_id, c.user2_id, c.created_at,
               lm.body, lm.created_at, lm.sender_id,
               COALESCE((
                   SELECT COUNT(*)::bigint FROM community_dm_messages m
                   WHERE m.conversation_id = c.id
                     AND m.sender_id != $1
                     AND m.created_at > COALESCE(
                       (SELECT r.last_read_at FROM community_dm_read_state r
                        WHERE r.user_id = $1 AND r.conversation_id = c.id),
                       '-infinity'::timestamptz
                     )
               ), 0)
        FROM community_conversations c
        LEFT JOIN LATERAL (
            SELECT body, created_at, sender_id
            FROM community_dm_messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
        ) lm ON true
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY COALESCE(lm.created_at, c.created_at) DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                user1_id,
                user2_id,
                created_at,
                last_body,
                last_at,
                last_sender,
                unread_count,
            )| {
                ConversationEnrichedRow {
                    id,
                    user1_id,
                    user2_id,
                    created_at,
                    last_message_body: last_body,
                    last_message_at: last_at,
                    last_sender_id: last_sender,
                    unread_count,
                }
            },
        )
        .collect())
}

pub async fn upsert_dm_read_state_now(
    pool: &PgPool,
    user_id: Uuid,
    conversation_id: Uuid,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    sqlx::query(
        r#"INSERT INTO community_dm_read_state (user_id, conversation_id, last_read_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, conversation_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at"#,
    )
    .bind(user_id)
    .bind(conversation_id)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

#[derive(Debug)]
pub struct DmMessageRow {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub body: String,
    pub created_at: DateTime<Utc>,
}

pub async fn list_dm_messages(
    pool: &PgPool,
    conversation_id: Uuid,
    limit: i64,
) -> Result<Vec<DmMessageRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, DateTime<Utc>)>(
        "SELECT id, conversation_id, sender_id, body, created_at FROM community_dm_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2",
    )
    .bind(conversation_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, conversation_id, sender_id, body, created_at)| DmMessageRow {
                id,
                conversation_id,
                sender_id,
                body,
                created_at,
            },
        )
        .collect())
}

pub async fn insert_dm_message(
    pool: &PgPool,
    conversation_id: Uuid,
    sender_id: Uuid,
    body: &str,
) -> Result<Uuid, sqlx::Error> {
    let row = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO community_dm_messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id",
    )
    .bind(conversation_id)
    .bind(sender_id)
    .bind(body)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn get_conversation_by_id(
    pool: &PgPool,
    conversation_id: Uuid,
) -> Result<Option<ConversationRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (Uuid, Uuid, Uuid, DateTime<Utc>)>(
        "SELECT id, user1_id, user2_id, created_at FROM community_conversations WHERE id = $1",
    )
    .bind(conversation_id)
    .fetch_optional(pool)
    .await?;
    Ok(
        row.map(|(id, user1_id, user2_id, created_at)| ConversationRow {
            id,
            user1_id,
            user2_id,
            created_at,
        }),
    )
}

/// 幂等创建或返回已有私信会话（`user1_id < user2_id` 约束）。
pub async fn ensure_conversation(
    pool: &PgPool,
    user_a: Uuid,
    user_b: Uuid,
) -> Result<Uuid, sqlx::Error> {
    if user_a == user_b {
        return Err(sqlx::Error::RowNotFound);
    }
    let (user1_id, user2_id) = if user_a < user_b {
        (user_a, user_b)
    } else {
        (user_b, user_a)
    };
    if let Some(id) = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO community_conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT (user1_id, user2_id) DO NOTHING RETURNING id",
    )
    .bind(user1_id)
    .bind(user2_id)
    .fetch_optional(pool)
    .await?
    {
        return Ok(id);
    }
    sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM community_conversations WHERE user1_id = $1 AND user2_id = $2",
    )
    .bind(user1_id)
    .bind(user2_id)
    .fetch_one(pool)
    .await
}

// ---------- 好友与好友请求 ----------
pub async fn list_friend_ids(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows = sqlx::query_scalar::<_, Uuid>(
        "SELECT friend_id FROM community_friends WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

#[derive(Debug)]
pub struct FriendRequestRow {
    pub id: Uuid,
    pub from_user_id: Uuid,
    pub to_user_id: Uuid,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

pub async fn list_friend_requests_to_user(
    pool: &PgPool,
    to_user_id: Uuid,
    status: &str,
    limit: i64,
) -> Result<Vec<FriendRequestRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, DateTime<Utc>)>(
        "SELECT id, from_user_id, to_user_id, status, created_at FROM community_friend_requests WHERE to_user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3",
    )
    .bind(to_user_id)
    .bind(status)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, from_user_id, to_user_id, status, created_at)| FriendRequestRow {
                id,
                from_user_id,
                to_user_id,
                status,
                created_at,
            },
        )
        .collect())
}

pub async fn list_friend_requests_from_user(
    pool: &PgPool,
    from_user_id: Uuid,
    status: &str,
    limit: i64,
) -> Result<Vec<FriendRequestRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, DateTime<Utc>)>(
        "SELECT id, from_user_id, to_user_id, status, created_at FROM community_friend_requests WHERE from_user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3",
    )
    .bind(from_user_id)
    .bind(status)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, from_user_id, to_user_id, status, created_at)| FriendRequestRow {
                id,
                from_user_id,
                to_user_id,
                status,
                created_at,
            },
        )
        .collect())
}

pub async fn insert_friend_request(
    pool: &PgPool,
    from_user_id: Uuid,
    to_user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    if from_user_id == to_user_id {
        return Ok(false);
    }
    let r = sqlx::query(
        "INSERT INTO community_friend_requests (from_user_id, to_user_id, status) VALUES ($1, $2, 'pending') ON CONFLICT (from_user_id, to_user_id) DO NOTHING",
    )
    .bind(from_user_id)
    .bind(to_user_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

/// 接收方同意：将申请标为 accepted，并双向写入 community_friends（幂等 ON CONFLICT DO NOTHING）
pub async fn accept_friend_request(
    pool: &PgPool,
    request_id: Uuid,
    receiver_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let row = sqlx::query_as::<_, (Uuid, Uuid)>(
        r#"UPDATE community_friend_requests SET status = 'accepted'
           WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
           RETURNING from_user_id, to_user_id"#,
    )
    .bind(request_id)
    .bind(receiver_id)
    .fetch_optional(&mut *tx)
    .await?;

    let Some((from_id, to_id)) = row else {
        tx.rollback().await?;
        return Ok(false);
    };

    sqlx::query(
        "INSERT INTO community_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING",
    )
    .bind(from_id)
    .bind(to_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(true)
}

/// 接收方拒绝：仅更新申请状态
pub async fn reject_friend_request(
    pool: &PgPool,
    request_id: Uuid,
    receiver_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"UPDATE community_friend_requests SET status = 'rejected'
           WHERE id = $1 AND to_user_id = $2 AND status = 'pending'"#,
    )
    .bind(request_id)
    .bind(receiver_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

// ---------- 反馈/建议（55-S10 / 54-S19）----------
#[derive(Debug, sqlx::FromRow)]
pub struct FeedbackRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub category: String,
    pub content: String,
    pub status: String,
    pub official_reply: Option<String>,
    pub media_urls: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn insert_feedback(
    pool: &PgPool,
    user_id: Uuid,
    category: &str,
    content: &str,
    media_urls: &[String],
) -> Result<Uuid, sqlx::Error> {
    let now = Utc::now();
    let row = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO community_feedback (user_id, category, content, status, media_urls, created_at, updated_at) VALUES ($1, $2, $3, 'open', $4, $5, $5) RETURNING id",
    )
    .bind(user_id)
    .bind(category)
    .bind(content)
    .bind(media_urls)
    .bind(now)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn list_feedback_by_user(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<FeedbackRow>, sqlx::Error> {
    sqlx::query_as::<_, FeedbackRow>(
        r#"SELECT id, user_id, category, content, status, official_reply, COALESCE(media_urls, '{}') AS media_urls, created_at, updated_at
           FROM community_feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2"#,
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// G4：更新反馈的官方回复与/或状态（当前仅内网 PATCH 使用；产品定稿后可扩展公网权限）
pub async fn update_feedback_official_reply_and_status(
    pool: &PgPool,
    feedback_id: Uuid,
    official_reply: Option<&str>,
    status: Option<&str>,
) -> Result<bool, sqlx::Error> {
    let now = Utc::now();
    let rows = if let (Some(reply), Some(st)) = (official_reply, status) {
        sqlx::query(
            "UPDATE community_feedback SET official_reply = $1, status = $2, updated_at = $3 WHERE id = $4",
        )
        .bind(reply)
        .bind(st)
        .bind(now)
        .bind(feedback_id)
        .execute(pool)
        .await?
    } else if let Some(reply) = official_reply {
        sqlx::query(
            "UPDATE community_feedback SET official_reply = $1, updated_at = $2 WHERE id = $3",
        )
        .bind(reply)
        .bind(now)
        .bind(feedback_id)
        .execute(pool)
        .await?
    } else if let Some(st) = status {
        sqlx::query("UPDATE community_feedback SET status = $1, updated_at = $2 WHERE id = $3")
            .bind(st)
            .bind(now)
            .bind(feedback_id)
            .execute(pool)
            .await?
    } else {
        return Ok(false);
    };
    Ok(rows.rows_affected() > 0)
}

#[derive(Debug, sqlx::FromRow)]
pub struct CommunityActivityEventRow {
    pub kind: String,
    pub actor_user_id: Uuid,
    pub actor_nickname: Option<String>,
    pub post_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

/// 当前用户相关互动事件（赞/评/关注）· 时间倒序 · 供 **`GET …/me/activity`**。
pub async fn list_me_activity_events(
    pool: &PgPool,
    author_id: Uuid,
    limit: i64,
) -> Result<Vec<CommunityActivityEventRow>, sqlx::Error> {
    let lim = limit.clamp(1, 50);
    sqlx::query_as::<_, CommunityActivityEventRow>(
        r#"
        SELECT * FROM (
            SELECT 'like'::text AS kind, l.user_id AS actor_user_id, u.nickname AS actor_nickname,
                   l.post_id, l.created_at
            FROM community_likes l
            INNER JOIN community_posts p ON p.id = l.post_id
            INNER JOIN users u ON u.id = l.user_id
            WHERE p.user_id = $1
            UNION ALL
            SELECT 'comment'::text, c.user_id, u.nickname, c.post_id, c.created_at
            FROM community_comments c
            INNER JOIN community_posts p ON p.id = c.post_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE p.user_id = $1 AND c.parent_id IS NULL
            UNION ALL
            SELECT 'follow'::text, f.follower_id, u.nickname, NULL::uuid, f.created_at
            FROM community_follows f
            INNER JOIN users u ON u.id = f.follower_id
            WHERE f.following_id = $1
            UNION ALL
            SELECT 'mention'::text, c.user_id, u.nickname, c.post_id, c.created_at
            FROM community_comments c
            INNER JOIN community_posts p ON p.id = c.post_id
            INNER JOIN users u ON u.id = c.user_id
            WHERE p.user_id = $1
              AND c.parent_id IS NULL
              AND position('@' in c.body) > 0
        ) ev
        ORDER BY ev.created_at DESC
        LIMIT $2
        "#,
    )
    .bind(author_id)
    .bind(lim)
    .fetch_all(pool)
    .await
}

#[derive(Debug, sqlx::FromRow)]
pub struct ExploreDestinationCountRow {
    pub destination: String,
    pub post_count: i64,
}

/// 公开帖目的地聚合（发现页 catalog · 有 DB 时优先于前端静态表）。
pub async fn list_explore_destination_counts(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<ExploreDestinationCountRow>, sqlx::Error> {
    let lim = limit.clamp(1, 80);
    sqlx::query_as::<_, ExploreDestinationCountRow>(
        r#"SELECT destination, COUNT(*)::bigint AS post_count
           FROM community_posts
           WHERE visibility_status = 'public'
             AND destination IS NOT NULL
             AND btrim(destination) <> ''
           GROUP BY destination
           ORDER BY post_count DESC, destination ASC
           LIMIT $1"#,
    )
    .bind(lim)
    .fetch_all(pool)
    .await
}
