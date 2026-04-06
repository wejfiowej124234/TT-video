//! B-083 / 83·84：订单费路由 **国别子路径键**（链下 SSOT，与 **84** 十国国池对齐）。
//!
//! **SSOT 字段**：行程 **`destination`** 的 **中文国家名**（与 [`crate::product_countries::PRODUCT_COUNTRY_NAMES_ZH`]、**`POST /itineraries`** / **`POST /itineraries/custom`** 校验同源）。
//! 链上 **`FeeRouter.sol` MVP** 为 **单一** **`countryBucket`**；**`bucket_route_key`** 为 **逻辑子路径**（`country_pool_{iso_lower}`），供索引/治理/未来多桶合约对账，**禁止**未知国家静默落入默认池。

use crate::product_countries::{PRODUCT_COUNTRY_CODES, PRODUCT_COUNTRY_NAMES_ZH};

/// 与 **GET /order**、**`itinerary.destination`** 对读（存在 bundle 时）
pub const FEE_ROUTE_COUNTRY_SSOT_FIELD: &str = "itinerary.destination";

const BUCKET_PREFIX: &str = "country_pool_";

/// 解析结果：**已映射** → ISO + 稳定桶键；**未映射/空** → 显式 **reject**（不默认池）
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FeeRouteCountryResolve {
    Routed {
        iso3166_alpha2: &'static str,
        /// 与 **84** 国池文档对齐的稳定键；链上 MVP 仍汇入同一 **`countryBucket`**
        bucket_route_key: String,
    },
    RejectUnmapped {
        code: &'static str,
        message: &'static str,
    },
}

/// 由 **中文国家名**（`destination`）解析费路由国别子路径。
#[must_use]
pub fn resolve_fee_route_country_from_zh_destination(name_zh: &str) -> FeeRouteCountryResolve {
    let t = name_zh.trim();
    if t.is_empty() {
        return FeeRouteCountryResolve::RejectUnmapped {
            code: "fee_route_empty_destination",
            message: "destination is empty; cannot derive fee route country key (B-083)",
        };
    }
    for (i, name) in PRODUCT_COUNTRY_NAMES_ZH.iter().enumerate() {
        if *name == t {
            let iso = PRODUCT_COUNTRY_CODES[i];
            let bucket_route_key = format!("{}{}", BUCKET_PREFIX, iso.to_ascii_lowercase());
            return FeeRouteCountryResolve::Routed {
                iso3166_alpha2: iso,
                bucket_route_key,
            };
        }
    }
    FeeRouteCountryResolve::RejectUnmapped {
        code: "fee_route_unmapped_destination",
        message: "destination not in product country list; explicit reject per B-083 (no silent default pool)",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn china_and_japan_distinct_iso_and_bucket() {
        let cn = resolve_fee_route_country_from_zh_destination("中国");
        let jp = resolve_fee_route_country_from_zh_destination("日本");
        match (cn, jp) {
            (
                FeeRouteCountryResolve::Routed {
                    iso3166_alpha2: a,
                    bucket_route_key: ba,
                },
                FeeRouteCountryResolve::Routed {
                    iso3166_alpha2: b,
                    bucket_route_key: bb,
                },
            ) => {
                assert_ne!(a, b);
                assert_ne!(ba, bb);
                assert_eq!(a, "CN");
                assert_eq!(b, "JP");
                assert_eq!(ba, "country_pool_cn");
                assert_eq!(bb, "country_pool_jp");
            }
            _ => panic!("expected both Routed"),
        }
    }

    #[test]
    fn italy_rejected_not_defaulted() {
        let r = resolve_fee_route_country_from_zh_destination("意大利");
        match r {
            FeeRouteCountryResolve::RejectUnmapped { code, .. } => {
                assert_eq!(code, "fee_route_unmapped_destination");
            }
            _ => panic!("expected reject"),
        }
    }

    #[test]
    fn empty_rejected() {
        let r = resolve_fee_route_country_from_zh_destination("  ");
        match r {
            FeeRouteCountryResolve::RejectUnmapped { code, .. } => {
                assert_eq!(code, "fee_route_empty_destination");
            }
            _ => panic!("expected reject"),
        }
    }

    #[test]
    fn all_ten_countries_routed_with_unique_buckets() {
        use std::collections::HashSet;
        let mut keys = HashSet::new();
        for name in PRODUCT_COUNTRY_NAMES_ZH.iter() {
            let r = resolve_fee_route_country_from_zh_destination(name);
            match r {
                FeeRouteCountryResolve::Routed { bucket_route_key, .. } => {
                    assert!(keys.insert(bucket_route_key));
                }
                _ => panic!("product name should route: {name}"),
            }
        }
        assert_eq!(keys.len(), PRODUCT_COUNTRY_NAMES_ZH.len());
    }
}
