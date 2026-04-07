//! 链事件 append-only 表 `event_log` 与索引器 checkpoint `checkpoints_sharded`（04 附录 §1～§2、110）

use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use sqlx::types::Json;

/// `checkpoints_sharded.consumer_id`，与内存 indexer 进度对齐（`internal::indexer_tick`）
pub const INDEXER_CHECKPOINT_CONSUMER_ID: &str = "traveltrust_indexer_tick_v1";

/// 解析 32 字节以太坊 `blockHash` / `transactionHash`（0x 前缀十六进制）
pub fn decode_eth_hash_bytes(s: &str) -> Option<Vec<u8>> {
    let s = s.trim().trim_start_matches("0x");
    if s.is_empty() {
        return None;
    }
    let b = hex::decode(s).ok()?;
    if b.len() == 32 {
        Some(b)
    } else {
        None
    }
}

pub fn event_type_label(topic0: &str, resolved_name: Option<&str>) -> String {
    if let Some(n) = resolved_name {
        if !n.is_empty() {
            return n.to_string();
        }
    }
    let t = topic0.trim();
    if t.len() > 200 {
        format!("topic0:{}", &t[..200])
    } else {
        t.to_string()
    }
}

/// 幂等插入；`(chain_id, block_number, log_index)` 已存在则忽略。
pub async fn insert_event_log(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &[u8],
    tx_hash: &[u8],
    event_type: &str,
    payload: &serde_json::Value,
    finality_n_used: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO event_log (
            chain_id, block_number, block_hash, tx_hash, log_index, event_type, payload, finality_n_used
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(chain_id)
    .bind(block_number)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(log_index)
    .bind(event_type)
    .bind(Json(payload))
    .bind(finality_n_used)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn upsert_indexer_checkpoint(
    pool: &PgPool,
    consumer_id: &str,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO checkpoints_sharded (consumer_id, chain_id, block_number, log_index)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (consumer_id, chain_id) DO UPDATE SET
            block_number = EXCLUDED.block_number,
            log_index = EXCLUDED.log_index,
            updated_at = now()
        "#,
    )
    .bind(consumer_id)
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .execute(pool)
    .await?;
    Ok(())
}

/// 读取 **`checkpoints_sharded`** 中本 consumer/链的 **`(block_number, log_index)`**；无行则 **`None`**（与 **internal indexer-reconcile** 内存对齐配套，110 §3.1.4）。
pub async fn fetch_indexer_checkpoint_for_chain(
    pool: &PgPool,
    consumer_id: &str,
    chain_id: i64,
) -> Result<Option<(i64, i32)>, sqlx::Error> {
    sqlx::query_as::<_, (i64, i32)>(
        r#"
        SELECT block_number, log_index
        FROM checkpoints_sharded
        WHERE consumer_id = $1 AND chain_id = $2
        "#,
    )
    .bind(consumer_id)
    .bind(chain_id)
    .fetch_optional(pool)
    .await
}

/// **reorg 回滚**：删除 **`block_number >= from_block_inclusive`** 的 `event_log` 行（与 **internal indexer-reorg-rewind** 配套，110 §3.1.3 Partial）。
pub async fn delete_event_log_from_block(
    pool: &PgPool,
    chain_id: i64,
    from_block_inclusive: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query("DELETE FROM event_log WHERE chain_id = $1 AND block_number >= $2")
        .bind(chain_id)
        .bind(from_block_inclusive)
        .execute(pool)
        .await?;
    Ok(r.rows_affected())
}

/// Escrow 相关、可参与 **`orders_projection`** 回放的 `event_log` 行（按块序扫描）。
#[derive(Debug, sqlx::FromRow)]
pub struct EventLogEscrowProjectionRow {
    pub chain_id: i64,
    pub block_number: i64,
    pub log_index: i32,
    pub event_type: String,
    pub payload: Json<serde_json::Value>,
    /// 与 **`insert_event_log`** 同源；**`ResolutionExecuted`** 回放时用于拉 **`eth_getTransactionByHash`**。
    pub tx_hash: Option<Vec<u8>>,
}

/// 与 **`topics[1]`** 末 **32** 个十六进制字符（订单 **UUID** **16** 字节）匹配的、该订单**最近一条** Escrow 类 `event_log` 行（**110 §3.3** 读模型；**702** 增补 **`tx_hash`****/**`block_hash`**）。
#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct EscrowEventFinalitySnapshot {
    pub finality_n_used: i32,
    pub block_number: i64,
    pub log_index: i32,
    pub event_type: String,
    pub tx_hash: Option<String>,
    pub block_hash: Option<String>,
}

/// **722**：**`chain_sync.event_log_snapshot`** JSON 对象顶层键顺序（与 **`escrow_event_finality_snapshot_to_json`** **插入顺序** **同源**；**702** **`tx_hash`****/**`block_hash`**）。
pub const EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS: &[&str] = &[
    "finality_n_used",
    "block_number",
    "log_index",
    "event_type",
    "tx_hash",
    "block_hash",
];

/// **`GET …/orders/:id/chain-sync-status`** 之 **`chain_sync.event_log_snapshot`**（与路由层 **702** 同形）。
/// 键序与 **`EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS`** 一致；**`traveltrust-api`** **`serde_json`** 启用 **`preserve_order`**，插入序即序列化序（**722**）。
pub fn escrow_event_finality_snapshot_to_json(
    row: &EscrowEventFinalitySnapshot,
) -> serde_json::Value {
    let mut m = serde_json::Map::with_capacity(6);
    m.insert(
        "finality_n_used".into(),
        serde_json::json!(row.finality_n_used),
    );
    m.insert("block_number".into(), serde_json::json!(row.block_number));
    m.insert("log_index".into(), serde_json::json!(row.log_index));
    m.insert("event_type".into(), serde_json::json!(row.event_type));
    m.insert("tx_hash".into(), serde_json::json!(row.tx_hash));
    m.insert("block_hash".into(), serde_json::json!(row.block_hash));
    serde_json::Value::Object(m)
}

pub async fn latest_escrow_event_finality_for_order(
    pool: &PgPool,
    chain_id: i64,
    order_id: uuid::Uuid,
) -> Result<Option<EscrowEventFinalitySnapshot>, sqlx::Error> {
    let order_hex = hex::encode(order_id.as_bytes());
    sqlx::query_as::<_, EscrowEventFinalitySnapshot>(
        r#"
        SELECT
            finality_n_used,
            block_number,
            log_index,
            event_type,
            CASE
                WHEN tx_hash IS NULL THEN NULL
                ELSE ('0x' || encode(tx_hash, 'hex'))
            END AS tx_hash,
            CASE
                WHEN block_hash IS NULL THEN NULL
                ELSE ('0x' || encode(block_hash, 'hex'))
            END AS block_hash
        FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'EscrowCreated',
            'Paid',
            'DisputeOpened',
            'Released',
            'Refunded',
            'ResolutionExecuted',
            'PartialRefundExecuted',
            'SlashedExecuted'
          )
          AND LENGTH(REGEXP_REPLACE(COALESCE(payload->'topics'->>1, ''), '^0x', '', 'i')) >= 32
          AND LOWER(RIGHT(REGEXP_REPLACE(COALESCE(payload->'topics'->>1, ''), '^0x', '', 'i'), 32)) = $2
        ORDER BY block_number DESC, log_index DESC
        LIMIT 1
        "#,
    )
    .bind(chain_id)
    .bind(order_hex)
    .fetch_optional(pool)
    .await
}

/// **110 §3.1.4 Target 前置（只读）**：按链统计 **`event_log`**、**`checkpoints_sharded`**、**`fee_router_routed_events`**、**`region_vault_forwarded_events`** 行数；**不** DELETE。
/// 供 **`POST …/internal/indexer-reconcile`** body **`event_log_chain_scope_rollback_dry_run:true`**；响应锚 **`110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN`**（路由层写入）。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct EventLogChainScopeRollbackDryRun {
    pub chain_id: i64,
    pub event_log_rows: i64,
    pub checkpoints_sharded_rows: i64,
    pub fee_router_routed_events_rows: i64,
    pub region_vault_forwarded_events_rows: i64,
}

pub async fn event_log_chain_scope_rollback_dry_run(
    pool: &PgPool,
    chain_id: i64,
) -> Result<EventLogChainScopeRollbackDryRun, sqlx::Error> {
    let event_log_rows: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM event_log WHERE chain_id = $1"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    let checkpoints_sharded_rows: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM checkpoints_sharded WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let fee_router_routed_events_rows: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM fee_router_routed_events WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let region_vault_forwarded_events_rows: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM region_vault_forwarded_events WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    Ok(EventLogChainScopeRollbackDryRun {
        chain_id,
        event_log_rows,
        checkpoints_sharded_rows,
        fee_router_routed_events_rows,
        region_vault_forwarded_events_rows,
    })
}

pub fn event_log_chain_scope_rollback_expected_confirm(chain_id: i64) -> String {
    format!("CONFIRM_DELETE_EVENT_LOG_CHAIN_{}", chain_id)
}

/// 单事务删除本链 **`event_log`**、**`checkpoints_sharded`**、**`fee_router_routed_events`**、**`region_vault_forwarded_events`**。**不**改 **`orders`** / 进程内 indexer 内存 checkpoint（须重启或另行 **tick** 对齐 **110**）。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct EventLogChainScopeRollbackExecuteSummary {
    pub chain_id: i64,
    pub deleted_event_log: u64,
    pub deleted_checkpoints_sharded: u64,
    pub deleted_fee_router_routed_events: u64,
    pub deleted_region_vault_forwarded_events: u64,
}

pub async fn event_log_chain_scope_rollback_execute(
    pool: &PgPool,
    chain_id: i64,
) -> Result<EventLogChainScopeRollbackExecuteSummary, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let deleted_event_log = sqlx::query(r#"DELETE FROM event_log WHERE chain_id = $1"#)
        .bind(chain_id)
        .execute(&mut *tx)
        .await?
        .rows_affected();

    let deleted_checkpoints_sharded =
        sqlx::query(r#"DELETE FROM checkpoints_sharded WHERE chain_id = $1"#)
            .bind(chain_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();

    let deleted_fee_router_routed_events =
        sqlx::query(r#"DELETE FROM fee_router_routed_events WHERE chain_id = $1"#)
            .bind(chain_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();

    let deleted_region_vault_forwarded_events =
        sqlx::query(r#"DELETE FROM region_vault_forwarded_events WHERE chain_id = $1"#)
            .bind(chain_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();

    tx.commit().await?;

    Ok(EventLogChainScopeRollbackExecuteSummary {
        chain_id,
        deleted_event_log,
        deleted_checkpoints_sharded,
        deleted_fee_router_routed_events,
        deleted_region_vault_forwarded_events,
    })
}

/// **`event_log` 内已持久化的 Escrow 类事件**与 **`orders_projection`** 去重地址计数（**本链 `chain_id`**）。
/// 供 **`POST …/internal/indexer-reconcile`** body **`include_event_log_escrow_coverage:true`**；响应锚 **`110-EVENT-LOG-ESCROW-COVERAGE`**。
/// **不**扫描链上全集，仅 **DB 已索引行**（与 **110** 全量链上扫链 **Target** 区分）。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct EventLogEscrowCoverageStats {
    pub chain_id: i64,
    pub escrow_class_event_rows: i64,
    pub escrow_created_rows: i64,
    pub distinct_escrow_address_from_escrow_created: i64,
    pub orders_projection_rows: i64,
    pub orders_projection_distinct_escrow_non_null: i64,
}

pub async fn event_log_escrow_coverage_stats(
    pool: &PgPool,
    chain_id: i64,
) -> Result<EventLogEscrowCoverageStats, sqlx::Error> {
    let escrow_class_event_rows: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'EscrowCreated',
            'Paid',
            'DisputeOpened',
            'Released',
            'Refunded',
            'ResolutionExecuted',
            'PartialRefundExecuted',
            'SlashedExecuted'
          )
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let escrow_created_rows: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM event_log WHERE chain_id = $1 AND event_type = 'EscrowCreated'"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    let distinct_escrow_address_from_escrow_created: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(DISTINCT addr)::bigint FROM (
            SELECT LOWER(
                CONCAT(
                    '0x',
                    RIGHT(
                        REGEXP_REPLACE(COALESCE(payload->'topics'->>2, ''), '^0x', '', 'i'),
                        40
                    )
                )
            ) AS addr
            FROM event_log
            WHERE chain_id = $1
              AND event_type = 'EscrowCreated'
              AND LENGTH(REGEXP_REPLACE(COALESCE(payload->'topics'->>2, ''), '^0x', '', 'i')) >= 40
        ) t
        WHERE addr IS NOT NULL AND addr <> ''
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let orders_projection_rows: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM orders_projection WHERE chain_id = $1"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    let orders_projection_distinct_escrow_non_null: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(DISTINCT escrow_address)::bigint FROM orders_projection WHERE chain_id = $1 AND escrow_address IS NOT NULL"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    Ok(EventLogEscrowCoverageStats {
        chain_id,
        escrow_class_event_rows,
        escrow_created_rows,
        distinct_escrow_address_from_escrow_created,
        orders_projection_rows,
        orders_projection_distinct_escrow_non_null,
    })
}

pub async fn list_event_log_escrow_projection_rows(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Vec<EventLogEscrowProjectionRow>, sqlx::Error> {
    sqlx::query_as::<_, EventLogEscrowProjectionRow>(
        r#"
        SELECT chain_id, block_number, log_index, event_type, payload, tx_hash
        FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'EscrowCreated',
            'Paid',
            'DisputeOpened',
            'Released',
            'Refunded',
            'ResolutionExecuted',
            'PartialRefundExecuted',
            'SlashedExecuted'
          )
        ORDER BY block_number ASC, log_index ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

/// Governor 类事件（**B-089 Completion**），供 **`replay_governance_proposals_from_event_log`** 使用。
pub async fn list_event_log_governance_projection_rows(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Vec<EventLogEscrowProjectionRow>, sqlx::Error> {
    sqlx::query_as::<_, EventLogEscrowProjectionRow>(
        r#"
        SELECT chain_id, block_number, log_index, event_type, payload, tx_hash
        FROM event_log
        WHERE chain_id = $1
          AND event_type IN (
            'ProposalCreated',
            'VoteCast',
            'ProposalQueued',
            'ProposalExecuted',
            'ProposalCanceled'
          )
        ORDER BY block_number ASC, log_index ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::postgres::PgPoolOptions;
    use std::time::Duration;

    #[tokio::test]
    async fn insert_event_log_returns_err_on_dead_pool() {
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_millis(500))
            .connect_lazy("postgres://nouser:nopass@127.0.0.1:1/traveltrust_test_gate")
            .expect("lazy pool");
        let bh = vec![1u8; 32];
        let th = vec![2u8; 32];
        let payload = serde_json::json!({});
        let err = insert_event_log(&pool, 137, 1, 0, &bh, &th, "Deposited", &payload, 12)
            .await
            .expect_err("dead port should fail SQL");
        assert!(
            !err.to_string().is_empty(),
            "sqlx error should carry message for handler detail"
        );
    }

    #[tokio::test]
    async fn upsert_indexer_checkpoint_returns_err_on_dead_pool() {
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_millis(500))
            .connect_lazy("postgres://nouser:nopass@127.0.0.1:1/traveltrust_test_gate")
            .expect("lazy pool");
        let err = upsert_indexer_checkpoint(&pool, INDEXER_CHECKPOINT_CONSUMER_ID, 137, 1, 0)
            .await
            .expect_err("dead port should fail SQL");
        assert!(
            !err.to_string().is_empty(),
            "sqlx error should carry message for handler detail"
        );
    }

    #[test]
    fn escrow_event_finality_snapshot_to_json_includes_hashes_702() {
        let row = EscrowEventFinalitySnapshot {
            finality_n_used: 12,
            block_number: 100,
            log_index: 3,
            event_type: "Paid".to_string(),
            tx_hash: Some("0xabcd".to_string()),
            block_hash: Some("0xef01".to_string()),
        };
        let v = escrow_event_finality_snapshot_to_json(&row);
        assert_eq!(v["finality_n_used"], 12);
        assert_eq!(v["block_number"], 100);
        assert_eq!(v["log_index"], 3);
        assert_eq!(v["event_type"], "Paid");
        assert_eq!(v["tx_hash"], "0xabcd");
        assert_eq!(v["block_hash"], "0xef01");
    }

    #[test]
    fn escrow_event_finality_snapshot_json_key_order_matches_ssot_722() {
        let row = EscrowEventFinalitySnapshot {
            finality_n_used: 1,
            block_number: 2,
            log_index: 3,
            event_type: "Paid".to_string(),
            tx_hash: None,
            block_hash: None,
        };
        let v = escrow_event_finality_snapshot_to_json(&row);
        let keys: Vec<&str> = v
            .as_object()
            .expect("snapshot json object")
            .keys()
            .map(|s| s.as_str())
            .collect();
        assert_eq!(keys, super::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS);
    }

    #[test]
    fn event_log_escrow_coverage_stats_json_shape() {
        let st = EventLogEscrowCoverageStats {
            chain_id: 137,
            escrow_class_event_rows: 12,
            escrow_created_rows: 3,
            distinct_escrow_address_from_escrow_created: 2,
            orders_projection_rows: 5,
            orders_projection_distinct_escrow_non_null: 4,
        };
        let v = serde_json::to_value(&st).unwrap();
        assert_eq!(v["chain_id"], 137);
        assert_eq!(v["escrow_class_event_rows"], 12);
        assert_eq!(v["distinct_escrow_address_from_escrow_created"], 2);
    }

    #[test]
    fn decode_eth_hash_accepts_0x_prefix() {
        let h = "0x".to_string() + &"ab".repeat(32);
        let b = decode_eth_hash_bytes(&h).unwrap();
        assert_eq!(b.len(), 32);
        assert_eq!(b[0], 0xab);
    }

    #[test]
    fn decode_eth_hash_rejects_short() {
        assert!(decode_eth_hash_bytes("0x00").is_none());
    }

    #[test]
    fn event_type_label_uses_resolved() {
        assert_eq!(event_type_label("0xdead", Some("Deposited")), "Deposited");
    }

    #[test]
    fn topic1_suffix_matches_uuid_hex() {
        let id = uuid::Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        let suffix = hex::encode(id.as_bytes());
        let topic = format!("0x00000000000000000000000000000000{suffix}");
        let stripped = topic.trim_start_matches("0x");
        assert!(stripped.len() >= 32);
        let last = &stripped[stripped.len() - 32..];
        assert_eq!(last.to_ascii_lowercase(), suffix);
    }

    #[test]
    fn event_log_chain_scope_rollback_dry_run_json_shape() {
        let d = super::EventLogChainScopeRollbackDryRun {
            chain_id: 137,
            event_log_rows: 10,
            checkpoints_sharded_rows: 1,
            fee_router_routed_events_rows: 2,
            region_vault_forwarded_events_rows: 0,
        };
        let v = serde_json::to_value(&d).expect("json");
        assert_eq!(v["chain_id"], 137);
        assert_eq!(v["event_log_rows"], 10);
    }

    #[test]
    fn event_log_chain_scope_rollback_expected_confirm_token() {
        assert_eq!(
            super::event_log_chain_scope_rollback_expected_confirm(137),
            "CONFIRM_DELETE_EVENT_LOG_CHAIN_137"
        );
    }

    #[test]
    fn event_log_chain_scope_rollback_execute_summary_json_shape() {
        let s = super::EventLogChainScopeRollbackExecuteSummary {
            chain_id: 137,
            deleted_event_log: 5,
            deleted_checkpoints_sharded: 1,
            deleted_fee_router_routed_events: 2,
            deleted_region_vault_forwarded_events: 0,
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["deleted_event_log"], 5);
    }
}
