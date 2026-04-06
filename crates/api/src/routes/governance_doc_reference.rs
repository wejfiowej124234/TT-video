//! [84-第一阶段10国Country-Pool发行参数总表](../../../../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md) 的只读 JSON 镜像（07 §五 5.2A）。
//! 更新 84 文首版本号时须同步 `DOC_VERSION` 与本模块数值。

use serde_json::{json, Value};

pub const DOC_REF: &str = "docs/spec/84-第一阶段10国Country-Pool发行参数总表.md";
pub const DOC_VERSION: &str = "1.0.16";

/// 与 84 §四 主表行顺序一致。
pub fn protocol_reference_json() -> Value {
    json!({
        "status": "ok",
        "doc_ref": DOC_REF,
        "doc_version": DOC_VERSION,
        "note": "Target 叙事参数；非链上 FeeRouter/RegionVault 读数。募资列为拟定展示值（84 §三 3.4、3.5）；对外定稿前勿当作募资承诺。",
        "fee_router": {
            "layer1_percent_of_allocatable_platform_fee": {
                "country_bucket": 45,
                "global_pool": 55
            },
            "global_pool_split_percent": {
                "ttg_stakers": 65,
                "reserve": 20,
                "operations": 15
            },
            "orthogonality_ref": "84 §1.1.1：仲裁费、Staking.slash 等与 45/55 正交；Runbook §7.1"
        },
        "phase1_countries": [
            { "name_zh": "中国", "tier": "S", "national_pool_cap_fee_points": 4.0, "phase1_open_fee_points": 3.0, "fundraise_target_cny_wan": 6000, "fundraise_cap_cny_wan": 8000, "notes": "入境旅游大国" },
            { "name_zh": "美国", "tier": "S", "national_pool_cap_fee_points": 4.0, "phase1_open_fee_points": 3.0, "fundraise_target_cny_wan": 6000, "fundraise_cap_cny_wan": 8000, "notes": "高消费市场" },
            { "name_zh": "法国", "tier": "S", "national_pool_cap_fee_points": 4.5, "phase1_open_fee_points": 3.5, "fundraise_target_cny_wan": 7000, "fundraise_cap_cny_wan": 9000, "notes": "全球领先目的地" },
            { "name_zh": "西班牙", "tier": "S", "national_pool_cap_fee_points": 4.5, "phase1_open_fee_points": 3.5, "fundraise_target_cny_wan": 7000, "fundraise_cap_cny_wan": 9000, "notes": "高消费" },
            { "name_zh": "日本", "tier": "A", "national_pool_cap_fee_points": 2.5, "phase1_open_fee_points": 2.0, "fundraise_target_cny_wan": 3000, "fundraise_cap_cny_wan": 4000, "notes": "高端旅游" },
            { "name_zh": "泰国", "tier": "A", "national_pool_cap_fee_points": 2.5, "phase1_open_fee_points": 2.0, "fundraise_target_cny_wan": 2500, "fundraise_cap_cny_wan": 3500, "notes": "亚洲热门" },
            { "name_zh": "新加坡", "tier": "A", "national_pool_cap_fee_points": 2.0, "phase1_open_fee_points": 1.5, "fundraise_target_cny_wan": 2000, "fundraise_cap_cny_wan": 3000, "notes": "高端" },
            { "name_zh": "韩国", "tier": "A", "national_pool_cap_fee_points": 2.0, "phase1_open_fee_points": 1.5, "fundraise_target_cny_wan": 2000, "fundraise_cap_cny_wan": 3000, "notes": "亚洲" },
            { "name_zh": "澳大利亚", "tier": "B", "national_pool_cap_fee_points": 1.5, "phase1_open_fee_points": 1.0, "fundraise_target_cny_wan": 1500, "fundraise_cap_cny_wan": 2000, "notes": "高消费" },
            { "name_zh": "阿联酋", "tier": "B", "national_pool_cap_fee_points": 1.5, "phase1_open_fee_points": 1.0, "fundraise_target_cny_wan": 1500, "fundraise_cap_cny_wan": 2000, "notes": "中东" }
        ],
        "checksums": {
            "phase1_open_fee_points_sum": 22,
            "national_pool_cap_fee_points_sum": 29,
            "country_bucket_percent": 45,
            "phase1_open_over_country_bucket": "22/45≈48.9%"
        }
    })
}

/// 深度合并 JSON 对象；对象键递归合并，否则 `overlay` 覆盖 `base` 对应节点。
pub fn merge_json_deep(base: &mut Value, overlay: &Value) {
    match (base, overlay) {
        (Value::Object(b), Value::Object(o)) => {
            for (k, v) in o {
                if let Some(bv) = b.get_mut(k) {
                    merge_json_deep(bv, v);
                } else {
                    b.insert(k.clone(), v.clone());
                }
            }
        }
        (b, v) => *b = v.clone(),
    }
}

/// 在 [`protocol_reference_json`] 之上生成「待生效参数包」镜像体（用于 `/protocol-reference/pending`）。
///
/// - 无 **`PROTOCOL_REFERENCE_PENDING_OVERLAY`** 或为空：与当前文档镜像一致；根级 **`pending_package_source`** = **`mirror`**。
/// - 非空且为合法 JSON：与根对象 **深度合并**（典型用法：只覆写 `fee_router` 子树）；**`pending_package_source`** = **`env_overlay`**。
/// - JSON 解析失败：**不合并**；**`pending_package_source`** = **`overlay_parse_error`**。
pub fn protocol_reference_pending_merged(overlay: Option<&str>) -> Value {
    let mut v = protocol_reference_json();
    let source = match overlay.map(|s| s.trim()).filter(|s| !s.is_empty()) {
        Some(trim) => match serde_json::from_str::<Value>(trim) {
            Ok(overlay_val) => {
                merge_json_deep(&mut v, &overlay_val);
                "env_overlay"
            }
            Err(_) => "overlay_parse_error",
        },
        None => "mirror",
    };
    if let Some(obj) = v.as_object_mut() {
        obj.insert("pending_package_source".to_string(), json!(source));
    }
    v
}

/// 运行时待生效体：读取环境变量 **`PROTOCOL_REFERENCE_PENDING_OVERLAY`**（JSON 片段，深度合并进文档镜像）。
pub fn protocol_reference_pending_json() -> Value {
    protocol_reference_pending_merged(
        std::env::var("PROTOCOL_REFERENCE_PENDING_OVERLAY")
            .ok()
            .as_deref(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn protocol_reference_doc_version_and_ref_match_constants() {
        let v = protocol_reference_json();
        assert_eq!(v["status"].as_str(), Some("ok"));
        assert_eq!(v["doc_version"].as_str(), Some(DOC_VERSION));
        assert_eq!(v["doc_ref"].as_str(), Some(DOC_REF));
    }

    #[test]
    fn protocol_reference_phase1_countries_len_and_open_points_sum() {
        let v = protocol_reference_json();
        let countries = v["phase1_countries"]
            .as_array()
            .expect("phase1_countries array");
        assert_eq!(countries.len(), 10);
        let sum: f64 = countries
            .iter()
            .map(|row| {
                row["phase1_open_fee_points"]
                    .as_f64()
                    .expect("phase1_open_fee_points")
            })
            .sum();
        assert!(
            (sum - 22.0).abs() < 1e-9,
            "phase1_open_fee_points sum {sum} expected 22"
        );
        assert_eq!(v["checksums"]["phase1_open_fee_points_sum"], 22);
        assert_eq!(v["checksums"]["country_bucket_percent"], 45);
        let cap_sum: f64 = countries
            .iter()
            .map(|row| {
                row["national_pool_cap_fee_points"]
                    .as_f64()
                    .expect("national_pool_cap_fee_points")
            })
            .sum();
        assert!(
            (cap_sum - 29.0).abs() < 1e-9,
            "national_pool_cap_fee_points sum {cap_sum} expected 29 (84 §四 主表行加总；与 §3.2 文案 28.5 不一致处以主表行为准)"
        );
        assert_eq!(v["checksums"]["national_pool_cap_fee_points_sum"], 29);
    }

    #[test]
    fn protocol_reference_fee_router_layer1_splits() {
        let v = protocol_reference_json();
        let l1 = &v["fee_router"]["layer1_percent_of_allocatable_platform_fee"];
        assert_eq!(l1["country_bucket"], 45);
        assert_eq!(l1["global_pool"], 55);
        let g = &v["fee_router"]["global_pool_split_percent"];
        assert_eq!(g["ttg_stakers"], 65);
        assert_eq!(g["reserve"], 20);
        assert_eq!(g["operations"], 15);
    }

    #[test]
    fn protocol_reference_pending_mirror_matches_fee_router() {
        let pending = protocol_reference_pending_merged(None);
        let base = protocol_reference_json();
        assert_eq!(
            pending["pending_package_source"].as_str(),
            Some("mirror")
        );
        assert_eq!(
            pending["fee_router"],
            base["fee_router"],
            "mirror pending must match protocol_reference fee_router"
        );
    }

    #[test]
    fn protocol_reference_pending_overlay_merges_layer1_only() {
        let overlay = r#"{"fee_router":{"layer1_percent_of_allocatable_platform_fee":{"country_bucket":44}}}"#;
        let pending = protocol_reference_pending_merged(Some(overlay));
        assert_eq!(
            pending["pending_package_source"].as_str(),
            Some("env_overlay")
        );
        assert_eq!(
            pending["fee_router"]["layer1_percent_of_allocatable_platform_fee"]["country_bucket"],
            44
        );
        assert_eq!(
            pending["fee_router"]["layer1_percent_of_allocatable_platform_fee"]["global_pool"],
            55
        );
        let g = &pending["fee_router"]["global_pool_split_percent"];
        assert_eq!(g["ttg_stakers"], 65);
        assert_eq!(g["reserve"], 20);
        assert_eq!(g["operations"], 15);
    }

    #[test]
    fn protocol_reference_pending_overlay_invalid_json_sets_parse_error_flag() {
        let pending = protocol_reference_pending_merged(Some("not json"));
        assert_eq!(
            pending["pending_package_source"].as_str(),
            Some("overlay_parse_error")
        );
        let base = protocol_reference_json();
        assert_eq!(pending["fee_router"], base["fee_router"]);
    }
}
