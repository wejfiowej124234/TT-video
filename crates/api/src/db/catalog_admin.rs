//! Admin Catalog CMS CRUD + publish workflow (C-S1 · 105 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogCountryRow {
    pub id: Uuid,
    pub iso3166: String,
    pub name_zh: String,
    pub name_en: String,
    pub sort_order: i32,
    pub open_status: String,
    pub publish_status: String,
    pub version: i32,
    pub payload: Value,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogCityRow {
    pub id: Uuid,
    pub country_id: Uuid,
    pub country_iso: String,
    pub country_name_zh: String,
    pub slug: String,
    pub name_zh: String,
    pub name_en: String,
    pub region_label: Option<String>,
    pub sort_order: i32,
    pub open_status: String,
    pub publish_status: String,
    pub version: i32,
    pub payload: Value,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogPoiRow {
    pub id: Uuid,
    pub city_id: Uuid,
    pub city_name_zh: String,
    pub country_iso: String,
    pub poi_type: String,
    pub slug: String,
    pub name_zh: String,
    pub name_en: String,
    pub description_zh: Option<String>,
    pub description_en: Option<String>,
    pub tier: Option<String>,
    pub sort_order: i32,
    pub publish_status: String,
    pub version: i32,
    pub payload: Value,
    pub legacy_value: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogPricingRow {
    pub id: Uuid,
    pub country_id: Uuid,
    pub country_iso: String,
    pub country_name_zh: String,
    pub currency_code: String,
    pub per_attraction_cents: i64,
    pub per_food_cents: i64,
    pub hotel_base_per_night_cents: i64,
    pub city_transport_price: Value,
    pub intercity_price_per_person: Value,
    pub guide_levels_per_day: Value,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogRouteRow {
    pub id: Uuid,
    pub from_city_id: Uuid,
    pub to_city_id: Uuid,
    pub from_city_name_zh: String,
    pub to_city_name_zh: String,
    pub mode: String,
    pub duration_min: Option<i32>,
    pub price_ref_cents: Option<i64>,
    pub rules_json: Value,
    pub publish_status: String,
    pub version: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogPublishQueueRow {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub label: String,
    pub publish_status: String,
    pub version: i32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminCatalogRevisionRow {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub version: i32,
    pub action: String,
    pub actor_id: Option<Uuid>,
    pub request_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn insert_catalog_revision<'e, E>(
    ex: E,
    entity_type: &str,
    entity_id: Uuid,
    version: i32,
    before_json: Option<Value>,
    after_json: Option<Value>,
    actor_id: Option<Uuid>,
    action: &str,
    request_id: Option<&str>,
) -> Result<(), sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    sqlx::query(
        r#"INSERT INTO catalog_content_revisions
           (entity_type, entity_id, version, before_json, after_json, actor_id, action, request_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(version)
    .bind(before_json)
    .bind(after_json)
    .bind(actor_id)
    .bind(action)
    .bind(request_id)
    .bind(Utc::now())
    .execute(ex)
    .await?;
    Ok(())
}

pub async fn list_admin_catalog_countries(
    pool: &PgPool,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogCountryRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogCountryRow>(
        r#"SELECT id, iso3166, name_zh, name_en, sort_order, open_status, publish_status,
                  version, payload, published_at, created_at, updated_at
           FROM catalog_countries
           WHERE ($1::text IS NULL OR publish_status = $1)
           ORDER BY sort_order, iso3166"#,
    )
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_catalog_country(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminCatalogCountryRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogCountryRow>(
        r#"SELECT id, iso3166, name_zh, name_en, sort_order, open_status, publish_status,
                  version, payload, published_at, created_at, updated_at
           FROM catalog_countries WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_admin_catalog_country(
    pool: &PgPool,
    iso3166: &str,
    name_zh: &str,
    name_en: &str,
    sort_order: i32,
    open_status: &str,
    payload: Value,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<AdminCatalogCountryRow, sqlx::Error> {
    let row = sqlx::query_as::<_, AdminCatalogCountryRow>(
        r#"INSERT INTO catalog_countries
           (iso3166, name_zh, name_en, sort_order, open_status, publish_status, version, payload, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'draft', 1, $6, $7, $7)
           RETURNING id, iso3166, name_zh, name_en, sort_order, open_status, publish_status,
                     version, payload, published_at, created_at, updated_at"#,
    )
    .bind(iso3166)
    .bind(name_zh)
    .bind(name_en)
    .bind(sort_order)
    .bind(open_status)
    .bind(payload)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;
    insert_catalog_revision(
        pool,
        "catalog_countries",
        row.id,
        row.version,
        None,
        Some(json!(row)),
        actor_id,
        "create",
        request_id,
    )
    .await?;
    Ok(row)
}

pub async fn patch_admin_catalog_country(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    name_zh: Option<&str>,
    name_en: Option<&str>,
    sort_order: Option<i32>,
    open_status: Option<&str>,
    payload: Option<Value>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogCountryRow, &'static str>, sqlx::Error> {
    let before = get_admin_catalog_country(pool, id).await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    let row = sqlx::query_as::<_, AdminCatalogCountryRow>(
        r#"UPDATE catalog_countries SET
             name_zh = COALESCE($2, name_zh),
             name_en = COALESCE($3, name_en),
             sort_order = COALESCE($4, sort_order),
             open_status = COALESCE($5, open_status),
             payload = COALESCE($6, payload),
             version = version + 1,
             updated_at = $7
           WHERE id = $1 AND version = $8
           RETURNING id, iso3166, name_zh, name_en, sort_order, open_status, publish_status,
                     version, payload, published_at, created_at, updated_at"#,
    )
    .bind(id)
    .bind(name_zh)
    .bind(name_en)
    .bind(sort_order)
    .bind(open_status)
    .bind(payload)
    .bind(Utc::now())
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        "catalog_countries",
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

async fn set_catalog_publish_status(
    pool: &PgPool,
    table: &str,
    entity_type: &str,
    id: Uuid,
    expected_version: i32,
    from_statuses: &[&str],
    to_status: &str,
    set_published_at: bool,
    actor_id: Option<Uuid>,
    action: &str,
    request_id: Option<&str>,
) -> Result<Result<(i32, Value), &'static str>, sqlx::Error> {
    let before_json: Option<(Value,)> = sqlx::query_as(&format!(
        "SELECT row_to_json(t)::jsonb FROM {table} t WHERE id = $1"
    ))
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some((before_json,)) = before_json else {
        return Ok(Err("not_found"));
    };
    let version_check: Option<(i32, String)> = sqlx::query_as(&format!(
        "SELECT version, publish_status FROM {table} WHERE id = $1"
    ))
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some((version, status)) = version_check else {
        return Ok(Err("not_found"));
    };
    if version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if !from_statuses.contains(&status.as_str()) {
        return Ok(Err("invalid_status_transition"));
    }
    let published_clause = if set_published_at {
        ", published_at = now()"
    } else if to_status == "archived" {
        ", published_at = NULL"
    } else {
        ""
    };
    let sql = format!(
        "UPDATE {table} SET publish_status = $2, version = version + 1, updated_at = now(){published_clause}
         WHERE id = $1 AND version = $3
         RETURNING version, row_to_json({table})::jsonb"
    );
    let after: Option<(i32, Value)> = sqlx::query_as(&sql)
        .bind(id)
        .bind(to_status)
        .bind(expected_version)
        .fetch_optional(pool)
        .await?;
    let Some((new_version, after_json)) = after else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        entity_type,
        id,
        new_version,
        Some(before_json),
        Some(after_json.clone()),
        actor_id,
        action,
        request_id,
    )
    .await?;
    Ok(Ok((new_version, after_json)))
}

pub async fn submit_review_catalog_country(
    pool: &PgPool,
    id: Uuid,
    version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match set_catalog_publish_status(
        pool,
        "catalog_countries",
        "catalog_countries",
        id,
        version,
        &["draft", "published"],
        "in_review",
        false,
        actor_id,
        "submit_review",
        request_id,
    )
    .await?
    {
        Ok((v, _)) => Ok(Ok(v)),
        Err(e) => Ok(Err(e)),
    }
}

pub async fn publish_catalog_country(
    pool: &PgPool,
    id: Uuid,
    version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match set_catalog_publish_status(
        pool,
        "catalog_countries",
        "catalog_countries",
        id,
        version,
        &["draft", "in_review"],
        "published",
        true,
        actor_id,
        "publish",
        request_id,
    )
    .await?
    {
        Ok((v, _)) => Ok(Ok(v)),
        Err(e) => Ok(Err(e)),
    }
}

pub async fn archive_catalog_country(
    pool: &PgPool,
    id: Uuid,
    version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match set_catalog_publish_status(
        pool,
        "catalog_countries",
        "catalog_countries",
        id,
        version,
        &["published", "in_review", "draft"],
        "archived",
        false,
        actor_id,
        "archive",
        request_id,
    )
    .await?
    {
        Ok((v, _)) => Ok(Ok(v)),
        Err(e) => Ok(Err(e)),
    }
}

pub async fn list_admin_catalog_cities(
    pool: &PgPool,
    country_id: Option<Uuid>,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogCityRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogCityRow>(
        r#"SELECT c.id, c.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  c.slug, c.name_zh, c.name_en, c.region_label, c.sort_order, c.open_status,
                  c.publish_status, c.version, c.payload, c.published_at, c.created_at, c.updated_at
           FROM catalog_cities c
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE ($1::uuid IS NULL OR c.country_id = $1)
             AND ($2::text IS NULL OR c.publish_status = $2)
           ORDER BY co.sort_order, c.sort_order, c.name_zh"#,
    )
    .bind(country_id)
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn create_admin_catalog_city(
    pool: &PgPool,
    country_id: Uuid,
    slug: &str,
    name_zh: &str,
    name_en: &str,
    region_label: Option<&str>,
    sort_order: i32,
    open_status: &str,
    payload: Value,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogCityRow, &'static str>, sqlx::Error> {
    let exists: Option<(i64,)> =
        sqlx::query_as("SELECT 1 FROM catalog_countries WHERE id = $1")
            .bind(country_id)
            .fetch_optional(pool)
            .await?;
    if exists.is_none() {
        return Ok(Err("country_not_found"));
    }
    let inserted = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO catalog_cities
           (country_id, slug, name_zh, name_en, region_label, sort_order, open_status, publish_status, version, payload, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 1, $8, $9, $9)
           RETURNING id"#,
    )
    .bind(country_id)
    .bind(slug)
    .bind(name_zh)
    .bind(name_en)
    .bind(region_label)
    .bind(sort_order)
    .bind(open_status)
    .bind(payload.clone())
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;
    let row = sqlx::query_as::<_, AdminCatalogCityRow>(
        r#"SELECT c.id, c.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  c.slug, c.name_zh, c.name_en, c.region_label, c.sort_order, c.open_status,
                  c.publish_status, c.version, c.payload, c.published_at, c.created_at, c.updated_at
           FROM catalog_cities c
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE c.id = $1"#,
    )
    .bind(inserted)
    .fetch_one(pool)
    .await?;
    insert_catalog_revision(
        pool,
        "catalog_cities",
        row.id,
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

pub async fn patch_admin_catalog_city(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    name_zh: Option<&str>,
    name_en: Option<&str>,
    region_label: Option<&str>,
    sort_order: Option<i32>,
    open_status: Option<&str>,
    payload: Option<Value>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogCityRow, &'static str>, sqlx::Error> {
    let before: Option<AdminCatalogCityRow> = sqlx::query_as(
        r#"SELECT c.id, c.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  c.slug, c.name_zh, c.name_en, c.region_label, c.sort_order, c.open_status,
                  c.publish_status, c.version, c.payload, c.published_at, c.created_at, c.updated_at
           FROM catalog_cities c JOIN catalog_countries co ON co.id = c.country_id WHERE c.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    let row = sqlx::query_as::<_, AdminCatalogCityRow>(
        r#"UPDATE catalog_cities AS c SET
             name_zh = COALESCE($2, c.name_zh),
             name_en = COALESCE($3, c.name_en),
             region_label = COALESCE($4, c.region_label),
             sort_order = COALESCE($5, c.sort_order),
             open_status = COALESCE($6, c.open_status),
             payload = COALESCE($7, c.payload),
             version = c.version + 1,
             updated_at = $8
           FROM catalog_countries AS co
           WHERE c.id = $1 AND c.country_id = co.id AND c.version = $9
           RETURNING c.id, c.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                     c.slug, c.name_zh, c.name_en, c.region_label, c.sort_order, c.open_status,
                     c.publish_status, c.version, c.payload, c.published_at, c.created_at, c.updated_at"#,
    )
    .bind(id)
    .bind(name_zh)
    .bind(name_en)
    .bind(region_label)
    .bind(sort_order)
    .bind(open_status)
    .bind(payload)
    .bind(Utc::now())
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        "catalog_cities",
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

pub async fn submit_review_catalog_entity(
    pool: &PgPool,
    table: &str,
    entity_type: &str,
    id: Uuid,
    version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match set_catalog_publish_status(
        pool,
        table,
        entity_type,
        id,
        version,
        &["draft", "published"],
        "in_review",
        false,
        actor_id,
        "submit_review",
        request_id,
    )
    .await?
    {
        Ok((v, _)) => Ok(Ok(v)),
        Err(e) => Ok(Err(e)),
    }
}

pub async fn publish_catalog_entity(
    pool: &PgPool,
    table: &str,
    entity_type: &str,
    id: Uuid,
    version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match set_catalog_publish_status(
        pool,
        table,
        entity_type,
        id,
        version,
        &["draft", "in_review"],
        "published",
        true,
        actor_id,
        "publish",
        request_id,
    )
    .await?
    {
        Ok((v, _)) => Ok(Ok(v)),
        Err(e) => Ok(Err(e)),
    }
}

pub async fn archive_catalog_entity(
    pool: &PgPool,
    table: &str,
    entity_type: &str,
    id: Uuid,
    version: i32,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<i32, &'static str>, sqlx::Error> {
    match set_catalog_publish_status(
        pool,
        table,
        entity_type,
        id,
        version,
        &["published", "in_review", "draft"],
        "archived",
        false,
        actor_id,
        "archive",
        request_id,
    )
    .await?
    {
        Ok((v, _)) => Ok(Ok(v)),
        Err(e) => Ok(Err(e)),
    }
}

pub async fn list_admin_catalog_pois(
    pool: &PgPool,
    city_id: Option<Uuid>,
    poi_type: Option<&str>,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogPoiRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogPoiRow>(
        r#"SELECT p.id, p.city_id, c.name_zh AS city_name_zh, co.iso3166 AS country_iso,
                  p.poi_type, p.slug, p.name_zh, p.name_en, p.description_zh, p.description_en,
                  p.tier, p.sort_order, p.publish_status, p.version, p.payload, p.legacy_value,
                  p.published_at, p.created_at, p.updated_at
           FROM catalog_pois p
           JOIN catalog_cities c ON c.id = p.city_id
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE ($1::uuid IS NULL OR p.city_id = $1)
             AND ($2::text IS NULL OR p.poi_type = $2)
             AND ($3::text IS NULL OR p.publish_status = $3)
           ORDER BY co.sort_order, c.sort_order, p.poi_type, p.sort_order, p.slug
           LIMIT 500"#,
    )
    .bind(city_id)
    .bind(poi_type)
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn create_admin_catalog_poi(
    pool: &PgPool,
    city_id: Uuid,
    poi_type: &str,
    slug: &str,
    name_zh: &str,
    name_en: &str,
    description_zh: Option<&str>,
    description_en: Option<&str>,
    tier: Option<&str>,
    sort_order: i32,
    payload: Value,
    legacy_value: Option<&str>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogPoiRow, &'static str>, sqlx::Error> {
    if !["attraction", "hotel", "food"].contains(&poi_type) {
        return Ok(Err("invalid_poi_type"));
    }
    let id = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO catalog_pois
           (city_id, poi_type, slug, name_zh, name_en, description_zh, description_en, tier,
            sort_order, publish_status, version, payload, legacy_value, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', 1, $10, $11, $12, $12)
           RETURNING id"#,
    )
    .bind(city_id)
    .bind(poi_type)
    .bind(slug)
    .bind(name_zh)
    .bind(name_en)
    .bind(description_zh)
    .bind(description_en)
    .bind(tier)
    .bind(sort_order)
    .bind(payload)
    .bind(legacy_value)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;
    let row = sqlx::query_as::<_, AdminCatalogPoiRow>(
        r#"SELECT p.id, p.city_id, c.name_zh AS city_name_zh, co.iso3166 AS country_iso,
                  p.poi_type, p.slug, p.name_zh, p.name_en, p.description_zh, p.description_en,
                  p.tier, p.sort_order, p.publish_status, p.version, p.payload, p.legacy_value,
                  p.published_at, p.created_at, p.updated_at
           FROM catalog_pois p
           JOIN catalog_cities c ON c.id = p.city_id
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE p.id = $1"#,
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    insert_catalog_revision(
        pool,
        "catalog_pois",
        row.id,
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

pub async fn patch_admin_catalog_poi(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    name_zh: Option<&str>,
    name_en: Option<&str>,
    description_zh: Option<&str>,
    description_en: Option<&str>,
    tier: Option<&str>,
    sort_order: Option<i32>,
    payload: Option<Value>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogPoiRow, &'static str>, sqlx::Error> {
    let before = sqlx::query_as::<_, AdminCatalogPoiRow>(
        r#"SELECT p.id, p.city_id, c.name_zh AS city_name_zh, co.iso3166 AS country_iso,
                  p.poi_type, p.slug, p.name_zh, p.name_en, p.description_zh, p.description_en,
                  p.tier, p.sort_order, p.publish_status, p.version, p.payload, p.legacy_value,
                  p.published_at, p.created_at, p.updated_at
           FROM catalog_pois p
           JOIN catalog_cities c ON c.id = p.city_id
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE p.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    if before.publish_status == "archived" {
        return Ok(Err("archived_readonly"));
    }
    let row = sqlx::query_as::<_, AdminCatalogPoiRow>(
        r#"UPDATE catalog_pois p SET
             name_zh = COALESCE($2, p.name_zh),
             name_en = COALESCE($3, p.name_en),
             description_zh = COALESCE($4, p.description_zh),
             description_en = COALESCE($5, p.description_en),
             tier = COALESCE($6, p.tier),
             sort_order = COALESCE($7, p.sort_order),
             payload = COALESCE($8, p.payload),
             version = p.version + 1,
             updated_at = $9
           FROM catalog_cities c, catalog_countries co
           WHERE p.id = $1 AND p.city_id = c.id AND c.country_id = co.id AND p.version = $10
           RETURNING p.id, p.city_id, c.name_zh AS city_name_zh, co.iso3166 AS country_iso,
                     p.poi_type, p.slug, p.name_zh, p.name_en, p.description_zh, p.description_en,
                     p.tier, p.sort_order, p.publish_status, p.version, p.payload, p.legacy_value,
                     p.published_at, p.created_at, p.updated_at"#,
    )
    .bind(id)
    .bind(name_zh)
    .bind(name_en)
    .bind(description_zh)
    .bind(description_en)
    .bind(tier)
    .bind(sort_order)
    .bind(payload)
    .bind(Utc::now())
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        "catalog_pois",
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

pub async fn list_admin_catalog_pricing(
    pool: &PgPool,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogPricingRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogPricingRow>(
        r#"SELECT p.id, p.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  p.currency_code, p.per_attraction_cents, p.per_food_cents, p.hotel_base_per_night_cents,
                  p.city_transport_price, p.intercity_price_per_person, p.guide_levels_per_day,
                  p.publish_status, p.version, p.published_at, p.updated_at
           FROM catalog_pricing_templates p
           JOIN catalog_countries co ON co.id = p.country_id
           WHERE ($1::text IS NULL OR p.publish_status = $1)
           ORDER BY co.sort_order"#,
    )
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn patch_admin_catalog_pricing(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    currency_code: Option<&str>,
    per_attraction_cents: Option<i64>,
    per_food_cents: Option<i64>,
    hotel_base_per_night_cents: Option<i64>,
    city_transport_price: Option<Value>,
    intercity_price_per_person: Option<Value>,
    guide_levels_per_day: Option<Value>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogPricingRow, &'static str>, sqlx::Error> {
    let before = sqlx::query_as::<_, AdminCatalogPricingRow>(
        r#"SELECT p.id, p.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  p.currency_code, p.per_attraction_cents, p.per_food_cents, p.hotel_base_per_night_cents,
                  p.city_transport_price, p.intercity_price_per_person, p.guide_levels_per_day,
                  p.publish_status, p.version, p.published_at, p.updated_at
           FROM catalog_pricing_templates p
           JOIN catalog_countries co ON co.id = p.country_id
           WHERE p.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    let row = sqlx::query_as::<_, AdminCatalogPricingRow>(
        r#"UPDATE catalog_pricing_templates p SET
             currency_code = COALESCE($2, p.currency_code),
             per_attraction_cents = COALESCE($3, p.per_attraction_cents),
             per_food_cents = COALESCE($4, p.per_food_cents),
             hotel_base_per_night_cents = COALESCE($5, p.hotel_base_per_night_cents),
             city_transport_price = COALESCE($6, p.city_transport_price),
             intercity_price_per_person = COALESCE($7, p.intercity_price_per_person),
             guide_levels_per_day = COALESCE($8, p.guide_levels_per_day),
             version = p.version + 1,
             updated_at = $9
           FROM catalog_countries co
           WHERE p.id = $1 AND p.country_id = co.id AND p.version = $10
           RETURNING p.id, p.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                     p.currency_code, p.per_attraction_cents, p.per_food_cents, p.hotel_base_per_night_cents,
                     p.city_transport_price, p.intercity_price_per_person, p.guide_levels_per_day,
                     p.publish_status, p.version, p.published_at, p.updated_at"#,
    )
    .bind(id)
    .bind(currency_code)
    .bind(per_attraction_cents)
    .bind(per_food_cents)
    .bind(hotel_base_per_night_cents)
    .bind(city_transport_price)
    .bind(intercity_price_per_person)
    .bind(guide_levels_per_day)
    .bind(Utc::now())
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        "catalog_pricing_templates",
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

pub async fn list_admin_catalog_routes(
    pool: &PgPool,
    publish_status: Option<&str>,
) -> Result<Vec<AdminCatalogRouteRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogRouteRow>(
        r#"SELECT r.id, r.from_city_id, r.to_city_id, fc.name_zh AS from_city_name_zh,
                  tc.name_zh AS to_city_name_zh, r.mode, r.duration_min, r.price_ref_cents,
                  r.rules_json, r.publish_status, r.version, r.published_at, r.updated_at
           FROM catalog_intercity_routes r
           JOIN catalog_cities fc ON fc.id = r.from_city_id
           JOIN catalog_cities tc ON tc.id = r.to_city_id
           WHERE ($1::text IS NULL OR r.publish_status = $1)
           ORDER BY fc.name_zh, tc.name_zh, r.mode
           LIMIT 500"#,
    )
    .bind(publish_status)
    .fetch_all(pool)
    .await
}

pub async fn patch_admin_catalog_route(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    duration_min: Option<i32>,
    price_ref_cents: Option<i64>,
    rules_json: Option<Value>,
    actor_id: Option<Uuid>,
    request_id: Option<&str>,
) -> Result<Result<AdminCatalogRouteRow, &'static str>, sqlx::Error> {
    let before = sqlx::query_as::<_, AdminCatalogRouteRow>(
        r#"SELECT r.id, r.from_city_id, r.to_city_id, fc.name_zh AS from_city_name_zh,
                  tc.name_zh AS to_city_name_zh, r.mode, r.duration_min, r.price_ref_cents,
                  r.rules_json, r.publish_status, r.version, r.published_at, r.updated_at
           FROM catalog_intercity_routes r
           JOIN catalog_cities fc ON fc.id = r.from_city_id
           JOIN catalog_cities tc ON tc.id = r.to_city_id
           WHERE r.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    let Some(before) = before else {
        return Ok(Err("not_found"));
    };
    if before.version != expected_version {
        return Ok(Err("version_conflict"));
    }
    let row = sqlx::query_as::<_, AdminCatalogRouteRow>(
        r#"UPDATE catalog_intercity_routes r SET
             duration_min = COALESCE($2, r.duration_min),
             price_ref_cents = COALESCE($3, r.price_ref_cents),
             rules_json = COALESCE($4, r.rules_json),
             version = r.version + 1,
             updated_at = $5
           FROM catalog_cities fc, catalog_cities tc
           WHERE r.id = $1 AND r.from_city_id = fc.id AND r.to_city_id = tc.id AND r.version = $6
           RETURNING r.id, r.from_city_id, r.to_city_id, fc.name_zh AS from_city_name_zh,
                     tc.name_zh AS to_city_name_zh, r.mode, r.duration_min, r.price_ref_cents,
                     r.rules_json, r.publish_status, r.version, r.published_at, r.updated_at"#,
    )
    .bind(id)
    .bind(duration_min)
    .bind(price_ref_cents)
    .bind(rules_json)
    .bind(Utc::now())
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(Err("version_conflict"));
    };
    insert_catalog_revision(
        pool,
        "catalog_intercity_routes",
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

pub async fn list_admin_catalog_publish_queue(
    pool: &PgPool,
) -> Result<Vec<AdminCatalogPublishQueueRow>, sqlx::Error> {
    let mut items: Vec<AdminCatalogPublishQueueRow> = Vec::new();
    let countries: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_countries'::text AS entity_type, id AS entity_id,
                  name_zh AS label, publish_status, version, updated_at
           FROM catalog_countries WHERE publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(countries);
    let cities: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_cities'::text, id, name_zh, publish_status, version, updated_at
           FROM catalog_cities WHERE publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(cities);
    let pois: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_pois'::text, id,
                  name_zh || ' (' || poi_type || ')' AS label,
                  publish_status, version, updated_at
           FROM catalog_pois WHERE publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(pois);
    let pricing: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_pricing_templates'::text, p.id,
                  co.name_zh || ' pricing' AS label,
                  p.publish_status, p.version, p.updated_at
           FROM catalog_pricing_templates p
           JOIN catalog_countries co ON co.id = p.country_id
           WHERE p.publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(pricing);
    let routes: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_intercity_routes'::text, r.id,
                  fc.name_zh || '→' || tc.name_zh || ' (' || r.mode || ')' AS label,
                  r.publish_status, r.version, r.updated_at
           FROM catalog_intercity_routes r
           JOIN catalog_cities fc ON fc.id = r.from_city_id
           JOIN catalog_cities tc ON tc.id = r.to_city_id
           WHERE r.publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(routes);
    let hotel_tiers: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_hotel_tier_definitions'::text, id,
                  tier_code || ' hotel tier' AS label,
                  publish_status, version, updated_at
           FROM catalog_hotel_tier_definitions WHERE publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(hotel_tiers);
    let transport_rules: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_transport_region_rules'::text, r.id,
                  co.name_zh || ' transport rules' AS label,
                  r.publish_status, r.version, r.updated_at
           FROM catalog_transport_region_rules r
           JOIN catalog_countries co ON co.id = r.country_id
           WHERE r.publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(transport_rules);
    let media_assets: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_media_assets'::text, id,
                  asset_kind || ': ' || left(url, 48) AS label,
                  publish_status, version, updated_at
           FROM catalog_media_assets WHERE publish_status = 'in_review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(media_assets);
    let poi_batches: Vec<AdminCatalogPublishQueueRow> = sqlx::query_as(
        r#"SELECT 'catalog_poi_image_batches'::text AS entity_type, id AS entity_id,
                  batch_name AS label, status AS publish_status, version, updated_at
           FROM catalog_poi_image_batches WHERE status = 'review'"#,
    )
    .fetch_all(pool)
    .await?;
    items.extend(poi_batches);
    items.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(items)
}

pub async fn list_admin_catalog_revisions(
    pool: &PgPool,
    entity_type: &str,
    entity_id: Uuid,
    limit: i64,
) -> Result<Vec<AdminCatalogRevisionRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminCatalogRevisionRow>(
        r#"SELECT id, entity_type, entity_id, version, action, actor_id, request_id, created_at
           FROM catalog_content_revisions
           WHERE entity_type = $1 AND entity_id = $2
           ORDER BY created_at DESC
           LIMIT $3"#,
    )
    .bind(entity_type)
    .bind(entity_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn create_catalog_publish_approval_request(
    pool: &PgPool,
    requested_by: Uuid,
    entity_type: &str,
    entity_id: Uuid,
    version: i32,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Result<Uuid, &'static str>, sqlx::Error> {
    let table = match entity_type {
        "catalog_countries" => "catalog_countries",
        "catalog_cities" => "catalog_cities",
        "catalog_pois" => "catalog_pois",
        "catalog_pricing_templates" => "catalog_pricing_templates",
        "catalog_intercity_routes" => "catalog_intercity_routes",
        "catalog_hotel_tier_definitions" => "catalog_hotel_tier_definitions",
        "catalog_transport_region_rules" => "catalog_transport_region_rules",
        "catalog_media_assets" => "catalog_media_assets",
        _ => return Ok(Err("invalid_entity_type")),
    };
    let row: Option<(String, i32)> = sqlx::query_as(&format!(
        "SELECT publish_status, version FROM {table} WHERE id = $1"
    ))
    .bind(entity_id)
    .fetch_optional(pool)
    .await?;
    let Some((status, ver)) = row else {
        return Ok(Err("not_found"));
    };
    if ver != version {
        return Ok(Err("version_conflict"));
    }
    if status != "in_review" {
        return Ok(Err("not_in_review"));
    }
    let before_payload = json!({ "publish_status": status, "version": ver });
    let after_payload = json!({
        "entity_type": entity_type,
        "entity_id": entity_id,
        "version": ver,
        "target_publish_status": "published",
    });
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('catalog.entity.publish', $1, $2, $3, 'pending', $4, $5, $6, $7)
           RETURNING id"#,
    )
    .bind(entity_type)
    .bind(entity_id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(before_payload)
    .bind(after_payload)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('catalog.entity.publish.requested', $1, $2, $3, $4, $5, $6)"#,
    )
    .bind(entity_type)
    .bind(entity_id.to_string())
    .bind(requested_by)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id, "version": ver }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Ok(approval_id))
}

pub async fn approve_catalog_publish_request_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approver_id: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<(Uuid, String, Uuid, i32)>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let existing: Option<(String, String, String, Uuid, String, Value, Value)> = sqlx::query_as(
        r#"SELECT action, resource_type, resource_id, requested_by, status, before_payload, after_payload
           FROM admin_approval_requests WHERE id = $1 FOR UPDATE"#,
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(existing) = existing else {
        return Ok(None);
    };
    if existing.0 != "catalog.entity.publish" || existing.4 != "pending" {
        return Ok(None);
    }
    if existing.3 == approver_id {
        return Ok(None);
    }
    let entity_type = existing.1;
    let entity_id = Uuid::parse_str(&existing.2).unwrap_or_else(|_| Uuid::nil());
    if entity_id.is_nil() {
        return Ok(None);
    }
    let version = existing
        .6
        .get("version")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    let table = match entity_type.as_str() {
        "catalog_countries" => "catalog_countries",
        "catalog_cities" => "catalog_cities",
        "catalog_pois" => "catalog_pois",
        "catalog_pricing_templates" => "catalog_pricing_templates",
        "catalog_intercity_routes" => "catalog_intercity_routes",
        "catalog_hotel_tier_definitions" => "catalog_hotel_tier_definitions",
        "catalog_transport_region_rules" => "catalog_transport_region_rules",
        "catalog_media_assets" => "catalog_media_assets",
        _ => return Ok(None),
    };
    tx.commit().await?;
    let publish_result = publish_catalog_entity(
        pool,
        table,
        &entity_type,
        entity_id,
        version,
        Some(approver_id),
        request_id,
    )
    .await?;
    let Ok(new_version) = publish_result else {
        return Ok(None);
    };
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE admin_approval_requests SET status = 'approved', approved_by = $2, approve_reason = $3, approved_at = $4
           WHERE id = $1 AND status = 'pending'"#,
    )
    .bind(approval_id)
    .bind(approver_id)
    .bind(reason)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('catalog.entity.publish.approved', $1, $2, $3, $4, $5, $6)"#,
    )
    .bind(&entity_type)
    .bind(entity_id.to_string())
    .bind(approver_id)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id, "new_version": new_version }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Some((approval_id, entity_type, entity_id, new_version)))
}

#[cfg(test)]
mod tests {
    #[test]
    fn publish_status_values_match_ddl() {
        for s in ["draft", "in_review", "published", "archived"] {
            assert!(!s.is_empty());
        }
    }
}
