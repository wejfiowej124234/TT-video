//! 产品期允许国家（十国）：顺序与 ISO 3166-1 alpha-2、中文展示名锁死。
//!
//! **单源对齐**：`frontend/lib/productCountries.ts`、`docs/spec/44`、`docs/spec/54` P54-010；
//! 写接口校验与 `GET /meta.product_countries` 须与本模块一致。
//! 中文国家名用于 **`POST /api/v1/itineraries` 的 `destination`** 时，配套城市清单见 [`crate::preset_cities`]。

/// ISO 3166-1 alpha-2，顺序固定（与 [`PRODUCT_COUNTRY_NAMES_ZH`] 一一对应）
pub const PRODUCT_COUNTRY_CODES: [&str; 10] =
    ["CN", "JP", "KR", "SG", "TH", "AE", "US", "AU", "FR", "ES"];

/// 中文国家名：与前端 Landing / 市场 / 行程 `destination`、`POST /itineraries/custom` 的 `country` 字段一致
pub const PRODUCT_COUNTRY_NAMES_ZH: [&str; 10] = [
    "中国",
    "日本",
    "韩国",
    "新加坡",
    "泰国",
    "阿联酋",
    "美国",
    "澳大利亚",
    "法国",
    "西班牙",
];

#[inline]
pub fn is_allowed_iso_country_code(s: &str) -> bool {
    normalize_iso_country_code(s).is_some()
}

/// 合法则返回规范大写双字母码
pub fn normalize_iso_country_code(s: &str) -> Option<&'static str> {
    let t = s.trim();
    if t.len() != 2 || !t.is_ascii() {
        return None;
    }
    let mut buf = [0u8; 2];
    buf.copy_from_slice(t.as_bytes());
    buf[0] = buf[0].to_ascii_uppercase();
    buf[1] = buf[1].to_ascii_uppercase();
    let up = std::str::from_utf8(&buf).ok()?;
    PRODUCT_COUNTRY_CODES.iter().find(|c| **c == up).copied()
}

#[inline]
pub fn is_allowed_zh_destination_country(s: &str) -> bool {
    let t = s.trim();
    PRODUCT_COUNTRY_NAMES_ZH.iter().any(|n| *n == t)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn codes_and_names_same_len() {
        assert_eq!(PRODUCT_COUNTRY_CODES.len(), PRODUCT_COUNTRY_NAMES_ZH.len());
    }

    #[test]
    fn normalize_iso_accepts_lowercase() {
        assert_eq!(normalize_iso_country_code("cn"), Some("CN"));
        assert_eq!(normalize_iso_country_code(" ae "), Some("AE"));
    }

    #[test]
    fn normalize_iso_rejects_unknown() {
        assert_eq!(normalize_iso_country_code("DE"), None);
        assert_eq!(normalize_iso_country_code("GB"), None);
        assert_eq!(normalize_iso_country_code("C"), None);
    }

    #[test]
    fn zh_name_exact_trim() {
        assert!(is_allowed_zh_destination_country("中国"));
        assert!(is_allowed_zh_destination_country(" 阿联酋 "));
        assert!(!is_allowed_zh_destination_country("意大利"));
    }
}
