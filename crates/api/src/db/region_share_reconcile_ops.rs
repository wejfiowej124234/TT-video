//! BE-RS-01 · RegionShare projection closure reconcile (Sprint 170-B)
//!
//! 三角校验：**FeeRouter `to_country`** ↔ **RegionVault forwarded** ↔ **P5 Country Ledger credits**（正交第三腿）。
//! Epoch：**`region_share_snapshot_lines`** 按 **`snapshot_epoch`** 只读对账；**不**改 B-115/P5-3 写入语义。

use chrono::Utc;
use serde_json::{json, Value};
use sqlx::postgres::PgPool;
use sqlx::types::Json;
use uuid::Uuid;

use super::economic_aggregate::{fetch_fee_router_for_aggregate, fetch_region_vault_for_aggregate};
use super::reconciliation_reports::{insert_reconciliation_report, REPORT_TYPE_REGION_SHARE_PROJECTION_CLOSURE};
use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, zero_word};

pub const REGION_SHARE_PROJECTION_CLOSURE_ANCHOR: &str =
    "170-BE-RS-01-REGION-SHARE-PROJECTION-CLOSURE-V1";
pub const REGION_SHARE_AMOUNT_TRIANGLE_ANCHOR: &str = "170-RS-R04-AMOUNT-TRIANGLE-V1";
pub const REGION_SHARE_EPOCH_RECONCILE_ANCHOR: &str = "170-RS-R05-SNAPSHOT-EPOCH-V1";

#[derive(Debug, Clone, serde::Serialize)]
pub struct TokenAmountSum {
    pub token_address: String,
    pub sum_u256_hex: String,
    pub row_count: i64,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct P5CreditSumRow {
    token_address: String,
    amount_u256_hex: String,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct SnapshotEpochRow {
    chain_id: i64,
    region_id: String,
    snapshot_epoch: i64,
    line_count: i64,
    distinct_snapshot_blocks: i64,
    min_snapshot_block: Option<i64>,
    max_snapshot_block: Option<i64>,
}

fn sum_rows_to_map(
    rows: &[(String, String)],
) -> std::collections::BTreeMap<String, ([u8; 32], i64)> {
    let mut out = std::collections::BTreeMap::new();
    for (token, hex) in rows {
        let Some(word) = parse_u256_word_hex(hex) else {
            continue;
        };
        let entry = out.entry(token.to_ascii_lowercase()).or_insert((zero_word(), 0));
        let _ = add_assign_be(&mut entry.0, &word);
        entry.1 += 1;
    }
    out
}

fn fee_router_to_country_rows(
    rows: &[super::economic_aggregate::FeeRouterAggregateSourceRow],
) -> Vec<(String, String)> {
    rows.iter()
        .map(|r| (r.token_address.clone(), r.to_country_u256_hex.clone()))
        .collect()
}

fn vault_forwarded_rows(
    rows: &[super::economic_aggregate::RegionVaultAggregateSourceRow],
) -> Vec<(String, String)> {
    rows.iter()
        .map(|r| (r.token_address.clone(), r.amount_u256_hex.clone()))
        .collect()
}

pub fn token_sums_from_map(map: &std::collections::BTreeMap<String, ([u8; 32], i64)>) -> Vec<TokenAmountSum> {
    map.iter()
        .map(|(token, (word, count))| TokenAmountSum {
            token_address: token.clone(),
            sum_u256_hex: fmt_word_hex(word),
            row_count: *count,
        })
        .collect()
}

pub fn amount_triangle_marker(
    fee_router: &std::collections::BTreeMap<String, ([u8; 32], i64)>,
    vault: &std::collections::BTreeMap<String, ([u8; 32], i64)>,
    p5: &std::collections::BTreeMap<String, ([u8; 32], i64)>,
) -> (&'static str, Value) {
    let legs_with_rows = [
        (!fee_router.is_empty(), "fee_router_to_country"),
        (!vault.is_empty(), "region_vault_forwarded"),
        (!p5.is_empty(), "p5_country_ledger_credits"),
    ];
    let populated: Vec<&str> = legs_with_rows
        .iter()
        .filter(|(has, _)| *has)
        .map(|(_, name)| *name)
        .collect();
    if populated.is_empty() {
        return (
            "incomparable",
            json!({
                "reason": "all_legs_empty",
                "populated_legs": [],
            }),
        );
    }
    if populated.len() < 2 {
        return (
            "incomparable",
            json!({
                "reason": "insufficient_legs_for_triangle",
                "populated_legs": populated,
            }),
        );
    }

    let mut tokens: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
    tokens.extend(fee_router.keys().cloned());
    tokens.extend(vault.keys().cloned());
    tokens.extend(p5.keys().cloned());

    let token_count = tokens.len();
    let mut drift_tokens: Vec<Value> = Vec::new();
    for token in tokens.iter() {
        let fr = fee_router.get(token).map(|(w, _)| *w).unwrap_or_else(zero_word);
        let rv = vault.get(token).map(|(w, _)| *w).unwrap_or_else(zero_word);
        let p5w = p5.get(token).map(|(w, _)| *w).unwrap_or_else(zero_word);
        let fr_pop = fee_router.contains_key(token);
        let rv_pop = vault.contains_key(token);
        let p5_pop = p5.contains_key(token);
        let aligned = fr == rv && rv == p5w;
        if !aligned {
            drift_tokens.push(json!({
                "token_address": token,
                "fee_router_to_country_u256_hex": fmt_word_hex(&fr),
                "region_vault_forwarded_u256_hex": fmt_word_hex(&rv),
                "p5_country_ledger_credit_u256_hex": fmt_word_hex(&p5w),
                "legs_populated": {
                    "fee_router_to_country": fr_pop,
                    "region_vault_forwarded": rv_pop,
                    "p5_country_ledger_credits": p5_pop,
                }
            }));
        }
    }

    if drift_tokens.is_empty() {
        (
            "aligned",
            json!({
                "populated_legs": populated,
                "token_count": token_count,
            }),
        )
    } else {
        (
            "drift",
            json!({
                "populated_legs": populated,
                "drift_token_count": drift_tokens.len(),
                "drift_tokens": drift_tokens,
            }),
        )
    }
}

async fn fetch_p5_credit_sums_by_token(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<Vec<P5CreditSumRow>, sqlx::Error> {
    sqlx::query_as::<_, P5CreditSumRow>(
        r#"
        SELECT token_address, amount_u256_hex
        FROM p5_country_ledger_lines
        WHERE direction = 1
          AND ($1::bigint IS NULL OR chain_id = $1)
        ORDER BY token_address ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

async fn list_snapshot_epoch_stats(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<Vec<SnapshotEpochRow>, sqlx::Error> {
    sqlx::query_as::<_, SnapshotEpochRow>(
        r#"
        SELECT
            chain_id,
            region_id,
            snapshot_epoch,
            COUNT(*)::bigint AS line_count,
            COUNT(DISTINCT snapshot_block_number)::bigint AS distinct_snapshot_blocks,
            MIN(snapshot_block_number) AS min_snapshot_block,
            MAX(snapshot_block_number) AS max_snapshot_block
        FROM region_share_snapshot_lines
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        GROUP BY chain_id, region_id, snapshot_epoch
        ORDER BY chain_id ASC, region_id ASC, snapshot_epoch ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

fn epoch_reconcile_marker(epochs: &[SnapshotEpochRow]) -> (&'static str, Value) {
    if epochs.is_empty() {
        return (
            "incomparable",
            json!({ "reason": "no_snapshot_lines", "epoch_count": 0 }),
        );
    }
    let mut drift_epochs: Vec<Value> = Vec::new();
    for e in epochs {
        if e.distinct_snapshot_blocks != 1 {
            drift_epochs.push(json!({
                "chain_id": e.chain_id,
                "region_id": e.region_id,
                "snapshot_epoch": e.snapshot_epoch,
                "line_count": e.line_count,
                "distinct_snapshot_blocks": e.distinct_snapshot_blocks,
                "min_snapshot_block": e.min_snapshot_block,
                "max_snapshot_block": e.max_snapshot_block,
            }));
        }
    }
    if drift_epochs.is_empty() {
        (
            "aligned",
            json!({
                "epoch_count": epochs.len(),
                "note": "each epoch has a single snapshot_block_number across lines",
            }),
        )
    } else {
        (
            "drift",
            json!({
                "epoch_count": epochs.len(),
                "drift_epoch_count": drift_epochs.len(),
                "drift_epochs": drift_epochs,
            }),
        )
    }
}

pub struct RegionShareReconcileRunResult {
    pub summary: Value,
    pub report_id: Option<Uuid>,
    pub projection_closure_clean: bool,
    pub amount_triangle_marker: String,
    pub epoch_reconcile_marker: String,
}

pub async fn run_region_share_reconcile(
    pool: &PgPool,
    chain_id: Option<i64>,
    persist: bool,
    fire_alert_on_drift: bool,
) -> Result<RegionShareReconcileRunResult, sqlx::Error> {
    let fr_rows = fetch_fee_router_for_aggregate(pool, chain_id).await?;
    let rv_rows = fetch_region_vault_for_aggregate(pool, chain_id).await?;
    let p5_rows = fetch_p5_credit_sums_by_token(pool, chain_id).await?;
    let epochs = list_snapshot_epoch_stats(pool, chain_id).await?;

    let fr_map = sum_rows_to_map(&fee_router_to_country_rows(&fr_rows));
    let rv_map = sum_rows_to_map(&vault_forwarded_rows(&rv_rows));
    let p5_pairs: Vec<(String, String)> = p5_rows
        .iter()
        .map(|r| (r.token_address.clone(), r.amount_u256_hex.clone()))
        .collect();
    let p5_map = sum_rows_to_map(&p5_pairs);

    let (tri_marker, tri_detail) = amount_triangle_marker(&fr_map, &rv_map, &p5_map);
    let (epoch_marker, epoch_detail) = epoch_reconcile_marker(&epochs);

    let projection_closure_clean = tri_marker == "aligned" && epoch_marker == "aligned";
    let drift_alert = if fire_alert_on_drift && !projection_closure_clean {
        json!({
            "fired": true,
            "severity": "P2",
            "source": "region_share_projection_closure_v1",
            "amount_triangle_marker": tri_marker,
            "epoch_reconcile_marker": epoch_marker,
        })
    } else {
        json!({ "fired": false })
    };

    let amount_triangle = json!({
        "anchor": REGION_SHARE_AMOUNT_TRIANGLE_ANCHOR,
        "schema_version": 1,
        "marker": tri_marker,
        "legs": {
            "fee_router_to_country": token_sums_from_map(&fr_map),
            "region_vault_forwarded": token_sums_from_map(&rv_map),
            "p5_country_ledger_credits": token_sums_from_map(&p5_map),
        },
        "detail": tri_detail,
        "boundary": "Projection-only Σ; P5 orthogonal; does not replace on-chain balanceOf or B-383/B384/B385 per-leg count smokes.",
    });

    let epoch_reconcile = json!({
        "anchor": REGION_SHARE_EPOCH_RECONCILE_ANCHOR,
        "schema_version": 1,
        "marker": epoch_marker,
        "epochs": epochs.iter().map(|e| json!({
            "chain_id": e.chain_id,
            "region_id": e.region_id,
            "snapshot_epoch": e.snapshot_epoch,
            "line_count": e.line_count,
            "distinct_snapshot_blocks": e.distinct_snapshot_blocks,
            "min_snapshot_block": e.min_snapshot_block,
            "max_snapshot_block": e.max_snapshot_block,
        })).collect::<Vec<_>>(),
        "detail": epoch_detail,
    });

    let observability = json!({
        "anchor": REGION_SHARE_PROJECTION_CLOSURE_ANCHOR,
        "schema_version": 1,
        "chain_id_filter": chain_id,
        "amount_triangle_marker": tri_marker,
        "epoch_reconcile_marker": epoch_marker,
        "projection_closure_clean": projection_closure_clean,
        "captured_at": Utc::now().to_rfc3339(),
    });

    let mut summary = json!({
        "anchor": REGION_SHARE_PROJECTION_CLOSURE_ANCHOR,
        "schema_version": 1,
        "chain_id_filter": chain_id,
        "stats": {
            "projection_closure_clean": projection_closure_clean,
            "amount_triangle_marker": tri_marker,
            "epoch_reconcile_marker": epoch_marker,
            "fee_router_routed_rows": fr_rows.len(),
            "region_vault_forwarded_rows": rv_rows.len(),
            "p5_country_ledger_credit_rows": p5_rows.len(),
            "snapshot_epochs": epochs.len(),
        },
        "amount_triangle": amount_triangle,
        "epoch_reconcile": epoch_reconcile,
        "region_share_projection_closure_observability": observability,
        "drift_alert": drift_alert,
        "rule_version": "region_share_projection_closure_v1",
    });

    let report_id = if persist {
        let id = insert_reconciliation_report(
            pool,
            REPORT_TYPE_REGION_SHARE_PROJECTION_CLOSURE,
            chain_id,
            &summary,
        )
        .await?;
        summary["report_id"] = json!(id.to_string());
        Some(id)
    } else {
        None
    };

    Ok(RegionShareReconcileRunResult {
        summary,
        report_id,
        projection_closure_clean,
        amount_triangle_marker: tri_marker.to_string(),
        epoch_reconcile_marker: epoch_marker.to_string(),
    })
}

pub async fn list_region_share_reconcile_reports(
    pool: &PgPool,
    chain_id: Option<i64>,
    limit: i64,
) -> Result<Vec<Value>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Option<i64>, chrono::DateTime<Utc>, Json<Value>)>(
        r#"
        SELECT id, chain_id, created_at, summary
        FROM reconciliation_reports
        WHERE report_type = $1
          AND ($2::bigint IS NULL OR chain_id = $2)
        ORDER BY created_at DESC, id DESC
        LIMIT $3
        "#,
    )
    .bind(REPORT_TYPE_REGION_SHARE_PROJECTION_CLOSURE)
    .bind(chain_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(id, chain_id, created_at, summary)| {
            let stats = summary.0.get("stats");
            json!({
                "report_id": id.to_string(),
                "chain_id": chain_id,
                "created_at": created_at.to_rfc3339(),
                "projection_closure_clean": stats.and_then(|s| s.get("projection_closure_clean")),
                "amount_triangle_marker": stats.and_then(|s| s.get("amount_triangle_marker")),
                "epoch_reconcile_marker": stats.and_then(|s| s.get("epoch_reconcile_marker")),
            })
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn amount_triangle_aligned_when_all_legs_match() {
        let mut fr = std::collections::BTreeMap::new();
        let mut rv = std::collections::BTreeMap::new();
        let mut p5 = std::collections::BTreeMap::new();
        let w = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000064",
        )
        .unwrap();
        fr.insert("0xtoken".into(), (w, 1));
        rv.insert("0xtoken".into(), (w, 1));
        p5.insert("0xtoken".into(), (w, 1));
        let (m, _) = amount_triangle_marker(&fr, &rv, &p5);
        assert_eq!(m, "aligned");
    }

    #[test]
    fn amount_triangle_drift_when_vault_differs() {
        let mut fr = std::collections::BTreeMap::new();
        let mut rv = std::collections::BTreeMap::new();
        let p5 = std::collections::BTreeMap::new();
        let a = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000064",
        )
        .unwrap();
        let b = parse_u256_word_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000065",
        )
        .unwrap();
        fr.insert("0xtoken".into(), (a, 1));
        rv.insert("0xtoken".into(), (b, 1));
        let (m, detail) = amount_triangle_marker(&fr, &rv, &p5);
        assert_eq!(m, "drift");
        assert_eq!(detail["drift_token_count"], 1);
    }

    #[test]
    fn amount_triangle_incomparable_when_single_leg() {
        let mut fr = std::collections::BTreeMap::new();
        let w = zero_word();
        fr.insert("0xtoken".into(), (w, 1));
        let (m, _) = amount_triangle_marker(&fr, &std::collections::BTreeMap::new(), &std::collections::BTreeMap::new());
        assert_eq!(m, "incomparable");
    }

    #[test]
    fn epoch_reconcile_flags_multi_block_epochs() {
        let epochs = vec![SnapshotEpochRow {
            chain_id: 1,
            region_id: "CN".into(),
            snapshot_epoch: 1,
            line_count: 2,
            distinct_snapshot_blocks: 2,
            min_snapshot_block: Some(100),
            max_snapshot_block: Some(101),
        }];
        let (m, _) = epoch_reconcile_marker(&epochs);
        assert_eq!(m, "drift");
    }
}
