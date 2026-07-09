//! CMS public announcements · admin + governed public read

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Lanes operable via CMS Admin (ttg_round / roadmap remain static SSOT in Phase ①).
pub const CMS_OPS_LANES: &[&str] = &["product", "governance", "protocol_status"];

const PUBLIC_SELECT_COLS: &str = "\
    id, slug, lane, kind, content_tier, pinned, sort_order, \
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en, \
    effective_at, release_at, target_at, cta_kind, cta_href, network_scope, \
    message_key, published_at, updated_at";

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PublicCmsAnnouncementRow {
    pub id: Uuid,
    pub slug: String,
    pub lane: String,
    pub kind: String,
    pub content_tier: String,
    pub pinned: bool,
    pub sort_order: i32,
    pub title_zh: String,
    pub title_en: String,
    pub summary_zh: String,
    pub summary_en: String,
    pub body_zh: Option<String>,
    pub body_en: Option<String>,
    pub effective_at: Option<NaiveDate>,
    pub release_at: Option<NaiveDate>,
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: String,
    pub message_key: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct CmsAnnouncementRow {
    pub id: Uuid,
    pub slug: String,
    pub lane: String,
    pub kind: String,
    pub content_tier: String,
    pub publish_status: String,
    pub pinned: bool,
    pub sort_order: i32,
    pub title_zh: String,
    pub title_en: String,
    pub summary_zh: String,
    pub summary_en: String,
    pub body_zh: Option<String>,
    pub body_en: Option<String>,
    pub effective_at: Option<NaiveDate>,
    pub release_at: Option<NaiveDate>,
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: String,
    pub message_key: Option<String>,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CmsAnnouncementCreateInput {
    pub slug: String,
    pub lane: String,
    pub kind: String,
    pub content_tier: String,
    pub pinned: Option<bool>,
    pub sort_order: Option<i32>,
    pub title_zh: String,
    pub title_en: String,
    pub summary_zh: Option<String>,
    pub summary_en: Option<String>,
    pub body_zh: Option<String>,
    pub body_en: Option<String>,
    pub effective_at: Option<NaiveDate>,
    pub release_at: Option<NaiveDate>,
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: Option<String>,
    pub message_key: Option<String>,
}

fn validate_slug(slug: &str) -> Result<(), &'static str> {
    let s = slug.trim();
    if s.is_empty() {
        return Err("slug_required");
    }
    if s.len() > 120 {
        return Err("invalid_slug");
    }
    if !s
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("invalid_slug");
    }
    Ok(())
}

fn validate_cms_lane(lane: &str) -> Result<(), &'static str> {
    if CMS_OPS_LANES.contains(&lane) {
        Ok(())
    } else {
        Err("invalid_lane")
    }
}

/// Relative `/path` or `https://` only — blocks open redirect / javascript: / data:
pub fn validate_cms_cta_href(href: Option<&str>) -> Result<(), &'static str> {
    let Some(raw) = href.filter(|s| !s.trim().is_empty()) else {
        return Ok(());
    };
    let h = raw.trim();
    let lower = h.to_ascii_lowercase();
    if lower.contains("javascript:") || lower.contains("data:") {
        return Err("invalid_cta_href");
    }
    if h.starts_with('/') && !h.starts_with("//") {
        return Ok(());
    }
    if h.starts_with("https://") && !h.starts_with("https:////") {
        return Ok(());
    }
    Err("invalid_cta_href")
}

fn validate_create_input(input: &CmsAnnouncementCreateInput) -> Result<(), &'static str> {
    validate_slug(&input.slug)?;
    validate_cms_lane(&input.lane)?;
    validate_cms_cta_href(input.cta_href.as_deref())?;
    if input.title_zh.trim().is_empty() || input.title_en.trim().is_empty() {
        return Err("title_required");
    }
    Ok(())
}

fn validate_patch_cta(input: &CmsAnnouncementPatchInput, cur: &CmsAnnouncementRow) -> Result<(), &'static str> {
    let href = input.cta_href.as_deref().or(cur.cta_href.as_deref());
    validate_cms_cta_href(href)?;
    if let Some(lane) = input.lane.as_deref() {
        validate_cms_lane(lane)?;
    }
    Ok(())
}

#[derive(Debug, Deserialize, Default)]
pub struct CmsAnnouncementPatchInput {
    pub version: i32,
    pub lane: Option<String>,
    pub kind: Option<String>,
    pub content_tier: Option<String>,
    pub pinned: Option<bool>,
    pub sort_order: Option<i32>,
    pub title_zh: Option<String>,
    pub title_en: Option<String>,
    pub summary_zh: Option<String>,
    pub summary_en: Option<String>,
    pub body_zh: Option<String>,
    pub body_en: Option<String>,
    pub effective_at: Option<NaiveDate>,
    pub release_at: Option<NaiveDate>,
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: Option<String>,
    pub message_key: Option<String>,
}

pub async fn list_admin_cms_announcements(
    pool: &sqlx::PgPool,
    publish_status: Option<&str>,
    lane: Option<&str>,
) -> Result<Vec<CmsAnnouncementRow>, sqlx::Error> {
    let mut qb = sqlx::QueryBuilder::new(
        "SELECT id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                message_key, version, published_at, updated_at
         FROM cms_public_announcements WHERE 1=1",
    );
    if let Some(st) = publish_status.filter(|s| !s.is_empty()) {
        qb.push(" AND publish_status = ");
        qb.push_bind(st);
    }
    if let Some(l) = lane.filter(|s| !s.is_empty()) {
        qb.push(" AND lane = ");
        qb.push_bind(l);
    }
    qb.push(" ORDER BY sort_order DESC, updated_at DESC");
    qb.build_query_as::<CmsAnnouncementRow>()
        .fetch_all(pool)
        .await
}

pub async fn get_admin_cms_announcement_by_id(
    pool: &sqlx::PgPool,
    id: Uuid,
) -> Result<Option<CmsAnnouncementRow>, sqlx::Error> {
    sqlx::query_as::<_, CmsAnnouncementRow>(
        "SELECT id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                message_key, version, published_at, updated_at
         FROM cms_public_announcements WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_cms_announcement(
    pool: &sqlx::PgPool,
    input: &CmsAnnouncementCreateInput,
) -> Result<Result<CmsAnnouncementRow, &'static str>, sqlx::Error> {
    if let Err(code) = validate_create_input(input) {
        return Ok(Err(code));
    }
    let slug = input.slug.trim();
    let row = sqlx::query_as::<_, CmsAnnouncementRow>(
        "INSERT INTO cms_public_announcements
            (slug, lane, kind, content_tier, pinned, sort_order, title_zh, title_en,
             summary_zh, summary_en, body_zh, body_en, effective_at, release_at, target_at,
             cta_kind, cta_href, network_scope, message_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                   message_key, version, published_at, updated_at",
    )
    .bind(slug)
    .bind(&input.lane)
    .bind(&input.kind)
    .bind(&input.content_tier)
    .bind(input.pinned.unwrap_or(false))
    .bind(input.sort_order.unwrap_or(0))
    .bind(&input.title_zh)
    .bind(&input.title_en)
    .bind(input.summary_zh.as_deref().unwrap_or(""))
    .bind(input.summary_en.as_deref().unwrap_or(""))
    .bind(&input.body_zh)
    .bind(&input.body_en)
    .bind(input.effective_at)
    .bind(input.release_at)
    .bind(input.target_at)
    .bind(&input.cta_kind)
    .bind(&input.cta_href)
    .bind(input.network_scope.as_deref().unwrap_or("none"))
    .bind(&input.message_key)
    .fetch_one(pool)
    .await;
    match row {
        Ok(r) => Ok(Ok(r)),
        Err(sqlx::Error::Database(e)) if e.code().as_deref() == Some("23505") => Ok(Err("slug_conflict")),
        Err(e) => Err(e),
    }
}

pub async fn patch_cms_announcement(
    pool: &sqlx::PgPool,
    id: Uuid,
    input: &CmsAnnouncementPatchInput,
) -> Result<Result<CmsAnnouncementRow, &'static str>, sqlx::Error> {
    let current = get_admin_cms_announcement_by_id(pool, id).await?;
    let Some(cur) = current else {
        return Ok(Err("not_found"));
    };
    if cur.version != input.version {
        return Ok(Err("version_conflict"));
    }
    if cur.publish_status == "published" || cur.publish_status == "archived" {
        return Ok(Err("published_immutable"));
    }
    if let Err(code) = validate_patch_cta(input, &cur) {
        return Ok(Err(code));
    }
    let lane = input.lane.as_deref().unwrap_or(&cur.lane);
    let kind = input.kind.as_deref().unwrap_or(&cur.kind);
    let content_tier = input.content_tier.as_deref().unwrap_or(&cur.content_tier);
    let pinned = input.pinned.unwrap_or(cur.pinned);
    let sort_order = input.sort_order.unwrap_or(cur.sort_order);
    let title_zh = input.title_zh.as_deref().unwrap_or(&cur.title_zh);
    let title_en = input.title_en.as_deref().unwrap_or(&cur.title_en);
    let summary_zh = input.summary_zh.as_deref().unwrap_or(&cur.summary_zh);
    let summary_en = input.summary_en.as_deref().unwrap_or(&cur.summary_en);
    let cur_body_zh = cur.body_zh.as_deref();
    let cur_body_en = cur.body_en.as_deref();
    let body_zh = input.body_zh.as_deref().or(cur_body_zh);
    let body_en = input.body_en.as_deref().or(cur_body_en);
    let effective_at = input.effective_at.or(cur.effective_at);
    let release_at = input.release_at.or(cur.release_at);
    let target_at = input.target_at.or(cur.target_at);
    let cta_kind = input.cta_kind.as_deref().or(cur.cta_kind.as_deref());
    let cta_href = input.cta_href.as_deref().or(cur.cta_href.as_deref());
    let network_scope = input.network_scope.as_deref().unwrap_or(&cur.network_scope);
    let message_key = input.message_key.as_deref().or(cur.message_key.as_deref());

    let row = sqlx::query_as::<_, CmsAnnouncementRow>(
        "UPDATE cms_public_announcements SET
            lane = $2, kind = $3, content_tier = $4, pinned = $5, sort_order = $6,
            title_zh = $7, title_en = $8, summary_zh = $9, summary_en = $10,
            body_zh = $11, body_en = $12, effective_at = $13,
            release_at = $14, target_at = $15, cta_kind = $16, cta_href = $17,
            network_scope = $18, message_key = $19,
            version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $20
         RETURNING id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                   message_key, version, published_at, updated_at",
    )
    .bind(id)
    .bind(lane)
    .bind(kind)
    .bind(content_tier)
    .bind(pinned)
    .bind(sort_order)
    .bind(title_zh)
    .bind(title_en)
    .bind(summary_zh)
    .bind(summary_en)
    .bind(body_zh)
    .bind(body_en)
    .bind(effective_at)
    .bind(release_at)
    .bind(target_at)
    .bind(cta_kind)
    .bind(cta_href)
    .bind(network_scope)
    .bind(message_key)
    .bind(input.version)
    .fetch_optional(pool)
    .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn submit_cms_announcement_review(
    pool: &sqlx::PgPool,
    id: Uuid,
    version: i32,
) -> Result<Result<CmsAnnouncementRow, &'static str>, sqlx::Error> {
    let row = sqlx::query_as::<_, CmsAnnouncementRow>(
        "UPDATE cms_public_announcements SET
            publish_status = 'in_review', version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND publish_status = 'draft'
         RETURNING id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                   message_key, version, published_at, updated_at",
    )
    .bind(id)
    .bind(version)
    .fetch_optional(pool)
    .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn set_cms_announcement_publish_status(
    pool: &sqlx::PgPool,
    id: Uuid,
    version: i32,
    publish: bool,
) -> Result<Result<CmsAnnouncementRow, &'static str>, sqlx::Error> {
    let current = get_admin_cms_announcement_by_id(pool, id).await?;
    let Some(cur) = current else {
        return Ok(Err("not_found"));
    };
    if cur.version != version {
        return Ok(Err("version_conflict"));
    }
    if publish {
        if cur.publish_status != "draft" && cur.publish_status != "in_review" {
            return Ok(Err("invalid_publish_transition"));
        }
    } else if cur.publish_status != "published" {
        return Ok(Err("invalid_unpublish_transition"));
    }
    let status = if publish { "published" } else { "draft" };
    let published_clause = if publish {
        ", published_at = COALESCE(published_at, now())"
    } else {
        ""
    };
    let sql = format!(
        "UPDATE cms_public_announcements SET
            publish_status = $2, version = version + 1, updated_at = now(){published_clause}
         WHERE id = $1 AND version = $3
         RETURNING id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                   message_key, version, published_at, updated_at"
    );
    let row = sqlx::query_as::<_, CmsAnnouncementRow>(&sql)
        .bind(id)
        .bind(status)
        .bind(version)
        .fetch_optional(pool)
        .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn archive_cms_announcement(
    pool: &sqlx::PgPool,
    id: Uuid,
    version: i32,
) -> Result<Result<CmsAnnouncementRow, &'static str>, sqlx::Error> {
    let row = sqlx::query_as::<_, CmsAnnouncementRow>(
        "UPDATE cms_public_announcements SET
            publish_status = 'archived', version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND publish_status IN ('draft', 'in_review', 'published')
         RETURNING id, slug, lane, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   effective_at, release_at, target_at, cta_kind, cta_href, network_scope,
                   message_key, version, published_at, updated_at",
    )
    .bind(id)
    .bind(version)
    .fetch_optional(pool)
    .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn list_public_cms_announcements(
    pool: &sqlx::PgPool,
    lane: Option<&str>,
    pulse_only: bool,
    limit: i64,
) -> Result<Vec<PublicCmsAnnouncementRow>, sqlx::Error> {
    let mut qb = sqlx::QueryBuilder::new(format!(
        "SELECT {PUBLIC_SELECT_COLS} FROM governed_public_announcements_v1 WHERE 1=1"
    ));
    if pulse_only {
        qb.push(" AND lane = 'product'");
    } else if let Some(l) = lane.filter(|s| !s.is_empty() && *s != "all") {
        if validate_cms_lane(l).is_err() {
            return Ok(vec![]);
        }
        qb.push(" AND lane = ");
        qb.push_bind(l);
    }
    qb.push(" ORDER BY pinned DESC, sort_order DESC, published_at DESC NULLS LAST");
    qb.push(" LIMIT ");
    qb.push_bind(limit.max(1).min(100));
    qb.build_query_as::<PublicCmsAnnouncementRow>()
        .fetch_all(pool)
        .await
}

pub async fn get_public_cms_announcement_by_slug(
    pool: &sqlx::PgPool,
    slug: &str,
) -> Result<Option<PublicCmsAnnouncementRow>, sqlx::Error> {
    sqlx::query_as::<_, PublicCmsAnnouncementRow>(&format!(
        "SELECT {PUBLIC_SELECT_COLS} FROM governed_public_announcements_v1 WHERE slug = $1"
    ))
    .bind(slug)
    .fetch_optional(pool)
    .await
}
