//! Admin Catalog server geo validation · meta parity · drift · observability (C-S5 · 117/118/119 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use traveltrust_core::{preset_cities_zh_for_country, PRODUCT_COUNTRY_CODES, PRODUCT_COUNTRY_NAMES_ZH};
use uuid::Uuid;

use crate::catalog_geo_validation::{
    catalog_server_geo_validation_enabled, meta_product_countries_core_snapshot,
    meta_product_countries_dual_write_order, resolve_meta_product_countries,
    MetaProductCountriesReadSource,
};

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogGeoValidationHistoryRow {
    pub id: Uuid,
    pub action: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub actor_id: Uuid,
    pub request_id: Option<String>,
    pub payload: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogGeoFlagStatus {
    pub catalog_server_geo_validation_enabled: bool,
    pub catalog_server_geo_validation_env: String,
    pub next_public_catalog_api_enabled_env: String,
    pub next_public_catalog_api_enabled_note: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogGeoReadSourceStatus {
    pub meta_read_source: String,
    pub post_itineraries_geo_source: String,
    pub dual_write_order: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogMetaProductCountriesParityRow {
    pub index: usize,
    pub core_iso: String,
    pub core_name_zh: String,
    pub catalog_iso: Option<String>,
    pub catalog_name_zh: Option<String>,
    pub passed: bool,
    pub detail: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogGeoDriftRow {
    pub id: String,
    pub severity: String,
    pub passed: bool,
    pub detail: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AdminCatalogGeoValidationSummary {
    pub flags: AdminCatalogGeoFlagStatus,
    pub read_source: AdminCatalogGeoReadSourceStatus,
    pub core_geo_parity_pass: bool,
    pub core_geo_parity_error: Option<String>,
    pub published_countries: i64,
    pub published_cities: i64,
    pub drift_detected: bool,
    pub drift_items: Vec<AdminCatalogGeoDriftRow>,
    pub meta_product_countries_parity: Vec<AdminCatalogMetaProductCountriesParityRow>,
    pub meta_product_countries_parity_pass: bool,
    pub open_b_s4_items: Vec<&'static str>,
    pub checked_at: DateTime<Utc>,
}

fn read_env_or_default(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| "unset".into())
}

fn next_public_catalog_api_enabled_observability() -> (String, String) {
    let raw = read_env_or_default("NEXT_PUBLIC_CATALOG_API_ENABLED");
    let enabled = matches!(raw.as_str(), "1" | "true" | "TRUE");
    let note = if enabled {
        "frontend catalog API adapter enabled on this process (120 break-glass only)".to_string()
    } else {
        "default 0/unset per 120 freeze; FE Consumer still TS cityDetails SSOT".to_string()
    };
    (raw, note)
}

pub async fn build_meta_product_countries_parity(
    pool: &PgPool,
) -> Result<Vec<AdminCatalogMetaProductCountriesParityRow>, sqlx::Error> {
    let catalog_rows = super::list_catalog_product_countries_ordered(pool).await?;
    let mut rows = Vec::with_capacity(PRODUCT_COUNTRY_CODES.len());
    for (i, core_iso) in PRODUCT_COUNTRY_CODES.iter().enumerate() {
        let core_name = PRODUCT_COUNTRY_NAMES_ZH[i];
        let catalog = catalog_rows.get(i);
        let (catalog_iso, catalog_name_zh, passed, detail) = match catalog {
            Some((iso, name_zh)) if iso == core_iso && name_zh == core_name => {
                (Some(iso.clone()), Some(name_zh.clone()), true, "match".into())
            }
            Some((iso, name_zh)) => (
                Some(iso.clone()),
                Some(name_zh.clone()),
                false,
                format!("iso/name_zh mismatch: core={core_iso}/{core_name} catalog={iso}/{name_zh}"),
            ),
            None => (
                None,
                None,
                false,
                format!("missing catalog row at index {i}"),
            ),
        };
        rows.push(AdminCatalogMetaProductCountriesParityRow {
            index: i,
            core_iso: (*core_iso).to_string(),
            core_name_zh: core_name.to_string(),
            catalog_iso,
            catalog_name_zh,
            passed,
            detail,
        });
    }
    Ok(rows)
}

pub async fn detect_catalog_geo_drift(pool: &PgPool) -> Result<Vec<AdminCatalogGeoDriftRow>, sqlx::Error> {
    let mut items = Vec::new();

    if let Err(e) = crate::catalog_geo_validation::assert_core_catalog_geo_parity(pool).await {
        items.push(AdminCatalogGeoDriftRow {
            id: "DRIFT-CORE-PG".into(),
            severity: "error".into(),
            passed: false,
            detail: e,
        });
    } else {
        items.push(AdminCatalogGeoDriftRow {
            id: "DRIFT-CORE-PG".into(),
            severity: "info".into(),
            passed: true,
            detail: "core product_countries + preset_cities match published catalog".into(),
        });
    }

    let resolved = resolve_meta_product_countries(Some(pool)).await;
    let expected = if catalog_server_geo_validation_enabled() {
        MetaProductCountriesReadSource::CatalogPg
    } else {
        MetaProductCountriesReadSource::Core
    };
    if resolved.read_source != expected {
        items.push(AdminCatalogGeoDriftRow {
            id: "DRIFT-META-READ-SOURCE".into(),
            severity: "warn".into(),
            passed: false,
            detail: format!(
                "flag={} but meta read_source={:?} (expected {:?} or core fallback)",
                catalog_server_geo_validation_enabled(),
                resolved.read_source,
                expected
            ),
        });
    }

    let published_countries: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_countries WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    if published_countries.0 != PRODUCT_COUNTRY_CODES.len() as i64 {
        items.push(AdminCatalogGeoDriftRow {
            id: "DRIFT-PUBLISHED-COUNTRIES".into(),
            severity: "warn".into(),
            passed: false,
            detail: format!(
                "published countries={} expected {}",
                published_countries.0,
                PRODUCT_COUNTRY_CODES.len()
            ),
        });
    }

    for (i, name_zh) in PRODUCT_COUNTRY_NAMES_ZH.iter().enumerate() {
        let core_cities: Vec<&str> = preset_cities_zh_for_country(name_zh)
            .map(|s| s.to_vec())
            .unwrap_or_default();
        let catalog_cities = super::list_catalog_city_names_zh_for_country(pool, name_zh).await?;
        if core_cities.len() != catalog_cities.len() {
            items.push(AdminCatalogGeoDriftRow {
                id: format!("DRIFT-CITIES-LEN-{i}"),
                severity: "error".into(),
                passed: false,
                detail: format!(
                    "city count for {name_zh}: core={} catalog={}",
                    core_cities.len(),
                    catalog_cities.len()
                ),
            });
        }
    }

    Ok(items)
}

pub async fn get_catalog_geo_validation_summary(
    pool: &PgPool,
) -> Result<AdminCatalogGeoValidationSummary, sqlx::Error> {
    let (api_enabled_env, api_enabled_note) = next_public_catalog_api_enabled_observability();
    let flags = AdminCatalogGeoFlagStatus {
        catalog_server_geo_validation_enabled: catalog_server_geo_validation_enabled(),
        catalog_server_geo_validation_env: read_env_or_default("CATALOG_SERVER_GEO_VALIDATION"),
        next_public_catalog_api_enabled_env: api_enabled_env,
        next_public_catalog_api_enabled_note: api_enabled_note,
    };

    let resolved = resolve_meta_product_countries(Some(pool)).await;
    let meta_source = match resolved.read_source {
        MetaProductCountriesReadSource::CatalogPg => "catalog-pg",
        MetaProductCountriesReadSource::Core => "core",
    };
    let post_source = if flags.catalog_server_geo_validation_enabled {
        "catalog-pg-opt-in"
    } else {
        "core"
    };
    let read_source = AdminCatalogGeoReadSourceStatus {
        meta_read_source: meta_source.to_string(),
        post_itineraries_geo_source: post_source.to_string(),
        dual_write_order: meta_product_countries_dual_write_order(resolved.read_source),
    };

    let parity_err = crate::catalog_geo_validation::assert_core_catalog_geo_parity(pool)
        .await
        .err();
    let meta_parity = build_meta_product_countries_parity(pool).await?;
    let meta_parity_pass = meta_parity.iter().all(|r| r.passed);
    let drift_items = detect_catalog_geo_drift(pool).await?;
    let drift_detected = drift_items.iter().any(|d| !d.passed);

    let published_countries: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_countries WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;
    let published_cities: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM catalog_cities WHERE publish_status = 'published'",
    )
    .fetch_one(pool)
    .await?;

    Ok(AdminCatalogGeoValidationSummary {
        flags,
        read_source,
        core_geo_parity_pass: parity_err.is_none(),
        core_geo_parity_error: parity_err,
        published_countries: published_countries.0,
        published_cities: published_cities.0,
        drift_detected,
        drift_items,
        meta_product_countries_parity_pass: meta_parity_pass,
        meta_product_countries_parity: meta_parity,
        open_b_s4_items: vec!["B-S4-02", "B-S4-03", "B-S4-04", "B-S4-05", "B-S4-06"],
        checked_at: Utc::now(),
    })
}

pub async fn list_catalog_geo_validation_history(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<AdminCatalogGeoValidationHistoryRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<String>,
            Option<String>,
            Uuid,
            Option<String>,
            Value,
            DateTime<Utc>,
        ),
    >(
        r#"SELECT id, action, resource_type, resource_id, actor_id, request_id, payload, created_at
           FROM admin_audit_logs
           WHERE action LIKE 'catalog.geo.%'
           ORDER BY created_at DESC
           LIMIT $1"#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(id, action, resource_type, resource_id, actor_id, request_id, payload, created_at)| {
                AdminCatalogGeoValidationHistoryRow {
                    id,
                    action,
                    resource_type,
                    resource_id,
                    actor_id,
                    request_id,
                    payload,
                    created_at,
                }
            },
        )
        .collect())
}

pub async fn insert_catalog_geo_validation_snapshot_audit(
    pool: &PgPool,
    actor_id: Uuid,
    request_id: Option<&str>,
    summary: &AdminCatalogGeoValidationSummary,
) -> Result<(), sqlx::Error> {
    let action = if summary.drift_detected {
        "catalog.geo.validation.drift_detected"
    } else {
        "catalog.geo.validation.snapshot"
    };
    super::insert_admin_audit_log(
        pool,
        actor_id,
        request_id,
        action,
        Some("catalog_geo_validation"),
        Some("summary"),
        &json!({
            "catalog_server_geo_validation_enabled": summary.flags.catalog_server_geo_validation_enabled,
            "meta_read_source": summary.read_source.meta_read_source,
            "core_geo_parity_pass": summary.core_geo_parity_pass,
            "meta_product_countries_parity_pass": summary.meta_product_countries_parity_pass,
            "drift_detected": summary.drift_detected,
            "drift_count": summary.drift_items.iter().filter(|d| !d.passed).count(),
        }),
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn open_b_s4_items_non_empty() {
        let summary = AdminCatalogGeoValidationSummary {
            flags: AdminCatalogGeoFlagStatus {
                catalog_server_geo_validation_enabled: false,
                catalog_server_geo_validation_env: "unset".into(),
                next_public_catalog_api_enabled_env: "unset".into(),
                next_public_catalog_api_enabled_note: String::new(),
            },
            read_source: AdminCatalogGeoReadSourceStatus {
                meta_read_source: "core".into(),
                post_itineraries_geo_source: "core".into(),
                dual_write_order: String::new(),
            },
            core_geo_parity_pass: true,
            core_geo_parity_error: None,
            published_countries: 10,
            published_cities: 38,
            drift_detected: false,
            drift_items: vec![],
            meta_product_countries_parity_pass: true,
            meta_product_countries_parity: vec![],
            open_b_s4_items: vec!["B-S4-02"],
            checked_at: Utc::now(),
        };
        assert!(!summary.open_b_s4_items.is_empty());
    }

    #[test]
    fn core_snapshot_len_is_ten() {
        let snap = meta_product_countries_core_snapshot();
        assert_eq!(snap.iso3166_alpha2.len(), 10);
    }
}
