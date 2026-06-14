//! `/market` 向导 facet 别名与 canonical 写入（与 `registry/market-guide-facet.v1.json` 同源语义）。

fn norm_token(raw: &str) -> String {
    raw.trim().to_lowercase().replace([' ', '-'], "_")
}

fn language_bucket(token: &str) -> Option<&'static str> {
    let t = token.trim();
    let n = norm_token(t);
    let bucket = match n.as_str() {
        "zh" | "中文" | "chinese" | "mandarin" => "zh",
        "en" | "英语" | "english" => "en",
        "ja" | "日语" | "japanese" => "ja",
        "ko" | "韩语" | "korean" => "ko",
        "th" | "泰语" | "thai" => "th",
        "ar" | "阿拉伯语" | "arabic" => "ar",
        "fr" | "法语" | "french" => "fr",
        "es" | "西班牙语" | "spanish" => "es",
        "闽南语" | "minnan" | "nan" => "minnan",
        _ => return None,
    };
    Some(bucket)
}

fn language_tokens_match(a: &str, b: &str) -> bool {
    if a.trim().eq_ignore_ascii_case(b.trim()) || a.trim() == b.trim() {
        return true;
    }
    match (language_bucket(a), language_bucket(b)) {
        (Some(x), Some(y)) => x == y,
        _ => false,
    }
}

fn service_bucket(token: &str) -> Option<&'static str> {
    let n = norm_token(token);
    let bucket = match n.as_str() {
        "向导服务" | "walking" | "culture" | "history" | "guide" => "guide_svc",
        "陪玩服务" | "playmate" | "food" | "hiking" => "play_svc",
        "摄影服务" | "photography" | "photo" => "photo_svc",
        "司机服务" | "driving" | "driver" | "transport" => "drive_svc",
        _ => return None,
    };
    Some(bucket)
}

fn service_tokens_match(a: &str, b: &str) -> bool {
    if a.trim().eq_ignore_ascii_case(b.trim()) || norm_token(a) == norm_token(b) {
        return true;
    }
    match (service_bucket(a), service_bucket(b)) {
        (Some(x), Some(y)) => x == y,
        _ => false,
    }
}

pub fn guide_matches_service_filter(guide_services: &[String], filter: &str) -> bool {
    if filter.trim().is_empty() {
        return true;
    }
    filter
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .any(|part| guide_services.iter().any(|s| service_tokens_match(s, part)))
}

pub fn guide_matches_language_filter(guide_langs: &[String], filter: &str) -> bool {
    if filter.trim().is_empty() {
        return true;
    }
    filter
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .any(|part| guide_langs.iter().any(|l| language_tokens_match(l, part)))
}

fn city_bucket(token: &str) -> Option<&'static str> {
    let t = token.trim();
    if t.is_empty() {
        return None;
    }
    let n = norm_token(t);
    let bucket = match n.as_str() {
        "hangzhou" | "杭州" | "hz" | "hangzhou_city" => "hangzhou",
        "beijing" | "北京" | "bj" => "beijing",
        "shanghai" | "上海" | "sh" => "shanghai",
        _ => return None,
    };
    Some(bucket)
}

/// 城市筛选：精确匹配 + 常见中英别名（如 杭州 / Hangzhou / HZ）。
pub fn guide_matches_city_filter(guide_city: &str, filter: &str) -> bool {
    let guide = guide_city.trim();
    let want = filter.trim();
    if want.is_empty() {
        return true;
    }
    if guide.eq_ignore_ascii_case(want) || guide == want {
        return true;
    }
    match (city_bucket(guide), city_bucket(want)) {
        (Some(a), Some(b)) => a == b,
        _ => false,
    }
}

pub fn normalize_language_for_storage(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    language_bucket(trimmed)
        .map(str::to_string)
        .unwrap_or_else(|| norm_token(trimmed))
}

pub fn normalize_service_for_storage(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    match service_bucket(trimmed) {
        Some("guide_svc") => "walking".to_string(),
        Some("play_svc") => "playmate".to_string(),
        Some("photo_svc") => "photography".to_string(),
        Some("drive_svc") => "driving".to_string(),
        _ => norm_token(trimmed),
    }
}

pub fn normalize_languages_for_storage(values: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    for v in values {
        let canon = normalize_language_for_storage(v);
        if canon.is_empty() || out.iter().any(|x| x == &canon) {
            continue;
        }
        out.push(canon);
    }
    out
}

pub fn normalize_service_types_for_storage(values: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    for v in values {
        let canon = normalize_service_for_storage(v);
        if canon.is_empty() || out.iter().any(|x| x == &canon) {
            continue;
        }
        out.push(canon);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    #[test]
    fn language_alias_en_english() {
        assert!(language_tokens_match("en", "英语"));
        assert!(language_tokens_match("zh", "中文"));
    }

    #[test]
    fn service_alias_walking_guide_ui() {
        assert!(service_tokens_match("walking", "向导服务"));
        assert!(service_tokens_match("culture", "向导服务"));
        assert!(!service_tokens_match("culture", "陪玩服务"));
        assert!(service_tokens_match("driving", "司机服务"));
    }

    #[test]
    fn normalize_write_path() {
        assert_eq!(normalize_language_for_storage("英语"), "en");
        assert_eq!(normalize_service_for_storage("向导服务"), "walking");
        assert_eq!(
            normalize_service_types_for_storage(&["司机服务".into(), "driving".into()]),
            vec!["driving".to_string()]
        );
    }

    #[test]
    fn city_alias_hangzhou_zh_en() {
        assert!(guide_matches_city_filter("Hangzhou", "杭州"));
        assert!(guide_matches_city_filter("杭州", "Hangzhou"));
        assert!(guide_matches_city_filter("HZ", "hangzhou"));
        assert!(!guide_matches_city_filter("Beijing", "杭州"));
    }

    #[test]
    fn registry_playmate_has_no_culture_overlap_with_guide_svc() {
        assert!(service_tokens_match("culture", "向导服务"));
        assert!(!service_tokens_match("culture", "陪玩服务"));
    }

    #[test]
    fn registry_json_service_buckets_align() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../registry/market-guide-facet.v1.json");
        let raw = fs::read_to_string(&root).expect("registry/market-guide-facet.v1.json");
        let v: serde_json::Value = serde_json::from_str(&raw).expect("json");
        let services = v.get("services").and_then(|s| s.as_object()).expect("services");
        let play = services.get("陪玩服务").expect("陪玩服务");
        let play_match = play.get("match").and_then(|m| m.as_array()).expect("match");
        assert!(
            !play_match.iter().any(|x| x.as_str() == Some("culture")),
            "陪玩服务 must not include culture (guide_svc overlap)"
        );
    }
}
