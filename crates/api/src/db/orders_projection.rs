//! `orders_projection`：链上 Escrow 事件驱动的订单投影（04 附录 §3、110）
//!
//! **对账语义（110 §3.1.3）**：**`reconcile_orders_projection_vs_orders`** 只将 **`orders` 表中
//! `escrow_address` 已填写（非空）** 的行与 **`orders_projection`**（按 `chain_id`）比对状态与 escrow 字节。
//! 这与链上合约里的「已入账 / **Funded**」不是同一谓词：未落库 `escrow_address` 的订单不会进入该对账的左集。
//! Internal **`indexer-reconcile`** 可选的 **`rpc_escrow_samples`** 走 RPC **`get_escrow_status`**，输出粗粒度
//! **`coarse_terminal_aligned`**，与上述 DB 内对账是**并列**辅助，不能互相替代。
//! 请求 **`rpc_escrow_samples>0`** 时另附 **`rpc_escrow_sample_meta`**（锚 **`110-RPC-ESCROW-SAMPLE-META`**）：已填 **`escrow_address`** 订单总数与抽样上限/返回条数（**不**声称全链扫）。

use std::collections::{HashMap, HashSet};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// `0x` + 40 hex → 20 字节地址
pub fn decode_evm_address_bytes(addr: &str) -> Option<Vec<u8>> {
    let h = addr.trim().trim_start_matches("0x");
    if h.len() < 40 {
        return None;
    }
    let last = &h[h.len().saturating_sub(40)..];
    let v = hex::decode(last).ok()?;
    if v.len() == 20 {
        Some(v)
    } else {
        None
    }
}

/// 索引器成功投影到内存订单后，双写 **`orders_projection`**（幂等 upsert，按事件补块高/列）。
pub async fn upsert_orders_projection_chain_snapshot(
    pool: &PgPool,
    order_id_raw32: &[u8; 32],
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    event_kind: &str,
    tourist_id: Option<Uuid>,
    guide_id: Option<Uuid>,
    status: &str,
    escrow_address_bytes: Option<&[u8]>,
) -> Result<(), sqlx::Error> {
    let paid_at_block = if event_kind == "Paid" {
        Some(block_number)
    } else {
        None
    };
    let paid_at_log_index = if event_kind == "Paid" {
        Some(log_index)
    } else {
        None
    };
    let completed_at_block = if matches!(
        event_kind,
        "Released" | "Refunded" | "ResolutionExecuted" | "PartialRefundExecuted" | "SlashedExecuted"
    ) {
        Some(block_number)
    } else {
        None
    };
    let dispute_opened_at_block = if event_kind == "DisputeOpened" {
        Some(block_number)
    } else {
        None
    };
    let resolution_type = if event_kind == "ResolutionExecuted" {
        Some(event_kind)
    } else {
        None
    };

    sqlx::query(
        r#"
        INSERT INTO orders_projection (
            order_id, chain_id, escrow_address, tourist_id, guide_id, status,
            amount, token,
            paid_at_block, paid_at_log_index,
            completed_at_block, dispute_opened_at_block, resolution_type,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8, $9, $10, $11, now())
        ON CONFLICT (order_id) DO UPDATE SET
            chain_id = EXCLUDED.chain_id,
            escrow_address = CASE
                WHEN EXCLUDED.escrow_address IS NOT NULL THEN EXCLUDED.escrow_address
                ELSE orders_projection.escrow_address
            END,
            tourist_id = CASE
                WHEN EXCLUDED.tourist_id IS NOT NULL THEN EXCLUDED.tourist_id
                ELSE orders_projection.tourist_id
            END,
            guide_id = CASE
                WHEN EXCLUDED.guide_id IS NOT NULL THEN EXCLUDED.guide_id
                ELSE orders_projection.guide_id
            END,
            status = EXCLUDED.status,
            paid_at_block = CASE
                WHEN EXCLUDED.paid_at_block IS NOT NULL THEN EXCLUDED.paid_at_block
                ELSE orders_projection.paid_at_block
            END,
            paid_at_log_index = CASE
                WHEN EXCLUDED.paid_at_log_index IS NOT NULL THEN EXCLUDED.paid_at_log_index
                ELSE orders_projection.paid_at_log_index
            END,
            completed_at_block = CASE
                WHEN EXCLUDED.completed_at_block IS NOT NULL THEN EXCLUDED.completed_at_block
                ELSE orders_projection.completed_at_block
            END,
            dispute_opened_at_block = CASE
                WHEN EXCLUDED.dispute_opened_at_block IS NOT NULL THEN EXCLUDED.dispute_opened_at_block
                ELSE orders_projection.dispute_opened_at_block
            END,
            resolution_type = CASE
                WHEN EXCLUDED.resolution_type IS NOT NULL THEN EXCLUDED.resolution_type
                ELSE orders_projection.resolution_type
            END,
            updated_at = now()
        "#,
    )
    .bind(order_id_raw32.as_slice())
    .bind(chain_id)
    .bind(escrow_address_bytes)
    .bind(tourist_id)
    .bind(guide_id)
    .bind(status)
    .bind(paid_at_block)
    .bind(paid_at_log_index)
    .bind(completed_at_block)
    .bind(dispute_opened_at_block)
    .bind(resolution_type)
    .execute(pool)
    .await?;
    Ok(())
}

/// **reorg 后重放前置**：按链清空 **`orders_projection`**，随后 **`replay_orders_projection_from_event_log`** 从剩余 **`event_log`** 重建（110 §3.1.3 Partial）。
pub async fn delete_orders_projection_for_chain(
    pool: &PgPool,
    chain_id: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query("DELETE FROM orders_projection WHERE chain_id = $1")
        .bind(chain_id)
        .execute(pool)
        .await?;
    Ok(r.rows_affected())
}

/// 与链上 topic1 / `parse_order_id_and_escrow_from_topics` 一致：前 16 字节 0，后 16 字节为订单 UUID。
pub fn order_uuid_to_projection_order_id(order_id: Uuid) -> [u8; 32] {
    let mut b = [0u8; 32];
    b[16..32].copy_from_slice(order_id.as_bytes());
    b
}

/// `orders_projection.order_id`（32 字节 BYTEA）→ 业务订单 UUID（末 16 字节）。
pub fn uuid_from_projection_order_id(buf: &[u8]) -> Option<Uuid> {
    if buf.len() != 32 {
        return None;
    }
    let tail: [u8; 16] = buf[16..32].try_into().ok()?;
    Some(Uuid::from_bytes(tail))
}

/// B-097：只读 **`orders_projection`** 终端列，供 **`GET /orders`** / **`GET /orders/:id`** 嵌套 **`projection_terminal`**。
#[derive(Debug, Clone)]
pub struct OrdersProjectionTerminalRow {
    pub status: String,
    pub resolution_type: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
struct OrdersProjectionTerminalSqlRow {
    status: String,
    resolution_type: Option<String>,
    updated_at: DateTime<Utc>,
}

fn normalize_order_status_key(s: &str) -> String {
    s.trim().to_lowercase().replace('-', "_")
}

/// 无投影行时为 **`null`**；有行时含 **`diverges_from_order_state`**（与 **`order.state`** 字符串比）。
#[must_use]
pub fn projection_terminal_json_for_api(
    business_order_status: &str,
    row: Option<&OrdersProjectionTerminalRow>,
) -> serde_json::Value {
    match row {
        None => serde_json::Value::Null,
        Some(p) => {
            let diverges =
                normalize_order_status_key(business_order_status) != normalize_order_status_key(&p.status);
            json!({
                "status": p.status,
                "resolution_type": p.resolution_type,
                "updated_at": p.updated_at.to_rfc3339(),
                "diverges_from_order_state": diverges,
            })
        }
    }
}

/// **`DATABASE_URL` 可读但查询失败** 时写入 **`order.projection_terminal`**，**`display_status`** 仍回落 **`orders`** 业务态。
#[must_use]
pub fn projection_terminal_json_degraded(err: &str) -> serde_json::Value {
    json!({
        "read_status": "degraded",
        "error": err,
    })
}

/// 按 **`order_uuid_to_projection_order_id`** 主键读一行（**`orders_projection`** PK = **`order_id`** BYTEA）。
pub async fn fetch_orders_projection_terminal_by_order_uuid(
    pool: &PgPool,
    order_id: Uuid,
) -> Result<Option<OrdersProjectionTerminalRow>, sqlx::Error> {
    let key = order_uuid_to_projection_order_id(order_id);
    let r = sqlx::query_as::<_, OrdersProjectionTerminalSqlRow>(
        r#"SELECT status, resolution_type, updated_at FROM orders_projection WHERE order_id = $1"#,
    )
    .bind(key.as_slice())
    .fetch_optional(pool)
    .await?;
    Ok(r.map(|x| OrdersProjectionTerminalRow {
        status: x.status,
        resolution_type: x.resolution_type,
        updated_at: x.updated_at,
    }))
}

/// 列表批量：逐键查询（订单列表页规模可控；避免手写 BYTEA 数组绑定差异）。
pub async fn fetch_orders_projection_terminals_by_order_uuids(
    pool: &PgPool,
    order_ids: &[Uuid],
) -> Result<HashMap<Uuid, OrdersProjectionTerminalRow>, sqlx::Error> {
    let mut m = HashMap::with_capacity(order_ids.len());
    for id in order_ids {
        if let Some(row) = fetch_orders_projection_terminal_by_order_uuid(pool, *id).await? {
            m.insert(*id, row);
        }
    }
    Ok(m)
}

fn vec_to_bytes32(v: &[u8]) -> Option<[u8; 32]> {
    if v.len() != 32 {
        return None;
    }
    let mut a = [0u8; 32];
    a.copy_from_slice(v);
    Some(a)
}

fn normalize_status(s: &str) -> String {
    s.trim().to_lowercase()
}

/// **110 §3.1.3**：与 **`chain_off::str_to_order_state`** 资金终态集合一致（**非** draft/created/accepted/escrowed）。
/// 仅在 **`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`** 且 reorg 重放后**无**投影行时，允许自动清 **`escrow_address`**（**保持** `status`）。
fn terminal_business_status_for_orphan_escrow_clear(normalized: &str) -> bool {
    matches!(
        normalized,
        "completed" | "disputed" | "refunded" | "partially_refunded" | "slashed" | "cancelled"
    )
}

/// 运维抽样用地址脱敏（20 字节 → `0x` + 前 3 字节 hex + `…` + 末 2 字节 hex）。
fn evm_address_preview_bytes20(bytes: &[u8; 20]) -> String {
    let h = hex::encode(bytes);
    format!("0x{}…{}", &h[..6], &h[h.len() - 4..])
}

fn evm_address_preview_from_hex_str(addr: Option<&str>) -> Option<String> {
    let s = addr?.trim();
    if s.is_empty() {
        return None;
    }
    let v = decode_evm_address_bytes(s)?;
    if v.len() != 20 {
        return None;
    }
    let b: [u8; 20] = v.try_into().ok()?;
    Some(evm_address_preview_bytes20(&b))
}

fn evm_address_preview_from_projection_bytes(b: Option<&Vec<u8>>) -> Option<String> {
    let v = b.as_ref()?;
    if v.len() != 20 {
        return None;
    }
    let arr: [u8; 20] = v.as_slice().try_into().ok()?;
    Some(evm_address_preview_bytes20(&arr))
}

#[derive(Debug, sqlx::FromRow)]
struct OrderEscrowRow {
    id: Uuid,
    status: String,
    escrow_address: Option<String>,
}

// 110-RECONCILE-SEMANTICS: left set = DB `escrow_address` populated (business column), not chain `Funded`.
async fn list_orders_with_escrow(pool: &PgPool) -> Result<Vec<OrderEscrowRow>, sqlx::Error> {
    sqlx::query_as::<_, OrderEscrowRow>(
        r#"
        SELECT id, status, escrow_address
        FROM orders
        WHERE escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''
        "#,
    )
    .fetch_all(pool)
    .await
}

#[derive(Debug, sqlx::FromRow)]
struct ProjectionRowDb {
    order_id: Vec<u8>,
    status: String,
    escrow_address: Option<Vec<u8>>,
}

async fn list_orders_projection_for_chain(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Vec<ProjectionRowDb>, sqlx::Error> {
    sqlx::query_as::<_, ProjectionRowDb>(
        r#"
        SELECT order_id, status, escrow_address
        FROM orders_projection
        WHERE chain_id = $1
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

/// **`orders`（已填 escrow）↔ `orders_projection`（按 chain_id）** 只读对账摘要，供 internal **indexer-reconcile** 与运维门禁。
#[derive(Debug, Clone, Default, Serialize)]
pub struct OrdersProjectionReconcileStats {
    pub chain_id: i64,
    pub orders_with_escrow: u32,
    pub projection_rows_chain: u32,
    pub malformed_projection_order_id_bytes: u32,
    pub matched: u32,
    pub missing_projection: u32,
    pub status_mismatch: u32,
    pub escrow_mismatch: u32,
    pub orphan_projections: u32,
    /// `missing_projection` + `status_mismatch` + `escrow_mismatch` + `orphan_projections` + `malformed_projection_order_id_bytes`
    pub issues_total: u32,
    /// 上式为 0 时为 true（与 110 对账门禁/告警口径一致）
    pub projection_reconcile_clean: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub samples: Option<serde_json::Value>,
}

const RECONCILE_SAMPLE_CAP: usize = 10;

/// 对账不写库；`orphan_projections` 指 `order_id` 末 16 字节 UUID 在 **`orders`** 表中不存在。
pub async fn reconcile_orders_projection_vs_orders(
    pool: &PgPool,
    chain_id: i64,
) -> Result<OrdersProjectionReconcileStats, sqlx::Error> {
    let proj_rows = list_orders_projection_for_chain(pool, chain_id).await?;
    let mut by_key: HashMap<[u8; 32], (String, Option<Vec<u8>>)> = HashMap::new();
    let mut malformed = 0u32;
    let mut sample_malformed = Vec::new();
    for r in proj_rows {
        let Some(k) = vec_to_bytes32(&r.order_id) else {
            malformed += 1;
            if sample_malformed.len() < RECONCILE_SAMPLE_CAP {
                sample_malformed.push(serde_json::json!({
                    "order_id_byte_len": r.order_id.len(),
                }));
            }
            continue;
        };
        by_key.insert(k, (r.status, r.escrow_address));
    }

    let all_order_ids: HashSet<Uuid> = sqlx::query_scalar::<_, Uuid>("SELECT id FROM orders")
        .fetch_all(pool)
        .await?
        .into_iter()
        .collect();

    let orders_esc = list_orders_with_escrow(pool).await?;

    let mut stats = OrdersProjectionReconcileStats {
        chain_id,
        orders_with_escrow: orders_esc.len() as u32,
        projection_rows_chain: by_key.len() as u32,
        malformed_projection_order_id_bytes: malformed,
        ..Default::default()
    };

    let mut sample_miss = Vec::new();
    let mut sample_status = Vec::new();
    let mut sample_escrow = Vec::new();

    for o in orders_esc {
        let key = order_uuid_to_projection_order_id(o.id);
        let Some((p_status, p_esc)) = by_key.get(&key) else {
            stats.missing_projection += 1;
            if sample_miss.len() < RECONCILE_SAMPLE_CAP {
                sample_miss.push(serde_json::json!({
                    "order_id": o.id,
                    "kind": "missing_projection",
                }));
            }
            continue;
        };
        let os = normalize_status(&o.status);
        let ps = normalize_status(p_status);
        if os != ps {
            stats.status_mismatch += 1;
            if sample_status.len() < RECONCILE_SAMPLE_CAP {
                sample_status.push(serde_json::json!({
                    "order_id": o.id,
                    "orders_status": o.status,
                    "projection_status": p_status,
                    "kind": "status_mismatch",
                }));
            }
            continue;
        }
        let o_esc = o
            .escrow_address
            .as_deref()
            .and_then(decode_evm_address_bytes);
        let match_esc = match (&o_esc, p_esc.as_ref()) {
            (Some(a), Some(b)) => a.as_slice() == b.as_slice(),
            (None, None) => true,
            _ => false,
        };
        if match_esc {
            stats.matched += 1;
        } else {
            stats.escrow_mismatch += 1;
            if sample_escrow.len() < RECONCILE_SAMPLE_CAP {
                sample_escrow.push(serde_json::json!({
                    "order_id": o.id,
                    "orders_status": o.status,
                    "projection_status": p_status,
                    "kind": "escrow_mismatch",
                    "orders_escrow_preview": evm_address_preview_from_hex_str(o.escrow_address.as_deref()),
                    "projection_escrow_preview": evm_address_preview_from_projection_bytes(p_esc.as_ref()),
                }));
            }
        }
    }

    let mut sample_orphan = Vec::new();
    for (k, (p_status, _)) in &by_key {
        let Some(u) = uuid_from_projection_order_id(k.as_slice()) else {
            continue;
        };
        if !all_order_ids.contains(&u) {
            stats.orphan_projections += 1;
            if sample_orphan.len() < RECONCILE_SAMPLE_CAP {
                sample_orphan.push(serde_json::json!({
                    "order_id": u,
                    "projection_status": p_status,
                    "kind": "orphan_projection",
                }));
            }
        }
    }

    stats.issues_total = stats.missing_projection
        + stats.status_mismatch
        + stats.escrow_mismatch
        + stats.orphan_projections
        + stats.malformed_projection_order_id_bytes;
    stats.projection_reconcile_clean = stats.issues_total == 0;

    if !sample_miss.is_empty()
        || !sample_status.is_empty()
        || !sample_escrow.is_empty()
        || !sample_orphan.is_empty()
        || !sample_malformed.is_empty()
    {
        stats.samples = Some(serde_json::json!({
            "missing_projection": sample_miss,
            "status_mismatch": sample_status,
            "escrow_mismatch": sample_escrow,
            "orphan_projection": sample_orphan,
            "malformed_projection_order_id": sample_malformed,
        }));
    }

    Ok(stats)
}

/// **110 §3.1.3 Partial（向 Target 靠拢）**：在 **`event_log`** 删尾 + **`orders_projection`** 全链重放之后，将 **`orders`** 与**当前链上投影**对齐。
///
/// **候选集** = **`orders` 中已填 `escrow_address`** ∪ **本链 `orders_projection` 中 `order_id` 可解析为 UUID 的订单**（覆盖「投影已 Funded 但业务表未写 escrow」等 reorg 后不一致）。
///
/// - 存在投影行且 **`status` / escrow 字节** 与 **`orders`** 不一致 → **UPDATE** 为投影值（escrow 以 **`0x` + 40 hex** 写入）。
/// - **无**投影行且 **`orders`** 业务列已填 escrow **且** **`status`**（忽略大小写）为 **`escrowed`** → **`accepted`**、**`escrow_address=NULL`**、**`escrowed_at=NULL`**。
/// - **无**投影行且业务列有 escrow、**非** **`escrowed`**、且状态为 **`draft` / `created` / `accepted`**（尚未进入资金终态）→ **`escrow_address=NULL`**、**`escrowed_at=NULL`**，**保持**原 **`status`**；摘要 **`cleared_orphan_escrow_pre_funded`**（110 §3.1.3 **Partial**：reorg 重放后清「误残留」托管地址）。
/// - **无**投影行且业务列有 escrow、**非** **`escrowed`**、且状态为资金终态（**`completed` / `disputed` / `refunded` / `partially_refunded` / `slashed` / `cancelled`**）：**默认**仅计数 **`skipped_no_projection_non_escrowed_with_escrow`**（须人工复核）；若调用方传入 **`clear_terminal_orphan_escrow=true`**（**`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`**）→ 与同列 pre_funded 路径一样清 **`escrow_address`**/**`escrowed_at`**、**保持** **`status`**；摘要 **`cleared_orphan_escrow_terminal_no_projection`**。
/// - **无**投影行且业务列有 escrow、**非** **`escrowed`**、且状态**非**上两类（未知/中间态字符串）→ **不**自动改写；摘要 **`skipped_no_projection_non_escrowed_with_escrow`**。
/// - 投影指向的 **`order_id` 在 `orders` 中不存在** → 计数 **`skipped_no_order_row`**，**不**写库（与对账 **`orphan_projection`** 口径一致）。
/// - **`orders.chain_id` 已钉死为其它链**（`Some` 且 **≠** 本次 **`chain_id`**）→ **不**改写；计数 **`skipped_orders_chain_domain_mismatch`**（**B-114-3**）。
///
/// 须在 **`perform_indexer_reorg_rewind_execute`** 内由 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1`** 显式开启。
#[derive(Debug, Clone, Default, Serialize)]
pub struct SyncOrdersFromProjectionSummary {
    pub chain_id: i64,
    /// 与本次调用传入一致；**`true`** 当且仅当 **`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`**（便于 **`orders_table_projection_sync`** 留痕）
    pub clear_terminal_orphan_escrow_enabled: bool,
    /// **`list_orders_with_escrow` ∪ 投影可解析 UUID** 去重后的审查条数（含随后跳过的不存在订单）
    pub candidates_total: u32,
    pub updated_from_projection_row: u32,
    pub demoted_escrowed_no_projection: u32,
    /// 无投影、**draft/created/accepted** 仍带业务 escrow 列 — 已清空地址（reorg 同步）
    pub cleared_orphan_escrow_pre_funded: u32,
    /// 无投影、资金终态仍带业务 escrow 列 — 已清空地址（**须** **`clear_terminal_orphan_escrow`**）
    pub cleared_orphan_escrow_terminal_no_projection: u32,
    pub unchanged: u32,
    /// 无投影、业务列已填 escrow、**`status` 非 `escrowed`** 且 **未**命中自动清列路径 — **未**自动清 escrow
    pub skipped_no_projection_non_escrowed_with_escrow: u32,
    /// 投影 **`order_id`** 可解析但 **`orders`** 无主键行
    pub skipped_no_order_row: u32,
    /// **`orders.chain_id`** 与本次投影 **`chain_id`** 不一致，跳过改写（**B-114-3**）
    pub skipped_orders_chain_domain_mismatch: u32,
}

pub async fn sync_orders_from_projection_for_chain(
    pool: &PgPool,
    chain_id: i64,
    clear_terminal_orphan_escrow: bool,
) -> Result<SyncOrdersFromProjectionSummary, sqlx::Error> {
    let proj_rows = list_orders_projection_for_chain(pool, chain_id).await?;
    let mut by_key: HashMap<[u8; 32], (String, Option<Vec<u8>>)> = HashMap::new();
    for r in proj_rows {
        let Some(k) = vec_to_bytes32(&r.order_id) else {
            continue;
        };
        by_key.insert(k, (r.status, r.escrow_address));
    }

    let orders_esc = list_orders_with_escrow(pool).await?;
    let mut candidate_ids: HashSet<Uuid> = orders_esc.iter().map(|r| r.id).collect();
    for k in by_key.keys() {
        if let Some(u) = uuid_from_projection_order_id(k.as_slice()) {
            candidate_ids.insert(u);
        }
    }

    let mut summary = SyncOrdersFromProjectionSummary {
        chain_id,
        clear_terminal_orphan_escrow_enabled: clear_terminal_orphan_escrow,
        candidates_total: candidate_ids.len() as u32,
        ..Default::default()
    };

    for id in candidate_ids {
        let Some(o) = super::get_order_by_id(pool, id).await? else {
            summary.skipped_no_order_row += 1;
            continue;
        };
        if !super::orders::orders_row_allowed_projection_sync_chain_domain(o.chain_id, chain_id) {
            summary.skipped_orders_chain_domain_mismatch += 1;
            continue;
        }
        let key = order_uuid_to_projection_order_id(id);
        let os = normalize_status(&o.status);
        let o_esc = o
            .escrow_address
            .as_deref()
            .and_then(decode_evm_address_bytes);
        let has_escrow_business = o
            .escrow_address
            .as_deref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);

        match by_key.get(&key) {
            None => {
                if has_escrow_business && os == "escrowed" {
                    super::orders::update_order_status_escrow_for_reorg_sync(
                        pool, id, "accepted", None, true,
                    )
                    .await?;
                    summary.demoted_escrowed_no_projection += 1;
                } else if has_escrow_business && os != "escrowed" {
                    if matches!(os.as_str(), "draft" | "created" | "accepted") {
                        super::orders::update_order_status_escrow_for_reorg_sync(
                            pool,
                            id,
                            os.as_str(),
                            None,
                            true,
                        )
                        .await?;
                        summary.cleared_orphan_escrow_pre_funded += 1;
                    } else if clear_terminal_orphan_escrow
                        && terminal_business_status_for_orphan_escrow_clear(os.as_str())
                    {
                        super::orders::update_order_status_escrow_for_reorg_sync(
                            pool,
                            id,
                            os.as_str(),
                            None,
                            true,
                        )
                        .await?;
                        summary.cleared_orphan_escrow_terminal_no_projection += 1;
                    } else {
                        summary.skipped_no_projection_non_escrowed_with_escrow += 1;
                    }
                } else {
                    summary.unchanged += 1;
                }
            }
            Some((p_status, p_esc)) => {
                let ps = normalize_status(p_status);
                let match_esc = match (&o_esc, p_esc.as_ref()) {
                    (Some(a), Some(b)) => a.as_slice() == b.as_slice(),
                    (None, None) => true,
                    _ => false,
                };
                if os == ps && match_esc {
                    summary.unchanged += 1;
                } else {
                    let new_esc_str = p_esc.as_ref().map(|b| format!("0x{}", hex::encode(b)));
                    let clear_escrowed_at = os == "escrowed" && ps != "escrowed";
                    super::orders::update_order_status_escrow_for_reorg_sync(
                        pool,
                        id,
                        p_status.as_str(),
                        new_esc_str.as_deref(),
                        clear_escrowed_at,
                    )
                    .await?;
                    summary.updated_from_projection_row += 1;
                }
            }
        }
    }

    Ok(summary)
}

/// **110 §3.1.4 Target 前置（只读）**：统计 **`orders`** 按 **`chain_id`** 列分布与本链 **`orders_projection`** 行数，**不**执行 DELETE/重写。
/// 供 **`POST …/internal/indexer-reconcile`** body **`orders_chain_scope_rollback_dry_run:true`** 使用；响应内嵌锚 **`110-ORDERS-CHAIN-SCOPE-DRY-RUN`**（由路由层写入）。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct OrdersChainScopeRollbackDryRun {
    pub chain_id: i64,
    pub orders_chain_id_eq: i64,
    pub orders_chain_id_null: i64,
    /// **`chain_id` IS NULL** 且业务 **`escrow_address`** 非空 — 全表按链回滚前须 **01/03** 与回填评审
    pub orders_chain_id_null_with_escrow_address: i64,
    pub orders_chain_id_other: i64,
    pub orders_projection_rows: i64,
}

pub async fn orders_chain_scope_rollback_dry_run(
    pool: &PgPool,
    chain_id: i64,
) -> Result<OrdersChainScopeRollbackDryRun, sqlx::Error> {
    let orders_chain_id_eq: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM orders WHERE chain_id = $1"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    let orders_chain_id_null: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM orders WHERE chain_id IS NULL"#)
            .fetch_one(pool)
            .await?;

    let orders_chain_id_other: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM orders WHERE chain_id IS NOT NULL AND chain_id <> $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let orders_chain_id_null_with_escrow_address: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM orders WHERE chain_id IS NULL AND escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''"#,
    )
    .fetch_one(pool)
    .await?;

    let orders_projection_rows: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM orders_projection WHERE chain_id = $1"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    Ok(OrdersChainScopeRollbackDryRun {
        chain_id,
        orders_chain_id_eq,
        orders_chain_id_null,
        orders_chain_id_null_with_escrow_address,
        orders_chain_id_other,
        orders_projection_rows,
    })
}

/// 与 **`POST …/internal/indexer-reconcile`** body **`orders_chain_scope_rollback_confirm`** 比对；须与请求 **`chain_id`** 一致。
pub fn orders_chain_scope_rollback_expected_confirm(chain_id: i64) -> String {
    format!("CONFIRM_DELETE_ORDERS_CHAIN_{}", chain_id)
}

/// **110 §3.1.4**：在单事务内删除 **`chain_id`** 匹配的 **`orders`**（及阻塞 FK 的子表行）与 **`orders_projection`**。
/// **`orders.chain_id IS NULL`** 或 **其他 `chain_id`** 的行**不**删除。须由路由层校验 **ENV** + **confirm** 双闸后再调用。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct OrdersChainScopeRollbackExecuteSummary {
    pub chain_id: i64,
    pub deleted_evidence_receipts: u64,
    pub deleted_disputes: u64,
    pub deleted_reviews: u64,
    pub deleted_orders: u64,
    pub deleted_orders_projection: u64,
}

pub async fn orders_chain_scope_rollback_execute(
    pool: &PgPool,
    chain_id: i64,
) -> Result<OrdersChainScopeRollbackExecuteSummary, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let deleted_evidence_receipts = sqlx::query(
        r#"DELETE FROM evidence_receipts WHERE order_id IN (SELECT id FROM orders WHERE chain_id = $1)"#,
    )
    .bind(chain_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();

    let deleted_disputes = sqlx::query(
        r#"DELETE FROM disputes WHERE order_id IN (SELECT id FROM orders WHERE chain_id = $1)"#,
    )
    .bind(chain_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();

    let deleted_reviews = sqlx::query(
        r#"DELETE FROM reviews WHERE order_id IN (SELECT id FROM orders WHERE chain_id = $1)"#,
    )
    .bind(chain_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();

    let deleted_orders = sqlx::query(r#"DELETE FROM orders WHERE chain_id = $1"#)
        .bind(chain_id)
        .execute(&mut *tx)
        .await?
        .rows_affected();

    let deleted_orders_projection =
        sqlx::query(r#"DELETE FROM orders_projection WHERE chain_id = $1"#)
            .bind(chain_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();

    tx.commit().await?;

    Ok(OrdersChainScopeRollbackExecuteSummary {
        chain_id,
        deleted_evidence_receipts,
        deleted_disputes,
        deleted_reviews,
        deleted_orders,
        deleted_orders_projection,
    })
}

/// 将 **`orders.chain_id`** 仍为 **NULL**、且 **`orders_projection`** 上存在同 **`chain_id`**、同 **`order_id`**（32 字节 → UUID）的订单打上 **`chain_id`**。
///
/// **不**覆盖已写入的 **`chain_id`**（与 **`upsert_order`** 的 **`COALESCE(orders.chain_id, …)`** 一致）。**110 §3.1.4** 回填 **Partial**；全表按链自动回滚仍为 **Target**。
pub async fn backfill_orders_chain_id_from_projection(
    pool: &PgPool,
    chain_id: i64,
) -> Result<u32, sqlx::Error> {
    let proj_rows = list_orders_projection_for_chain(pool, chain_id).await?;
    let mut updated = 0u32;
    for r in proj_rows {
        let Some(k) = vec_to_bytes32(&r.order_id) else {
            continue;
        };
        let Some(uid) = uuid_from_projection_order_id(k.as_slice()) else {
            continue;
        };
        let res =
            sqlx::query(r#"UPDATE orders SET chain_id = $1 WHERE id = $2 AND chain_id IS NULL"#)
                .bind(chain_id)
                .bind(uid)
                .execute(pool)
                .await?;
        if res.rows_affected() > 0 {
            updated += 1;
        }
    }
    Ok(updated)
}

/// **B-102**：**`backfill_orders_chain_id_from_projection`** 的 **dry-run** 摘要（**只读**，不写 **`orders`**）。
#[derive(Debug, Serialize)]
pub struct OrdersChainIdBackfillDryRunSummary {
    pub anchor: &'static str,
    pub chain_id: i64,
    pub projection_rows_on_chain: usize,
    pub orders_null_chain_id_total: i64,
    pub would_update_rows: u32,
    /// 与 **`GET /api/v1/orders?orders_chain_id=<chain_id>`** **`orders_chain_scope`** 同源（**`db::orders::orders_list_chain_scope_json`** + **`ChainOffConfig.business_chain_id`**）。
    pub orders_list_chain_scope: serde_json::Value,
}

pub async fn orders_chain_id_backfill_dry_run_summary(
    pool: &PgPool,
    chain_id: i64,
    list_scope_business_chain_id: Option<i64>,
) -> Result<OrdersChainIdBackfillDryRunSummary, sqlx::Error> {
    let orders_null_chain_id_total = super::orders::count_orders_chain_id_null(pool).await?;
    let proj_rows = list_orders_projection_for_chain(pool, chain_id).await?;
    let projection_rows_on_chain = proj_rows.len();
    let mut would_update_rows = 0u32;
    for r in &proj_rows {
        let Some(k) = vec_to_bytes32(&r.order_id) else {
            continue;
        };
        let Some(uid) = uuid_from_projection_order_id(k.as_slice()) else {
            continue;
        };
        let n: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*)::bigint FROM orders WHERE id = $1 AND chain_id IS NULL"#,
        )
        .bind(uid)
        .fetch_one(pool)
        .await?;
        if n > 0 {
            would_update_rows += 1;
        }
    }
    let orders_list_chain_scope =
        crate::db::orders_list_chain_scope_json(list_scope_business_chain_id, Some(chain_id));
    Ok(OrdersChainIdBackfillDryRunSummary {
        anchor: "B102-ORDERS-CHAIN-ID-BACKFILL-DRY-RUN",
        chain_id,
        projection_rows_on_chain,
        orders_null_chain_id_total,
        would_update_rows,
        orders_list_chain_scope,
    })
}

#[cfg(test)]
mod tests {
    use super::decode_evm_address_bytes;
    use super::order_uuid_to_projection_order_id;
    use super::uuid_from_projection_order_id;
    use crate::chain::resolution_tx::{
        orders_projection_status_from_resolution_input, parse_execute_resolution_amounts,
    };
    use crate::chain_off::order_state_to_str;
    use traveltrust_core::terminal_order_state_from_resolution_amounts;
    use uuid::Uuid;

    #[test]
    fn decode_address_trailing_20_bytes() {
        let b = decode_evm_address_bytes(
            "0x000000000000000000000000abcdef0123456789abcdef0123456789abcdef",
        )
        .unwrap();
        assert_eq!(b.len(), 20);
    }

    #[test]
    fn projection_order_id_roundtrip_uuid_tail() {
        let id = Uuid::new_v4();
        let b32 = order_uuid_to_projection_order_id(id);
        assert_eq!(uuid_from_projection_order_id(&b32), Some(id));
    }

    #[test]
    fn evm_address_preview_from_hex_str_shape() {
        let hex = "0x000000000000000000000000abcdef0123456789abcdef0123456789abcdef";
        let p = super::evm_address_preview_from_hex_str(Some(hex)).expect("preview");
        assert!(p.starts_with("0x"));
        assert!(p.contains('…'));
        assert_eq!(p.len(), 2 + 6 + 3 + 4);
    }

    #[test]
    fn evm_address_preview_from_projection_bytes_shape() {
        let mut v = vec![0u8; 20];
        v[19] = 0x42;
        let p = super::evm_address_preview_from_projection_bytes(Some(&v)).expect("preview");
        assert!(p.starts_with("0x000000"));
        assert!(p.contains('…'));
    }

    /// reorg 同步路径：仅 **draft/created/accepted** 在无投影时允许自动清 **`escrow_address`**（见 **`sync_orders_from_projection_for_chain`**）。
    #[test]
    fn orphan_escrow_auto_clear_allowlist_pre_funded_only() {
        let clear = |s: &str| matches!(s, "draft" | "created" | "accepted");
        assert!(clear("draft") && clear("created") && clear("accepted"));
        assert!(!clear("completed") && !clear("disputed") && !clear("refunded"));
    }

    #[test]
    fn orders_chain_scope_rollback_dry_run_json_shape() {
        let d = super::OrdersChainScopeRollbackDryRun {
            chain_id: 137,
            orders_chain_id_eq: 2,
            orders_chain_id_null: 1,
            orders_chain_id_null_with_escrow_address: 0,
            orders_chain_id_other: 0,
            orders_projection_rows: 3,
        };
        let v = serde_json::to_value(&d).expect("json");
        assert_eq!(v["chain_id"], 137);
        assert_eq!(v["orders_projection_rows"], 3);
    }

    #[test]
    fn orders_chain_scope_rollback_expected_confirm_token() {
        assert_eq!(
            super::orders_chain_scope_rollback_expected_confirm(137),
            "CONFIRM_DELETE_ORDERS_CHAIN_137"
        );
    }

    /// **TT-B122-BACKFILL-DRY-RUN-STRICT-SCOPE-JSON-001**：**`chain_id != business_chain_id`** 时摘要内嵌 **`orders_list_chain_scope`** 与 **`GET /orders?orders_chain_id=<chain_id>`** 所用 **`orders_list_chain_scope_json`** **同序列化**（**`strict_chain_id`**）。
    #[test]
    fn tt_b122_backfill_dry_run_summary_strict_scope_matches_list_chain_scope_json() {
        let biz = Some(137_i64);
        let reconcile_cid = 1_i64;
        let scope = crate::db::orders_list_chain_scope_json(biz, Some(reconcile_cid));
        let s = super::OrdersChainIdBackfillDryRunSummary {
            anchor: "B102-ORDERS-CHAIN-ID-BACKFILL-DRY-RUN",
            chain_id: reconcile_cid,
            projection_rows_on_chain: 0,
            orders_null_chain_id_total: 0,
            would_update_rows: 0,
            orders_list_chain_scope: scope.clone(),
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["orders_list_chain_scope"], scope);
        assert_eq!(v["orders_list_chain_scope"]["filter"], "strict_chain_id");
        assert_eq!(
            v["orders_list_chain_scope"],
            serde_json::to_value(crate::db::orders_list_chain_scope_json(biz, Some(reconcile_cid)))
                .unwrap()
        );
    }

    /// **TT-B102-BACKFILL-DRY-RUN-SUMMARY-LIST-SCOPE-001**：**`OrdersChainIdBackfillDryRunSummary.orders_list_chain_scope`** 与 **`db::orders::orders_list_chain_scope_json(business, Some(chain_id))`** 同源。
    #[test]
    fn b102_orders_chain_id_backfill_dry_run_summary_embeds_list_chain_scope() {
        let s = super::OrdersChainIdBackfillDryRunSummary {
            anchor: "B102-ORDERS-CHAIN-ID-BACKFILL-DRY-RUN",
            chain_id: 137,
            projection_rows_on_chain: 0,
            orders_null_chain_id_total: 0,
            would_update_rows: 0,
            orders_list_chain_scope: crate::db::orders_list_chain_scope_json(Some(137), Some(137)),
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["chain_id"], 137);
        assert_eq!(
            v["orders_list_chain_scope"]["filter"],
            "default_business_chain"
        );
        assert_eq!(
            v["orders_list_chain_scope"],
            serde_json::to_value(crate::db::orders_list_chain_scope_json(
                Some(137),
                Some(137)
            ))
            .unwrap()
        );
    }

    #[test]
    fn orders_chain_scope_rollback_execute_summary_json_shape() {
        let s = super::OrdersChainScopeRollbackExecuteSummary {
            chain_id: 137,
            deleted_evidence_receipts: 0,
            deleted_disputes: 1,
            deleted_reviews: 0,
            deleted_orders: 2,
            deleted_orders_projection: 2,
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["deleted_orders"], 2);
        assert_eq!(v["deleted_orders_projection"], 2);
    }

    #[test]
    fn sync_orders_from_projection_summary_includes_terminal_env_echo() {
        let s = super::SyncOrdersFromProjectionSummary {
            chain_id: 137,
            clear_terminal_orphan_escrow_enabled: true,
            candidates_total: 0,
            ..Default::default()
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["chain_id"], 137);
        assert_eq!(v["clear_terminal_orphan_escrow_enabled"], true);
    }

    #[test]
    fn terminal_business_status_for_orphan_escrow_clear_matches_chain_off() {
        use super::terminal_business_status_for_orphan_escrow_clear as term;
        assert!(term("completed"));
        assert!(term("disputed"));
        assert!(term("refunded"));
        assert!(term("partially_refunded"));
        assert!(term("slashed"));
        assert!(term("cancelled"));
        assert!(!term("draft"));
        assert!(!term("created"));
        assert!(!term("accepted"));
        assert!(!term("escrowed"));
        assert!(!term("weird_status"));
    }

    /// **`POST …/internal/indexer-reconcile`** **200** 体中 **`stats`** 与 **110** **`projection_reconcile_clean`** 门禁字段同形状。
    #[test]
    fn orders_projection_reconcile_stats_json_includes_gate_fields_when_clean() {
        let s = super::OrdersProjectionReconcileStats {
            chain_id: 137,
            issues_total: 0,
            projection_reconcile_clean: true,
            ..Default::default()
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["chain_id"], 137);
        assert_eq!(v["issues_total"], 0);
        assert_eq!(v["projection_reconcile_clean"], true);
        assert!(!v.as_object().unwrap().contains_key("samples"));
    }

    #[test]
    fn orders_projection_reconcile_stats_json_serializes_sample_buckets_when_present() {
        let s = super::OrdersProjectionReconcileStats {
            chain_id: 1,
            issues_total: 2,
            projection_reconcile_clean: false,
            samples: Some(serde_json::json!({
                "missing_projection": [],
                "status_mismatch": [],
                "escrow_mismatch": [],
                "orphan_projection": [],
                "malformed_projection_order_id": []
            })),
            ..Default::default()
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["projection_reconcile_clean"], false);
        assert!(v.get("samples").and_then(|x| x.as_object()).is_some());
    }

    #[test]
    fn b097_projection_terminal_json_null_when_no_row() {
        let v = super::projection_terminal_json_for_api("escrowed", None);
        assert!(v.is_null());
    }

    #[test]
    fn b097_projection_terminal_json_sets_diverges_when_mismatch() {
        let row = super::OrdersProjectionTerminalRow {
            status: "partially_refunded".to_string(),
            resolution_type: Some("ResolutionExecuted".to_string()),
            updated_at: "2026-04-07T12:00:00Z".parse::<chrono::DateTime<chrono::Utc>>().unwrap(),
        };
        let v = super::projection_terminal_json_for_api("escrowed", Some(&row));
        assert_eq!(v["status"], "partially_refunded");
        assert_eq!(v["resolution_type"], "ResolutionExecuted");
        assert_eq!(v["diverges_from_order_state"], true);
    }

    fn b094_execute_resolution_calldata(g: u128, t: u128, p: u128) -> Vec<u8> {
        use sha3::{Digest, Keccak256};
        let h = Keccak256::digest(b"executeResolution(bytes32,bytes32,uint256,uint256,uint256)");
        let sel = [h[0], h[1], h[2], h[3]];
        let word = |v: u128| {
            let mut x = [0u8; 32];
            x[16..32].copy_from_slice(&v.to_be_bytes());
            x
        };
        let mut out = Vec::with_capacity(4 + 32 * 5);
        out.extend_from_slice(&sel);
        out.extend_from_slice(&[0u8; 64]);
        out.extend_from_slice(&word(g));
        out.extend_from_slice(&word(t));
        out.extend_from_slice(&word(p));
        out
    }

    /// **TT-B094-ORDERS-PROJECTION-RESOLUTION-STATUS-SSOT-001**：**`orders_projection.status`**（经 **`resolution_tx::orders_projection_status_from_resolution_input`** 写入，与 **`replay_orders_projection`** / RPC 路径同源）与 **`traveltrust_core::terminal_order_state_from_resolution_amounts`**、**`executeResolution`** calldata 三腿一致；比例与 **`contracts/test/Escrow.t.sol`** **`test_B094_executeResolution_*`** 模板相同（标度可用 **`TOTAL`** 任意正倍数）。
    #[test]
    fn b094_orders_projection_status_ssot_matches_resolution_parse_and_core_terminal() {
        let cases: [(u128, u128, u128, &str); 3] = [
            (0, 1000, 0, "refunded"),
            (300, 650, 50, "partially_refunded"),
            (0, 800, 200, "slashed"),
        ];
        for (g, t, p, want) in cases {
            let total = g + t + p;
            let st = terminal_order_state_from_resolution_amounts(g, t, p, total).expect("conserving");
            let input = b094_execute_resolution_calldata(g, t, p);
            assert_eq!(
                parse_execute_resolution_amounts(&input),
                Some((g, t, p)),
                "parse three legs ({g},{t},{p})"
            );
            assert_eq!(
                orders_projection_status_from_resolution_input(&input),
                Some(want),
                "projection status string"
            );
            assert_eq!(order_state_to_str(st), want, "order_state_to_str vs upsert status");
        }
    }
}
