//! 94 §2.3.5 · 子站列表 `GET …/listings?country=&category=&sort=` 与前端 `marketSubsiteFilters.ts` 对齐。

use serde::Deserialize;
use serde_json::Value;
use traveltrust_core::is_allowed_iso_country_code;

use crate::db::MarketListingRow;

const MERCHANT_CATEGORIES: &[&str] = &["hotel", "dining", "attraction", "experience"];
const ACQUISITION_CATEGORIES: &[&str] = &["luxury", "sneakers", "electronics", "health", "accessories"];

#[derive(Debug, Clone, Deserialize, Default)]
pub struct MarketListingsListQuery {
    pub country: Option<String>,
    pub category: Option<String>,
    pub sort: Option<String>,
}

fn normalize_slug(raw: &str) -> String {
    raw.trim().to_lowercase()
}

pub fn parse_list_country(raw: Option<&str>) -> Option<String> {
    let s = raw.map(str::trim).filter(|s| !s.is_empty() && !s.eq_ignore_ascii_case("all"))?;
    let upper = s.to_uppercase();
    if is_allowed_iso_country_code(&upper) {
        Some(upper)
    } else {
        None
    }
}

pub fn parse_list_category(raw: Option<&str>, variant: &str) -> Option<String> {
    let slug = normalize_slug(raw?);
    if slug.is_empty() || slug == "all" {
        return None;
    }
    let allowed = if variant == "provider" {
        MERCHANT_CATEGORIES
    } else {
        ACQUISITION_CATEGORIES
    };
    if allowed.contains(&slug.as_str()) {
        Some(slug)
    } else {
        None
    }
}

pub fn parse_list_sort(raw: Option<&str>, variant: &str) -> &'static str {
    let slug = normalize_slug(raw.unwrap_or("recent"));
    if variant == "provider" {
        match slug.as_str() {
            "price_asc" => "price_asc",
            "price_desc" => "price_desc",
            _ => "recent",
        }
    } else {
        match slug.as_str() {
            "bounty_desc" => "bounty_desc",
            _ => "recent",
        }
    }
}

fn payload_country_iso(payload: &Value, variant: &str) -> Option<String> {
    let key = if variant == "provider" {
        "countryIso"
    } else {
        "destinationCountryIso"
    };
    payload
        .get(key)
        .and_then(|v| v.as_str())
        .map(|s| s.trim().to_uppercase())
        .filter(|s| is_allowed_iso_country_code(s))
}

fn payload_category_slug(payload: &Value) -> Option<String> {
    payload
        .get("category")
        .and_then(|v| v.as_str())
        .map(normalize_slug)
        .filter(|s| !s.is_empty())
}

fn payload_price_usdc(payload: &Value) -> f64 {
    payload
        .get("priceUsdc")
        .and_then(|v| {
            v.as_f64()
                .or_else(|| v.as_str().and_then(|s| s.parse().ok()))
        })
        .filter(|n| n.is_finite())
        .unwrap_or(0.0)
}

fn payload_bounty_max_usdc(payload: &Value) -> f64 {
    payload
        .get("bountyMaxUsdc")
        .and_then(|v| {
            v.as_f64()
                .or_else(|| v.as_str().and_then(|s| s.parse().ok()))
        })
        .filter(|n| n.is_finite())
        .unwrap_or(0.0)
}

pub fn listing_matches_market_subsite_filters(
    row: &MarketListingRow,
    variant: &str,
    country: Option<&str>,
    category: Option<&str>,
) -> bool {
    if let Some(want) = country {
        let have = payload_country_iso(&row.payload, variant);
        if have.as_deref() != Some(want) {
            return false;
        }
    }
    if let Some(want_cat) = category {
        let have = payload_category_slug(&row.payload);
        if have.as_deref() != Some(want_cat) {
            return false;
        }
    }
    true
}

pub fn filter_and_sort_market_listings(
    mut rows: Vec<MarketListingRow>,
    variant: &str,
    query: &MarketListingsListQuery,
) -> Vec<MarketListingRow> {
    let country = parse_list_country(query.country.as_deref());
    let category = parse_list_category(query.category.as_deref(), variant);
    let sort = parse_list_sort(query.sort.as_deref(), variant);

    rows.retain(|row| {
        listing_matches_market_subsite_filters(
            row,
            variant,
            country.as_deref(),
            category.as_deref(),
        )
    });

    match sort {
        "price_asc" if variant == "provider" => {
            rows.sort_by(|a, b| {
                payload_price_usdc(&a.payload)
                    .partial_cmp(&payload_price_usdc(&b.payload))
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
        }
        "price_desc" if variant == "provider" => {
            rows.sort_by(|a, b| {
                payload_price_usdc(&b.payload)
                    .partial_cmp(&payload_price_usdc(&a.payload))
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
        }
        "bounty_desc" if variant == "acquisition" => {
            rows.sort_by(|a, b| {
                payload_bounty_max_usdc(&b.payload)
                    .partial_cmp(&payload_bounty_max_usdc(&a.payload))
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
        }
        _ => {
            rows.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        }
    }

    rows
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};
    use serde_json::json;
    use uuid::Uuid;

    fn row(payload: Value, updated_ms: i64) -> MarketListingRow {
        let ts = Utc
            .timestamp_millis_opt(updated_ms)
            .single()
            .unwrap_or_else(Utc::now);
        MarketListingRow {
            id: Uuid::new_v4(),
            variant: "provider".into(),
            owner_user_id: Uuid::new_v4(),
            payload,
            status: "published".into(),
            data_origin: "production".into(),
            created_at: ts,
            updated_at: ts,
        }
    }

    #[test]
    fn filters_provider_by_country_and_category() {
        let rows = vec![
            row(
                json!({"countryIso":"JP","category":"dining","priceUsdc":100}),
                1,
            ),
            row(
                json!({"countryIso":"CN","category":"hotel","priceUsdc":50}),
                2,
            ),
        ];
        let out = filter_and_sort_market_listings(
            rows,
            "provider",
            &MarketListingsListQuery {
                country: Some("JP".into()),
                category: Some("dining".into()),
                sort: Some("recent".into()),
            },
        );
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].payload["countryIso"], "JP");
    }

    #[test]
    fn sorts_provider_price_asc() {
        let rows = vec![
            row(
                json!({"countryIso":"CN","category":"hotel","priceUsdc":200}),
                1,
            ),
            row(
                json!({"countryIso":"CN","category":"hotel","priceUsdc":50}),
                2,
            ),
        ];
        let out = filter_and_sort_market_listings(
            rows,
            "provider",
            &MarketListingsListQuery {
                country: None,
                category: None,
                sort: Some("price_asc".into()),
            },
        );
        assert_eq!(out[0].payload["priceUsdc"], 50);
    }

    #[test]
    fn sorts_acquisition_bounty_desc() {
        let mut r1 = row(json!({"destinationCountryIso":"CN","category":"health","bountyMaxUsdc":100}), 1);
        r1.variant = "acquisition".into();
        let mut r2 = r1.clone();
        r2.id = Uuid::new_v4();
        r2.payload = json!({"destinationCountryIso":"CN","category":"health","bountyMaxUsdc":500});
        let out = filter_and_sort_market_listings(
            vec![r1, r2],
            "acquisition",
            &MarketListingsListQuery {
                country: None,
                category: None,
                sort: Some("bounty_desc".into()),
            },
        );
        assert_eq!(out[0].payload["bountyMaxUsdc"], 500);
    }
}
