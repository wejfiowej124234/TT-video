//! Catalog CMS 只读查询（S2-API-RO · 109 · 107）
//! 仅返回 `publish_status = published` 行。

use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogCountryRow {
    pub id: Uuid,
    pub iso3166: String,
    pub name_zh: String,
    pub name_en: String,
    pub sort_order: i32,
    pub open_status: String,
    pub version: i32,
    pub payload: Value,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogCityRow {
    pub id: Uuid,
    pub country_id: Uuid,
    pub country_iso: String,
    pub slug: String,
    pub name_zh: String,
    pub name_en: String,
    pub region_label: Option<String>,
    pub sort_order: i32,
    pub open_status: String,
    pub version: i32,
    pub payload: Value,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogPoiRow {
    pub id: Uuid,
    pub city_id: Uuid,
    pub city_slug: String,
    pub city_name_zh: String,
    pub country_iso: String,
    pub poi_type: String,
    pub slug: String,
    pub name_zh: String,
    pub name_en: String,
    pub description_zh: Option<String>,
    pub legacy_value: Option<String>,
    pub sort_order: i32,
    pub version: i32,
    pub payload: Value,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogPricingRow {
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
    pub version: i32,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogIntercityRouteRow {
    pub id: Uuid,
    pub from_city_id: Uuid,
    pub to_city_id: Uuid,
    pub from_city_name_zh: String,
    pub to_city_name_zh: String,
    pub from_country_iso: String,
    pub mode: String,
    pub rules_json: Value,
    pub version: i32,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogHotelTierRow {
    pub id: Uuid,
    pub tier_code: String,
    pub sort_order: i32,
    pub multiplier: f64,
    pub label_key: String,
    pub description_key: String,
    pub submit_label_zh: String,
    pub version: i32,
    pub stock_image_url: Option<String>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogMediaRow {
    pub id: Uuid,
    pub asset_kind: String,
    pub source_type: String,
    pub url: String,
    pub license: Value,
    pub country_id: Option<Uuid>,
    pub country_iso: Option<String>,
    pub version: i32,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CatalogPoiImageRow {
    pub poi_id: Uuid,
    pub legacy_value: Option<String>,
    pub city_name_zh: String,
    pub country_iso: String,
    pub poi_type: String,
    pub image_url: String,
    pub image_source: String,
}

pub async fn list_catalog_countries(pool: &PgPool) -> Result<Vec<CatalogCountryRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogCountryRow>(
        r#"SELECT id, iso3166, name_zh, name_en, sort_order, open_status, version, payload
           FROM catalog_countries
           WHERE publish_status = 'published'
           ORDER BY sort_order, iso3166"#,
    )
    .fetch_all(pool)
    .await
}

pub async fn list_catalog_cities(
    pool: &PgPool,
    country_iso: Option<&str>,
) -> Result<Vec<CatalogCityRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogCityRow>(
        r#"SELECT c.id, c.country_id, co.iso3166 AS country_iso, c.slug, c.name_zh, c.name_en,
                  c.region_label, c.sort_order, c.open_status, c.version, c.payload
           FROM catalog_cities c
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE c.publish_status = 'published' AND co.publish_status = 'published'
             AND ($1::text IS NULL OR co.iso3166 = $1)
           ORDER BY co.sort_order, c.sort_order, c.name_zh"#,
    )
    .bind(country_iso)
    .fetch_all(pool)
    .await
}

pub async fn list_catalog_pois(
    pool: &PgPool,
    city_id: Option<Uuid>,
    country_iso: Option<&str>,
    city_name_zh: Option<&str>,
    poi_type: Option<&str>,
) -> Result<Vec<CatalogPoiRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogPoiRow>(
        r#"SELECT p.id, p.city_id, c.slug AS city_slug, c.name_zh AS city_name_zh, co.iso3166 AS country_iso,
                  p.poi_type, p.slug, p.name_zh, p.name_en, p.description_zh, p.legacy_value,
                  p.sort_order, p.version, p.payload
           FROM catalog_pois p
           JOIN catalog_cities c ON c.id = p.city_id
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE p.publish_status = 'published'
             AND c.publish_status = 'published'
             AND co.publish_status = 'published'
             AND ($1::uuid IS NULL OR p.city_id = $1)
             AND ($2::text IS NULL OR co.iso3166 = $2)
             AND ($3::text IS NULL OR c.name_zh = $3)
             AND ($4::text IS NULL OR p.poi_type = $4)
           ORDER BY co.sort_order, c.sort_order, p.poi_type, p.sort_order, p.slug"#,
    )
    .bind(city_id)
    .bind(country_iso)
    .bind(city_name_zh)
    .bind(poi_type)
    .fetch_all(pool)
    .await
}

pub async fn list_catalog_pricing(
    pool: &PgPool,
    country_iso: Option<&str>,
) -> Result<Vec<CatalogPricingRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogPricingRow>(
        r#"SELECT p.id, p.country_id, co.iso3166 AS country_iso, co.name_zh AS country_name_zh,
                  p.currency_code, p.per_attraction_cents, p.per_food_cents, p.hotel_base_per_night_cents,
                  p.city_transport_price, p.intercity_price_per_person, p.guide_levels_per_day, p.version
           FROM catalog_pricing_templates p
           JOIN catalog_countries co ON co.id = p.country_id
           WHERE p.publish_status = 'published' AND co.publish_status = 'published'
             AND ($1::text IS NULL OR co.iso3166 = $1)
           ORDER BY co.sort_order"#,
    )
    .bind(country_iso)
    .fetch_all(pool)
    .await
}

pub async fn list_catalog_intercity_routes(
    pool: &PgPool,
    from_city_id: Option<Uuid>,
    to_city_id: Option<Uuid>,
    from_city_name_zh: Option<&str>,
    to_city_name_zh: Option<&str>,
    country_iso: Option<&str>,
) -> Result<Vec<CatalogIntercityRouteRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogIntercityRouteRow>(
        r#"SELECT r.id, r.from_city_id, r.to_city_id,
                  fc.name_zh AS from_city_name_zh, tc.name_zh AS to_city_name_zh,
                  fco.iso3166 AS from_country_iso, r.mode, r.rules_json, r.version
           FROM catalog_intercity_routes r
           JOIN catalog_cities fc ON fc.id = r.from_city_id
           JOIN catalog_cities tc ON tc.id = r.to_city_id
           JOIN catalog_countries fco ON fco.id = fc.country_id
           WHERE r.publish_status = 'published'
             AND fc.publish_status = 'published'
             AND tc.publish_status = 'published'
             AND ($1::uuid IS NULL OR r.from_city_id = $1)
             AND ($2::uuid IS NULL OR r.to_city_id = $2)
             AND ($3::text IS NULL OR fc.name_zh = $3)
             AND ($4::text IS NULL OR tc.name_zh = $4)
             AND ($5::text IS NULL OR fco.iso3166 = $5)
           ORDER BY fco.sort_order, fc.name_zh, tc.name_zh, r.mode"#,
    )
    .bind(from_city_id)
    .bind(to_city_id)
    .bind(from_city_name_zh)
    .bind(to_city_name_zh)
    .bind(country_iso)
    .fetch_all(pool)
    .await
}

pub async fn list_catalog_media(
    pool: &PgPool,
    asset_kind: Option<&str>,
    country_iso: Option<&str>,
) -> Result<Vec<CatalogMediaRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogMediaRow>(
        r#"SELECT m.id, m.asset_kind, m.source_type, m.url, m.license, m.country_id,
                  co.iso3166 AS country_iso, m.version
           FROM catalog_media_assets m
           LEFT JOIN catalog_countries co ON co.id = m.country_id
           WHERE m.publish_status = 'published'
             AND ($1::text IS NULL OR m.asset_kind = $1)
             AND ($2::text IS NULL OR co.iso3166 = $2)
           ORDER BY m.asset_kind, m.url"#,
    )
    .bind(asset_kind)
    .bind(country_iso)
    .fetch_all(pool)
    .await
}

pub async fn list_catalog_hotel_tiers(pool: &PgPool) -> Result<Vec<CatalogHotelTierRow>, sqlx::Error> {
    sqlx::query_as::<_, CatalogHotelTierRow>(
        r#"SELECT t.id,
                  t.tier_code,
                  t.sort_order,
                  (t.multiplier)::float8 AS multiplier,
                  t.label_key,
                  t.description_key,
                  t.submit_label_zh,
                  t.version,
                  m.url AS stock_image_url
           FROM catalog_hotel_tier_definitions t
           LEFT JOIN catalog_media_assets m
             ON m.id = t.stock_image_asset_id AND m.publish_status = 'published'
           WHERE t.publish_status = 'published'
           ORDER BY t.sort_order, t.tier_code"#,
    )
    .fetch_all(pool)
    .await
}

pub async fn count_catalog_published_summary(
    pool: &PgPool,
) -> Result<(i64, i64, i64, i64, i64, i64, i64), sqlx::Error> {
    let countries: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_countries WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let cities: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_cities WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let pois: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_pois WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let pricing: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_pricing_templates WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let routes: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_intercity_routes WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let media: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_media_assets WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let hotel_tiers: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_hotel_tier_definitions WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    Ok((
        countries.0,
        cities.0,
        pois.0,
        pricing.0,
        routes.0,
        media.0,
        hotel_tiers.0,
    ))
}

const POI_IMAGE_SELECT: &str = r#"SELECT p.id AS poi_id,
                  p.legacy_value,
                  c.name_zh AS city_name_zh,
                  co.iso3166 AS country_iso,
                  p.poi_type,
                  COALESCE(
                    NULLIF(pub.image_url, ''),
                    NULLIF(p.payload->>'image_url', ''),
                    NULLIF(p.payload->>'image', '')
                  ) AS image_url,
                  CASE
                    WHEN pub.poi_id IS NOT NULL AND NULLIF(pub.image_url, '') IS NOT NULL THEN 'published'
                    ELSE 'payload'
                  END AS image_source
           FROM catalog_pois p
           JOIN catalog_cities c ON c.id = p.city_id
           JOIN catalog_countries co ON co.id = c.country_id
           LEFT JOIN catalog_poi_images_published pub ON pub.poi_id = p.id"#;

pub async fn list_catalog_poi_images(
    pool: &PgPool,
    country_iso: Option<&str>,
    city_name_zh: Option<&str>,
    poi_type: Option<&str>,
) -> Result<Vec<CatalogPoiImageRow>, sqlx::Error> {
    let sql = format!(
        r#"{POI_IMAGE_SELECT}
           WHERE p.publish_status = 'published'
             AND c.publish_status = 'published'
             AND co.publish_status = 'published'
             AND ($1::text IS NULL OR co.iso3166 = $1)
             AND ($2::text IS NULL OR c.name_zh = $2)
             AND ($3::text IS NULL OR p.poi_type = $3)
             AND COALESCE(
               NULLIF(pub.image_url, ''),
               NULLIF(p.payload->>'image_url', ''),
               NULLIF(p.payload->>'image', '')
             ) IS NOT NULL
           ORDER BY co.sort_order, c.sort_order, p.poi_type, p.sort_order, p.slug"#
    );
    sqlx::query_as::<_, CatalogPoiImageRow>(&sql)
        .bind(country_iso)
        .bind(city_name_zh)
        .bind(poi_type)
        .fetch_all(pool)
        .await
}

pub async fn get_catalog_poi_image_by_id(
    pool: &PgPool,
    poi_id: Uuid,
) -> Result<Option<CatalogPoiImageRow>, sqlx::Error> {
    let sql = format!(
        r#"{POI_IMAGE_SELECT}
           WHERE p.publish_status = 'published'
             AND c.publish_status = 'published'
             AND co.publish_status = 'published'
             AND p.id = $1
             AND COALESCE(
               NULLIF(pub.image_url, ''),
               NULLIF(p.payload->>'image_url', ''),
               NULLIF(p.payload->>'image', '')
             ) IS NOT NULL"#
    );
    sqlx::query_as::<_, CatalogPoiImageRow>(&sql)
        .bind(poi_id)
        .fetch_optional(pool)
        .await
}

pub async fn catalog_country_name_zh_exists(pool: &PgPool, name_zh: &str) -> Result<bool, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"SELECT count(*)::bigint FROM catalog_countries
           WHERE publish_status = 'published' AND name_zh = $1"#,
    )
    .bind(name_zh)
    .fetch_one(pool)
    .await?;
    Ok(row.0 > 0)
}

pub async fn catalog_preset_city_exists(
    pool: &PgPool,
    country_name_zh: &str,
    city_name_zh: &str,
) -> Result<bool, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"SELECT count(*)::bigint FROM catalog_cities c
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE co.publish_status = 'published'
             AND c.publish_status = 'published'
             AND co.name_zh = $1
             AND c.name_zh = $2"#,
    )
    .bind(country_name_zh)
    .bind(city_name_zh)
    .fetch_one(pool)
    .await?;
    Ok(row.0 > 0)
}

pub async fn list_catalog_product_countries_ordered(
    pool: &PgPool,
) -> Result<Vec<(String, String)>, sqlx::Error> {
    let rows: Vec<(String, String)> = sqlx::query_as(
        r#"SELECT iso3166, name_zh FROM catalog_countries
           WHERE publish_status = 'published'
           ORDER BY sort_order, iso3166"#,
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn list_catalog_city_names_zh_for_country(
    pool: &PgPool,
    country_name_zh: &str,
) -> Result<Vec<String>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        r#"SELECT c.name_zh FROM catalog_cities c
           JOIN catalog_countries co ON co.id = c.country_id
           WHERE co.publish_status = 'published'
             AND c.publish_status = 'published'
             AND co.name_zh = $1
           ORDER BY c.sort_order, c.name_zh"#,
    )
    .bind(country_name_zh)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|r| r.0).collect())
}
