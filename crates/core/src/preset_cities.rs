//! 产品期「国家 → 预设城市」清单，与 `frontend/lib/geoOptions.ts` 的 **`CITIES_BY_COUNTRY`** 锁死。
//!
//! **用途**：`POST /api/v1/itineraries` 的 `destination`（中文国家名）+ `city` / `cities[]` 校验；变更须双写前端与本文。

/// 返回某中文国家名下的预设城市切片；未知国家返回 `None`。
pub fn preset_cities_zh_for_country(country_zh: &str) -> Option<&'static [&'static str]> {
    match country_zh.trim() {
        "中国" => Some(&[
            "北京", "上海", "杭州", "西安", "成都", "广州", "厦门", "大理", "青岛",
        ]),
        "日本" => Some(&["东京", "大阪", "京都", "札幌", "福冈"]),
        "韩国" => Some(&["首尔", "釜山", "济州", "仁川"]),
        "新加坡" => Some(&["新加坡"]),
        "泰国" => Some(&["曼谷", "清迈", "普吉"]),
        "阿联酋" => Some(&["迪拜", "阿布扎比", "沙迦"]),
        "美国" => Some(&["纽约", "洛杉矶", "旧金山", "拉斯维加斯"]),
        "澳大利亚" => Some(&["悉尼", "墨尔本", "黄金海岸"]),
        "法国" => Some(&["巴黎", "里昂", "尼斯"]),
        "西班牙" => Some(&["马德里", "巴塞罗那", "塞维利亚"]),
        _ => None,
    }
}

/// `city` 是否为该国预设清单中的城市（trim 后全等匹配）。
#[inline]
pub fn is_preset_city_for_zh_country(country_zh: &str, city: &str) -> bool {
    let c = city.trim();
    if c.is_empty() {
        return false;
    }
    preset_cities_zh_for_country(country_zh)
        .map(|list| list.iter().any(|x| *x == c))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn china_hangzhou_ok_paris_wrong_country() {
        assert!(is_preset_city_for_zh_country("中国", "杭州"));
        assert!(!is_preset_city_for_zh_country("中国", "巴黎"));
        assert!(is_preset_city_for_zh_country("法国", "巴黎"));
    }

    #[test]
    fn singapore_single_city() {
        assert!(is_preset_city_for_zh_country("新加坡", "新加坡"));
        assert!(!is_preset_city_for_zh_country("新加坡", "曼谷"));
    }
}
