//! S4 / S4b · Catalog-backed server geo validation (read-only · opt-in)
//!
//! Default: **`traveltrust_core::product_countries`** + **`preset_cities`**（与 `GET /meta.product_countries` 编译期快照同源）。
//! `CATALOG_SERVER_GEO_VALIDATION=1` 且 **`db_pool`** 可用时，**POST /itineraries** / **POST /itineraries/custom** 国家/预设城市校验改读 **published catalog**；**GET /meta.product_countries** 同理读 **published catalog_countries**；失败或未配置时回退 core。

use sqlx::PgPool;
use traveltrust_core::{
    is_allowed_zh_destination_country, is_preset_city_for_zh_country,
    preset_cities_zh_for_country, PRODUCT_COUNTRY_CODES, PRODUCT_COUNTRY_NAMES_ZH,
};

use crate::db;

#[cfg(test)]
static CATALOG_GEO_ENV_TEST_MUTEX: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[cfg(test)]
pub(crate) fn lock_catalog_geo_env_tests() -> std::sync::MutexGuard<'static, ()> {
    CATALOG_GEO_ENV_TEST_MUTEX
        .lock()
        .unwrap_or_else(|e| e.into_inner())
}

/// `CATALOG_SERVER_GEO_VALIDATION=1|true` 时启用 catalog 只读校验（默认 **关**）。
pub fn catalog_server_geo_validation_enabled() -> bool {
    matches!(
        std::env::var("CATALOG_SERVER_GEO_VALIDATION").as_deref(),
        Ok("1") | Ok("true") | Ok("TRUE")
    )
}

pub async fn is_allowed_zh_destination_country_resolved(
    pool: Option<&PgPool>,
    country_zh: &str,
) -> bool {
    let t = country_zh.trim();
    if t.is_empty() {
        return false;
    }
    if catalog_server_geo_validation_enabled() {
        if let Some(pool) = pool {
            return match db::catalog_country_name_zh_exists(pool, t).await {
                Ok(ok) => ok,
                Err(_) => is_allowed_zh_destination_country(t),
            };
        }
    }
    is_allowed_zh_destination_country(t)
}

pub async fn is_preset_city_for_zh_country_resolved(
    pool: Option<&PgPool>,
    country_zh: &str,
    city: &str,
) -> bool {
    let c = city.trim();
    if c.is_empty() {
        return false;
    }
    if catalog_server_geo_validation_enabled() {
        if let Some(pool) = pool {
            match db::catalog_preset_city_exists(pool, country_zh.trim(), c).await {
                Ok(ok) => return ok,
                Err(_) => {}
            }
        }
    }
    is_preset_city_for_zh_country(country_zh, c)
}

/// Contract gate：core 十国/预设城市须与 committed catalog import（published）一致。
pub async fn assert_core_catalog_geo_parity(pool: &PgPool) -> Result<(), String> {
    let catalog_countries = db::list_catalog_product_countries_ordered(pool)
        .await
        .map_err(|e| format!("catalog countries read failed: {e}"))?;
    if catalog_countries.len() != PRODUCT_COUNTRY_CODES.len() {
        return Err(format!(
            "country count mismatch: core={} catalog={}",
            PRODUCT_COUNTRY_CODES.len(),
            catalog_countries.len()
        ));
    }
    for (i, (iso, name_zh)) in catalog_countries.iter().enumerate() {
        if iso != PRODUCT_COUNTRY_CODES[i] {
            return Err(format!(
                "iso order mismatch at {i}: core={} catalog={iso}",
                PRODUCT_COUNTRY_CODES[i]
            ));
        }
        if name_zh != PRODUCT_COUNTRY_NAMES_ZH[i] {
            return Err(format!(
                "name_zh mismatch at {i}: core={} catalog={name_zh}",
                PRODUCT_COUNTRY_NAMES_ZH[i]
            ));
        }
        let core_cities: Vec<&str> = preset_cities_zh_for_country(name_zh)
            .map(|s| s.to_vec())
            .unwrap_or_default();
        let catalog_cities = db::list_catalog_city_names_zh_for_country(pool, name_zh)
            .await
            .map_err(|e| format!("cities read failed for {name_zh}: {e}"))?;
        if core_cities.len() != catalog_cities.len() {
            return Err(format!(
                "city count mismatch for {name_zh}: core={} catalog={}",
                core_cities.len(),
                catalog_cities.len()
            ));
        }
        for (a, b) in core_cities.iter().zip(catalog_cities.iter()) {
            if *a != b.as_str() {
                return Err(format!(
                    "city mismatch for {name_zh}: core={a} catalog={b}"
                ));
            }
        }
    }
    Ok(())
}

/// S4b · `GET /meta.product_countries` 数组读源（746 契约键序不变；`dual_write_order` 含 `read_source=` 可观测）。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MetaProductCountriesReadSource {
    Core,
    CatalogPg,
}

pub struct MetaProductCountriesResolved {
    pub iso3166_alpha2: Vec<String>,
    pub name_zh: Vec<String>,
    pub read_source: MetaProductCountriesReadSource,
}

pub fn meta_product_countries_core_snapshot() -> MetaProductCountriesResolved {
    MetaProductCountriesResolved {
        iso3166_alpha2: PRODUCT_COUNTRY_CODES
            .iter()
            .map(|s| (*s).to_string())
            .collect(),
        name_zh: PRODUCT_COUNTRY_NAMES_ZH
            .iter()
            .map(|s| (*s).to_string())
            .collect(),
        read_source: MetaProductCountriesReadSource::Core,
    }
}

fn meta_product_countries_from_catalog_rows(
    rows: Result<Vec<(String, String)>, sqlx::Error>,
) -> MetaProductCountriesResolved {
    match rows {
        Ok(catalog) if catalog.len() == PRODUCT_COUNTRY_CODES.len() => MetaProductCountriesResolved {
            iso3166_alpha2: catalog.iter().map(|(iso, _)| iso.clone()).collect(),
            name_zh: catalog.iter().map(|(_, zh)| zh.clone()).collect(),
            read_source: MetaProductCountriesReadSource::CatalogPg,
        },
        _ => meta_product_countries_core_snapshot(),
    }
}

/// S4b · `GET /meta.product_countries`：默认 core；`CATALOG_SERVER_GEO_VALIDATION=1` + pool 时读 published catalog_countries。
pub async fn resolve_meta_product_countries(
    pool: Option<&PgPool>,
) -> MetaProductCountriesResolved {
    if !catalog_server_geo_validation_enabled() {
        return meta_product_countries_core_snapshot();
    }
    let Some(pool) = pool else {
        return meta_product_countries_core_snapshot();
    };
    meta_product_countries_from_catalog_rows(
        db::list_catalog_product_countries_ordered(pool).await,
    )
}

pub fn meta_product_countries_dual_write_order(source: MetaProductCountriesReadSource) -> String {
    match source {
        MetaProductCountriesReadSource::CatalogPg => {
            "read_source=catalog-pg; GET /meta product_countries reads published catalog_countries (iso3166/name_zh ordered by sort_order) when CATALOG_SERVER_GEO_VALIDATION=1 and DATABASE_URL; core fallback on read failure or row-count mismatch; meta handler does not persist this block; POST /guides country_code and POST /itineraries* geo validators share the same opt-in flag".to_string()
        }
        MetaProductCountriesReadSource::Core => {
            "read_source=core; GET /meta product_countries default compile-time snapshot from traveltrust_core::PRODUCT_COUNTRY_CODES and PRODUCT_COUNTRY_NAMES_ZH (same-length parallel arrays); when CATALOG_SERVER_GEO_VALIDATION=1 and db_pool available reads published catalog_countries with core fallback; meta handler does not persist this block; POST /guides country_code and POST /itineraries* validators share the same geo SSOT".to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::it_db_pool;

    struct CatalogGeoEnvGuard {
        prev: Option<String>,
    }

    impl CatalogGeoEnvGuard {
        fn set(value: &str) -> Self {
            let prev = std::env::var("CATALOG_SERVER_GEO_VALIDATION").ok();
            std::env::set_var("CATALOG_SERVER_GEO_VALIDATION", value);
            Self { prev }
        }
    }

    impl Drop for CatalogGeoEnvGuard {
        fn drop(&mut self) {
            match &self.prev {
                Some(v) => std::env::set_var("CATALOG_SERVER_GEO_VALIDATION", v),
                None => std::env::remove_var("CATALOG_SERVER_GEO_VALIDATION"),
            }
        }
    }

    #[test]
    fn meta_product_countries_core_snapshot_matches_constants() {
        let snap = meta_product_countries_core_snapshot();
        assert_eq!(snap.read_source, MetaProductCountriesReadSource::Core);
        assert_eq!(snap.iso3166_alpha2.len(), PRODUCT_COUNTRY_CODES.len());
        for (i, iso) in snap.iso3166_alpha2.iter().enumerate() {
            assert_eq!(iso.as_str(), PRODUCT_COUNTRY_CODES[i]);
            assert_eq!(snap.name_zh[i].as_str(), PRODUCT_COUNTRY_NAMES_ZH[i]);
        }
    }

    #[test]
    fn meta_product_countries_from_catalog_rows_err_falls_back_core() {
        let resolved = meta_product_countries_from_catalog_rows(Err(
            sqlx::Error::PoolClosed,
        ));
        assert_eq!(resolved.read_source, MetaProductCountriesReadSource::Core);
        assert_eq!(
            resolved.iso3166_alpha2[0].as_str(),
            PRODUCT_COUNTRY_CODES[0]
        );
    }

    #[test]
    fn meta_product_countries_from_catalog_rows_wrong_len_falls_back_core() {
        let resolved = meta_product_countries_from_catalog_rows(Ok(vec![(
            "TH".into(),
            "泰国".into(),
        )]));
        assert_eq!(resolved.read_source, MetaProductCountriesReadSource::Core);
    }

    #[tokio::test]
    async fn meta_product_countries_default_uses_core_without_flag() {
        let _lock = lock_catalog_geo_env_tests();
        let _guard = CatalogGeoEnvGuard::set("0");
        let resolved = resolve_meta_product_countries(None).await;
        assert_eq!(resolved.read_source, MetaProductCountriesReadSource::Core);
    }

    #[tokio::test]
    async fn meta_product_countries_fallback_no_pool_when_flag_on() {
        let _lock = lock_catalog_geo_env_tests();
        let _guard = CatalogGeoEnvGuard::set("1");
        let resolved = resolve_meta_product_countries(None).await;
        assert_eq!(resolved.read_source, MetaProductCountriesReadSource::Core);
    }

    #[tokio::test]
    async fn meta_product_countries_catalog_opt_in_when_enabled_and_pg() {
        let _lock = lock_catalog_geo_env_tests();
        let _guard = CatalogGeoEnvGuard::set("1");
        let Some(pool) = it_db_pool::connect_migrated_pg_it_pool().await else {
            eprintln!("skip meta_product_countries_catalog_opt_in: DATABASE_URL unset");
            return;
        };
        let summary = crate::db::count_catalog_published_summary(&pool).await;
        let Ok((countries, _, _, _, _, _, _)) = summary else {
            eprintln!("skip meta_product_countries_catalog_opt_in: count failed");
            return;
        };
        if countries as usize != PRODUCT_COUNTRY_CODES.len() {
            eprintln!(
                "skip meta_product_countries_catalog_opt_in: expected {} published countries, got {countries}",
                PRODUCT_COUNTRY_CODES.len()
            );
            return;
        }
        let resolved = resolve_meta_product_countries(Some(&pool)).await;
        assert_eq!(
            resolved.read_source,
            MetaProductCountriesReadSource::CatalogPg,
            "flag=1 + pool + {} published countries should read catalog",
            countries
        );
        for (i, iso) in resolved.iso3166_alpha2.iter().enumerate() {
            assert_eq!(iso.as_str(), PRODUCT_COUNTRY_CODES[i]);
            assert_eq!(resolved.name_zh[i].as_str(), PRODUCT_COUNTRY_NAMES_ZH[i]);
        }
    }

    #[tokio::test]
    async fn catalog_server_validation_parity_core_vs_pg() {
        let Some(pool) = it_db_pool::connect_migrated_pg_it_pool().await else {
            eprintln!("skip catalog_server_validation_parity: DATABASE_URL unset");
            return;
        };
        let summary = crate::db::count_catalog_published_summary(&pool).await;
        let Ok((countries, _, _, _, _, _, _)) = summary else {
            eprintln!("skip catalog_server_validation_parity: count failed");
            return;
        };
        if countries == 0 {
            eprintln!("skip catalog_server_validation_parity: run catalog-import apply");
            return;
        }
        assert_core_catalog_geo_parity(&pool)
            .await
            .expect("core vs catalog geo parity");
    }
}
