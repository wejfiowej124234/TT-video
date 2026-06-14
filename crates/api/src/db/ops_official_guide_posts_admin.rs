//! Admin Official Guide Posts M8 (O-S2 · 101/103 SSOT)

use chrono::{DateTime, Utc};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

const STATUS_DRAFT: &str = "draft";
const STATUS_IN_REVIEW: &str = "in_review";
const STATUS_PUBLISHED: &str = "published";
const STATUS_ARCHIVED: &str = "archived";

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminOfficialGuidePostRow {
    pub id: Uuid,
    pub community_post_id: Option<Uuid>,
    pub author_account_id: Uuid,
    pub title: String,
    pub body: String,
    pub destination: Option<String>,
    pub tags: Vec<String>,
    pub cover_url: Option<String>,
    pub featured: bool,
    pub publish_status: String,
    pub data_origin: String,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub author_display_label: Option<String>,
    pub author_user_email: Option<String>,
}

async fn reload_official_guide_post(
    pool: &PgPool,
    id: Uuid,
) -> Result<Result<AdminOfficialGuidePostRow, &'static str>, sqlx::Error> {
    match get_official_guide_post_admin(pool, id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

pub async fn list_official_guide_posts_admin(
    pool: &PgPool,
    author_account_id: Option<Uuid>,
    publish_status: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminOfficialGuidePostRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT g.id, g.community_post_id, g.author_account_id, g.title, g.body, g.destination,
                  g.tags, g.cover_url, g.featured, g.publish_status, g.data_origin, g.published_at,
                  g.created_at, g.updated_at,
                  a.display_label AS author_display_label, u.email AS author_user_email
           FROM ops_official_guide_posts g
           JOIN ops_official_accounts a ON a.id = g.author_account_id
           JOIN users u ON u.id = a.user_id
           WHERE ($1::uuid IS NULL OR g.author_account_id = $1)
             AND ($2::text IS NULL OR g.publish_status = $2)
           ORDER BY g.updated_at DESC
           LIMIT $3"#,
    )
    .bind(author_account_id)
    .bind(publish_status)
    .bind(limit.clamp(1, 200))
    .fetch_all(pool)
    .await
}

pub async fn get_official_guide_post_admin(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminOfficialGuidePostRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT g.id, g.community_post_id, g.author_account_id, g.title, g.body, g.destination,
                  g.tags, g.cover_url, g.featured, g.publish_status, g.data_origin, g.published_at,
                  g.created_at, g.updated_at,
                  a.display_label AS author_display_label, u.email AS author_user_email
           FROM ops_official_guide_posts g
           JOIN ops_official_accounts a ON a.id = g.author_account_id
           JOIN users u ON u.id = a.user_id
           WHERE g.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub struct CreateOfficialGuidePostInput {
    pub author_account_id: Uuid,
    pub title: String,
    pub body: String,
    pub destination: Option<String>,
    pub tags: Vec<String>,
    pub cover_url: Option<String>,
    pub featured: bool,
}

pub async fn create_official_guide_post_admin(
    pool: &PgPool,
    actor_id: Uuid,
    input: CreateOfficialGuidePostInput,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialGuidePostRow, &'static str>, sqlx::Error> {
    let account: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM ops_official_accounts WHERE id = $1")
            .bind(input.author_account_id)
            .fetch_optional(pool)
            .await?;
    if account.is_none() {
        return Ok(Err("author_account_not_found"));
    }
    let title = input.title.trim();
    if title.is_empty() {
        return Ok(Err("invalid_title"));
    }
    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO ops_official_guide_posts
           (author_account_id, title, body, destination, tags, cover_url, featured,
            publish_status, data_origin, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 'official_seed', $8, $8)
           RETURNING id"#,
    )
    .bind(input.author_account_id)
    .bind(title)
    .bind(input.body.trim())
    .bind(input.destination.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(&input.tags)
    .bind(input.cover_url.as_deref().filter(|s| !s.is_empty()))
    .bind(input.featured)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;
    insert_official_guide_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.guide.created",
        id,
        json!({ "author_account_id": input.author_account_id, "title": title }),
    )
    .await?;
    reload_official_guide_post(pool, id).await
}

#[derive(Debug, Default)]
pub struct PatchOfficialGuidePostInput {
    pub title: Option<String>,
    pub body: Option<String>,
    pub destination: Option<String>,
    pub tags: Option<Vec<String>>,
    pub cover_url: Option<String>,
    pub featured: Option<bool>,
    pub author_account_id: Option<Uuid>,
}

pub async fn patch_official_guide_post_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    input: PatchOfficialGuidePostInput,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialGuidePostRow, &'static str>, sqlx::Error> {
    let row = get_official_guide_post_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status == STATUS_ARCHIVED {
        return Ok(Err("archived"));
    }
    if row.publish_status == STATUS_PUBLISHED && input.author_account_id.is_some() {
        return Ok(Err("cannot_rebind_published"));
    }
    if let Some(new_author) = input.author_account_id {
        let exists: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM ops_official_accounts WHERE id = $1")
                .bind(new_author)
                .fetch_optional(pool)
                .await?;
        if exists.is_none() {
            return Ok(Err("author_account_not_found"));
        }
    }
    let title = input
        .title
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(row.title.as_str());
    let body = input.body.as_deref().unwrap_or(row.body.as_str());
    let destination = input
        .destination
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .or(row.destination);
    let tags = input.tags.unwrap_or(row.tags);
    let cover_url = input
        .cover_url
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .or(row.cover_url);
    let featured = input.featured.unwrap_or(row.featured);
    let author_account_id = input.author_account_id.unwrap_or(row.author_account_id);
    sqlx::query(
        r#"UPDATE ops_official_guide_posts
           SET author_account_id = $2, title = $3, body = $4, destination = $5, tags = $6,
               cover_url = $7, featured = $8, updated_at = $9
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(author_account_id)
    .bind(title)
    .bind(body)
    .bind(destination)
    .bind(tags)
    .bind(cover_url)
    .bind(featured)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_guide_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.guide.updated",
        id,
        json!({ "title": title }),
    )
    .await?;
    reload_official_guide_post(pool, id).await
}

pub async fn submit_official_guide_post_review(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialGuidePostRow, &'static str>, sqlx::Error> {
    let row = get_official_guide_post_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != STATUS_DRAFT {
        return Ok(Err("not_draft"));
    }
    sqlx::query(
        "UPDATE ops_official_guide_posts SET publish_status = 'in_review', updated_at = $2 WHERE id = $1",
    )
    .bind(id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_official_guide_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.guide.submit_review",
        id,
        json!({}),
    )
    .await?;
    reload_official_guide_post(pool, id).await
}

pub async fn request_official_guide_post_publish(
    pool: &PgPool,
    id: Uuid,
    requested_by: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Result<Uuid, &'static str>, sqlx::Error> {
    let row = get_official_guide_post_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != STATUS_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('ops.official.guide.publish', 'ops_official_guide_post', $1, $2, 'pending', $3, $4, $5, $6)
           RETURNING id"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(json!({ "publish_status": row.publish_status, "title": row.title }))
    .bind(json!({ "publish_status": STATUS_PUBLISHED, "content_tier": "official" }))
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.official.guide.publish.requested', 'ops_official_guide_post', $1, $2, $3, $4, $5)"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Ok(approval_id))
}

fn community_post_body(title: &str, body: &str) -> String {
    let b = body.trim();
    if b.starts_with(title.trim()) {
        b.to_string()
    } else {
        format!("{}\n\n{}", title.trim(), b)
    }
}

async fn project_guide_to_community_post(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    guide: &AdminOfficialGuidePostRow,
    user_id: Uuid,
) -> Result<Uuid, sqlx::Error> {
    let post_body = community_post_body(&guide.title, &guide.body);
    let post_type = if guide.cover_url.is_some() {
        "photo"
    } else {
        "text"
    };
    let media_urls: Vec<String> = guide
        .cover_url
        .as_ref()
        .map(|u| vec![u.clone()])
        .unwrap_or_default();
    if let Some(post_id) = guide.community_post_id {
        sqlx::query(
            r#"UPDATE community_posts
               SET user_id = $2, body = $3, post_type = $4, destination = $5, tags = $6,
                   media_urls = $7, cover_url = $8, data_origin = 'production',
                   content_tier = 'official', official_account_id = $9, visibility_status = 'public'
               WHERE id = $1"#,
        )
        .bind(post_id)
        .bind(user_id)
        .bind(&post_body)
        .bind(post_type)
        .bind(guide.destination.as_deref())
        .bind(&guide.tags)
        .bind(&media_urls)
        .bind(guide.cover_url.as_deref())
        .bind(guide.author_account_id)
        .execute(&mut **tx)
        .await?;
        Ok(post_id)
    } else {
        let post_id: Uuid = sqlx::query_scalar(
            r#"INSERT INTO community_posts
               (user_id, body, post_type, destination, tags, media_urls, cover_url, data_origin,
                content_tier, official_account_id, visibility_status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'production', 'official', $8, 'public', $9)
               RETURNING id"#,
        )
        .bind(user_id)
        .bind(&post_body)
        .bind(post_type)
        .bind(guide.destination.as_deref())
        .bind(&guide.tags)
        .bind(&media_urls)
        .bind(guide.cover_url.as_deref())
        .bind(guide.author_account_id)
        .bind(Utc::now())
        .fetch_one(&mut **tx)
        .await?;
        Ok(post_id)
    }
}

pub async fn publish_official_guide_post_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialGuidePostRow, &'static str>, sqlx::Error> {
    let row = get_official_guide_post_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != STATUS_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let author: Option<(Uuid, bool)> = sqlx::query_as(
        "SELECT user_id, is_active FROM ops_official_accounts WHERE id = $1",
    )
    .bind(row.author_account_id)
    .fetch_optional(pool)
    .await?;
    let Some((user_id, is_active)) = author else {
        return Ok(Err("author_account_not_found"));
    };
    if !is_active {
        return Ok(Err("author_account_inactive"));
    }
    let now = Utc::now();
    let mut tx = pool.begin().await?;
    let community_post_id = project_guide_to_community_post(&mut tx, &row, user_id).await?;
    sqlx::query(
        r#"UPDATE ops_official_guide_posts
           SET community_post_id = $2, publish_status = 'published', data_origin = 'production',
               published_at = $3, updated_at = $3
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(community_post_id)
    .bind(now)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.official.guide.published', 'ops_official_guide_post', $1, $2, $3, $4, $5)"#,
    )
    .bind(id.to_string())
    .bind(actor_id)
    .bind(request_id)
    .bind(json!({ "community_post_id": community_post_id, "content_tier": "official" }))
    .bind(now)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    reload_official_guide_post(pool, id).await
}

pub async fn approve_official_guide_publish_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approver_id: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<(Uuid, Uuid)>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let existing: Option<(String, String, String, Uuid, String)> = sqlx::query_as(
        r#"SELECT action, resource_type, resource_id, requested_by, status
           FROM admin_approval_requests WHERE id = $1 FOR UPDATE"#,
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(existing) = existing else {
        return Ok(None);
    };
    if existing.0 != "ops.official.guide.publish" || existing.4 != "pending" {
        return Ok(None);
    }
    if existing.3 == approver_id {
        return Ok(None);
    }
    let guide_id = Uuid::parse_str(&existing.2).unwrap_or_else(|_| Uuid::nil());
    if guide_id.is_nil() {
        return Ok(None);
    }
    sqlx::query(
        r#"UPDATE admin_approval_requests SET status = 'approved', approved_by = $2, approve_reason = $3, approved_at = $4
           WHERE id = $1"#,
    )
    .bind(approval_id)
    .bind(approver_id)
    .bind(reason)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    match publish_official_guide_post_admin(pool, guide_id, approver_id, request_id).await? {
        Ok(_) => Ok(Some((approval_id, guide_id))),
        Err(_) => Ok(None),
    }
}

pub async fn archive_official_guide_post_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminOfficialGuidePostRow, &'static str>, sqlx::Error> {
    let row = get_official_guide_post_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    sqlx::query(
        "UPDATE ops_official_guide_posts SET publish_status = 'archived', updated_at = $2 WHERE id = $1",
    )
    .bind(id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    if let Some(post_id) = row.community_post_id {
        let _ = sqlx::query(
            "UPDATE community_posts SET visibility_status = 'archived' WHERE id = $1",
        )
        .bind(post_id)
        .execute(pool)
        .await;
    }
    insert_official_guide_audit(
        pool,
        actor_id,
        request_id,
        "ops.official.guide.archived",
        id,
        json!({}),
    )
    .await?;
    reload_official_guide_post(pool, id).await
}

async fn insert_official_guide_audit(
    pool: &PgPool,
    actor_id: Uuid,
    request_id: Option<&str>,
    action: &str,
    guide_id: Uuid,
    payload: serde_json::Value,
) -> Result<(), sqlx::Error> {
    super::insert_admin_audit_log(
        pool,
        actor_id,
        request_id,
        action,
        Some("ops_official_guide_post"),
        Some(guide_id.to_string().as_str()),
        &payload,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn community_post_body_prefixes_title() {
        assert!(community_post_body("曼谷三日", "正文").starts_with("曼谷三日"));
    }
}
