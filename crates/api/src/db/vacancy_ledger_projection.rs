//! S4a · `vacancy_ledger_projections` read/write (Indexer SSOT · no reserve recompute).

use sqlx::postgres::PgPool;

use crate::chain::vacancy_ledger_indexer::VacancyLedgerSnapshot;

pub async fn upsert_vacancy_ledger_projection(
    pool: &PgPool,
    chain_id: i64,
    snap: &VacancyLedgerSnapshot,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO vacancy_ledger_projections (
            chain_id,
            jurisdiction_id,
            state,
            principal_u256,
            swept_u256,
            reserve_u256,
            disbursed_u256,
            sweep_enabled,
            steward_activation_epoch_id,
            last_block_number,
            last_log_index,
            updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
        ON CONFLICT (chain_id, jurisdiction_id) DO UPDATE SET
            state = EXCLUDED.state,
            principal_u256 = EXCLUDED.principal_u256,
            swept_u256 = EXCLUDED.swept_u256,
            reserve_u256 = EXCLUDED.reserve_u256,
            disbursed_u256 = EXCLUDED.disbursed_u256,
            sweep_enabled = EXCLUDED.sweep_enabled,
            steward_activation_epoch_id = COALESCE(
                EXCLUDED.steward_activation_epoch_id,
                vacancy_ledger_projections.steward_activation_epoch_id
            ),
            last_block_number = EXCLUDED.last_block_number,
            last_log_index = EXCLUDED.last_log_index,
            updated_at = now()
        "#,
    )
    .bind(chain_id)
    .bind(&snap.jurisdiction)
    .bind(&snap.state)
    .bind(&snap.principal)
    .bind(&snap.swept)
    .bind(&snap.reserve)
    .bind(&snap.disbursed)
    .bind(snap.sweep_enabled)
    .bind(&snap.steward_activation_epoch_id)
    .bind(snap.last_block.map(|b| b as i64))
    .bind(snap.last_log_index.map(|i| i as i32))
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_vacancy_ledger_projection(
    pool: &PgPool,
    chain_id: i64,
    jurisdiction_id: &str,
) -> Result<Option<VacancyLedgerSnapshot>, sqlx::Error> {
    let row = sqlx::query_as::<
        _,
        (
            String,
            String,
            String,
            String,
            String,
            bool,
            Option<String>,
            Option<i64>,
            Option<i32>,
        ),
    >(
        r#"
        SELECT
            state,
            principal_u256,
            swept_u256,
            reserve_u256,
            disbursed_u256,
            sweep_enabled,
            steward_activation_epoch_id,
            last_block_number,
            last_log_index
        FROM vacancy_ledger_projections
        WHERE chain_id = $1 AND jurisdiction_id = $2
        "#,
    )
    .bind(chain_id)
    .bind(jurisdiction_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(
        |(
            state,
            principal,
            swept,
            reserve,
            disbursed,
            sweep_enabled,
            steward_activation_epoch_id,
            last_block,
            last_log_index,
        )| VacancyLedgerSnapshot {
            jurisdiction: jurisdiction_id.to_string(),
            state,
            principal,
            swept,
            reserve,
            disbursed,
            sweep_enabled,
            steward_activation_epoch_id,
            last_block: last_block.map(|b| b as u64),
            last_log_index: last_log_index.map(|i| i as u32),
        },
    ))
}

pub fn snapshot_to_public_json(snap: &VacancyLedgerSnapshot) -> serde_json::Value {
    let mut v = serde_json::json!({
        "jurisdiction": snap.jurisdiction,
        "state": snap.state,
        "principal": snap.principal,
        "swept": snap.swept,
        "reserve": snap.reserve,
        "disbursed": snap.disbursed,
        "sweepEnabled": snap.sweep_enabled,
        "dataSource": "indexer",
        "readOnly": true
    });
    if let Some(epoch) = &snap.steward_activation_epoch_id {
        v["stewardActivationEpochId"] = serde_json::json!(epoch);
    }
    if let Some(b) = snap.last_block {
        v["lastBlock"] = serde_json::json!(b);
    }
    if let Some(i) = snap.last_log_index {
        v["lastLogIndex"] = serde_json::json!(i);
    }
    v
}

#[derive(Clone, Debug)]
pub struct VacancyLedgerProjectionRow {
    pub jurisdiction: String,
    pub snapshot: VacancyLedgerSnapshot,
    pub updated_at: Option<String>,
}

pub async fn list_vacancy_ledger_projections(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Vec<VacancyLedgerProjectionRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            String,
            String,
            String,
            String,
            String,
            String,
            bool,
            Option<String>,
            Option<i64>,
            Option<i32>,
            Option<chrono::DateTime<chrono::Utc>>,
        ),
    >(
        r#"
        SELECT
            jurisdiction_id,
            state,
            principal_u256,
            swept_u256,
            reserve_u256,
            disbursed_u256,
            sweep_enabled,
            steward_activation_epoch_id,
            last_block_number,
            last_log_index,
            updated_at
        FROM vacancy_ledger_projections
        WHERE chain_id = $1
        ORDER BY jurisdiction_id ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(
                jurisdiction,
                state,
                principal,
                swept,
                reserve,
                disbursed,
                sweep_enabled,
                steward_activation_epoch_id,
                last_block,
                last_log_index,
                updated_at,
            )| VacancyLedgerProjectionRow {
                jurisdiction: jurisdiction.clone(),
                snapshot: VacancyLedgerSnapshot {
                    jurisdiction,
                    state,
                    principal,
                    swept,
                    reserve,
                    disbursed,
                    sweep_enabled,
                    steward_activation_epoch_id,
                    last_block: last_block.map(|b| b as u64),
                    last_log_index: last_log_index.map(|i| i as u32),
                },
                updated_at: updated_at.map(|t| t.to_rfc3339()),
            },
        )
        .collect())
}

#[derive(Clone, Debug)]
pub struct VacancyTimelineEventRow {
    pub event_type: String,
    pub block_number: i64,
    pub log_index: i32,
    pub tx_hash: Option<String>,
    pub jurisdiction: Option<String>,
}

fn jurisdiction_from_event_topic(topic: &str) -> Option<String> {
    let t = topic.trim().trim_start_matches("0x");
    if t.len() < 4 {
        return None;
    }
    let tail = &t[t.len() - 4..];
    let b = hex::decode(tail).ok()?;
    if b.len() != 2 {
        return None;
    }
    if !b[0].is_ascii_alphabetic() || !b[1].is_ascii_alphabetic() {
        return None;
    }
    Some(format!(
        "{}{}",
        char::from(b[0].to_ascii_uppercase()),
        char::from(b[1].to_ascii_uppercase())
    ))
}

pub async fn list_vacancy_timeline_events(
    pool: &PgPool,
    chain_id: i64,
    jurisdiction: Option<&str>,
    limit: u32,
) -> Result<Vec<VacancyTimelineEventRow>, sqlx::Error> {
    let lim = limit.min(200) as i64;
    let rows = sqlx::query_as::<_, (String, i64, i32, Option<Vec<u8>>, serde_json::Value)>(
        r#"
        SELECT event_type, block_number, log_index, tx_hash, payload
        FROM event_log
        WHERE chain_id = $1
        AND event_type IN (
            'VacancyEntered',
            'GraceStarted',
            'SweepExecuted',
            'ReserveReached',
            'StewardActivated',
            'JurisdictionReserveDisbursed'
        )
        ORDER BY block_number ASC, log_index ASC
        LIMIT $2
        "#,
    )
    .bind(chain_id)
    .bind(lim)
    .fetch_all(pool)
    .await?;

    let j_filter = jurisdiction.map(|s| s.trim().to_uppercase());
    Ok(rows
        .into_iter()
        .filter_map(|(event_type, block_number, log_index, tx_hash, payload)| {
            let topic1 = payload
                .get("topics")
                .and_then(|t| t.as_array())
                .and_then(|a| a.get(1))
                .and_then(|x| x.as_str())?;
            let j = jurisdiction_from_event_topic(topic1)?;
            if let Some(ref want) = j_filter {
                if &j != want {
                    return None;
                }
            }
            Some(VacancyTimelineEventRow {
                event_type,
                block_number,
                log_index,
                tx_hash: tx_hash.map(|h| format!("0x{}", hex::encode(h))),
                jurisdiction: Some(j),
            })
        })
        .collect())
}

#[derive(Clone, Debug, Default)]
pub struct VacancyProjectionStats {
    pub max_block: Option<i64>,
    pub max_log_index: Option<i32>,
    pub jurisdiction_count: i64,
}

pub async fn vacancy_projection_stats(
    pool: &PgPool,
    chain_id: i64,
) -> Result<VacancyProjectionStats, sqlx::Error> {
    let row = sqlx::query_as::<_, (Option<i64>, Option<i32>, i64)>(
        r#"
        SELECT
            MAX(last_block_number),
            MAX(last_log_index),
            COUNT(*)::bigint
        FROM vacancy_ledger_projections
        WHERE chain_id = $1
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;
    Ok(VacancyProjectionStats {
        max_block: row.0,
        max_log_index: row.1,
        jurisdiction_count: row.2,
    })
}

pub async fn count_vacancy_events(pool: &PgPool, chain_id: i64) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint
        FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'VacancyEntered',
            'GraceStarted',
            'SweepExecuted',
            'ReserveReached',
            'StewardActivated',
            'JurisdictionReserveDisbursed'
          )
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await
}

pub async fn latest_vacancy_event_timestamp(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Option<chrono::DateTime<chrono::Utc>>, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT MAX(created_at)
        FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'VacancyEntered',
            'GraceStarted',
            'SweepExecuted',
            'ReserveReached',
            'StewardActivated',
            'JurisdictionReserveDisbursed'
          )
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await
}

#[derive(Clone, Debug)]
pub struct VacancyEventExplorerRow {
    pub event_type: String,
    pub block_number: i64,
    pub log_index: i32,
    pub tx_hash: Option<String>,
    pub jurisdiction: Option<String>,
    pub created_at: String,
    pub topic0: String,
    pub topics: Vec<String>,
    pub data: serde_json::Value,
}

pub async fn list_vacancy_event_explorer(
    pool: &PgPool,
    chain_id: i64,
    jurisdiction: Option<&str>,
    limit: u32,
) -> Result<Vec<VacancyEventExplorerRow>, sqlx::Error> {
    let lim = limit.min(200) as i64;
    let rows = sqlx::query_as::<_, (String, i64, i32, Option<Vec<u8>>, serde_json::Value, chrono::DateTime<chrono::Utc>)>(
        r#"
        SELECT event_type, block_number, log_index, tx_hash, payload, created_at
        FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'VacancyEntered',
            'GraceStarted',
            'SweepExecuted',
            'ReserveReached',
            'StewardActivated',
            'JurisdictionReserveDisbursed'
          )
        ORDER BY block_number DESC, log_index DESC
        LIMIT $2
        "#,
    )
    .bind(chain_id)
    .bind(lim)
    .fetch_all(pool)
    .await?;

    let j_filter = jurisdiction.map(|s| s.trim().to_uppercase());
    Ok(rows
        .into_iter()
        .filter_map(|(event_type, block_number, log_index, tx_hash, payload, created_at)| {
            let topics: Vec<String> = payload
                .get("topics")
                .and_then(|t| t.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|x| x.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default();
            let topic0 = payload
                .get("topic0")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            let topic1 = topics.get(1).map(|s| s.as_str())?;
            let j = jurisdiction_from_event_topic(topic1)?;
            if let Some(ref want) = j_filter {
                if &j != want {
                    return None;
                }
            }
            Some(VacancyEventExplorerRow {
                event_type,
                block_number,
                log_index,
                tx_hash: tx_hash.map(|h| format!("0x{}", hex::encode(h))),
                jurisdiction: Some(j),
                created_at: created_at.to_rfc3339(),
                topic0,
                topics,
                data: payload.get("data").cloned().unwrap_or(serde_json::json!("0x")),
            })
        })
        .collect())
}
