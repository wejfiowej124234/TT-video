//! Admin · Public Operations display metadata (SSOT-PUB-OPS O1–O5).

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

pub const PUBLIC_OPS_SURFACE_IDS: &[&str] = &[
    "home_hero",
    "home_feed",
    "market_feed",
    "community_feed",
    "community_featured",
    "community_explore",
    "landing_promo",
    "did_rank",
    "market_provider",
    "market_acquisition",
];

pub fn normalize_public_ops_surfaces(surfaces: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    for s in surfaces {
        let t = s.trim();
        if t.is_empty() {
            continue;
        }
        if PUBLIC_OPS_SURFACE_IDS.contains(&t) {
            let owned = t.to_string();
            if !out.contains(&owned) {
                out.push(owned);
            }
        }
    }
    out
}

/// Empty `display_surfaces` = visible on all surfaces (migration/backfill compat).
pub fn entity_visible_on_public_surface(display_surfaces: &[String], surface: &str) -> bool {
    if display_surfaces.is_empty() {
        return true;
    }
    display_surfaces.iter().any(|s| s == surface)
}

/// NULL start/end = no bound; end is exclusive at boundary (`now >= end` → hidden).
pub fn entity_visible_in_public_schedule(
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    now: DateTime<Utc>,
) -> bool {
    if let Some(start) = display_start_at {
        if now < start {
            return false;
        }
    }
    if let Some(end) = display_end_at {
        if now >= end {
            return false;
        }
    }
    true
}

pub fn validate_display_schedule(
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
) -> Result<(), &'static str> {
    match (display_start_at, display_end_at) {
        (Some(s), Some(e)) if s >= e => Err("invalid_schedule_range"),
        _ => Ok(()),
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PublicOpsDisplayRow {
    pub id: Uuid,
    pub entity_type: String,
    pub label: String,
    pub display_status: String,
    pub display_origin: String,
    pub data_origin: String,
    pub featured: bool,
    pub display_priority: i32,
    pub display_surfaces: Vec<String>,
    pub display_start_at: Option<DateTime<Utc>>,
    pub display_end_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Default)]
pub struct PublicOpsListFilters {
    pub display_status: Option<String>,
    pub featured_only: Option<bool>,
}

fn table_for_entity(entity_type: &str) -> Option<&'static str> {
    match entity_type {
        "guides" => Some("guides"),
        "orders" => Some("orders"),
        "market_listings" => Some("market_listings"),
        "community_posts" => Some("community_posts"),
        _ => None,
    }
}

pub fn is_supported_public_ops_entity(entity_type: &str) -> bool {
    table_for_entity(entity_type).is_some()
}

pub async fn list_public_ops_display_entities(
    pool: &PgPool,
    entity_type: &str,
    filters: PublicOpsListFilters,
    limit: i64,
) -> Result<Vec<PublicOpsDisplayRow>, sqlx::Error> {
    let Some(table) = table_for_entity(entity_type) else {
        return Ok(vec![]);
    };
    let lim = limit.clamp(1, 200);

    match table {
        "guides" => list_guides(pool, &filters, lim).await,
        "orders" => list_orders(pool, &filters, lim).await,
        "market_listings" => list_listings(pool, &filters, lim).await,
        "community_posts" => list_posts(pool, &filters, lim).await,
        _ => Ok(vec![]),
    }
}

#[derive(sqlx::FromRow)]
struct GuideListRow {
    id: Uuid,
    city: String,
    country_code: String,
    display_status: String,
    display_origin: String,
    data_origin: String,
    featured: bool,
    display_priority: i32,
    display_surfaces: Vec<String>,
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    updated_at: DateTime<Utc>,
}

async fn list_guides(
    pool: &PgPool,
    filters: &PublicOpsListFilters,
    limit: i64,
) -> Result<Vec<PublicOpsDisplayRow>, sqlx::Error> {
    let rows = match (&filters.display_status, filters.featured_only) {
        (Some(st), Some(true)) => {
            sqlx::query_as::<_, GuideListRow>(
                r#"SELECT id, city, country_code, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM guides WHERE display_status = $1 AND featured = true
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (Some(st), _) => {
            sqlx::query_as::<_, GuideListRow>(
                r#"SELECT id, city, country_code, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM guides WHERE display_status = $1
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, Some(true)) => {
            sqlx::query_as::<_, GuideListRow>(
                r#"SELECT id, city, country_code, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM guides WHERE featured = true
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, _) => {
            sqlx::query_as::<_, GuideListRow>(
                r#"SELECT id, city, country_code, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM guides
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };
    Ok(rows
        .into_iter()
        .map(|r| PublicOpsDisplayRow {
            id: r.id,
            entity_type: "guides".into(),
            label: format!("{} · {}", r.city, r.country_code),
            display_status: r.display_status,
            display_origin: r.display_origin,
            data_origin: r.data_origin,
            featured: r.featured,
            display_priority: r.display_priority,
            display_surfaces: r.display_surfaces,
            display_start_at: r.display_start_at,
            display_end_at: r.display_end_at,
            updated_at: r.updated_at,
        })
        .collect())
}

#[derive(sqlx::FromRow)]
struct OrderListRow {
    id: Uuid,
    label: String,
    display_status: String,
    display_origin: String,
    data_origin: String,
    featured: bool,
    display_priority: i32,
    display_surfaces: Vec<String>,
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    updated_at: DateTime<Utc>,
}

async fn list_orders(
    pool: &PgPool,
    filters: &PublicOpsListFilters,
    limit: i64,
) -> Result<Vec<PublicOpsDisplayRow>, sqlx::Error> {
    let rows = match (&filters.display_status, filters.featured_only) {
        (Some(st), Some(true)) => {
            sqlx::query_as::<_, OrderListRow>(
                r#"SELECT o.id, COALESCE(NULLIF(TRIM(i.destination), ''), 'order') AS label,
                          o.display_status, o.display_origin, o.data_origin, o.featured, o.display_priority, o.display_surfaces, o.display_start_at, o.display_end_at, o.updated_at
                   FROM orders o LEFT JOIN itineraries i ON i.order_id = o.id
                   WHERE o.display_status = $1 AND o.featured = true
                   ORDER BY o.featured DESC, o.display_priority DESC, o.updated_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (Some(st), _) => {
            sqlx::query_as::<_, OrderListRow>(
                r#"SELECT o.id, COALESCE(NULLIF(TRIM(i.destination), ''), 'order') AS label,
                          o.display_status, o.display_origin, o.data_origin, o.featured, o.display_priority, o.display_surfaces, o.display_start_at, o.display_end_at, o.updated_at
                   FROM orders o LEFT JOIN itineraries i ON i.order_id = o.id
                   WHERE o.display_status = $1
                   ORDER BY o.featured DESC, o.display_priority DESC, o.updated_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, Some(true)) => {
            sqlx::query_as::<_, OrderListRow>(
                r#"SELECT o.id, COALESCE(NULLIF(TRIM(i.destination), ''), 'order') AS label,
                          o.display_status, o.display_origin, o.data_origin, o.featured, o.display_priority, o.display_surfaces, o.display_start_at, o.display_end_at, o.updated_at
                   FROM orders o LEFT JOIN itineraries i ON i.order_id = o.id
                   WHERE o.featured = true
                   ORDER BY o.featured DESC, o.display_priority DESC, o.updated_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, _) => {
            sqlx::query_as::<_, OrderListRow>(
                r#"SELECT o.id, COALESCE(NULLIF(TRIM(i.destination), ''), 'order') AS label,
                          o.display_status, o.display_origin, o.data_origin, o.featured, o.display_priority, o.display_surfaces, o.display_start_at, o.display_end_at, o.updated_at
                   FROM orders o LEFT JOIN itineraries i ON i.order_id = o.id
                   ORDER BY o.featured DESC, o.display_priority DESC, o.updated_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };
    Ok(rows
        .into_iter()
        .map(|r| PublicOpsDisplayRow {
            id: r.id,
            entity_type: "orders".into(),
            label: r.label,
            display_status: r.display_status,
            display_origin: r.display_origin,
            data_origin: r.data_origin,
            featured: r.featured,
            display_priority: r.display_priority,
            display_surfaces: r.display_surfaces,
            display_start_at: r.display_start_at,
            display_end_at: r.display_end_at,
            updated_at: r.updated_at,
        })
        .collect())
}

#[derive(sqlx::FromRow)]
struct ListingListRow {
    id: Uuid,
    variant: String,
    payload: Value,
    display_status: String,
    display_origin: String,
    data_origin: String,
    featured: bool,
    display_priority: i32,
    display_surfaces: Vec<String>,
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    updated_at: DateTime<Utc>,
}

async fn list_listings(
    pool: &PgPool,
    filters: &PublicOpsListFilters,
    limit: i64,
) -> Result<Vec<PublicOpsDisplayRow>, sqlx::Error> {
    let rows = match (&filters.display_status, filters.featured_only) {
        (Some(st), Some(true)) => {
            sqlx::query_as::<_, ListingListRow>(
                r#"SELECT id, variant, payload, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM market_listings WHERE display_status = $1 AND featured = true
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (Some(st), _) => {
            sqlx::query_as::<_, ListingListRow>(
                r#"SELECT id, variant, payload, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM market_listings WHERE display_status = $1
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, Some(true)) => {
            sqlx::query_as::<_, ListingListRow>(
                r#"SELECT id, variant, payload, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM market_listings WHERE featured = true
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, _) => {
            sqlx::query_as::<_, ListingListRow>(
                r#"SELECT id, variant, payload, display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, updated_at
                   FROM market_listings
                   ORDER BY featured DESC, display_priority DESC, updated_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };
    Ok(rows
        .into_iter()
        .map(|r| {
            let title = r
                .payload
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or("listing");
            PublicOpsDisplayRow {
                id: r.id,
                entity_type: "market_listings".into(),
                label: format!("{title} · {}", r.variant),
                display_status: r.display_status,
                display_origin: r.display_origin,
                data_origin: r.data_origin,
                featured: r.featured,
                display_priority: r.display_priority,
                display_surfaces: r.display_surfaces,
                display_start_at: r.display_start_at,
                display_end_at: r.display_end_at,
                updated_at: r.updated_at,
            }
        })
        .collect())
}

#[derive(sqlx::FromRow)]
struct PostListRow {
    id: Uuid,
    label: String,
    display_status: String,
    display_origin: String,
    data_origin: String,
    featured: bool,
    display_priority: i32,
    display_surfaces: Vec<String>,
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    updated_at: DateTime<Utc>,
}

async fn list_posts(
    pool: &PgPool,
    filters: &PublicOpsListFilters,
    limit: i64,
) -> Result<Vec<PublicOpsDisplayRow>, sqlx::Error> {
    let rows = match (&filters.display_status, filters.featured_only) {
        (Some(st), Some(true)) => {
            sqlx::query_as::<_, PostListRow>(
                r#"SELECT id, LEFT(COALESCE(body, ''), 80) AS label,
                          display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, created_at AS updated_at
                   FROM community_posts WHERE display_status = $1 AND featured = true
                   ORDER BY featured DESC, display_priority DESC, created_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (Some(st), _) => {
            sqlx::query_as::<_, PostListRow>(
                r#"SELECT id, LEFT(COALESCE(body, ''), 80) AS label,
                          display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, created_at AS updated_at
                   FROM community_posts WHERE display_status = $1
                   ORDER BY featured DESC, display_priority DESC, created_at DESC LIMIT $2"#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, Some(true)) => {
            sqlx::query_as::<_, PostListRow>(
                r#"SELECT id, LEFT(COALESCE(body, ''), 80) AS label,
                          display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, created_at AS updated_at
                   FROM community_posts WHERE featured = true
                   ORDER BY featured DESC, display_priority DESC, created_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        (None, _) => {
            sqlx::query_as::<_, PostListRow>(
                r#"SELECT id, LEFT(COALESCE(body, ''), 80) AS label,
                          display_status, display_origin, data_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, created_at AS updated_at
                   FROM community_posts
                   ORDER BY featured DESC, display_priority DESC, created_at DESC LIMIT $1"#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };
    Ok(rows
        .into_iter()
        .map(|r| PublicOpsDisplayRow {
            id: r.id,
            entity_type: "community_posts".into(),
            label: r.label,
            display_status: r.display_status,
            display_origin: r.display_origin,
            data_origin: r.data_origin,
            featured: r.featured,
            display_priority: r.display_priority,
            display_surfaces: r.display_surfaces,
            display_start_at: r.display_start_at,
            display_end_at: r.display_end_at,
            updated_at: r.updated_at,
        })
        .collect())
}

pub async fn set_public_ops_display_status(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    display_status: &str,
    display_source: &str,
) -> Result<Option<PublicOpsDisplayRow>, sqlx::Error> {
    let sql = match table_for_entity(entity_type) {
        Some("guides") => {
            "UPDATE guides SET display_status = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("orders") => {
            "UPDATE orders SET display_status = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("market_listings") => {
            "UPDATE market_listings SET display_status = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("community_posts") => {
            "UPDATE community_posts SET display_status = $2, display_source = $3 WHERE id = $1"
        }
        _ => return Ok(None),
    };
    let affected = sqlx::query(sql)
        .bind(entity_id)
        .bind(display_status)
        .bind(display_source)
        .execute(pool)
        .await?
        .rows_affected();
    if affected == 0 {
        return Ok(None);
    }
    fetch_public_ops_display_entity(pool, entity_type, entity_id).await
}

pub fn catalog_featured_allowed(display_status: &str, featured: bool) -> Result<(), &'static str> {
    if featured && display_status != "published" {
        return Err("featured_requires_published");
    }
    Ok(())
}

pub async fn set_public_ops_featured(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    featured: bool,
    display_source: &str,
) -> Result<Result<Option<PublicOpsDisplayRow>, &'static str>, sqlx::Error> {
    let current = fetch_public_ops_display_entity(pool, entity_type, entity_id).await?;
    let Some(row) = current else {
        return Ok(Ok(None));
    };
    if let Err(code) = catalog_featured_allowed(&row.display_status, featured) {
        return Ok(Err(code));
    }
    let sql = match table_for_entity(entity_type) {
        Some("guides") => {
            "UPDATE guides SET featured = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("orders") => {
            "UPDATE orders SET featured = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("market_listings") => {
            "UPDATE market_listings SET featured = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("community_posts") => {
            "UPDATE community_posts SET featured = $2, display_source = $3 WHERE id = $1"
        }
        _ => return Ok(Ok(None)),
    };
    let affected = sqlx::query(sql)
        .bind(entity_id)
        .bind(featured)
        .bind(display_source)
        .execute(pool)
        .await?
        .rows_affected();
    if affected == 0 {
        return Ok(Ok(None));
    }
    Ok(Ok(fetch_public_ops_display_entity(pool, entity_type, entity_id).await?))
}

pub async fn set_public_ops_display_priority(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    display_priority: i32,
    display_source: &str,
) -> Result<Option<PublicOpsDisplayRow>, sqlx::Error> {
    let sql = match table_for_entity(entity_type) {
        Some("guides") => {
            "UPDATE guides SET display_priority = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("orders") => {
            "UPDATE orders SET display_priority = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("market_listings") => {
            "UPDATE market_listings SET display_priority = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("community_posts") => {
            "UPDATE community_posts SET display_priority = $2, display_source = $3 WHERE id = $1"
        }
        _ => return Ok(None),
    };
    let affected = sqlx::query(sql)
        .bind(entity_id)
        .bind(display_priority)
        .bind(display_source)
        .execute(pool)
        .await?
        .rows_affected();
    if affected == 0 {
        return Ok(None);
    }
    fetch_public_ops_display_entity(pool, entity_type, entity_id).await
}

pub async fn set_public_ops_display_surfaces(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    display_surfaces: Vec<String>,
    display_source: &str,
) -> Result<Option<PublicOpsDisplayRow>, sqlx::Error> {
    let surfaces = normalize_public_ops_surfaces(&display_surfaces);
    let sql = match table_for_entity(entity_type) {
        Some("guides") => {
            "UPDATE guides SET display_surfaces = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("orders") => {
            "UPDATE orders SET display_surfaces = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("market_listings") => {
            "UPDATE market_listings SET display_surfaces = $2, display_source = $3, updated_at = NOW() WHERE id = $1"
        }
        Some("community_posts") => {
            "UPDATE community_posts SET display_surfaces = $2, display_source = $3 WHERE id = $1"
        }
        _ => return Ok(None),
    };
    let affected = sqlx::query(sql)
        .bind(entity_id)
        .bind(&surfaces)
        .bind(display_source)
        .execute(pool)
        .await?
        .rows_affected();
    if affected == 0 {
        return Ok(None);
    }
    fetch_public_ops_display_entity(pool, entity_type, entity_id).await
}

pub async fn set_public_ops_display_schedule(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
    display_source: &str,
) -> Result<Result<Option<PublicOpsDisplayRow>, &'static str>, sqlx::Error> {
    if let Err(e) = validate_display_schedule(display_start_at, display_end_at) {
        return Ok(Err(e));
    }
    let sql = match table_for_entity(entity_type) {
        Some("guides") => {
            "UPDATE guides SET display_start_at = $2, display_end_at = $3, display_source = $4, updated_at = NOW() WHERE id = $1"
        }
        Some("orders") => {
            "UPDATE orders SET display_start_at = $2, display_end_at = $3, display_source = $4, updated_at = NOW() WHERE id = $1"
        }
        Some("market_listings") => {
            "UPDATE market_listings SET display_start_at = $2, display_end_at = $3, display_source = $4, updated_at = NOW() WHERE id = $1"
        }
        Some("community_posts") => {
            "UPDATE community_posts SET display_start_at = $2, display_end_at = $3, display_source = $4 WHERE id = $1"
        }
        _ => return Ok(Ok(None)),
    };
    let affected = sqlx::query(sql)
        .bind(entity_id)
        .bind(display_start_at)
        .bind(display_end_at)
        .bind(display_source)
        .execute(pool)
        .await?
        .rows_affected();
    if affected == 0 {
        return Ok(Ok(None));
    }
    fetch_public_ops_display_entity(pool, entity_type, entity_id)
        .await
        .map(|row| Ok(row))
}

pub async fn fetch_public_ops_display_entity(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
) -> Result<Option<PublicOpsDisplayRow>, sqlx::Error> {
    let items = list_public_ops_display_entities(
        pool,
        entity_type,
        PublicOpsListFilters::default(),
        500,
    )
    .await?;
    Ok(items.into_iter().find(|r| r.id == entity_id))
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PublicOpsPreviewChecks {
    pub display_status_published: bool,
    pub surface_match: bool,
    pub schedule_in_window: bool,
    pub policy_origin_allowed: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PublicOpsPreviewResult {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub surface: String,
    pub as_of: DateTime<Utc>,
    pub visible: bool,
    pub checks: PublicOpsPreviewChecks,
    pub reasons_hidden: Vec<String>,
    pub display: PublicOpsDisplayRow,
}

pub fn evaluate_public_ops_preview(
    row: PublicOpsDisplayRow,
    surface: &str,
    as_of: DateTime<Utc>,
    policy: Option<&super::PublicOpsPolicyRow>,
) -> PublicOpsPreviewResult {
    let surface = normalize_public_ops_surfaces(&[surface.to_string()]);
    let surface_key = surface.first().map(String::as_str).unwrap_or("market_feed");
    let display_status_published = row.display_status == "published";
    let surface_match = entity_visible_on_public_surface(&row.display_surfaces, surface_key);
    let schedule_in_window =
        entity_visible_in_public_schedule(row.display_start_at, row.display_end_at, as_of);
    let policy_row = policy.cloned().unwrap_or_default();
    let policy_origin_allowed =
        super::entity_visible_by_display_origin_policy(&row.display_origin, &policy_row);
    let mut reasons_hidden = Vec::new();
    if !display_status_published {
        reasons_hidden.push("display_status_not_published".into());
    }
    if !surface_match {
        reasons_hidden.push("surface_not_matched".into());
    }
    if !schedule_in_window {
        reasons_hidden.push("schedule_out_of_window".into());
    }
    if !policy_origin_allowed {
        reasons_hidden.push("display_origin_blocked_by_policy".into());
    }
    let visible = display_status_published
        && surface_match
        && schedule_in_window
        && policy_origin_allowed;
    PublicOpsPreviewResult {
        entity_type: row.entity_type.clone(),
        entity_id: row.id,
        surface: surface_key.to_string(),
        as_of,
        visible,
        checks: PublicOpsPreviewChecks {
            display_status_published,
            surface_match,
            schedule_in_window,
            policy_origin_allowed,
        },
        reasons_hidden,
        display: row,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn featured_requires_published_display_status() {
        assert!(catalog_featured_allowed("published", true).is_ok());
        assert!(catalog_featured_allowed("published", false).is_ok());
        assert!(catalog_featured_allowed("hidden", false).is_ok());
        assert_eq!(
            catalog_featured_allowed("hidden", true),
            Err("featured_requires_published")
        );
    }
}
