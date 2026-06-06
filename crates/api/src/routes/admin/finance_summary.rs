//! Admin 财务汇总：内存聚合与 CSV 导出助手（`GET …/finance/summary*`、RegionVault 导出列）。
use chrono::Utc;
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::chain_off;
use crate::db;
use crate::state::ApiMetaState;

pub(super) struct AdminFinanceSummaryComputed {
    pub meta: Value,
    pub summary: Value,
    pub audit_detail: Value,
}

fn finance_summary_value_cell(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => s.clone(),
        Value::Array(_) | Value::Object(_) => {
            serde_json::to_string(v).unwrap_or_else(|_| "{}".to_string())
        }
    }
}

pub(crate) fn csv_escape_cell(s: &str) -> String {
    if s.contains(['"', ',', '\n', '\r']) {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

/// P5-2-A 最小列集（**`id`** 置末）；**仅** **`region_vault_forwarded_events`** 行。
pub(crate) fn region_vault_forwarded_export_csv(
    rows: &[db::RegionVaultForwardedEventRow],
) -> String {
    use std::fmt::Write;
    let mut buf = String::from(
        "chain_id,block_number,log_index,block_hash,tx_hash,vault_address,token_address,to_address,amount_u256_hex,inserted_at,id\n",
    );
    for r in rows {
        let _ = writeln!(
            buf,
            "{},{},{},{},{},{},{},{},{},{},{}",
            r.chain_id,
            r.block_number,
            r.log_index,
            csv_escape_cell(&r.block_hash),
            csv_escape_cell(&r.tx_hash),
            csv_escape_cell(&r.vault_address),
            csv_escape_cell(&r.token_address),
            csv_escape_cell(&r.to_address),
            csv_escape_cell(&r.amount_u256_hex),
            csv_escape_cell(&r.inserted_at.to_rfc3339()),
            csv_escape_cell(&r.id.to_string()),
        );
    }
    buf
}

fn push_finance_csv_row(buf: &mut String, group: &str, metric: &str, value: &str) {
    use std::fmt::Write;
    let _ = writeln!(
        buf,
        "{},{},{}",
        csv_escape_cell(group),
        csv_escape_cell(metric),
        csv_escape_cell(value)
    );
}

pub(crate) fn finance_summary_to_csv(meta: &Value, summary: &Value) -> String {
    let mut buf = String::new();
    push_finance_csv_row(&mut buf, "export", "kind", "finance_summary_v2");

    if let Some(mo) = meta.as_object() {
        for (k, v) in mo {
            match (k.as_str(), v) {
                ("fee_router_stats" | "region_vault_stats", Value::Object(m)) => {
                    let group = format!("meta.{k}");
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            group.as_str(),
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("last_stored_orders_projection_reconcile", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "meta.last_stored_orders_projection_reconcile",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                _ => {
                    push_finance_csv_row(
                        &mut buf,
                        "meta",
                        k.as_str(),
                        &finance_summary_value_cell(v),
                    );
                }
            }
        }
    };
    if let Some(b) = crate::routes::meta_build_value().as_object() {
        for (k, v) in b {
            push_finance_csv_row(
                &mut buf,
                "meta.build",
                k.as_str(),
                &finance_summary_value_cell(v),
            );
        }
    };
    if let Some(so) = summary.as_object() {
        for (k, v) in so {
            match (k.as_str(), v) {
                ("state_counts", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.state_counts",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("total_amount_by_currency", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.total_amount_by_currency",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("escrowed_amount_by_currency", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.escrowed_amount_by_currency",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("dispute_status_counts", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.dispute_status_counts",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                _ => push_finance_csv_row(
                    &mut buf,
                    "summary",
                    k.as_str(),
                    &finance_summary_value_cell(v),
                ),
            }
        }
    }
    buf
}

pub(crate) async fn compute_admin_finance_summary(
    state: &ApiMetaState,
    co: &chain_off::ChainOffState,
) -> AdminFinanceSummaryComputed {
    let store = co.store.read().await;

    let mut state_counts: HashMap<String, i64> = HashMap::new();
    let mut total_by_currency: HashMap<String, f64> = HashMap::new();
    let mut escrowed_by_currency: HashMap<String, f64> = HashMap::new();
    let mut orders_with_escrow_address: i64 = 0;
    let mut orders_amount_parse_error_count: i64 = 0;

    for order in store.orders.values() {
        let order_state = chain_off::order_state_to_str(order.state).to_string();
        *state_counts.entry(order_state.clone()).or_insert(0) += 1;

        if order
            .escrow_address
            .as_ref()
            .is_some_and(|s| !s.trim().is_empty())
        {
            orders_with_escrow_address += 1;
        };
        match order.amount.parse::<f64>() {
            Ok(v) => {
                let ccy = order.currency.clone();
                *total_by_currency.entry(ccy.clone()).or_insert(0.0) += v;
                if matches!(order_state.as_str(), "Escrowed" | "Completed") {
                    *escrowed_by_currency.entry(ccy).or_insert(0.0) += v;
                }
            }
            Err(_) => {
                orders_amount_parse_error_count += 1;
            }
        }
    };    let mut dispute_status_counts: HashMap<String, i64> = HashMap::new();
    for d in store.disputes.values() {
        *dispute_status_counts.entry(d.status.clone()).or_insert(0) += 1;
    };    let (
        db_order_count,
        db_orders_with_escrow_count,
        fee_router_stats,
        region_vault_stats,
        last_stored_orders_projection_reconcile,
        orders_projection_reconcile_report_count,
        reconciliation_reports_total_count,
        reconciliation_reports_with_open_issues_count,
        reconciliation_reports_projection_unclean_count,
        reconciliation_reports_projection_clean_count,
    ) = if let Some(pool) = co.db_pool.as_ref() {
        let fee_router_stats = match db::fee_router_routed_stats(pool, None).await {
            Ok(s) => json!({
                "total": s.total,
                "max_block_number": s.max_block_number,
                "min_block_number": s.min_block_number,
                "latest_inserted_at": s.latest_inserted_at.map(|t| t.to_rfc3339()),
            }),
            Err(_) => Value::Null,
        };
        let region_vault_stats = match db::region_vault_forwarded_stats(pool, None).await {
            Ok(s) => json!({
                "total": s.total,
                "max_block_number": s.max_block_number,
                "min_block_number": s.min_block_number,
                "latest_inserted_at": s.latest_inserted_at.map(|t| t.to_rfc3339()),
            }),
            Err(_) => Value::Null,
        };
        let last_stored_orders_projection_reconcile =
            match db::admin_last_stored_orders_projection_reconcile(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => Value::Null,
                Err(_) => Value::Null,
            };
        let orders_projection_reconcile_report_count = db::count_reconciliation_reports(
            pool,
            Some(db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS),
            None,
            None,
            None,
        )
        .await
        .ok();
        let reconciliation_reports_total_count =
            db::count_reconciliation_reports(pool, None, None, None, None)
                .await
                .ok();
        let reconciliation_reports_with_open_issues_count =
            db::count_reconciliation_reports(pool, None, None, None, Some(1))
                .await
                .ok();
        let reconciliation_reports_projection_unclean_count =
            db::count_reconciliation_reports(pool, None, None, Some(false), None)
                .await
                .ok();
        let reconciliation_reports_projection_clean_count =
            db::count_reconciliation_reports(pool, None, None, Some(true), None)
                .await
                .ok();
        (
            db::count_orders(pool).await.ok(),
            db::count_orders_with_escrow_address(pool).await.ok(),
            fee_router_stats,
            region_vault_stats,
            last_stored_orders_projection_reconcile,
            orders_projection_reconcile_report_count,
            reconciliation_reports_total_count,
            reconciliation_reports_with_open_issues_count,
            reconciliation_reports_projection_unclean_count,
            reconciliation_reports_projection_clean_count,
        )
    } else {
        (
            None,
            None,
            Value::Null,
            Value::Null,
            Value::Null,
            None,
            None,
            None,
            None,
            None,
        )
    };

    let fee_router_address_meta = state
        .chain_config
        .as_ref()
        .and_then(|c| c.fee_router_address.as_ref())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(std::string::ToString::to_string);

    let region_vault_address_meta = state
        .chain_config
        .as_ref()
        .and_then(|c| c.region_vault_address.as_ref())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(std::string::ToString::to_string);

    let meta = json!({
        "generated_at": Utc::now().to_rfc3339(),
        "source": "chain_off",
        "db_order_count": db_order_count,
        "db_orders_with_escrow_count": db_orders_with_escrow_count,
        "orders_projection_reconcile_report_count": orders_projection_reconcile_report_count,
        "reconciliation_reports_total_count": reconciliation_reports_total_count,
        "reconciliation_reports_with_open_issues_count": reconciliation_reports_with_open_issues_count,
        "reconciliation_reports_projection_unclean_count": reconciliation_reports_projection_unclean_count,
        "reconciliation_reports_projection_clean_count": reconciliation_reports_projection_clean_count,
        "fee_router_address": fee_router_address_meta,
        "fee_router_stats": fee_router_stats,
        "region_vault_address": region_vault_address_meta,
        "region_vault_stats": region_vault_stats,
        "last_stored_orders_projection_reconcile": last_stored_orders_projection_reconcile,
    });

    let summary = json!({
        "order_count": store.orders.len(),
        "state_counts": state_counts,
        "total_amount_by_currency": total_by_currency,
        "escrowed_amount_by_currency": escrowed_by_currency,
        "dispute_count": store.disputes.len(),
        "dispute_status_counts": dispute_status_counts,
        "orders_with_escrow_address_count": orders_with_escrow_address,
        "orders_amount_parse_error_count": orders_amount_parse_error_count,
    });

    let audit_detail = json!({
        "order_count": store.orders.len(),
        "dispute_count": store.disputes.len(),
        "state_count_keys": state_counts.len(),
        "currency_count_keys": total_by_currency.len(),
        "orders_with_escrow_address": orders_with_escrow_address,
        "orders_amount_parse_error_count": orders_amount_parse_error_count,
        "db_order_count": db_order_count,
        "db_orders_with_escrow_count": db_orders_with_escrow_count,
        "orders_projection_reconcile_report_count": orders_projection_reconcile_report_count,
        "reconciliation_reports_total_count": reconciliation_reports_total_count,
        "reconciliation_reports_with_open_issues_count": reconciliation_reports_with_open_issues_count,
        "reconciliation_reports_projection_unclean_count": reconciliation_reports_projection_unclean_count,
        "reconciliation_reports_projection_clean_count": reconciliation_reports_projection_clean_count,
        "fee_router_total": fee_router_stats.get("total").and_then(|x| x.as_i64()),
        "region_vault_total": region_vault_stats.get("total").and_then(|x| x.as_i64()),
        "projection_reconcile_clean": last_stored_orders_projection_reconcile
            .get("projection_reconcile_clean")
            .and_then(|v| v.as_bool()),
    });

    AdminFinanceSummaryComputed {
        meta,
        summary,
        audit_detail,
    }
}
