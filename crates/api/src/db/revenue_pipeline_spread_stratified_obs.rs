//! **B-395** / **TT-B395**：**spread** **异常** **原因** **分层** **（** **空** **投影** **/** **单** **腿** **/** **缺** **一** **腿** **/** **三** **腿** **腿间** **漂移** **；** **只读** **DB** **；** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-394** **同源** **计数** **与** **`spread_blocks`** **；** **另** **输出** **`spread_anomaly_layer`** **与** **`inter_leg_drift`** **。**

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B395** / **母表 B-395**：机读锚（**`revenue_pipeline_spread_stratified_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_STRATIFIED_OBS_ANCHOR: &str =
    "395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-V1";

fn spread_i64(min_v: i64, max_v: i64) -> i64 {
    let d = i128::from(max_v) - i128::from(min_v);
    if d > i64::MAX as i128 {
        i64::MAX
    } else if d < i64::MIN as i128 {
        i64::MIN
    } else {
        d as i64
    }
}

/// **纯** **内存** **组装** **（** **单测** **）** **。**
pub fn revenue_pipeline_spread_stratified_observability_v1(
    expected_chain_id: i64,
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
) -> Value {
    let leg_fr = if fr_total > 0 {
        json!(fr_max)
    } else {
        Value::Null
    };
    let leg_rv = if rv_total > 0 {
        json!(rv_max)
    } else {
        Value::Null
    };
    let leg_p5 = if p5_total > 0 {
        json!(p5_max)
    } else {
        Value::Null
    };

    let mut missing_leg_keys: Vec<&'static str> = Vec::new();
    if fr_total == 0 {
        missing_leg_keys.push("fee_router_routed_events");
    }
    if rv_total == 0 {
        missing_leg_keys.push("region_vault_forwarded_events");
    }
    if p5_total == 0 {
        missing_leg_keys.push("p5_country_ledger_lines");
    }

    let mut leg_maxes: Vec<i64> = Vec::new();
    if fr_total > 0 {
        if let Some(m) = fr_max {
            leg_maxes.push(m);
        }
    }
    if rv_total > 0 {
        if let Some(m) = rv_max {
            leg_maxes.push(m);
        }
    }
    if p5_total > 0 {
        if let Some(m) = p5_max {
            leg_maxes.push(m);
        }
    }

    let legs_with_rows_count = leg_maxes.len() as i64;

    let (
        spread_anomaly_layer,
        min_leg_max_block_number,
        max_leg_max_block_number,
        spread_blocks,
        marker,
        inter_leg_drift,
        observation_note,
    ) = if leg_maxes.is_empty() {
        (
            "empty_projection",
            Value::Null,
            Value::Null,
            Value::Null,
            "incomparable",
            false,
            json!("projection_tables_empty_all_legs"),
        )
    } else if leg_maxes.len() == 1 {
        let only = leg_maxes[0];
        (
            "single_leg_only",
            json!(only),
            json!(only),
            json!(0_i64),
            "aligned",
            false,
            json!("single_leg_surface_no_inter_leg_compare"),
        )
    } else {
        let min_v = leg_maxes.iter().copied().min().expect("len>=2");
        let max_v = leg_maxes.iter().copied().max().expect("len>=2");
        let sp = spread_i64(min_v, max_v);
        let drift = sp > 0;
        let m = if drift { "drift" } else { "aligned" };
        let layer = if leg_maxes.len() == 2 {
            "dual_leg_missing_third"
        } else {
            "triple_leg_surface"
        };
        (
            layer,
            json!(min_v),
            json!(max_v),
            json!(sp),
            m,
            drift,
            json!("ok"),
        )
    };

    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_STRATIFIED_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Stratified spread diagnosis on top of B-394-compatible min/max spread across legs with rows. spread_anomaly_layer: empty_projection | single_leg_only | dual_leg_missing_third | triple_leg_surface. inter_leg_drift true iff >=2 legs with max and spread_blocks>0.",
        "legs_with_rows_count": legs_with_rows_count,
        "missing_leg_keys": missing_leg_keys,
        "spread_anomaly_layer": spread_anomaly_layer,
        "inter_leg_drift": inter_leg_drift,
        "per_leg_max_block_number": {
            "fee_router_routed_events": leg_fr,
            "region_vault_forwarded_events": leg_rv,
            "p5_country_ledger_lines": leg_p5,
        },
        "min_leg_max_block_number": min_leg_max_block_number,
        "max_leg_max_block_number": max_leg_max_block_number,
        "spread_blocks": spread_blocks,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **。**
pub async fn revenue_pipeline_spread_stratified_observability(
    pool: &PgPool,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    Ok(revenue_pipeline_spread_stratified_observability_v1(
        expected_chain_id,
        fr.total,
        fr.max_block_number,
        rv.total,
        rv.max_block_number,
        p5.total,
        p5.max_block_number,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b395_empty_projection_layer() {
        let v = revenue_pipeline_spread_stratified_observability_v1(80002, 0, None, 0, None, 0, None);
        assert_eq!(v["spread_anomaly_layer"], "empty_projection");
        assert_eq!(v["legs_with_rows_count"], json!(0));
        assert_eq!(v["inter_leg_drift"], json!(false));
        assert_eq!(v["marker"], "incomparable");
    }

    #[test]
    fn b395_single_leg_layer() {
        let v = revenue_pipeline_spread_stratified_observability_v1(80002, 1, Some(10), 0, None, 0, None);
        assert_eq!(v["spread_anomaly_layer"], "single_leg_only");
        assert_eq!(v["inter_leg_drift"], json!(false));
    }

    #[test]
    fn b395_dual_missing_third_drift() {
        let v = revenue_pipeline_spread_stratified_observability_v1(80002, 1, Some(100), 1, Some(50), 0, None);
        assert_eq!(v["spread_anomaly_layer"], "dual_leg_missing_third");
        assert_eq!(v["inter_leg_drift"], json!(true));
        assert_eq!(v["missing_leg_keys"], json!(["p5_country_ledger_lines"]));
    }

    #[test]
    fn b395_triple_aligned() {
        let v = revenue_pipeline_spread_stratified_observability_v1(80002, 1, Some(5), 1, Some(5), 1, Some(5));
        assert_eq!(v["spread_anomaly_layer"], "triple_leg_surface");
        assert_eq!(v["inter_leg_drift"], json!(false));
    }
}
