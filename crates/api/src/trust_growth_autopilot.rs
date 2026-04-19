//! P-GROW3/P-SCALE1：与 `frontend/config/trustGrowthExperiments.ts` 变体矩阵对齐（三臂 × 四触点）。

/// 与前端 `TrustGrowthMoment` 一致
pub const MOMENTS: &[&str] = &["register", "first_yield", "first_order", "governance_entry"];

/// 各触点共用三变体 id（与 TS `trustGrowthExperiments.ts` 同步）
pub const VARIANT_IDS: &[&str] = &["control", "minimal_delayed", "alt_copy"];

#[derive(Clone, Copy, Default)]
pub struct VariantAgg {
    pub view: i64,
    pub trust_hub_click: i64,
    pub dismiss: i64,
    pub details_toggle_open: i64,
}

/// 由聚合行计算运行时权重（正数即可，前端按总和归一）。
pub fn recompute_runtime_weights(
    metrics: &[(String, String, VariantAgg)], // (moment, variant_id, agg)
) -> serde_json::Value {
    use serde_json::{json, Map, Value};
    let mut out = Map::new();
    for moment in MOMENTS.iter().copied() {
        let mut raw: Vec<f64> = Vec::new();
        for vid in VARIANT_IDS.iter().copied() {
            let agg = metrics
                .iter()
                .find(|(m, v, _)| m.as_str() == moment && v.as_str() == vid)
                .map(|(_, _, a)| *a)
                .unwrap_or_default();
            let ctr = (agg.trust_hub_click as f64 + 1.0) / (agg.view as f64 + 2.0);
            let engage = (agg.details_toggle_open as f64 + 0.25) / (agg.view as f64 + 2.0);
            raw.push(0.75 * ctr + 0.25 * engage);
        }
        let sum_raw: f64 = raw.iter().sum::<f64>().max(1e-9);
        let min_frac = 0.08_f64;
        let w: Vec<f64> = raw
            .iter()
            .map(|r| (r / sum_raw).max(min_frac))
            .collect();
        let sum_w: f64 = w.iter().sum::<f64>().max(1e-9);
        let norm: Vec<f64> = w.iter().map(|x| x / sum_w).collect();
        let mut moment_map = Map::new();
        for (i, vid) in VARIANT_IDS.iter().enumerate() {
            let val = (norm.get(i).copied().unwrap_or(0.0) * 1000.0).round() / 10.0;
            moment_map.insert((*vid).to_string(), json!(val));
        }
        out.insert(moment.to_string(), Value::Object(moment_map));
    }
    Value::Object(out)
}

/// 三等分权重（与 `recompute_runtime_weights` 输出标度一致：×1000/10）。
pub fn equal_weights_moments_json() -> serde_json::Value {
    use serde_json::json;
    let v = (1000.0_f64 / 3.0_f64).round() / 10.0;
    json!({
        "register": { "control": v, "minimal_delayed": v, "alt_copy": v },
        "first_yield": { "control": v, "minimal_delayed": v, "alt_copy": v },
        "first_order": { "control": v, "minimal_delayed": v, "alt_copy": v },
        "governance_entry": { "control": v, "minimal_delayed": v, "alt_copy": v },
    })
}

/// 对 `moments` 各触点应用 variant 级占比上限（`caps`：variant_id → 最大分数 0..=1），然后重新归一化到约 100 量纲。
pub fn apply_variant_weight_caps(
    moments: &serde_json::Value,
    caps: &serde_json::Map<String, serde_json::Value>,
) -> serde_json::Value {
    use serde_json::{json, Map, Value};
    if caps.is_empty() {
        return moments.clone();
    }
    let cap_frac = |vid: &str| -> f64 {
        caps
            .get(vid)
            .and_then(|x| x.as_f64())
            .filter(|c| c.is_finite() && *c >= 0.0)
            .unwrap_or(1.0)
            .min(1.0)
            .max(0.0)
    };

    let Some(root) = moments.as_object() else {
        return moments.clone();
    };
    let mut out = Map::new();
    for (moment_key, moment_val) in root {
        let Some(moment_obj) = moment_val.as_object() else {
            out.insert(moment_key.clone(), moment_val.clone());
            continue;
        };
        let mut frac: Vec<(String, f64)> = Vec::new();
        for vid in VARIANT_IDS.iter().copied() {
            let w = moment_obj
                .get(vid)
                .and_then(|x| x.as_f64())
                .unwrap_or(0.0)
                .max(0.0);
            frac.push(((*vid).to_string(), w));
        }
        let sum0: f64 = frac.iter().map(|(_, w)| w).sum::<f64>().max(1e-9);
        let applied: Vec<(String, f64)> = frac
            .into_iter()
            .map(|(vid, w)| {
                let f = w / sum0;
                let max_f = cap_frac(&vid);
                (vid, f.min(max_f))
            })
            .collect();
        let s1: f64 = applied.iter().map(|(_, f)| f).sum::<f64>().max(1e-9);
        let mut moment_map = Map::new();
        for (vid, f) in applied.iter() {
            let display = ((f / s1) * 1000.0).round() / 10.0;
            moment_map.insert(vid.clone(), json!(display));
        }
        out.insert(moment_key.clone(), Value::Object(moment_map));
    }
    Value::Object(out)
}

/// P-OBS1：基于当前聚合与运行时权重生成告警（启发式阈值，可由环境变量覆盖）。
pub fn compute_trust_growth_alerts(
    metrics: &[(String, String, VariantAgg)],
    moments_json: &serde_json::Value,
) -> Vec<serde_json::Value> {
    use serde_json::json;
    let mut out: Vec<serde_json::Value> = Vec::new();

    let skew_ratio: f64 = std::env::var("TRUST_GROWTH_ALERT_TRAFFIC_SKEW_RATIO")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8.0_f64);
    let ctr_floor: f64 = std::env::var("TRUST_GROWTH_ALERT_CTR_COLLAPSE")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0.003_f64);
    let weight_low: f64 = std::env::var("TRUST_GROWTH_ALERT_WEIGHT_LOW")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(4.0_f64);
    let weight_high: f64 = std::env::var("TRUST_GROWTH_ALERT_WEIGHT_HIGH")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(92.0_f64);

    if let Some(mo) = moments_json.as_object() {
        for (moment, mv) in mo {
            if let Some(vo) = mv.as_object() {
                for (vid, wv) in vo {
                    if let Some(w) = wv.as_f64() {
                        if w < weight_low || w > weight_high {
                            out.push(json!({
                                "code": "weight_outlier",
                                "severity": "warn",
                                "moment": moment,
                                "variant_id": vid,
                                "detail": format!("weight {w:.1} outside [{weight_low}, {weight_high}]")
                            }));
                        }
                    }
                }
            }
        }
    }

    for m in MOMENTS.iter().copied() {
        let mut views: Vec<i64> = Vec::new();
        let mut clicks: Vec<i64> = Vec::new();
        for v in VARIANT_IDS.iter().copied() {
            let agg = metrics
                .iter()
                .find(|(mm, vv, _)| mm.as_str() == m && vv.as_str() == v)
                .map(|(_, _, a)| *a)
                .unwrap_or_default();
            views.push(agg.view);
            clicks.push(agg.trust_hub_click);
        }
        let total_v: i64 = views.iter().sum();
        if total_v >= 50 {
            let min_v = views.iter().copied().filter(|x| *x > 0).min().unwrap_or(1).max(1);
            let max_v = views.iter().copied().max().unwrap_or(0).max(1);
            if (max_v as f64) / (min_v as f64) >= skew_ratio {
                out.push(json!({
                    "code": "traffic_skew",
                    "severity": "warn",
                    "moment": m,
                    "detail": format!("max_views/min_views >= {skew_ratio} (total_views={total_v})")
                }));
            }
        }
        for (i, v) in VARIANT_IDS.iter().enumerate() {
            let vi = views.get(i).copied().unwrap_or(0);
            let ci = clicks.get(i).copied().unwrap_or(0);
            if vi >= 100 {
                let ctr = (ci as f64) / (vi as f64).max(1.0);
                if ctr < ctr_floor {
                    out.push(json!({
                        "code": "ctr_collapse",
                        "severity": "critical",
                        "moment": m,
                        "variant_id": *v,
                        "detail": format!("CTR {ctr:.4} < {ctr_floor} with views={vi}")
                    }));
                }
            }
        }
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recompute_emits_all_moments() {
        let v = recompute_runtime_weights(&[]);
        let obj = v.as_object().unwrap();
        assert_eq!(obj.len(), MOMENTS.len());
    }

    #[test]
    fn caps_renormalize() {
        use serde_json::json;
        let base = json!({
            "register": { "control": 50.0, "minimal_delayed": 30.0, "alt_copy": 20.0 }
        });
        let mut caps = serde_json::Map::new();
        caps.insert("alt_copy".to_string(), json!(0.10));
        let out = apply_variant_weight_caps(&base, &caps);
        let reg = out["register"].as_object().unwrap();
        let sum: f64 = reg.values().filter_map(|x| x.as_f64()).sum();
        assert!((sum - 100.0).abs() < 2.0, "sum={sum}");
        assert!(reg["alt_copy"].as_f64().unwrap() <= 12.0);
    }
}
