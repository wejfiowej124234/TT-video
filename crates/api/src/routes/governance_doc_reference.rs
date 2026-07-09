//! [84-第一阶段10国Country-Pool发行参数总表](../../../../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md) 的只读 JSON 镜像（07 §五 5.2A）。
//! 更新 84 文首版本号时须同步 `DOC_VERSION` 与本模块数值。
//!
//! **FeeRouter 五数字**（`fee_router`）与 **84 §1.1～§1.2**、**[08-4-附录 §2 Mermaid](../../../../docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md)**、**83 §3 / 附录 B** 须同号：`layer1` **45** / **55**；`global_pool_split_percent` **65** / **20** / **15**（后者相对 Global 自身 100%）。`check-governance-doc-linkage.sh` 对 Mermaid 节点与本模块字面量做交叉锚点。

use serde_json::{json, Value};

pub const DOC_REF: &str = "docs/spec/84-第一阶段10国Country-Pool发行参数总表.md";
pub const DOC_VERSION: &str = "1.0.22";
/// 与 **protocol-ssot.v1** 同源；pregate / registry 对拍。
pub const PROTOCOL_SSOT_REF: &str = "docs/spec/governance-token/protocol-ssot.v1.yaml";
pub const TTG_REFERENCE_PRICE_V1_REF: &str = "docs/spec/governance-token/ttg-reference-price-v1-draft.md";
pub const COUNTRY_REVENUE_MODEL_V1_REF: &str =
    "docs/spec/governance-token/country-revenue-model-v1-draft.md";
pub const COUNTRY_POOL_FUNDRAISE_GOVERNANCE_V1_REF: &str =
    "docs/spec/governance-token/country-pool-fundraise-governance-v1.md";
pub const TTG_REFERENCE_PRICE_V1_ID: &str = "ttg-reference-price-v1-draft-20260615";

pub const TTG_REF_PRICE_CNY: f64 = 200.0;
pub const TTG_FDV_CNY: f64 = 2_000_000_000.0;
pub const TTG_MOCK_USDC_CNY_FX: f64 = 7.2;
const TTG_TOTAL_SUPPLY: f64 = 10_000_000.0;

fn phase1_country_row(
    name_zh: &str,
    tier: &str,
    cap_pts: f64,
    open_pts: f64,
    fundraise_target_wan: i64,
    notes: &str,
) -> Value {
    json!({
        "name_zh": name_zh,
        "tier": tier,
        "national_pool_cap_fee_points": cap_pts,
        "phase1_open_fee_points": open_pts,
        "fundraise_target_cny_wan": fundraise_target_wan,
        "fundraise_target_source": "governance_board_per_country",
        "notes": notes
    })
}

fn governance_fundraise_targets_json() -> Value {
    json!({
        "CN": 8000,
        "US": 8000,
        "FR": 9000,
        "ES": 9000,
        "JP": 5000,
        "TH": 3500,
        "SG": 3000,
        "KR": 4000,
        "AU": 2000,
        "AE": 2000
    })
}

fn valuation_anchor_v1_json() -> Value {
    json!({
        "id": TTG_REFERENCE_PRICE_V1_ID,
        "doc_ref": TTG_REFERENCE_PRICE_V1_REF,
        "status": "engineering_default_phase1",
        "reference_price_cny_per_ttg": TTG_REF_PRICE_CNY,
        "fdv_cny": TTG_FDV_CNY,
        "total_supply_ttg": TTG_TOTAL_SUPPLY as i64,
        "mock_usdc_cny_fx": TTG_MOCK_USDC_CNY_FX,
        "mock_usdc_per_ttg": TTG_REF_PRICE_CNY / TTG_MOCK_USDC_CNY_FX,
        "fundraise_model": "governance_board_per_country_independent",
        "fundraise_governance_ref": COUNTRY_POOL_FUNDRAISE_GOVERNANCE_V1_REF,
        "fundraise_targets_cny_wan": governance_fundraise_targets_json(),
        "independent_parameter_systems": {
            "fundraise_target": "governance_board_market_size_per_country",
            "seat_stake_ttg": "seat_tier_protocol_ssot_liability_lock",
            "fee_points": "country_revenue_grade_and_seat_tier",
            "auto_conversion_between_systems": false
        },
        "stake_requirement": {
            "source": "seat_tier_protocol_ssot",
            "lock_months": 24
        },
        "country_revenue_model_ref": COUNTRY_REVENUE_MODEL_V1_REF,
        "fee_points_semantics": "country_revenue_grade_and_seat_tier_not_global_pool_weight",
        "legal_signoff_pending": true
    })
}

/// 与 84 §四 主表行顺序一致。
pub fn protocol_reference_json() -> Value {
    json!({
        "status": "ok",
        "doc_ref": DOC_REF,
        "doc_version": DOC_VERSION,
        "protocol_ssot": protocol_ssot_json(),
        "valuation_anchor": valuation_anchor_v1_json(),
        "note": "Target 叙事参数；非链上读数。三轨独立：募资目标=治理委员会逐国参数；Seat质押=责任锁仓；Fee Points=收益分配等级。无自动换算。TTG参考价仅用于Mock/FDV。",
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
            phase1_country_row("中国", "S", 4.0, 3.0, 8000, "入境旅游大国"),
            phase1_country_row("美国", "S", 4.0, 3.0, 8000, "高消费市场"),
            phase1_country_row("法国", "S", 4.5, 3.5, 9000, "全球领先目的地"),
            phase1_country_row("西班牙", "S", 4.5, 3.5, 9000, "高消费"),
            phase1_country_row("日本", "A", 2.5, 2.0, 5000, "高端旅游"),
            phase1_country_row("泰国", "A", 2.5, 2.0, 3500, "亚洲热门"),
            phase1_country_row("新加坡", "A", 2.0, 1.5, 3000, "高端"),
            phase1_country_row("韩国", "A", 2.0, 1.5, 4000, "亚洲"),
            phase1_country_row("澳大利亚", "B", 1.5, 1.0, 2000, "高消费"),
            phase1_country_row("阿联酋", "B", 1.5, 1.0, 2000, "中东")
        ],
        "checksums": {
            "phase1_open_fee_points_sum": 22,
            "national_pool_cap_fee_points_sum": 29,
            "country_bucket_percent": 45,
            "phase1_open_over_country_bucket": "22/45≈48.9%",
            "valuation_anchor_id": TTG_REFERENCE_PRICE_V1_ID
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

/// [protocol-ssot.v1.yaml](../../../../docs/spec/governance-token/protocol-ssot.v1.yaml) 只读镜像（Protocol Convergence P2）。
pub const PROTOCOL_SSOT_VERSION: &str = "1.0.3";

/// 与 **protocol-ssot.v1** 同源；**`GET /steward/stake-quote`** 等只读路由消费。
pub fn protocol_ssot_json() -> Value {
    json!({
        "version": PROTOCOL_SSOT_VERSION,
        "ttg": {
            "symbol": "TTG",
            "decimals": 18,
            "total_supply": 10_000_000
        },
        "lock_tiers": {
            "snapshot_min_lock_days": 7,
            "seat_buyout_min_lock_days": 90,
            "buyout_cooldown_days": 180,
            "steward_seat_min_tenure_months": 24,
            "steward_resign_notice_days": 180,
            "steward_stake_release_delay_days": 90,
            "steward_stake_release_vest_days": 365,
            "country_pool_subscription_lock_months": 24,
            "redemption_window_days_per_quarter": 15,
            "redemption_max_nav_pct_bps": 1000
        },
        "jurisdictions": [
            {"id": "CN", "tier": "S", "fee_route_bps": 400, "phase1_open_bps": 300, "steward_stake_bps": 400, "min_hold_bps": 300, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "US", "tier": "S", "fee_route_bps": 400, "phase1_open_bps": 300, "steward_stake_bps": 400, "min_hold_bps": 300, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "FR", "tier": "S", "fee_route_bps": 450, "phase1_open_bps": 350, "steward_stake_bps": 450, "min_hold_bps": 350, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "ES", "tier": "S", "fee_route_bps": 450, "phase1_open_bps": 350, "steward_stake_bps": 450, "min_hold_bps": 350, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "JP", "tier": "A", "fee_route_bps": 250, "phase1_open_bps": 200, "steward_stake_bps": 250, "min_hold_bps": 200, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "TH", "tier": "A", "fee_route_bps": 250, "phase1_open_bps": 200, "steward_stake_bps": 250, "min_hold_bps": 200, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "SG", "tier": "A", "fee_route_bps": 200, "phase1_open_bps": 150, "steward_stake_bps": 200, "min_hold_bps": 200, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "KR", "tier": "A", "fee_route_bps": 200, "phase1_open_bps": 150, "steward_stake_bps": 200, "min_hold_bps": 200, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "AU", "tier": "B", "fee_route_bps": 150, "phase1_open_bps": 100, "steward_stake_bps": 150, "min_hold_bps": 100, "seat_cap": 1, "subscription_lock_months": 24},
            {"id": "AE", "tier": "B", "fee_route_bps": 150, "phase1_open_bps": 100, "steward_stake_bps": 150, "min_hold_bps": 100, "seat_cap": 1, "subscription_lock_months": 24}
        ],
        "p1_resolutions": {
            "steward_stake_equals_fee_route_phase1": true,
            "nav_redemption_non_principal": true,
            "legal_signoff_pending": true
        }
    })
}

fn valid_jurisdiction_ids() -> Vec<String> {
    protocol_ssot_json()["jurisdictions"]
        .as_array()
        .map(|rows| {
            rows.iter()
                .filter_map(|r| r["id"].as_str().map(str::to_uppercase))
                .collect()
        })
        .unwrap_or_default()
}

/// **`GET /api/v1/steward/stake-quote`** 文档 SSOT 计算（多国 bps 累加）。
pub fn steward_stake_quote_for_jurisdictions(
    jurisdiction_ids: &[String],
) -> Result<Value, &'static str> {
    let valid = valid_jurisdiction_ids();
    let ssot = protocol_ssot_json();
    let jurisdictions_rows = ssot["jurisdictions"].as_array();
    let mut cumulative_bps: u64 = 0;
    let mut lines = Vec::new();
    for jid in jurisdiction_ids {
        let id = jid.trim().to_uppercase();
        if id.is_empty() {
            continue;
        }
        let row = jurisdictions_rows
            .and_then(|rows| rows.iter().find(|r| r["id"].as_str() == Some(id.as_str())));
        let Some(row) = row else {
            return Err("invalid_jurisdiction");
        };
        let bps = row["steward_stake_bps"].as_u64().unwrap_or(0);
        cumulative_bps += bps;
        let supply = ssot["ttg"]["total_supply"].as_u64().unwrap_or(10_000_000);
        let ttg_units = supply * bps / 10_000;
        lines.push(json!({
            "jurisdiction_id": id,
            "steward_stake_bps": bps,
            "ttg_units_required": ttg_units
        }));
    }
    if lines.is_empty() {
        return Err("jurisdictions_required");
    }
    let supply = ssot["ttg"]["total_supply"].as_u64().unwrap_or(10_000_000);
    Ok(json!({
        "status": "ok",
        "ttg_symbol": "TTG",
        "ttg_total_supply": supply,
        "cumulative_steward_stake_bps": cumulative_bps,
        "cumulative_ttg_units_required": supply * cumulative_bps / 10_000,
        "jurisdictions": lines,
        "lock_tiers": ssot["lock_tiers"],
        "valid_jurisdiction_ids": valid,
        "meta": { "implementation_status": "steward_stake_quote_doc_ssot" }
    }))
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
        let cn = countries
            .iter()
            .find(|r| r["name_zh"] == "中国")
            .expect("CN row");
        assert_eq!(cn["fundraise_target_cny_wan"], 8000);
        assert_eq!(cn["fundraise_target_source"], "governance_board_per_country");
        let jp = countries.iter().find(|r| r["name_zh"] == "日本").expect("JP row");
        assert_eq!(jp["fundraise_target_cny_wan"], 5000);
        let kr = countries.iter().find(|r| r["name_zh"] == "韩国").expect("KR row");
        assert_eq!(kr["fundraise_target_cny_wan"], 4000);
        let th = countries.iter().find(|r| r["name_zh"] == "泰国").expect("TH row");
        assert_eq!(th["fundraise_target_cny_wan"], 3500);
        let fundraise_sum: i64 = countries
            .iter()
            .map(|row| row["fundraise_target_cny_wan"].as_i64().expect("fundraise_target_cny_wan"))
            .sum();
        assert_eq!(fundraise_sum, 53_500, "governance board per-country fundraise total (wan CNY)");
        assert!(cn.get("fundraise_cap_cny_wan").is_none());
        assert_eq!(
            v["valuation_anchor"]["fundraise_model"].as_str(),
            Some("governance_board_per_country_independent")
        );
        assert_eq!(
            v["valuation_anchor"]["reference_price_cny_per_ttg"].as_f64(),
            Some(200.0)
        );
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

    /// P5-5-1：`checksums` 与 `fee_router` 同源；分层闭合 100%；§1.4 产品表述与 linkage 脚本锚点一致。
    #[test]
    fn protocol_reference_checksums_align_with_fee_router_and_84_section_1_4() {
        let v = protocol_reference_json();
        let l1 = &v["fee_router"]["layer1_percent_of_allocatable_platform_fee"];
        let cb = l1["country_bucket"]
            .as_u64()
            .expect("layer1 country_bucket as u64");
        let gl = l1["global_pool"]
            .as_u64()
            .expect("layer1 global_pool as u64");
        assert_eq!(cb + gl, 100, "84 §1.1 layer1 must sum to 100%");
        let g = &v["fee_router"]["global_pool_split_percent"];
        let gps = g["ttg_stakers"].as_u64().expect("ttg_stakers")
            + g["reserve"].as_u64().expect("reserve")
            + g["operations"].as_u64().expect("operations");
        assert_eq!(gps, 100, "84 §1.2 Global 内拆须合计 100%");
        assert_eq!(
            v["checksums"]["country_bucket_percent"].as_u64(),
            Some(cb),
            "checksums.country_bucket_percent must match fee_router.layer1.country_bucket"
        );
        assert_eq!(
            v["checksums"]["phase1_open_over_country_bucket"].as_str(),
            Some("22/45≈48.9%"),
            "84 §1.4 叙事锁定；变更须同步 84 正文与 check-governance-doc-linkage 相关锚点"
        );
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
