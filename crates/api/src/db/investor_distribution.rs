//! 应计分红分录（B-086 / **TT-B086-INVESTOR-DISTRIBUTION-ACCRUAL-001**）：幂等 **`idempotency_key`** + 快照块 **`pro_rata`** 分配（**`allocate_pro_rata_accruals`** = **`pro_rata_share_balance_at_snapshot`**）；**B-088** 快照钉死常量（**`SNAPSHOT_*`** / **`B088_ANCHOR`**）供 API **`snapshot_binding`** 引用
//!
//! **B-115-3**：**`registerAccrual`** 链下登记视图（与 **`InvestorDistributionClaim`** 头注释 **`distributionId`↔UUID** 对齐）；**不**调用链上。

use chrono::{DateTime, Utc};
use num_bigint::BigUint;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, zero_word};

/// 与 **`POST …/internal/investor-distribution-accrual`** 实现钉死一致（母表 B-086）
pub const CASH_BASIS: &str = "fee_router_allocatable_platform_fee_sum";
/// **`amount_u256_hex`** 在 84/B-084 语义下为 **可分配平台费**（路由后进入池的累计）
pub const FORMULA: &str = "pro_rata_share_balance_at_snapshot";

// —— 母表 B-088：未决分红与 **转让** 的 **单一冻结块**（与 `list_investor_share_transfers_up_to_block` 一致）
/// **`snapshot_block_number`**：**含该块** 内全部 `Transfer` 行参与余额重放
pub const SNAPSHOT_BLOCK_BINDING: &str = "inclusive_upto_snapshot_block";
/// 与 SQL **`ORDER BY block_number ASC, log_index ASC`** 一致
pub const SNAPSHOT_TRANSFER_REPLAY_ORDER: &str = "block_number_asc_log_index_asc";
/// 持有人集合主投影：**ERC20 `Transfer`**；**`STAKING_ADDRESS`** 非空时叠加 **`investor_stake_state_events`** 质押归因（**101**）；**`INVESTOR_LOCK_CONTRACT_ADDRESSES`** 非空时于质押之后再叠 **`investor_lock_state_events`**（**112**）
pub const SNAPSHOT_ELIGIBILITY_PROJECTION: &str = "investor_share_transfer_events";
pub const B088_ANCHOR: &str = "B-088-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER";

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InvestorDistributionAccrualRow {
    pub id: Uuid,
    pub idempotency_key: String,
    pub chain_id: i64,
    pub token_address: String,
    pub snapshot_block_number: i64,
    pub cash_basis: String,
    pub formula: String,
    pub total_cash_u256_hex: String,
    pub total_supply_u256_hex: String,
    pub distributed_sum_u256_hex: String,
    pub remainder_u256_hex: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InvestorDistributionAccrualLineRow {
    pub distribution_id: Uuid,
    pub holder_address: String,
    pub balance_snapshot_u256_hex: String,
    pub accrual_u256_hex: String,
}

fn u256_hex_to_biguint(s: &str) -> Option<BigUint> {
    let w = parse_u256_word_hex(s)?;
    Some(BigUint::from_bytes_be(&w))
}

fn biguint_to_u256_hex(b: &BigUint) -> String {
    let bytes = b.to_bytes_be();
    let mut word = [0u8; 32];
    let n = bytes.len().min(32);
    if n > 0 {
        word[32 - n..].copy_from_slice(&bytes[bytes.len() - n..]);
    }
    fmt_word_hex(&word)
}

/// **`accrual_i = floor(cash * balance_i / supply)`**；**`remainder = cash - Σ accrual`**
pub fn allocate_pro_rata_accruals(
    total_cash_hex: &str,
    holders: &[(String, String)],
    total_supply_hex: &str,
) -> Result<(Vec<(String, String, String)>, String, String), &'static str> {
    let cash = u256_hex_to_biguint(total_cash_hex).ok_or("invalid_total_cash_hex")?;
    let supply = u256_hex_to_biguint(total_supply_hex).ok_or("invalid_total_supply_hex")?;
    if supply == BigUint::from(0u8) {
        return Err("total_supply_zero");
    }

    let mut lines: Vec<(String, String, String)> = Vec::with_capacity(holders.len());
    let mut sum_accrual = BigUint::from(0u8);

    for (addr, bal_hex) in holders {
        let bal = u256_hex_to_biguint(bal_hex).ok_or("invalid_balance_hex")?;
        let acc = (&cash * &bal) / &supply;
        sum_accrual += &acc;
        lines.push((
            addr.clone(),
            bal_hex.clone(),
            biguint_to_u256_hex(&acc),
        ));
    }

    if sum_accrual > cash {
        return Err("accrual_sum_exceeds_cash");
    }
    let distributed_hex = biguint_to_u256_hex(&sum_accrual);
    let remainder = cash - sum_accrual;
    Ok((lines, distributed_hex, biguint_to_u256_hex(&remainder)))
}

/// Σ **`amount_u256_hex`**（FeeRouter 投影），**`block_number <= max_block`**
pub async fn sum_fee_router_amount_upto_block_hex(
    pool: &PgPool,
    chain_id: i64,
    token_address: &str,
    max_block_inclusive: i64,
) -> Result<String, sqlx::Error> {
    let token_l = token_address.trim().to_lowercase();
    let rows: Vec<(String,)> = sqlx::query_as(
        r#"
        SELECT amount_u256_hex
        FROM fee_router_routed_events
        WHERE chain_id = $1
          AND LOWER(token_address) = $2
          AND block_number <= $3
        ORDER BY block_number ASC, log_index ASC
        "#,
    )
    .bind(chain_id)
    .bind(&token_l)
    .bind(max_block_inclusive)
    .fetch_all(pool)
    .await?;

    let mut acc = zero_word();
    for (h,) in rows {
        let Some(w) = parse_u256_word_hex(&h) else {
            continue;
        };
        add_assign_be(&mut acc, &w).map_err(|_| {
            sqlx::Error::Protocol("fee_router amount sum overflow".into())
        })?;
    }
    Ok(fmt_word_hex(&acc))
}

/// 与 **`InvestorDistributionClaim`** 头注释一致：将 **`Uuid` 的 128 位**置于 **`bytes32` 低 128 位**（高 128 位 **0**），供链上 **`distributionId`** / **`registerAccrual`** 对读。
pub fn distribution_uuid_to_bytes32_hex_for_claim(id: Uuid) -> String {
    let u = id.as_u128();
    let mut word = [0u8; 32];
    word[16..32].copy_from_slice(&u.to_be_bytes());
    fmt_word_hex(&word)
}

pub async fn get_investor_distribution_accrual_line(
    pool: &PgPool,
    distribution_id: Uuid,
    holder_address: &str,
) -> Result<Option<InvestorDistributionAccrualLineRow>, sqlx::Error> {
    let h = holder_address.trim().to_lowercase();
    sqlx::query_as::<_, InvestorDistributionAccrualLineRow>(
        r#"
        SELECT distribution_id, holder_address, balance_snapshot_u256_hex, accrual_u256_hex
        FROM investor_distribution_accrual_lines
        WHERE distribution_id = $1 AND LOWER(holder_address) = $2
        "#,
    )
    .bind(distribution_id)
    .bind(h)
    .fetch_optional(pool)
    .await
}

pub async fn get_distribution_by_idempotency_key(
    pool: &PgPool,
    key: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    let id: Option<Uuid> = sqlx::query_scalar(
        r#"SELECT id FROM investor_distribution_accruals WHERE idempotency_key = $1"#,
    )
    .bind(key)
    .fetch_optional(pool)
    .await?;
    Ok(id)
}

pub async fn list_distribution_lines(
    pool: &PgPool,
    distribution_id: Uuid,
) -> Result<Vec<InvestorDistributionAccrualLineRow>, sqlx::Error> {
    sqlx::query_as::<_, InvestorDistributionAccrualLineRow>(
        r#"
        SELECT distribution_id, holder_address, balance_snapshot_u256_hex, accrual_u256_hex
        FROM investor_distribution_accrual_lines
        WHERE distribution_id = $1
        ORDER BY holder_address ASC
        "#,
    )
    .bind(distribution_id)
    .fetch_all(pool)
    .await
}

pub async fn get_distribution_header(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<InvestorDistributionAccrualRow>, sqlx::Error> {
    sqlx::query_as::<_, InvestorDistributionAccrualRow>(
        r#"
        SELECT id, idempotency_key, chain_id, token_address, snapshot_block_number,
               cash_basis, formula, total_cash_u256_hex, total_supply_u256_hex,
               distributed_sum_u256_hex, remainder_u256_hex, created_at
        FROM investor_distribution_accruals
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn list_recent_distributions(
    pool: &PgPool,
    chain_id: Option<i64>,
    limit: i64,
) -> Result<Vec<InvestorDistributionAccrualRow>, sqlx::Error> {
    sqlx::query_as::<_, InvestorDistributionAccrualRow>(
        r#"
        SELECT id, idempotency_key, chain_id, token_address, snapshot_block_number,
               cash_basis, formula, total_cash_u256_hex, total_supply_u256_hex,
               distributed_sum_u256_hex, remainder_u256_hex, created_at
        FROM investor_distribution_accruals
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(chain_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// 插入头 + 行；**`idempotency_key`** 冲突时调用方应先查重
pub async fn insert_distribution_with_lines(
    pool: &PgPool,
    idempotency_key: &str,
    chain_id: i64,
    token_address: &str,
    snapshot_block_number: i64,
    total_cash_u256_hex: &str,
    total_supply_u256_hex: &str,
    distributed_sum_u256_hex: &str,
    remainder_u256_hex: &str,
    lines: &[(String, String, String)],
) -> Result<Uuid, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO investor_distribution_accruals (
            idempotency_key, chain_id, token_address, snapshot_block_number,
            cash_basis, formula, total_cash_u256_hex, total_supply_u256_hex,
            distributed_sum_u256_hex, remainder_u256_hex
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
        "#,
    )
    .bind(idempotency_key)
    .bind(chain_id)
    .bind(token_address)
    .bind(snapshot_block_number)
    .bind(CASH_BASIS)
    .bind(FORMULA)
    .bind(total_cash_u256_hex)
    .bind(total_supply_u256_hex)
    .bind(distributed_sum_u256_hex)
    .bind(remainder_u256_hex)
    .fetch_one(&mut *tx)
    .await?;

    for (holder, bal_hex, acc_hex) in lines {
        sqlx::query(
            r#"
            INSERT INTO investor_distribution_accrual_lines (
                distribution_id, holder_address, balance_snapshot_u256_hex, accrual_u256_hex
            )
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(id)
        .bind(holder)
        .bind(bal_hex)
        .bind(acc_hex)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use num_bigint::BigUint;

    /// **TT-B086-PRO-RATA-FLOOR-SNAPSHOT-001**：每行 **`accrual_i = floor(cash * balance_i / supply)`**；与 **`POST …/internal/investor-distribution-accrual`** 写入行同源。
    #[test]
    fn b086_allocate_each_line_is_floor_cash_times_balance_over_supply() {
        let cash = u256_hex_to_biguint(
            "0x0000000000000000000000000000000000000000000000000000000000002710",
        )
        .unwrap();
        let supply = u256_hex_to_biguint(
            "0x00000000000000000000000000000000000000000000000000000000000003e8",
        )
        .unwrap();
        let holders = vec![
            (
                "0x0000000000000000000000000000000000000001".into(),
                "0x00000000000000000000000000000000000000000000000000000000000001f4".into(),
            ),
            (
                "0x0000000000000000000000000000000000000002".into(),
                "0x00000000000000000000000000000000000000000000000000000000000001f4".into(),
            ),
        ];
        let cash_hex = "0x0000000000000000000000000000000000000000000000000000000000002710";
        let supply_hex = "0x00000000000000000000000000000000000000000000000000000000000003e8";
        let (lines, dist, rem) =
            allocate_pro_rata_accruals(cash_hex, &holders, supply_hex).unwrap();
        for (addr, bal_hex, acc_hex) in &lines {
            let bal = u256_hex_to_biguint(bal_hex).unwrap();
            let acc = u256_hex_to_biguint(acc_hex).unwrap();
            let expect = (&cash * &bal) / &supply;
            assert_eq!(acc, expect, "holder {addr}");
        }
        let sum_acc: BigUint = lines.iter().fold(BigUint::from(0u8), |acc, (_, _, a)| {
            acc + u256_hex_to_biguint(a).unwrap()
        });
        assert_eq!(super::biguint_to_u256_hex(&sum_acc), dist);
        assert_eq!(sum_acc + u256_hex_to_biguint(&rem).unwrap(), cash);
    }

    /// **TT-B086-PRO-RATA-IDEMPOTENT-MATH-001**：同一 **cash / holders / supply** 重算，分录 **逐字一致**（对应 DB 层「同 **`idempotency_key`** 不重插」的数学前提）。
    #[test]
    fn b086_allocate_pro_rata_repeat_is_deterministic() {
        let cash = "0x00000000000000000000000000000000000000000000000000000000000003e8";
        let supply = "0x0000000000000000000000000000000000000000000000000000000000000064";
        let h = vec![
            (
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into(),
                "0x000000000000000000000000000000000000000000000000000000000000003c".into(),
            ),
            (
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into(),
                "0x0000000000000000000000000000000000000000000000000000000000000028".into(),
            ),
        ];
        let a = allocate_pro_rata_accruals(cash, &h, supply).unwrap();
        let b = allocate_pro_rata_accruals(cash, &h, supply).unwrap();
        assert_eq!(a.0, b.0);
        assert_eq!(a.1, b.1);
        assert_eq!(a.2, b.2);
    }

    /// **B-115-5**：应计 **现金口径 / 公式** 字面量 **不得** 与 **`fee-pool-aggregates`** 的 **Σ SSOT 串** 混名（与 **B-084** 投影聚合正交）。
    #[test]
    fn b1155_distribution_constants_not_fee_pool_aggregate_ssot_alias() {
        assert_ne!(
            crate::db::economic_aggregate::FEE_POOL_AGGREGATES_SSOT_LITERAL,
            CASH_BASIS
        );
        assert_ne!(
            crate::db::economic_aggregate::FEE_POOL_AGGREGATES_SSOT_LITERAL,
            FORMULA
        );
        assert_ne!(
            crate::db::economic_aggregate::FEE_POOL_AGGREGATES_RULE_VERSION,
            SNAPSHOT_BLOCK_BINDING
        );
    }

    /// **B-115-3**：**`Uuid::as_u128()`** 落 **`bytes32` 低 128 位**（big-endian 词）。
    #[test]
    fn b1153_distribution_uuid_to_bytes32_lower_u128() {
        let id = Uuid::from_u128(0x00ab);
        let h = distribution_uuid_to_bytes32_hex_for_claim(id);
        assert_eq!(
            h,
            "0x00000000000000000000000000000000000000000000000000000000000000ab"
        );
    }

    #[test]
    fn pro_rata_two_holders_matches_manual() {
        let cash = "0x00000000000000000000000000000000000000000000000000000000000003e8";
        let supply = "0x0000000000000000000000000000000000000000000000000000000000000064";
        let h = vec![
            (
                "0x000000000000000000000000000000000000000a".into(),
                "0x000000000000000000000000000000000000000000000000000000000000003c".into(),
            ),
            (
                "0x000000000000000000000000000000000000000000000000000000000000000b".into(),
                "0x0000000000000000000000000000000000000000000000000000000000000028".into(),
            ),
        ];
        let (lines, dist_sum, rem) = allocate_pro_rata_accruals(cash, &h, supply).unwrap();
        assert_eq!(lines.len(), 2);
        assert_eq!(
            lines[0].2,
            "0x0000000000000000000000000000000000000000000000000000000000000258"
        );
        assert_eq!(
            lines[1].2,
            "0x0000000000000000000000000000000000000000000000000000000000000190"
        );
        let s0 = u256_hex_to_biguint(&lines[0].2).unwrap();
        let s1 = u256_hex_to_biguint(&lines[1].2).unwrap();
        let r = u256_hex_to_biguint(&rem).unwrap();
        assert_eq!(s0 + s1 + r, u256_hex_to_biguint(cash).unwrap());
        assert_eq!(
            dist_sum,
            "0x00000000000000000000000000000000000000000000000000000000000003e8"
        );
        assert_eq!(
            rem,
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        );
    }
}
