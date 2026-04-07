//! Staking 状态事件投影（TT-COMP-B088）：**`Staked` / `Withdrawn` / `Slashed`** 可重放，与 **`investor_share_transfer_events`** 合并为 **`pro_rata`** 领取名单

use std::collections::BTreeMap;

use sqlx::postgres::PgPool;

use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, sub_assign_be, zero_word};

/// 与 **`POST …/internal/investor-distribution-accrual`** **`snapshot_binding`** 同源
pub const B088_STAKE_PROJECTION_TABLE: &str = "investor_stake_state_events";
pub const B088_STAKE_EVENT_SOURCE: &str = "Staking.Staked|Withdrawn|Slashed";
pub const B088_COMP_ANCHOR: &str = "TT-COMP-B088-STAKE-LOCK-PROJECTION-001";

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InvestorStakeStateRow {
    pub user_address: String,
    pub event_kind: String,
    pub amount_u256_hex: String,
}

pub async fn insert_investor_stake_state_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    staking_contract_address: &str,
    user_address: &str,
    event_kind: &str,
    amount_u256_hex: &str,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"
        INSERT INTO investor_stake_state_events (
            chain_id, block_number, log_index, block_hash, tx_hash,
            staking_contract_address, user_address, event_kind, amount_u256_hex
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
    .bind(staking_contract_address)
    .bind(user_address)
    .bind(event_kind)
    .bind(amount_u256_hex)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}

pub async fn list_investor_stake_state_events_up_to_block(
    pool: &PgPool,
    chain_id: i64,
    staking_contract_address: &str,
    max_block_inclusive: i64,
) -> Result<Vec<InvestorStakeStateRow>, sqlx::Error> {
    let sc = staking_contract_address.trim().to_lowercase();
    sqlx::query_as::<_, InvestorStakeStateRow>(
        r#"
        SELECT user_address, event_kind, amount_u256_hex
        FROM investor_stake_state_events
        WHERE chain_id = $1
          AND LOWER(staking_contract_address) = $2
          AND block_number <= $3
        ORDER BY block_number ASC, log_index ASC
        "#,
    )
    .bind(chain_id)
    .bind(&sc)
    .bind(max_block_inclusive)
    .fetch_all(pool)
    .await
}

fn norm_addr(a: &str) -> String {
    format!("0x{}", a.trim_start_matches("0x").to_lowercase())
}

/// 重放 **`stakeOf`**（**`Staked` +**，**`Withdrawn`/`Slashed` −**）。
pub fn replay_stake_of_from_rows(rows: &[InvestorStakeStateRow]) -> Result<BTreeMap<String, [u8; 32]>, &'static str> {
    let mut out: BTreeMap<String, [u8; 32]> = BTreeMap::new();
    for r in rows {
        let u = norm_addr(&r.user_address);
        let w = parse_u256_word_hex(&r.amount_u256_hex).ok_or("invalid_stake_amount_u256_hex")?;
        let e = out.entry(u).or_insert(zero_word());
        match r.event_kind.as_str() {
            "Staked" => add_assign_be(e, &w).map_err(|_| "staked_add_overflow")?,
            "Withdrawn" | "Slashed" => sub_assign_be(e, &w).map_err(|_| "stake_sub_underflow")?,
            _ => return Err("unknown_stake_event_kind"),
        }
    }
    out.retain(|_, b| *b != zero_word());
    Ok(out)
}

/// **`transfer` 重放余额** 上叠加 **`stakeOf`**，并 **剔除** 质押合约地址键（其 ERC20 余额为池子，按用户 **`stakeOf`** 归因）。
pub fn merge_transfer_balances_with_stake_overlay(
    mut transfer_balances: BTreeMap<String, [u8; 32]>,
    stake_rows: &[InvestorStakeStateRow],
    staking_contract_norm: &str,
) -> Result<BTreeMap<String, [u8; 32]>, &'static str> {
    let sc = norm_addr(staking_contract_norm);
    let stake_map = replay_stake_of_from_rows(stake_rows)?;
    for (user, stake_w) in stake_map {
        let e = transfer_balances.entry(user).or_insert(zero_word());
        add_assign_be(e, &stake_w).map_err(|_| "overlay_add_overflow")?;
    }
    transfer_balances.remove(&sc);
    transfer_balances.retain(|_, w| *w != zero_word());
    Ok(transfer_balances)
}

pub async fn delete_investor_stake_state_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    rewind_from_block: i64,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"DELETE FROM investor_stake_state_events WHERE chain_id = $1 AND block_number >= $2"#,
    )
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

    fn row(kind: &str, user: &str, hexv: &str) -> InvestorStakeStateRow {
        InvestorStakeStateRow {
            user_address: user.to_string(),
            event_kind: kind.to_string(),
            amount_u256_hex: hexv.to_string(),
        }
    }

    #[test]
    fn comp_b088_overlay_restores_holder_weight_after_stake_to_contract() {
        let sc = "0x00000000000000000000000000000000000000cc";
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
            norm_addr(sc),
            parse_u256_word_hex("0x0000000000000000000000000000000000000000000000000000000000000028").unwrap(),
        );

        let stake_rows = vec![row(
            "Staked",
            a,
            "0x0000000000000000000000000000000000000000000000000000000000000028",
        )];

        let merged = merge_transfer_balances_with_stake_overlay(t, &stake_rows, sc).unwrap();
        assert!(merged.get(&norm_addr(sc)).is_none());
        assert_eq!(merged.len(), 2);
        assert_eq!(
            fmt_word_hex(merged.get(&norm_addr(a)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000064"
        );
        assert_eq!(
            fmt_word_hex(merged.get(&norm_addr(z)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000064"
        );

        let mut sum = zero_word();
        for w in merged.values() {
            add_assign_be(&mut sum, w).unwrap();
        }
        let expect = parse_u256_word_hex(
            "0x00000000000000000000000000000000000000000000000000000000000000c8",
        )
        .unwrap();
        assert_eq!(sum, expect);
    }
}
