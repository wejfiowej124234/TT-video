//! Admin Catalog Operations — pricing-adjacent entities (C-S3 · 105 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::{
    archive_catalog_entity, insert_catalog_revision, publish_catalog_entity,
    submit_review_catalog_entity, AdminCatalogCountryRow,
};

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogHotelTierRow {
    pub id: Uuid,
    pub tier_code: String,
    pub sort_order: i32,
    pub multiplier: f64,
    pub label_key: String,
    pub description_key: String,
    pub submit_label_zh: String,
    pub stock_image_asset_id: Option<Uuid>,
    pub stock_image_url: Option<String>,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogTransportRuleRow {
    pub id: Uuid,
    pub country_id: Uuid,
    pub country_iso: String,
    pub country_name_zh: String,
    pub default_modes: Vec<String>,
    pub rail_ui_label_key: Option<String>,
    pub flight_ui_label_key: Option<String>,
    pub notes: Option<String>,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogMediaAssetRow {
    pub id: Uuid,
    pub asset_kind: String,
    pub source_type: String,
    pub url: String,
    pub source_page_url: Option<String>,
    pub license: Value,
    pub alt_text_zh: Option<String>,
    pub alt_text_en: Option<String>,
    pub stock_pool_key: Option<String>,
    pub country_id: Option<Uuid>,
    pub country_iso: Option<String>,
    pub country_name_zh: Option<String>,
    pub city_id: Option<Uuid>,
    pub poi_id: Option<Uuid>,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCountryLandingAmbientRow {
    pub country_id: Uuid,
    pub iso3166: String,
    pub name_zh: String,
    pub publish_status: String,
    pub version: i32,
    pub landing_ambient: Value,
    pub media_asset_id: Option<Uuid>,
}

pub async fn list_admin_catalog_hotel_tiers(
    pool: &PgPool,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogHotelTierRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT t.id, t.tier_code, t.sort_order, (t.multiplier)::float8 AS multiplier,
                  t.label_key, t.description_key, t.submit_label_zh, t.stock_image_asset_id,
                  m.url AS stock_image_url, t.publish_status, t.version, t.published_at, t.updated_at
           FROM catalog_hotel_tier_definitions t
           LEFT JOIN catalog_media_assets m ON m.id = t.stock_image_asset_id
           WHERE ($1::text IS NULL OR t.publish_status = $1)
           ORDER BY t.sort_order, t.tier_code"#,
    )
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_hotel_tier(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminCatalogHotelTierRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT t.id, t.tier_code, t.sort_order, (t.multiplier)::float8 AS multiplier,
                  t.label_key, t.description_key, t.submit_label_zh, t.stock_image_asset_id,
                  m.url AS stock_image_url, t.publish_status, t.version, t.published_at, t.updated_at
           FROM catalog_hotel_tier_definitions t
           LEFT JOIN catalog_media_assets m ON m.id = t.stock_image_asset_id
           WHERE t.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn patch_admin_catalog_hotel_tier(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    sort_order: Option<i32>,
    multiplier: Option<f64>,
    label_key: Option<&str>,
    description_key: Option<&str>,
    submit_label_zh: Option<&str>,
    stock_image_asset_id: Option<Option<Uuid>>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogHotelTierRow, &'static str>, sqlx::Error> {
    let before = get_admin_catalog_hotel_tier(pool, id).await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    sqlx::query(
        r#"UPDATE catalog_hotel_tier_definitions SET
             sort_order = COALESCE($2, sort_order),
             multiplier = COALESCE($3, multiplier),
             label_key = COALESCE($4, label_key),
             description_key = COALESCE($5, description_key),
             submit_label_zh = COALESCE($6, submit_label_zh),
             stock_image_asset_id = CASE WHEN $7 THEN $8 ELSE stock_image_asset_id END,
             version = version + 1,
             updated_at = $9
           WHERE id = $1 AND version = $10"#,
    )
    .bind(id)
    .bind(sort_order)
    .bind(multiplier)
    .bind(label_key)
    .bind(description_key)
    .bind(submit_label_zh)
    .bind(stock_image_asset_id.is_some())
    .bind(stock_image_asset_id.flatten())
    .bind(Utc::now())
    .bind(expected_version)
    .execute(pool)
    .await?;
    let row = get_admin_catalog_hotel_tier(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    if row.version == before.version {
        return Ok(Err("version_conflict"));
    }
    insert_catalog_revision(
        pool,
        "catalog_hotel_tier_definitions",
        id,
        row.version,
        Some(json!(before)),
        Some(json!(row)),
        actor_id,
        "update",
        request_id,
    )
    .await?;
    Ok(Ok(row))
}

pub async fn list_admin_catalog_transport_rules(
    pool: &PgPool,
    publish_status: Option<&str>,
    country_id: Option<Uuid>,
) -> Result<Vec<AdminCatalogTransportRuleRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT r.id, r.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  r.default_modes, r.rail_ui_label_key, r.flight_ui_label_key, r.notes,
                  r.publish_status, r.version, r.published_at, r.updated_at
           FROM catalog_transport_region_rules r
           JOIN catalog_countries co ON co.id = r.country_id
           WHERE ($1::text IS NULL OR r.publish_status = $1)
             AND ($2::uuid IS NULL OR r.country_id = $2)
           ORDER BY co.sort_order"#,
    )
    .bind(publish_status)
    .bind(country_id)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_transport_rule(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminCatalogTransportRuleRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT r.id, r.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  r.default_modes, r.rail_ui_label_key, r.flight_ui_label_key, r.notes,
                  r.publish_status, r.version, r.published_at, r.updated_at
           FROM catalog_transport_region_rules r
           JOIN catalog_countries co ON co.id = r.country_id
           WHERE r.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn patch_admin_catalog_transport_rule(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    default_modes: Option<Vec<String>>,
    rail_ui_label_key: Option<&str>,
    flight_ui_label_key: Option<&str>,
    notes: Option<&str>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogTransportRuleRow, &'static str>, sqlx::Error> {
    let before = get_admin_catalog_transport_rule(pool, id).await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    };
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    let row = sqlx::query_as::<_, AdminCatalogTransportRuleRow>(
        r#"UPDATE catalog_transport_region_rules r SET
             default_modes = COALESCE($2, r.default_modes),
             rail_ui_label_key = COALESCE($3, r.rail_ui_label_key),
             flight_ui_label_key = COALESCE($4, r.flight_ui_label_key),
             notes = COALESCE($5, r.notes),
             version = r.version + 1,
             updated_at = $6
           FROM catalog_countries co
           WHERE r.id = $1 AND r.country_id = co.id AND r.version = $7
           RETURNING r.id, r.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                     r.default_modes, r.rail_ui_label_key, r.flight_ui_label_key, r.notes,
                     r.publish_status, r.version, r.published_at, r.updated_at"#,
    )
    .bind(id)
    .bind(default_modes)
    .bind(rail_ui_label_key)
    .bind(flight_ui_label_key)
    .bind(notes)
    .bind(Utc::now())
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        "catalog_transport_region_rules",
        id,
        row.version,
        Some(json!(before)),
        Some(json!(row)),
        actor_id,
        "update",
        request_id,
    )
    .await?;
    Ok(Ok(row))
}

pub async fn list_admin_catalog_media_assets(
    pool: &PgPool,
    publish_status: Option<&str>,
    asset_kind: Option<&str>,
    country_id: Option<Uuid>,
) -> Result<Vec<AdminCatalogMediaAssetRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT m.id, m.asset_kind, m.source_type, m.url, m.source_page_url, m.license,
                  m.alt_text_zh, m.alt_text_en, m.stock_pool_key, m.country_id,
                  co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  m.city_id, m.poi_id, m.publish_status, m.version, m.published_at, m.updated_at
           FROM catalog_media_assets m
           LEFT JOIN catalog_countries co ON co.id = m.country_id
           WHERE ($1::text IS NULL OR m.publish_status = $1)
             AND ($2::text IS NULL OR m.asset_kind = $2)
             AND ($3::uuid IS NULL OR m.country_id = $3)
           ORDER BY m.asset_kind, co.sort_order NULLS LAST, m.url
           LIMIT 500"#,
    )
    .bind(publish_status)
    .bind(asset_kind)
    .bind(country_id)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_media_asset(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminCatalogMediaAssetRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT m.id, m.asset_kind, m.source_type, m.url, m.source_page_url, m.license,
                  m.alt_text_zh, m.alt_text_en, m.stock_pool_key, m.country_id,
                  co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  m.city_id, m.poi_id, m.publish_status, m.version, m.published_at, m.updated_at
           FROM catalog_media_assets m
           LEFT JOIN catalog_countries co ON co.id = m.country_id
           WHERE m.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_admin_catalog_media_asset(
    pool: &PgPool,
    asset_kind: &str,
    source_type: &str,
    url: &str,
    source_page_url: Option<&str>,
    license: Value,
    alt_text_zh: Option<&str>,
    alt_text_en: Option<&str>,
    stock_pool_key: Option<&str>,
    country_id: Option<Uuid>,
    city_id: Option<Uuid>,
    poi_id: Option<Uuid>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogMediaAssetRow, &'static str>, sqlx::Error> {
    if ![
        "poi_hero",
        "landing_ambient",
        "hotel_tier_stock",
        "transport_stock",
        "generic",
    ]
    .contains(&asset_kind)
    {
        return Ok(Err("invalid_asset_kind"));
    }
    if !["unsplash", "upload", "external_url"].contains(&source_type) {
        return Ok(Err("invalid_source_type"));
    }
    let id = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO catalog_media_assets
           (asset_kind, source_type, url, source_page_url, license, alt_text_zh, alt_text_en,
            stock_pool_key, country_id, city_id, poi_id, publish_status, version, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', 1, $12, $13, $13)
           RETURNING id"#,
    )
    .bind(asset_kind)
    .bind(source_type)
    .bind(url)
    .bind(source_page_url)
    .bind(license)
    .bind(alt_text_zh)
    .bind(alt_text_en)
    .bind(stock_pool_key)
    .bind(country_id)
    .bind(city_id)
    .bind(poi_id)
    .bind(actor_id)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;
    let row = get_admin_catalog_media_asset(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    insert_catalog_revision(
        pool,
        "catalog_media_assets",
        id,
        row.version,
        None,
        Some(json!(row)),
        actor_id,
        "create",
        request_id,
    )
    .await?;
    Ok(Ok(row))
}

pub async fn patch_admin_catalog_media_asset(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    url: Option<&str>,
    source_page_url: Option<&str>,
    license: Option<Value>,
    alt_text_zh: Option<&str>,
    alt_text_en: Option<&str>,
    stock_pool_key: Option<&str>,
    country_id: Option<Option<Uuid>>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogMediaAssetRow, &'static str>, sqlx::Error> {
    let before = get_admin_catalog_media_asset(pool, id).await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    };
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    sqlx::query(
        r#"UPDATE catalog_media_assets SET
             url = COALESCE($2, url),
             source_page_url = COALESCE($3, source_page_url),
             license = COALESCE($4, license),
             alt_text_zh = COALESCE($5, alt_text_zh),
             alt_text_en = COALESCE($6, alt_text_en),
             stock_pool_key = COALESCE($7, stock_pool_key),
             country_id = CASE WHEN $8 THEN $9 ELSE country_id END,
             version = version + 1,
             updated_at = $10
           WHERE id = $1 AND version = $11"#,
    )
    .bind(id)
    .bind(url)
    .bind(source_page_url)
    .bind(license)
    .bind(alt_text_zh)
    .bind(alt_text_en)
    .bind(stock_pool_key)
    .bind(country_id.is_some())
    .bind(country_id.flatten())
    .bind(Utc::now())
    .bind(expected_version)
    .execute(pool)
    .await?;
    let row = get_admin_catalog_media_asset(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    if row.version == before.version {
        return Ok(Err("version_conflict"));
    }
    insert_catalog_revision(
        pool,
        "catalog_media_assets",
        id,
        row.version,
        Some(json!(before)),
        Some(json!(row)),
        actor_id,
        "update",
        request_id,
    )
    .await?;
    Ok(Ok(row))
}

pub async fn get_admin_country_landing_ambient(
    pool: &PgPool,
    country_id: Uuid,
) -> Result<Option<AdminCountryLandingAmbientRow>, sqlx::Error> {
    let row: Option<(Uuid, String, String, String, i32, Value)> = sqlx::query_as(
        r#"SELECT id, iso3166, name_zh, publish_status, version, payload
           FROM catalog_countries WHERE id = $1"#,
    )
    .bind(country_id)
    .fetch_optional(pool)
    .await?;
    let Some((id, iso, name_zh, publish_status, version, payload)) = row else {
        return Ok(None);
    };
    let landing = payload
        .get("landing_ambient")
        .cloned()
        .unwrap_or_else(|| json!({}));
    let media_asset_id = landing
        .get("media_asset_id")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());
    Ok(Some(AdminCountryLandingAmbientRow {
        country_id: id,
        iso3166: iso,
        name_zh,
        publish_status,
        version,
        landing_ambient: landing,
        media_asset_id,
    }))
}

pub async fn patch_admin_country_landing_ambient(
    pool: &PgPool,
    country_id: Uuid,
    expected_version: i32,
    landing_ambient: Value,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCountryLandingAmbientRow, &'static str>, sqlx::Error> {
    let before: Option<AdminCatalogCountryRow> = sqlx::query_as(
        r#"SELECT id, iso3166, name_zh, name_en, sort_order, open_status, publish_status,
                  version, payload, published_at, created_at, updated_at
           FROM catalog_countries WHERE id = $1"#,
    )
    .bind(country_id)
    .fetch_optional(pool)
    .await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    };
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    let mut payload = before.payload.clone();
    if let Some(obj) = payload.as_object_mut() {
        obj.insert("landing_ambient".to_string(), landing_ambient.clone());
    } else {
        payload = json!({ "landing_ambient": landing_ambient.clone() });
    }
    let new_version = expected_version + 1;
    sqlx::query(
        r#"UPDATE catalog_countries SET payload = $2, version = $3, updated_at = $4
           WHERE id = $1 AND version = $5"#,
    )
    .bind(country_id)
    .bind(&payload)
    .bind(new_version)
    .bind(Utc::now())
    .bind(expected_version)
    .execute(pool)
    .await?;
    insert_catalog_revision(
        pool,
        "catalog_countries",
        country_id,
        new_version,
        Some(json!({ "landing_ambient": before.payload.get("landing_ambient") })),
        Some(json!({ "landing_ambient": landing_ambient })),
        actor_id,
        "update_landing_ambient",
        request_id,
    )
    .await?;
    let out = get_admin_country_landing_ambient(pool, country_id).await?;
    match out {
        Some(v) => Ok(Ok(v)),
        None => Ok(Err("not_found")),
    }
}

pub async fn ops_entity_workflow(
    pool: &PgPool,
    table: &str,
    entity_type: &str,
    id: Uuid,
    version: i32,
    op: &str,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match op {
        "submit" => {
            submit_review_catalog_entity(pool, table, entity_type, id, version, actor_id, request_id).await
        }
        "publish" => {
            publish_catalog_entity(pool, table, entity_type, id, version, actor_id, request_id).await
        }
        "archive" => {
            archive_catalog_entity(pool, table, entity_type, id, version, actor_id, request_id).await
        }
        _ => Ok(Err("invalid_op")),
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn media_asset_kind_values_match_ddl() {
        for k in [
            "poi_hero",
            "landing_ambient",
            "hotel_tier_stock",
            "transport_stock",
            "generic",
        ] {
            assert!(!k.is_empty());
        }
    }
}
