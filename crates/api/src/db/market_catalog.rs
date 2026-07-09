//! MarketBuilder · public catalog reads from Governed Views (PCP Phase 1).

use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::governed_market::{
    market_listing_surface_key, GOVERNED_DISCOVER_ORDERS_VIEW, GOVERNED_MARKET_GUIDES_VIEW,
    GOVERNED_MARKET_LISTINGS_VIEW,
};
use super::market_listings::MarketListingRow;
use super::guides::GuideRow;

async fn fetch_guide_rows(
    pool: &PgPool,
    sql: &str,
) -> Result<Vec<GuideRow>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        user_id: Uuid,
        city: String,
        country_code: String,
        languages: JsonValue,
        service_types: JsonValue,
        bio: Option<String>,
        wallet_address: Option<String>,
        real_name: Option<String>,
        passport_number_hash: Option<String>,
        id_photo_url: Option<String>,
        language_cert_url: Option<String>,
        guide_license_url: Option<String>,
        stake_amount: String,
        hourly_rate: Option<String>,
        avatar_url: Option<String>,
        public_title: Option<String>,
        status: String,
        rejection_codes: JsonValue,
        rejection_message: Option<String>,
        data_origin: String,
        display_status: String,
        display_origin: String,
        featured: bool,
        display_priority: i32,
        display_surfaces: Vec<String>,
        display_start_at: Option<DateTime<Utc>>,
        display_end_at: Option<DateTime<Utc>>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(sql).fetch_all(pool).await?;
    Ok(rows
        .into_iter()
        .map(|r| GuideRow {
            id: r.id,
            user_id: r.user_id,
            city: r.city,
            country_code: r.country_code,
            languages: serde_json::from_value(r.languages).unwrap_or_default(),
            service_types: serde_json::from_value(r.service_types).unwrap_or_default(),
            bio: r.bio,
            wallet_address: r.wallet_address,
            real_name: r.real_name,
            passport_number_hash: r.passport_number_hash,
            id_photo_url: r.id_photo_url,
            language_cert_url: r.language_cert_url,
            guide_license_url: r.guide_license_url,
            stake_amount: r.stake_amount,
            hourly_rate: r.hourly_rate,
            avatar_url: r.avatar_url,
            public_title: r.public_title,
            status: r.status,
            rejection_codes: serde_json::from_value(r.rejection_codes).unwrap_or_default(),
            rejection_message: r.rejection_message,
            data_origin: r.data_origin,
            display_status: r.display_status,
            display_origin: r.display_origin,
            featured: r.featured,
            display_priority: r.display_priority,
            display_surfaces: r.display_surfaces,
            display_start_at: r.display_start_at,
            display_end_at: r.display_end_at,
            created_at: r.created_at,
            updated_at: r.updated_at,
        })
        .collect())
}

/// All guides passing PCP Governance for `market_feed` (DDG applied in Builder).
pub async fn list_governed_market_guides(pool: &PgPool) -> Result<Vec<GuideRow>, sqlx::Error> {
    fetch_guide_rows(
        pool,
        &format!("SELECT id, user_id, city, country_code, languages, service_types, bio, wallet_address, real_name, passport_number_hash, id_photo_url, language_cert_url, guide_license_url, stake_amount, hourly_rate, avatar_url, public_title, status, rejection_codes, rejection_message, data_origin, display_status, display_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, created_at, updated_at FROM {GOVERNED_MARKET_GUIDES_VIEW}"),
    )
    .await
}

pub async fn get_governed_market_guide_by_id(
    pool: &PgPool,
    guide_id: Uuid,
) -> Result<Option<GuideRow>, sqlx::Error> {
    let sql = format!(
        "SELECT id, user_id, city, country_code, languages, service_types, bio, wallet_address, real_name, passport_number_hash, id_photo_url, language_cert_url, guide_license_url, stake_amount, hourly_rate, avatar_url, public_title, status, rejection_codes, rejection_message, data_origin, display_status, display_origin, featured, display_priority, display_surfaces, display_start_at, display_end_at, created_at, updated_at FROM {GOVERNED_MARKET_GUIDES_VIEW} WHERE id = $1"
    );
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        user_id: Uuid,
        city: String,
        country_code: String,
        languages: JsonValue,
        service_types: JsonValue,
        bio: Option<String>,
        wallet_address: Option<String>,
        real_name: Option<String>,
        passport_number_hash: Option<String>,
        id_photo_url: Option<String>,
        language_cert_url: Option<String>,
        guide_license_url: Option<String>,
        stake_amount: String,
        hourly_rate: Option<String>,
        avatar_url: Option<String>,
        public_title: Option<String>,
        status: String,
        rejection_codes: JsonValue,
        rejection_message: Option<String>,
        data_origin: String,
        display_status: String,
        display_origin: String,
        featured: bool,
        display_priority: i32,
        display_surfaces: Vec<String>,
        display_start_at: Option<DateTime<Utc>>,
        display_end_at: Option<DateTime<Utc>>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    }
    let row = sqlx::query_as::<_, Row>(&sql)
        .bind(guide_id)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|r| GuideRow {
        id: r.id,
        user_id: r.user_id,
        city: r.city,
        country_code: r.country_code,
        languages: serde_json::from_value(r.languages).unwrap_or_default(),
        service_types: serde_json::from_value(r.service_types).unwrap_or_default(),
        bio: r.bio,
        wallet_address: r.wallet_address,
        real_name: r.real_name,
        passport_number_hash: r.passport_number_hash,
        id_photo_url: r.id_photo_url,
        language_cert_url: r.language_cert_url,
        guide_license_url: r.guide_license_url,
        stake_amount: r.stake_amount,
        hourly_rate: r.hourly_rate,
        avatar_url: r.avatar_url,
        public_title: r.public_title,
        status: r.status,
        rejection_codes: serde_json::from_value(r.rejection_codes).unwrap_or_default(),
        rejection_message: r.rejection_message,
        data_origin: r.data_origin,
        display_status: r.display_status,
        display_origin: r.display_origin,
        featured: r.featured,
        display_priority: r.display_priority,
        display_surfaces: r.display_surfaces,
        display_start_at: r.display_start_at,
        display_end_at: r.display_end_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
    }))
}

pub async fn governed_market_guide_exists(pool: &PgPool, guide_id: Uuid) -> Result<bool, sqlx::Error> {
    let sql = format!("SELECT EXISTS(SELECT 1 FROM {GOVERNED_MARKET_GUIDES_VIEW} WHERE id = $1)");
    let exists: bool = sqlx::query_scalar(&sql).bind(guide_id).fetch_one(pool).await?;
    Ok(exists)
}

pub async fn list_governed_market_listings_by_variant(
    pool: &PgPool,
    variant: &str,
    limit: i64,
    public_catalog_only: bool,
) -> Result<Vec<MarketListingRow>, sqlx::Error> {
    let surface = market_listing_surface_key(variant);
    if public_catalog_only {
        sqlx::query_as::<_, MarketListingRow>(
            r#"SELECT id, variant, owner_user_id, payload, status, data_origin, display_origin, created_at, updated_at
               FROM governed_market_listings_v1
               WHERE variant = $1
                 AND data_origin = 'production'
                 AND (display_surfaces = '{}' OR $3 = ANY(display_surfaces))
               ORDER BY featured DESC, display_priority DESC, updated_at DESC
               LIMIT $2"#,
        )
        .bind(variant)
        .bind(limit)
        .bind(surface)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, MarketListingRow>(
            r#"SELECT id, variant, owner_user_id, payload, status, data_origin, display_origin, created_at, updated_at
               FROM market_listings
               WHERE variant = $1 AND status = 'published'
               ORDER BY updated_at DESC
               LIMIT $2"#,
        )
        .bind(variant)
        .bind(limit)
        .fetch_all(pool)
        .await
    }
}

pub async fn select_governed_public_market_listing_by_id(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
) -> Result<Option<MarketListingRow>, sqlx::Error> {
    let surface = market_listing_surface_key(variant);
    sqlx::query_as::<_, MarketListingRow>(
        r#"SELECT id, variant, owner_user_id, payload, status, data_origin, display_origin, created_at, updated_at
           FROM governed_market_listings_v1
           WHERE id = $1 AND variant = $2
             AND data_origin = 'production'
             AND (display_surfaces = '{}' OR $3 = ANY(display_surfaces))"#,
    )
    .bind(id)
    .bind(variant)
    .bind(surface)
    .fetch_optional(pool)
    .await
}

pub async fn governed_discover_order_exists(pool: &PgPool, order_id: Uuid) -> Result<bool, sqlx::Error> {
    let sql = format!("SELECT EXISTS(SELECT 1 FROM {GOVERNED_DISCOVER_ORDERS_VIEW} WHERE id = $1)");
    let exists: bool = sqlx::query_scalar(&sql).bind(order_id).fetch_one(pool).await?;
    Ok(exists)
}

/// Intersect candidate discover order ids with `governed_discover_orders_v1` (production catalog gate).
pub async fn filter_order_ids_in_governed_discover_view(
    pool: &PgPool,
    order_ids: &[Uuid],
) -> Result<std::collections::HashSet<Uuid>, sqlx::Error> {
    use std::collections::HashSet;
    if order_ids.is_empty() {
        return Ok(HashSet::new());
    }
    let sql = format!("SELECT id FROM {GOVERNED_DISCOVER_ORDERS_VIEW} WHERE id = ANY($1)");
    let rows: Vec<Uuid> = sqlx::query_scalar(&sql).bind(order_ids).fetch_all(pool).await?;
    Ok(rows.into_iter().collect())
}
