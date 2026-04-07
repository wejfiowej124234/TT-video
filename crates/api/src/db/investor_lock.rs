//! 份额锁仓事件投影（**TT-COMP-B088-LOCK-VAULT-PROJECTION-001**）：**`Locked` / `Unlocked`** 可重放，与 **`investor_share_transfer_events`** 合并（在 **`Staking`** 叠加之后可选再叠）

use std::collections::BTreeMap;

use sqlx::postgres::PgPool;

use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, sub_assign_be, zero_word};

pub const B088_LOCK_PROJECTION_TABLE: &str = "investor_lock_state_events";
pub const B088_LOCK_EVENT_SOURCE: &str = "InvestorShareLockLedger.Locked|Unlocked";
pub const B088_LOCK_COMP_ANCHOR: &str = "TT-COMP-B088-LOCK-VAULT-PROJECTION-001";

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InvestorLockStateRow {
    pub user_address: String,
    pub event_kind: String,
    pub amount_u256_hex: String,
}

pub async fn insert_investor_lock_state_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    lock_contract_address: &str,
    user_address: &str,
    event_kind: &str,
    amount_u256_hex: &str,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"
        INSERT INTO investor_lock_state_events (
            chain_id, block_number, log_index, block_hash, tx_hash,
            lock_contract_address, user_address, event_kind, amount_u256_hex
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(lock_contract_address)
    .bind(user_address)
    .bind(event_kind)
    .bind(amount_u256_hex)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}

pub async fn list_investor_lock_state_events_up_to_block(
    pool: &PgPool,
    chain_id: i64,
    lock_contract_address: &str,
    max_block_inclusive: i64,
) -> Result<Vec<InvestorLockStateRow>, sqlx::Error> {
    let lc = lock_contract_address.trim().to_lowercase();
    sqlx::query_as::<_, InvestorLockStateRow>(
        r#"
        SELECT user_address, event_kind, amount_u256_hex
        FROM investor_lock_state_events
        WHERE chain_id = $1
          AND LOWER(lock_contract_address) = $2
          AND block_number <= $3
        ORDER BY block_number ASC, log_index ASC
        "#,
    )
    .bind(chain_id)
    .bind(&lc)
    .bind(max_block_inclusive)
    .fetch_all(pool)
    .await
}

fn norm_addr(a: &str) -> String {
    format!("0x{}", a.trim_start_matches("0x").to_lowercase())
}

/// 重放 **`lockedOf`** 语义（**`Locked` +**，**`Unlocked` −**）。
pub fn replay_locked_of_from_rows(rows: &[InvestorLockStateRow]) -> Result<BTreeMap<String, [u8; 32]>, &'static str> {
    let mut out: BTreeMap<String, [u8; 32]> = BTreeMap::new();
    for r in rows {
        let u = norm_addr(&r.user_address);
        let w = parse_u256_word_hex(&r.amount_u256_hex).ok_or("invalid_lock_amount_u256_hex")?;
        let e = out.entry(u).or_insert(zero_word());
        match r.event_kind.as_str() {
            "Locked" => add_assign_be(e, &w).map_err(|_| "locked_add_overflow")?,
            "Unlocked" => sub_assign_be(e, &w).map_err(|_| "unlock_sub_underflow")?,
            _ => return Err("unknown_lock_event_kind"),
        }
    }
    out.retain(|_, b| *b != zero_word());
    Ok(out)
}

/// 在 **`transfer` 重放（及可选 **`stake`** 叠加）** 后，再叠加 **锁仓合约** 账簿：用户 **`Locked−Unlocked`** 计入份额，**剔除** 锁仓合约地址键。
pub fn merge_transfer_balances_with_lock_overlay(
    mut transfer_balances: BTreeMap<String, [u8; 32]>,
    lock_rows: &[InvestorLockStateRow],
    lock_contract_norm: &str,
) -> Result<BTreeMap<String, [u8; 32]>, &'static str> {
    let lc = norm_addr(lock_contract_norm);
    let lock_map = replay_locked_of_from_rows(lock_rows)?;
    for (user, lock_w) in lock_map {
        let e = transfer_balances.entry(user).or_insert(zero_word());
        add_assign_be(e, &lock_w).map_err(|_| "lock_overlay_add_overflow")?;
    }
    transfer_balances.remove(&lc);
    transfer_balances.retain(|_, w| *w != zero_word());
    Ok(transfer_balances)
}

pub async fn delete_investor_lock_state_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    rewind_from_block: i64,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(r#"DELETE FROM investor_lock_state_events WHERE chain_id = $1 AND block_number >= $2"#)
        .bind(chain_id)
        .bind(rewind_from_block)
        .execute(pool)
        .await?
        .rows_affected();
    Ok(n)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(kind: &str, user: &str, hexv: &str) -> InvestorLockStateRow {
        InvestorLockStateRow {
            user_address: user.to_string(),
            event_kind: kind.to_string(),
            amount_u256_hex: hexv.to_string(),
        }
    }

    #[test]
    fn comp_b088_lock_overlay_attributes_locked_to_user() {
        let lock_c = "0x00000000000000000000000000000000000000dd";
        let a = "0x000000000000000000000000000000000000000a";
        let z = "0x0000000000000000000000000000000000000000";

        let mut t = BTreeMap::new();
        t.insert(
            norm_addr(z),
            parse_u256_word_hex("0x0000000000000000000000000000000000000000000000000000000000000064").unwrap(),
        );
        t.insert(
            norm_addr(a),
            parse_u256_word_hex("0x000000000000000000000000000000000000000000000000000000000000003c").unwrap(),
        );
        t.insert(
            norm_addr(lock_c),
            parse_u256_word_hex("0x0000000000000000000000000000000000000000000000000000000000000014").unwrap(),
        );

        let lock_rows = vec![row(
            "Locked",
            a,
            "0x0000000000000000000000000000000000000000000000000000000000000014",
        )];

        let merged = merge_transfer_balances_with_lock_overlay(t, &lock_rows, lock_c).unwrap();
        assert!(merged.get(&norm_addr(lock_c)).is_none());
        assert_eq!(
            fmt_word_hex(merged.get(&norm_addr(a)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000050"
        );
    }
}
