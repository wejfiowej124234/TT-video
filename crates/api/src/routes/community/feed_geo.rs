//! Feed 附近 / POI · ① 响应 enrich（与前端 `communityFeedProximity` 同源占位算法）
//! ② 真 DB 列接入前：`venue_name`/`distance_m` 为派生字段；`max_distance_m` 查询可服务端过滤。

use serde_json::{json, Value};

#[derive(Debug, Clone)]
pub struct FeedGeoContext {
    pub anchor_poi_id: String,
    pub max_distance_m: Option<i64>,
    pub anchor_lat: Option<f64>,
    pub anchor_lng: Option<f64>,
}

impl Default for FeedGeoContext {
    fn default() -> Self {
        Self {
            anchor_poi_id: "hotel_lavande".to_string(),
            max_distance_m: None,
            anchor_lat: None,
            anchor_lng: None,
        }
    }
}

impl FeedGeoContext {
    pub fn from_query(
        anchor_poi_id: Option<&str>,
        max_distance_m: Option<i64>,
        anchor_lat: Option<f64>,
        anchor_lng: Option<f64>,
    ) -> Self {
        let anchor = anchor_poi_id
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or("hotel_lavande")
            .to_string();
        Self {
            anchor_poi_id: anchor,
            max_distance_m: max_distance_m.filter(|m| *m > 0),
            anchor_lat,
            anchor_lng,
        }
    }
}

/// 与前端 `communityFeedStableDistanceKm` 同源（31 乘 + u32 wrap · UTF-16 标量）
pub fn stable_distance_m(seed: &str, min_km: f64, max_km: f64) -> i64 {
    let mut h: u32 = 0;
    for ch in seed.chars() {
        h = h.wrapping_mul(31).wrapping_add(ch as u32);
    }
    let frac = f64::from(h % 1000) / 1000.0;
    let km = min_km + frac * (max_km - min_km);
    (km * 1000.0).round() as i64
}

fn distance_bucket_max_km(max_distance_m: Option<i64>) -> f64 {
    match max_distance_m {
        Some(m) if m <= 1000 => 0.95,
        Some(m) if m <= 5000 => 4.8,
        _ => 9.5,
    }
}

fn distance_seed(post_id: &str, destination: Option<&str>, anchor: &str, lat: Option<f64>, lng: Option<f64>) -> String {
    let name = destination.filter(|s| !s.is_empty()).unwrap_or(post_id);
    let gps = match (lat, lng) {
        (Some(a), Some(b)) => format!("{a:.4},{b:.4}"),
        _ => String::new(),
    };
    format!("{anchor}:{gps}:{post_id}:{name}")
}

pub fn is_sponsored_tags(tags: &[String]) -> bool {
    tags.iter().any(|t| t.trim().eq_ignore_ascii_case("ad") || t.trim().eq_ignore_ascii_case("#ad"))
}

fn post_distance_m_value(post: &Value) -> i64 {
    post.get("distance_m")
        .and_then(|v| v.as_i64())
        .unwrap_or(i64::MAX)
}

/// JSON 行 enrich + 可选按 `max_distance_m` 过滤排序（GET feed 出口）
pub fn enrich_and_filter_feed_posts(mut posts: Vec<Value>, ctx: &FeedGeoContext) -> Vec<Value> {
    for post in &mut posts {
        if let Some(obj) = post.as_object_mut() {
            let id = obj
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let destination = obj.get("destination").and_then(|v| v.as_str()).map(String::from);
            let tags: Vec<String> = obj
                .get("tags")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|x| x.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();

            if obj.get("venue_name").is_none() {
                if let Some(ref dest) = destination.as_deref().filter(|s| !s.is_empty()) {
                    obj.insert("venue_name".to_string(), json!(dest));
                }
            }

            if obj.get("distance_m").is_none() {
                let seed = distance_seed(
                    &id,
                    destination.as_deref(),
                    &ctx.anchor_poi_id,
                    ctx.anchor_lat,
                    ctx.anchor_lng,
                );
                let max_km = distance_bucket_max_km(ctx.max_distance_m);
                obj.insert(
                    "distance_m".to_string(),
                    json!(stable_distance_m(&seed, 0.2, max_km)),
                );
            }

            if obj.get("is_sponsored").is_none() && is_sponsored_tags(&tags) {
                obj.insert("is_sponsored".to_string(), json!(true));
            }
        }
    }

    if let Some(max_m) = ctx.max_distance_m {
        posts.retain(|p| post_distance_m_value(p) <= max_m);
        posts.sort_by_key(|p| post_distance_m_value(p));
    }

    posts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stable_distance_m_is_deterministic() {
        let a = stable_distance_m("hotel_lavande::p1:京都", 0.2, 0.95);
        let b = stable_distance_m("hotel_lavande::p1:京都", 0.2, 0.95);
        assert_eq!(a, b);
        assert!(a >= 200);
        assert!(a <= 950);
    }

    #[test]
    fn stable_distance_m_matches_frontend_hash() {
        assert_eq!(stable_distance_m("hotel_lavande::p1:京都", 0.2, 0.95), 475);
    }

    #[test]
    fn enrich_filters_by_max_distance_m() {
        let ctx = FeedGeoContext {
            anchor_poi_id: "hotel_lavande".into(),
            max_distance_m: Some(1000),
            anchor_lat: None,
            anchor_lng: None,
        };
        let posts = vec![
            json!({"id": "a", "destination": "京都", "tags": []}),
            json!({"id": "b", "destination": "东京", "tags": ["ad"]}),
        ];
        let out = enrich_and_filter_feed_posts(posts, &ctx);
        for p in &out {
            assert!(p.get("distance_m").and_then(|v| v.as_i64()).unwrap_or(0) <= 1000);
            assert!(p.get("venue_name").is_some());
        }
        assert!(out.iter().any(|p| p.get("is_sponsored") == Some(&json!(true))));
    }
}
