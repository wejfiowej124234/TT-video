//! GAP-IDX-NP-004 · Country Pool Net Profit events + epoch projections.

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;

use crate::chain::country_pool_net_profit_indexer::{
    apply_net_profit_event, NetProfitEpochSnapshot, NetProfitIndexerEvent,
};

#[derive(Debug, Clone)]
pub struct NetProfitEventRow {
    pub event_type: String,
    pub block_number: i64,
    pub log_index: i32,
    pub tx_hash: Option<String>,
    pub jurisdiction: String,
    pub epoch_id: Option<String>,
    pub payload: Value,
    pub accounting_ok: Option<bool>,
    pub accounting_note: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NetProfitEpochRow {
    pub jurisdiction: String,
    pub epoch_id: String,
    pub snapshot: NetProfitEpochSnapshot,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Default)]
pub struct NetProfitProjectionStats {
    pub max_block: Option<i64>,
    pub max_log_index: Option<i32>,
    pub epoch_count: i64,
    pub event_count: i64,
}

pub async fn insert_country_pool_net_profit_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &[u8],
    tx_hash: &[u8],
    log_address: &str,
    event_type: &str,
    jurisdiction_id: &str,
    epoch_id: Option<&str>,
    payload: &Value,
    accounting_ok: Option<bool>,
    accounting_note: Option<&str>,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        INSERT INTO country_pool_net_profit_events (
            chain_id, block_number, log_index, block_hash, tx_hash, log_address,
            event_type, jurisdiction_id, epoch_id, payload, accounting_ok, accounting_note
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(log_address)
    .bind(event_type)
    .bind(jurisdiction_id)
    .bind(epoch_id)
    .bind(payload)
    .bind(accounting_ok)
    .bind(accounting_note)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn upsert_net_profit_epoch(
    pool: &PgPool,
    chain_id: i64,
    snap: &NetProfitEpochSnapshot,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO country_pool_net_profit_epochs (
            chain_id, jurisdiction_id, epoch_id, status,
            epoch_start, epoch_end,
            gross_revenue, allowable_expense, net_profit, net_profit_prime,
            funded, steward_amount, unallocated_amount, global_amount,
            steward_path_eligible, qualified_steward,
            bps_steward_path, bps_global_treasury, active_steward,
            last_block_number, last_log_index, updated_at
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,now()
        )
        ON CONFLICT (chain_id, jurisdiction_id, epoch_id) DO UPDATE SET
            status = EXCLUDED.status,
            epoch_start = COALESCE(EXCLUDED.epoch_start, country_pool_net_profit_epochs.epoch_start),
            epoch_end = COALESCE(EXCLUDED.epoch_end, country_pool_net_profit_epochs.epoch_end),
            gross_revenue = COALESCE(EXCLUDED.gross_revenue, country_pool_net_profit_epochs.gross_revenue),
            allowable_expense = COALESCE(EXCLUDED.allowable_expense, country_pool_net_profit_epochs.allowable_expense),
            net_profit = COALESCE(EXCLUDED.net_profit, country_pool_net_profit_epochs.net_profit),
            net_profit_prime = COALESCE(EXCLUDED.net_profit_prime, country_pool_net_profit_epochs.net_profit_prime),
            funded = EXCLUDED.funded OR country_pool_net_profit_epochs.funded,
            steward_amount = COALESCE(EXCLUDED.steward_amount, country_pool_net_profit_epochs.steward_amount),
            unallocated_amount = COALESCE(EXCLUDED.unallocated_amount, country_pool_net_profit_epochs.unallocated_amount),
            global_amount = COALESCE(EXCLUDED.global_amount, country_pool_net_profit_epochs.global_amount),
            steward_path_eligible = COALESCE(EXCLUDED.steward_path_eligible, country_pool_net_profit_epochs.steward_path_eligible),
            qualified_steward = COALESCE(EXCLUDED.qualified_steward, country_pool_net_profit_epochs.qualified_steward),
            bps_steward_path = EXCLUDED.bps_steward_path,
            bps_global_treasury = EXCLUDED.bps_global_treasury,
            active_steward = COALESCE(EXCLUDED.active_steward, country_pool_net_profit_epochs.active_steward),
            last_block_number = EXCLUDED.last_block_number,
            last_log_index = EXCLUDED.last_log_index,
            updated_at = now()
        "#,
    )
    .bind(chain_id)
    .bind(&snap.jurisdiction)
    .bind(&snap.epoch_id)
    .bind(&snap.status)
    .bind(snap.epoch_start.map(|v| v as i64))
    .bind(snap.epoch_end.map(|v| v as i64))
    .bind(&snap.gross_revenue)
    .bind(&snap.allowable_expense)
    .bind(&snap.net_profit)
    .bind(&snap.net_profit_prime)
    .bind(snap.funded)
    .bind(&snap.steward_amount)
    .bind(&snap.unallocated_amount)
    .bind(&snap.global_amount)
    .bind(snap.steward_path_eligible)
    .bind(&snap.qualified_steward)
    .bind(snap.bps_steward_path as i32)
    .bind(snap.bps_global_treasury as i32)
    .bind(&snap.active_steward)
    .bind(snap.last_block.map(|v| v as i64))
    .bind(snap.last_log_index.map(|v| v as i32))
    .execute(pool)
    .await?;
    Ok(())
}

fn row_to_epoch_snapshot(jurisdiction: &str, row: &sqlx::postgres::PgRow) -> NetProfitEpochSnapshot {
    use sqlx::Row;
    NetProfitEpochSnapshot {
        jurisdiction: jurisdiction.to_string(),
        epoch_id: row.get("epoch_id"),
        status: row.try_get::<String, _>("status").unwrap_or_default(),
        epoch_start: row
            .try_get::<Option<i64>, _>("epoch_start")
            .ok()
            .flatten()
            .map(|v| v as u64),
        epoch_end: row
            .try_get::<Option<i64>, _>("epoch_end")
            .ok()
            .flatten()
            .map(|v| v as u64),
        gross_revenue: row.try_get("gross_revenue").ok(),
        allowable_expense: row.try_get("allowable_expense").ok(),
        net_profit: row.try_get("net_profit").ok(),
        net_profit_prime: row.try_get("net_profit_prime").ok(),
        funded: row.try_get("funded").unwrap_or(false),
        steward_amount: row.try_get("steward_amount").ok(),
        unallocated_amount: row.try_get("unallocated_amount").ok(),
        global_amount: row.try_get("global_amount").ok(),
        steward_path_eligible: row.try_get("steward_path_eligible").ok(),
        qualified_steward: row.try_get("qualified_steward").ok(),
        bps_steward_path: row.try_get::<i32, _>("bps_steward_path").unwrap_or(4500) as u16,
        bps_global_treasury: row.try_get::<i32, _>("bps_global_treasury").unwrap_or(5500) as u16,
        active_steward: row.try_get("active_steward").ok(),
        last_block: row
            .try_get::<Option<i64>, _>("last_block_number")
            .ok()
            .flatten()
            .map(|v| v as u64),
        last_log_index: row
            .try_get::<Option<i32>, _>("last_log_index")
            .ok()
            .flatten()
            .map(|v| v as u32),
    }
}

pub async fn get_net_profit_epoch(
    pool: &PgPool,
    chain_id: i64,
    jurisdiction: &str,
    epoch_id: &str,
) -> Result<Option<NetProfitEpochSnapshot>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT jurisdiction_id, epoch_id, status, epoch_start, epoch_end, gross_revenue, allowable_expense,
               net_profit, net_profit_prime, funded, steward_amount, unallocated_amount,
               global_amount, steward_path_eligible, qualified_steward,
               bps_steward_path, bps_global_treasury, active_steward,
               last_block_number, last_log_index
        FROM country_pool_net_profit_epochs
        WHERE chain_id = $1 AND jurisdiction_id = $2 AND epoch_id = $3
        "#,
    )
    .bind(chain_id)
    .bind(jurisdiction)
    .bind(epoch_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|r| row_to_epoch_snapshot(jurisdiction, &r)))
}

pub async fn persist_net_profit_indexer_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &[u8],
    tx_hash: &[u8],
    log_address: &str,
    ev: &NetProfitIndexerEvent,
    payload: &Value,
) -> Result<bool, sqlx::Error> {
    let (event_type, jurisdiction, epoch_id, accounting_ok, accounting_note) = match ev {
        NetProfitIndexerEvent::EpochOpened { jurisdiction, epoch_id, .. } => {
            ("EpochOpened", jurisdiction.clone(), Some(epoch_id.clone()), None, None)
        }
        NetProfitIndexerEvent::NetProfitAccrued { jurisdiction, epoch_id, .. } => {
            ("NetProfitAccrued", jurisdiction.clone(), Some(epoch_id.clone()), None, None)
        }
        NetProfitIndexerEvent::EpochClosed { jurisdiction, epoch_id, .. } => {
            ("EpochClosed", jurisdiction.clone(), Some(epoch_id.clone()), None, None)
        }
        NetProfitIndexerEvent::LedgerFundedForSplit { jurisdiction, epoch_id, .. } => (
            "LedgerFundedForSplit",
            jurisdiction.clone(),
            Some(epoch_id.clone()),
            None,
            None,
        ),
        NetProfitIndexerEvent::NetProfitSplit {
            jurisdiction,
            epoch_id,
            accounting,
            ..
        } => (
            "NetProfitSplit",
            jurisdiction.clone(),
            Some(epoch_id.clone()),
            Some(accounting.ok),
            accounting.note.clone(),
        ),
        NetProfitIndexerEvent::ActiveStewardConfigSet { jurisdiction, .. } => {
            ("ActiveStewardConfigSet", jurisdiction.clone(), None, None, None)
        }
        NetProfitIndexerEvent::StewardPathDeposit { jurisdiction, epoch_id, .. } => (
            "StewardPathDeposit",
            jurisdiction.clone(),
            Some(epoch_id.clone()),
            None,
            None,
        ),
        NetProfitIndexerEvent::UnallocatedStewardDeposit { jurisdiction, epoch_id, .. } => (
            "UnallocatedStewardDeposit",
            jurisdiction.clone(),
            Some(epoch_id.clone()),
            None,
            None,
        ),
        NetProfitIndexerEvent::UnallocatedStewardReleased { jurisdiction, .. } => (
            "UnallocatedStewardReleased",
            jurisdiction.clone(),
            None,
            None,
            None,
        ),
    };

    let inserted = insert_country_pool_net_profit_event(
        pool,
        chain_id,
        block_number,
        log_index,
        block_hash,
        tx_hash,
        log_address,
        event_type,
        &jurisdiction,
        epoch_id.as_deref(),
        payload,
        accounting_ok,
        accounting_note.as_deref(),
    )
    .await?;

    if inserted {
        apply_net_profit_event_to_db(
            pool,
            chain_id,
            ev,
            block_number.max(0) as u64,
            log_index.max(0) as u32,
        )
        .await?;
    }
    Ok(inserted)
}

pub async fn apply_net_profit_event_to_db(
    pool: &PgPool,
    chain_id: i64,
    ev: &NetProfitIndexerEvent,
    block_number: u64,
    log_index: u32,
) -> Result<(), sqlx::Error> {
    let (jurisdiction, epoch_id) = match ev {
        NetProfitIndexerEvent::EpochOpened { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::NetProfitAccrued { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::EpochClosed { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::LedgerFundedForSplit { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::NetProfitSplit { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::StewardPathDeposit { jurisdiction, epoch_id, .. }
        | NetProfitIndexerEvent::UnallocatedStewardDeposit { jurisdiction, epoch_id, .. } => {
            (jurisdiction.clone(), Some(epoch_id.clone()))
        }
        NetProfitIndexerEvent::ActiveStewardConfigSet { jurisdiction, .. }
        | NetProfitIndexerEvent::UnallocatedStewardReleased { jurisdiction, .. } => {
            (jurisdiction.clone(), None)
        }
    };

    let mut snap = if let Some(ref eid) = epoch_id {
        get_net_profit_epoch(pool, chain_id, &jurisdiction, eid)
            .await?
            .unwrap_or_else(|| NetProfitEpochSnapshot {
                jurisdiction: jurisdiction.clone(),
                epoch_id: eid.clone(),
                ..Default::default()
            })
    } else {
        NetProfitEpochSnapshot {
            jurisdiction: jurisdiction.clone(),
            epoch_id: "0".to_string(),
            ..Default::default()
        }
    };

    apply_net_profit_event(&mut snap, ev, block_number, log_index);

    if epoch_id.is_some() {
        upsert_net_profit_epoch(pool, chain_id, &snap).await?;
    } else if let NetProfitIndexerEvent::ActiveStewardConfigSet { .. } = ev {
        sqlx::query(
            r#"
            UPDATE country_pool_net_profit_epochs
            SET active_steward = $3, updated_at = now()
            WHERE chain_id = $1 AND jurisdiction_id = $2
            "#,
        )
        .bind(chain_id)
        .bind(&jurisdiction)
        .bind(&snap.active_steward)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn list_net_profit_epochs(
    pool: &PgPool,
    chain_id: i64,
    jurisdiction: Option<&str>,
    limit: u32,
) -> Result<Vec<NetProfitEpochRow>, sqlx::Error> {
    use sqlx::Row;
    let lim = limit.min(200) as i64;
    let sql = if jurisdiction.is_some() {
        r#"
        SELECT jurisdiction_id, epoch_id, status, epoch_start, epoch_end, gross_revenue,
               allowable_expense, net_profit, net_profit_prime, funded,
               steward_amount, unallocated_amount, global_amount,
               steward_path_eligible, qualified_steward,
               bps_steward_path, bps_global_treasury, active_steward,
               last_block_number, last_log_index, updated_at
        FROM country_pool_net_profit_epochs
        WHERE chain_id = $1 AND jurisdiction_id = $2
        ORDER BY CAST(epoch_id AS BIGINT) DESC
        LIMIT $3
        "#
    } else {
        r#"
        SELECT jurisdiction_id, epoch_id, status, epoch_start, epoch_end, gross_revenue,
               allowable_expense, net_profit, net_profit_prime, funded,
               steward_amount, unallocated_amount, global_amount,
               steward_path_eligible, qualified_steward,
               bps_steward_path, bps_global_treasury, active_steward,
               last_block_number, last_log_index, updated_at
        FROM country_pool_net_profit_epochs
        WHERE chain_id = $1
        ORDER BY jurisdiction_id, CAST(epoch_id AS BIGINT) DESC
        LIMIT $2
        "#
    };

    let rows = if let Some(j) = jurisdiction {
        sqlx::query(sql)
            .bind(chain_id)
            .bind(j)
            .bind(lim)
            .fetch_all(pool)
            .await?
    } else {
        sqlx::query(sql)
            .bind(chain_id)
            .bind(lim)
            .fetch_all(pool)
            .await?
    };

    Ok(rows
        .into_iter()
        .map(|r| {
            let jurisdiction: String = r.get("jurisdiction_id");
            let snapshot = row_to_epoch_snapshot(&jurisdiction, &r);
            NetProfitEpochRow {
                jurisdiction,
                epoch_id: snapshot.epoch_id.clone(),
                updated_at: r.get("updated_at"),
                snapshot,
            }
        })
        .collect())
}

pub async fn list_net_profit_timeline_events(
    pool: &PgPool,
    chain_id: i64,
    jurisdiction: Option<&str>,
    limit: u32,
) -> Result<Vec<NetProfitEventRow>, sqlx::Error> {
    let lim = limit.min(200) as i64;
    let rows = sqlx::query_as::<_, (
        String,
        i64,
        i32,
        Option<Vec<u8>>,
        String,
        Option<String>,
        Value,
        Option<bool>,
        Option<String>,
    )>(
        r#"
        SELECT event_type, block_number, log_index, tx_hash, jurisdiction_id, epoch_id,
               payload, accounting_ok, accounting_note
        FROM country_pool_net_profit_events
        WHERE chain_id = $1
          AND ($2::text IS NULL OR jurisdiction_id = $2)
        ORDER BY block_number ASC, log_index ASC
        LIMIT $3
        "#,
    )
    .bind(chain_id)
    .bind(jurisdiction)
    .bind(lim)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(event_type, block_number, log_index, tx_hash, jurisdiction, epoch_id, payload, accounting_ok, accounting_note)| {
                NetProfitEventRow {
                    event_type,
                    block_number,
                    log_index,
                    tx_hash: tx_hash.map(|h| format!("0x{}", hex::encode(h))),
                    jurisdiction,
                    epoch_id,
                    payload,
                    accounting_ok,
                    accounting_note,
                }
            },
        )
        .collect())
}

pub fn epoch_snapshot_to_public_json(snap: &NetProfitEpochSnapshot) -> serde_json::Value {
    serde_json::json!({
        "epochId": snap.epoch_id,
        "status": snap.status,
        "epochStart": snap.epoch_start,
        "epochEnd": snap.epoch_end,
        "grossRevenue": snap.gross_revenue,
        "allowableExpense": snap.allowable_expense,
        "netProfit": snap.net_profit,
        "netProfitPrime": snap.net_profit_prime,
        "funded": snap.funded,
        "stewardAmount": snap.steward_amount,
        "unallocatedAmount": snap.unallocated_amount,
        "globalAmount": snap.global_amount,
        "stewardPathEligible": snap.steward_path_eligible,
        "qualifiedSteward": snap.qualified_steward,
        "bpsStewardPath": snap.bps_steward_path,
        "bpsGlobalTreasury": snap.bps_global_treasury,
        "activeSteward": snap.active_steward,
        "lastBlock": snap.last_block,
        "lastLogIndex": snap.last_log_index,
        "dataSource": "indexer",
    })
}

pub async fn net_profit_projection_stats(
    pool: &PgPool,
    chain_id: i64,
) -> Result<NetProfitProjectionStats, sqlx::Error> {
    let epoch_row = sqlx::query_as::<_, (Option<i64>, Option<i32>, i64)>(
        r#"
        SELECT MAX(last_block_number), MAX(last_log_index), COUNT(*)::bigint
        FROM country_pool_net_profit_epochs WHERE chain_id = $1
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let event_count = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*)::bigint FROM country_pool_net_profit_events WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    Ok(NetProfitProjectionStats {
        max_block: epoch_row.0,
        max_log_index: epoch_row.1,
        epoch_count: epoch_row.2,
        event_count,
    })
}

pub async fn count_net_profit_accounting_failures(
    pool: &PgPool,
    chain_id: i64,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM country_pool_net_profit_events
        WHERE chain_id = $1 AND event_type = 'NetProfitSplit' AND accounting_ok = false
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await
}

pub async fn latest_net_profit_event_timestamp(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT MAX(inserted_at) FROM country_pool_net_profit_events WHERE chain_id = $1
        "#,
    )
    .bind(chain_id)
    .fetch_optional(pool)
    .await
}
