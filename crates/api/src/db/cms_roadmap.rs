//! CMS product roadmap · section config + milestones (lane=roadmap, excluded from Pulse)

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use super::cms_announcements::{
    archive_cms_announcement, set_cms_announcement_publish_status, submit_cms_announcement_review,
    validate_cms_cta_href, CmsAnnouncementRow,
};

pub const ROADMAP_SECTION_KEY: &str = "active";
pub const ROADMAP_LANE: &str = "roadmap";

const MILESTONE_PUBLIC_COLS: &str = "\
    id, slug, kind, content_tier, pinned, sort_order, \
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en, \
    target_at, cta_kind, cta_href, network_scope, message_key, ops_status, \
    published_at, updated_at";

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct RoadmapSectionAdminRow {
    pub id: Uuid,
    pub singleton_key: String,
    pub anchor_id: String,
    pub period_label: String,
    pub kicker_zh: String,
    pub kicker_en: String,
    pub title_zh: String,
    pub title_en: String,
    pub subtitle_zh: String,
    pub subtitle_en: String,
    pub disclaimer_zh: String,
    pub disclaimer_en: String,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct RoadmapSectionPublicRow {
    pub anchor_id: String,
    pub period_label: String,
    pub kicker_zh: String,
    pub kicker_en: String,
    pub title_zh: String,
    pub title_en: String,
    pub subtitle_zh: String,
    pub subtitle_en: String,
    pub disclaimer_zh: String,
    pub disclaimer_en: String,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct RoadmapMilestonePublicRow {
    pub id: Uuid,
    pub slug: String,
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
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: String,
    pub message_key: Option<String>,
    pub ops_status: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct RoadmapMilestoneAdminRow {
    pub id: Uuid,
    pub slug: String,
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
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: String,
    pub message_key: Option<String>,
    pub ops_status: Option<String>,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RoadmapSectionPatchInput {
    pub version: i32,
    pub anchor_id: Option<String>,
    pub period_label: Option<String>,
    pub kicker_zh: Option<String>,
    pub kicker_en: Option<String>,
    pub title_zh: Option<String>,
    pub title_en: Option<String>,
    pub subtitle_zh: Option<String>,
    pub subtitle_en: Option<String>,
    pub disclaimer_zh: Option<String>,
    pub disclaimer_en: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RoadmapMilestoneCreateInput {
    pub slug: String,
    pub kind: String,
    pub pinned: Option<bool>,
    pub sort_order: Option<i32>,
    pub title_zh: String,
    pub title_en: String,
    pub summary_zh: Option<String>,
    pub summary_en: Option<String>,
    pub body_zh: Option<String>,
    pub body_en: Option<String>,
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: Option<String>,
    pub message_key: Option<String>,
    pub ops_status: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct RoadmapMilestonePatchInput {
    pub version: i32,
    pub kind: Option<String>,
    pub pinned: Option<bool>,
    pub sort_order: Option<i32>,
    pub title_zh: Option<String>,
    pub title_en: Option<String>,
    pub summary_zh: Option<String>,
    pub summary_en: Option<String>,
    pub body_zh: Option<String>,
    pub body_en: Option<String>,
    pub target_at: Option<NaiveDate>,
    pub cta_kind: Option<String>,
    pub cta_href: Option<String>,
    pub network_scope: Option<String>,
    pub message_key: Option<String>,
    pub ops_status: Option<String>,
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

fn validate_ops_status(v: Option<&str>) -> Result<(), &'static str> {
    match v {
        None | Some("planned") | Some("in_progress") | Some("completed") => Ok(()),
        Some(_) => Err("invalid_ops_status"),
    }
}

fn validate_milestone_create(input: &RoadmapMilestoneCreateInput) -> Result<(), &'static str> {
    validate_slug(&input.slug)?;
    validate_cms_cta_href(input.cta_href.as_deref())?;
    validate_ops_status(input.ops_status.as_deref())?;
    if input.title_zh.trim().is_empty() || input.title_en.trim().is_empty() {
        return Err("title_required");
    }
    Ok(())
}

pub async fn get_admin_roadmap_section(
    pool: &sqlx::PgPool,
) -> Result<Option<RoadmapSectionAdminRow>, sqlx::Error> {
    sqlx::query_as::<_, RoadmapSectionAdminRow>(
        "SELECT id, singleton_key, anchor_id, period_label, kicker_zh, kicker_en,
                title_zh, title_en, subtitle_zh, subtitle_en, disclaimer_zh, disclaimer_en,
                publish_status, version, published_at, updated_at
         FROM cms_roadmap_section WHERE singleton_key = $1",
    )
    .bind(ROADMAP_SECTION_KEY)
    .fetch_optional(pool)
    .await
}

pub async fn patch_roadmap_section(
    pool: &sqlx::PgPool,
    input: &RoadmapSectionPatchInput,
) -> Result<Result<RoadmapSectionAdminRow, &'static str>, sqlx::Error> {
    let current = get_admin_roadmap_section(pool).await?;
    let Some(cur) = current else {
        return Ok(Err("not_found"));
    };
    if cur.version != input.version {
        return Ok(Err("version_conflict"));
    }
    if cur.publish_status == "published" || cur.publish_status == "archived" {
        return Ok(Err("published_immutable"));
    }
    let row = sqlx::query_as::<_, RoadmapSectionAdminRow>(
        "UPDATE cms_roadmap_section SET
            anchor_id = $2, period_label = $3, kicker_zh = $4, kicker_en = $5,
            title_zh = $6, title_en = $7, subtitle_zh = $8, subtitle_en = $9,
            disclaimer_zh = $10, disclaimer_en = $11,
            version = version + 1, updated_at = now()
         WHERE singleton_key = $1 AND version = $12
         RETURNING id, singleton_key, anchor_id, period_label, kicker_zh, kicker_en,
                   title_zh, title_en, subtitle_zh, subtitle_en, disclaimer_zh, disclaimer_en,
                   publish_status, version, published_at, updated_at",
    )
    .bind(ROADMAP_SECTION_KEY)
    .bind(input.anchor_id.as_deref().unwrap_or(&cur.anchor_id))
    .bind(input.period_label.as_deref().unwrap_or(&cur.period_label))
    .bind(input.kicker_zh.as_deref().unwrap_or(&cur.kicker_zh))
    .bind(input.kicker_en.as_deref().unwrap_or(&cur.kicker_en))
    .bind(input.title_zh.as_deref().unwrap_or(&cur.title_zh))
    .bind(input.title_en.as_deref().unwrap_or(&cur.title_en))
    .bind(input.subtitle_zh.as_deref().unwrap_or(&cur.subtitle_zh))
    .bind(input.subtitle_en.as_deref().unwrap_or(&cur.subtitle_en))
    .bind(input.disclaimer_zh.as_deref().unwrap_or(&cur.disclaimer_zh))
    .bind(input.disclaimer_en.as_deref().unwrap_or(&cur.disclaimer_en))
    .bind(input.version)
    .fetch_optional(pool)
    .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn submit_roadmap_section_review(
    pool: &sqlx::PgPool,
    version: i32,
) -> Result<Result<RoadmapSectionAdminRow, &'static str>, sqlx::Error> {
    let row = sqlx::query_as::<_, RoadmapSectionAdminRow>(
        "UPDATE cms_roadmap_section SET
            publish_status = 'in_review', version = version + 1, updated_at = now()
         WHERE singleton_key = $1 AND version = $2 AND publish_status = 'draft'
         RETURNING id, singleton_key, anchor_id, period_label, kicker_zh, kicker_en,
                   title_zh, title_en, subtitle_zh, subtitle_en, disclaimer_zh, disclaimer_en,
                   publish_status, version, published_at, updated_at",
    )
    .bind(ROADMAP_SECTION_KEY)
    .bind(version)
    .fetch_optional(pool)
    .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn set_roadmap_section_publish_status(
    pool: &sqlx::PgPool,
    version: i32,
    publish: bool,
) -> Result<Result<RoadmapSectionAdminRow, &'static str>, sqlx::Error> {
    let current = get_admin_roadmap_section(pool).await?;
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
        "UPDATE cms_roadmap_section SET
            publish_status = $2, version = version + 1, updated_at = now(){published_clause}
         WHERE singleton_key = $1 AND version = $3
         RETURNING id, singleton_key, anchor_id, period_label, kicker_zh, kicker_en,
                   title_zh, title_en, subtitle_zh, subtitle_en, disclaimer_zh, disclaimer_en,
                   publish_status, version, published_at, updated_at"
    );
    let row = sqlx::query_as::<_, RoadmapSectionAdminRow>(&sql)
        .bind(ROADMAP_SECTION_KEY)
        .bind(status)
        .bind(version)
        .fetch_optional(pool)
        .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn get_public_roadmap_section(
    pool: &sqlx::PgPool,
) -> Result<Option<RoadmapSectionPublicRow>, sqlx::Error> {
    sqlx::query_as::<_, RoadmapSectionPublicRow>(
        "SELECT anchor_id, period_label, kicker_zh, kicker_en, title_zh, title_en,
                subtitle_zh, subtitle_en, disclaimer_zh, disclaimer_en, published_at, updated_at
         FROM governed_public_roadmap_section_v1 LIMIT 1",
    )
    .fetch_optional(pool)
    .await
}

pub async fn list_public_roadmap_milestones(
    pool: &sqlx::PgPool,
    limit: i64,
) -> Result<Vec<RoadmapMilestonePublicRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {MILESTONE_PUBLIC_COLS}
         FROM governed_public_roadmap_milestones_v1
         ORDER BY sort_order DESC, published_at DESC NULLS LAST
         LIMIT $1"
    );
    sqlx::query_as::<_, RoadmapMilestonePublicRow>(&sql)
        .bind(limit.max(1).min(50))
        .fetch_all(pool)
        .await
}

pub async fn list_admin_roadmap_milestones(
    pool: &sqlx::PgPool,
    publish_status: Option<&str>,
) -> Result<Vec<RoadmapMilestoneAdminRow>, sqlx::Error> {
    let mut qb = sqlx::QueryBuilder::new(
        "SELECT id, slug, kind, content_tier, publish_status, pinned, sort_order,
                title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                target_at, cta_kind, cta_href, network_scope, message_key, ops_status,
                version, published_at, updated_at
         FROM cms_public_announcements WHERE lane = 'roadmap'",
    );
    if let Some(st) = publish_status.filter(|s| !s.is_empty()) {
        qb.push(" AND publish_status = ");
        qb.push_bind(st);
    }
    qb.push(" ORDER BY sort_order DESC, updated_at DESC");
    qb.build_query_as::<RoadmapMilestoneAdminRow>()
        .fetch_all(pool)
        .await
}

pub async fn get_admin_roadmap_milestone_by_id(
    pool: &sqlx::PgPool,
    id: Uuid,
) -> Result<Option<RoadmapMilestoneAdminRow>, sqlx::Error> {
    sqlx::query_as::<_, RoadmapMilestoneAdminRow>(
        "SELECT id, slug, kind, content_tier, publish_status, pinned, sort_order,
                title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                target_at, cta_kind, cta_href, network_scope, message_key, ops_status,
                version, published_at, updated_at
         FROM cms_public_announcements WHERE id = $1 AND lane = 'roadmap'",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_roadmap_milestone(
    pool: &sqlx::PgPool,
    input: &RoadmapMilestoneCreateInput,
) -> Result<Result<RoadmapMilestoneAdminRow, &'static str>, sqlx::Error> {
    if let Err(code) = validate_milestone_create(input) {
        return Ok(Err(code));
    }
    let slug = input.slug.trim();
    let row = sqlx::query_as::<_, RoadmapMilestoneAdminRow>(
        "INSERT INTO cms_public_announcements
            (slug, lane, kind, content_tier, pinned, sort_order, title_zh, title_en,
             summary_zh, summary_en, body_zh, body_en, target_at, cta_kind, cta_href,
             network_scope, message_key, ops_status)
         VALUES ($1, 'roadmap', $2, 'roadmap', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id, slug, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   target_at, cta_kind, cta_href, network_scope, message_key, ops_status,
                   version, published_at, updated_at",
    )
    .bind(slug)
    .bind(&input.kind)
    .bind(input.pinned.unwrap_or(false))
    .bind(input.sort_order.unwrap_or(0))
    .bind(&input.title_zh)
    .bind(&input.title_en)
    .bind(input.summary_zh.as_deref().unwrap_or(""))
    .bind(input.summary_en.as_deref().unwrap_or(""))
    .bind(&input.body_zh)
    .bind(&input.body_en)
    .bind(input.target_at)
    .bind(&input.cta_kind)
    .bind(&input.cta_href)
    .bind(input.network_scope.as_deref().unwrap_or("none"))
    .bind(&input.message_key)
    .bind(input.ops_status.as_deref().unwrap_or("planned"))
    .fetch_one(pool)
    .await;
    match row {
        Ok(r) => Ok(Ok(r)),
        Err(sqlx::Error::Database(e)) if e.code().as_deref() == Some("23505") => Ok(Err("slug_conflict")),
        Err(e) => Err(e),
    }
}

pub async fn patch_roadmap_milestone(
    pool: &sqlx::PgPool,
    id: Uuid,
    input: &RoadmapMilestonePatchInput,
) -> Result<Result<RoadmapMilestoneAdminRow, &'static str>, sqlx::Error> {
    let current = get_admin_roadmap_milestone_by_id(pool, id).await?;
    let Some(cur) = current else {
        return Ok(Err("not_found"));
    };
    if cur.version != input.version {
        return Ok(Err("version_conflict"));
    }
    if cur.publish_status == "published" || cur.publish_status == "archived" {
        return Ok(Err("published_immutable"));
    }
    let href = input.cta_href.as_deref().or(cur.cta_href.as_deref());
    if validate_cms_cta_href(href).is_err() {
        return Ok(Err("invalid_cta_href"));
    }
    if validate_ops_status(input.ops_status.as_deref()).is_err() {
        return Ok(Err("invalid_ops_status"));
    }
    let row = sqlx::query_as::<_, RoadmapMilestoneAdminRow>(
        "UPDATE cms_public_announcements SET
            kind = $2, pinned = $3, sort_order = $4, title_zh = $5, title_en = $6,
            summary_zh = $7, summary_en = $8, body_zh = $9, body_en = $10,
            target_at = $11, cta_kind = $12, cta_href = $13, network_scope = $14,
            message_key = $15, ops_status = $16,
            version = version + 1, updated_at = now()
         WHERE id = $1 AND lane = 'roadmap' AND version = $17
         RETURNING id, slug, kind, content_tier, publish_status, pinned, sort_order,
                   title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
                   target_at, cta_kind, cta_href, network_scope, message_key, ops_status,
                   version, published_at, updated_at",
    )
    .bind(id)
    .bind(input.kind.as_deref().unwrap_or(&cur.kind))
    .bind(input.pinned.unwrap_or(cur.pinned))
    .bind(input.sort_order.unwrap_or(cur.sort_order))
    .bind(input.title_zh.as_deref().unwrap_or(&cur.title_zh))
    .bind(input.title_en.as_deref().unwrap_or(&cur.title_en))
    .bind(input.summary_zh.as_deref().unwrap_or(&cur.summary_zh))
    .bind(input.summary_en.as_deref().unwrap_or(&cur.summary_en))
    .bind(input.body_zh.as_deref().or(cur.body_zh.as_deref()))
    .bind(input.body_en.as_deref().or(cur.body_en.as_deref()))
    .bind(input.target_at.or(cur.target_at))
    .bind(input.cta_kind.as_deref().or(cur.cta_kind.as_deref()))
    .bind(input.cta_href.as_deref().or(cur.cta_href.as_deref()))
    .bind(input.network_scope.as_deref().unwrap_or(&cur.network_scope))
    .bind(input.message_key.as_deref().or(cur.message_key.as_deref()))
    .bind(input.ops_status.as_deref().or(cur.ops_status.as_deref()))
    .bind(input.version)
    .fetch_optional(pool)
    .await?;
    Ok(row.ok_or("version_conflict"))
}

pub async fn roadmap_milestone_workflow(
    pool: &sqlx::PgPool,
    id: Uuid,
    version: i32,
    action: &str,
) -> Result<Result<CmsAnnouncementRow, &'static str>, sqlx::Error> {
    let current = get_admin_roadmap_milestone_by_id(pool, id).await?;
    let Some(_) = current else {
        return Ok(Err("not_found"));
    };
    match action {
        "submit-review" => submit_cms_announcement_review(pool, id, version).await,
        "publish" => set_cms_announcement_publish_status(pool, id, version, true).await,
        "unpublish" => set_cms_announcement_publish_status(pool, id, version, false).await,
        "archive" => archive_cms_announcement(pool, id, version).await,
        _ => Ok(Err("invalid_action")),
    }
}
