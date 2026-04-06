//! 份额代币 ERC20 `Transfer` 投影与重放对账（B-085、`investor_share_transfer_events`）

use std::collections::BTreeMap;

use sqlx::postgres::PgPool;

use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, sub_assign_be, zero_word};

const ZERO_ADDR: &str = "0x0000000000000000000000000000000000000000";

/// 有序重放行（与链上 log 序一致）
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InvestorShareTransferRow {
    pub token_address: String,
    pub from_address: String,
    pub to_address: String,
    pub value_u256_hex: String,
}

pub async fn insert_investor_share_transfer_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    token_address: &str,
    from_address: &str,
    to_address: &str,
    value_u256_hex: &str,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"
        INSERT INTO investor_share_transfer_events (
            chain_id, block_number, log_index, block_hash, tx_hash,
            token_address, from_address, to_address, value_u256_hex
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
    .bind(token_address)
    .bind(from_address)
    .bind(to_address)
    .bind(value_u256_hex)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}

pub async fn list_investor_share_transfers_for_replay(
    pool: &PgPool,
    chain_id: Option<i64>,
    token_address: Option<&str>,
) -> Result<Vec<InvestorShareTransferRow>, sqlx::Error> {
    let token_l = token_address.map(|s| s.trim().to_lowercase());
    let rows = sqlx::query_as::<_, InvestorShareTransferRow>(
        r#"
        SELECT token_address, from_address, to_address, value_u256_hex
        FROM investor_share_transfer_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
          AND ($2::text IS NULL OR LOWER(token_address) = $2)
        ORDER BY block_number ASC, log_index ASC
        "#,
    )
    .bind(chain_id)
    .bind(token_l.as_deref())
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

/// 仅含 **`block_number <= max_block_inclusive`** 的 Transfer 行（B-086 快照）
pub async fn list_investor_share_transfers_up_to_block(
    pool: &PgPool,
    chain_id: i64,
    token_address: &str,
    max_block_inclusive: i64,
) -> Result<Vec<InvestorShareTransferRow>, sqlx::Error> {
    let token_l = token_address.trim().to_lowercase();
    let rows = sqlx::query_as::<_, InvestorShareTransferRow>(
        r#"
        SELECT token_address, from_address, to_address, value_u256_hex
        FROM investor_share_transfer_events
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
    Ok(rows)
}

pub async fn delete_investor_share_transfer_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    rewind_from_block: i64,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"DELETE FROM investor_share_transfer_events WHERE chain_id = $1 AND block_number >= $2"#,
    )
    .bind(chain_id)
    .bind(rewind_from_block)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}

fn norm_addr(a: &str) -> String {
    format!("0x{}", a.trim_start_matches("0x").to_lowercase())
}

/// 自 `Transfer` 行重放余额；返回 (**holder → u256 hex**)、**Σ balances**（不含零地址键）。
pub fn replay_balances_from_transfers(
    rows: &[InvestorShareTransferRow],
) -> Result<(BTreeMap<String, [u8; 32]>, [u8; 32]), &'static str> {
    let mut balances: BTreeMap<String, [u8; 32]> = BTreeMap::new();
    let zero = norm_addr(ZERO_ADDR);

    for r in rows {
        let from = norm_addr(&r.from_address);
        let to = norm_addr(&r.to_address);
        let v = parse_u256_word_hex(&r.value_u256_hex).ok_or("invalid_value_u256_hex")?;

        if from == zero && to == zero {
            return Err("transfer_from_and_to_zero");
        }

        if from == zero {
            let e = balances.entry(to).or_insert(zero_word());
            add_assign_be(e, &v).map_err(|_| "balance_add_overflow")?;
        } else if to == zero {
            let e = balances
                .get_mut(&from)
                .ok_or("burn_from_missing_balance")?;
            sub_assign_be(e, &v).map_err(|_| "burn_underflow")?;
        } else {
            let from_e = balances
                .get_mut(&from)
                .ok_or("transfer_from_missing_balance")?;
            sub_assign_be(from_e, &v).map_err(|_| "transfer_underflow")?;
            let to_e = balances.entry(to).or_insert(zero_word());
            add_assign_be(to_e, &v).map_err(|_| "balance_add_overflow")?;
        }
    }

    balances.retain(|_, w| *w != zero_word());
    let mut sum = zero_word();
    for w in balances.values() {
        add_assign_be(&mut sum, w).map_err(|_| "sum_balances_overflow")?;
    }
    Ok((balances, sum))
}

/// 有余额持有人中不在合规表内的地址（**`compliance` 表为空时**不调用）
pub async fn compliance_holders_not_allowlisted(
    pool: &PgPool,
    holders: &[String],
) -> Result<Vec<String>, sqlx::Error> {
    if holders.is_empty() {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    for h in holders {
        let ok: bool = sqlx::query_scalar(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM investor_share_compliance_wallets
                WHERE LOWER(wallet_address) = LOWER($1)
            )
            "#,
        )
        .bind(h)
        .fetch_one(pool)
        .await?;
        if !ok {
            out.push(h.clone());
        }
    }
    Ok(out)
}

pub async fn investor_share_compliance_wallet_count(pool: &PgPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM investor_share_compliance_wallets"#)
        .fetch_one(pool)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(from: &str, to: &str, value: &str) -> InvestorShareTransferRow {
        InvestorShareTransferRow {
            token_address: "0xt".to_string(),
            from_address: from.to_string(),
            to_address: to.to_string(),
            value_u256_hex: value.to_string(),
        }
    }

    #[test]
    fn replay_mint_transfer_burn() {
        let z = ZERO_ADDR;
        let a = "0x000000000000000000000000000000000000000a";
        let b = "0x000000000000000000000000000000000000000b";
        let rows = vec![
            row(z, a, "0x0000000000000000000000000000000000000000000000000000000000000064"),
            row(a, b, "0x000000000000000000000000000000000000000000000000000000000000001e"),
            row(b, z, "0x000000000000000000000000000000000000000000000000000000000000000a"),
        ];
        let (bal, sum) = replay_balances_from_transfers(&rows).unwrap();
        assert_eq!(bal.len(), 2);
        assert_eq!(
            fmt_word_hex(bal.get(&norm_addr(a)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000046"
        );
        assert_eq!(
            fmt_word_hex(bal.get(&norm_addr(b)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000014"
        );
        let expect_sum = parse_u256_word_hex(
            "0x000000000000000000000000000000000000000000000000000000000000005a",
        )
        .unwrap();
        assert_eq!(sum, expect_sum);
    }

    /// 母表 **B-088**：**`snapshot_block = 10`** 时 **不含** 块 **11** 的转让；领取名单与 **`pro_rata`** 表一致。
    #[test]
    fn b088_later_block_transfer_excluded_from_snapshot_cutoff() {
        let z = ZERO_ADDR;
        let a = "0x000000000000000000000000000000000000000a";
        let b = "0x000000000000000000000000000000000000000b";
        let mint = row(
            z,
            a,
            "0x0000000000000000000000000000000000000000000000000000000000000064",
        );
        let xfer = row(
            a,
            b,
            "0x0000000000000000000000000000000000000000000000000000000000000028",
        );

        let (bal_10, sum_10) = replay_balances_from_transfers(&[mint.clone()]).unwrap();
        let (bal_11, sum_11) = replay_balances_from_transfers(&[mint, xfer]).unwrap();

        assert_eq!(bal_10.len(), 1);
        assert!(bal_10.get(&norm_addr(a)).is_some());
        assert_eq!(
            fmt_word_hex(bal_10.get(&norm_addr(a)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000064"
        );

        assert_eq!(bal_11.len(), 2);
        assert_eq!(
            fmt_word_hex(bal_11.get(&norm_addr(a)).unwrap()),
            "0x000000000000000000000000000000000000000000000000000000000000003c"
        );
        assert_eq!(
            fmt_word_hex(bal_11.get(&norm_addr(b)).unwrap()),
            "0x0000000000000000000000000000000000000000000000000000000000000028"
        );

        let cash = "0x00000000000000000000000000000000000000000000000000000000000003e8";
        let h10: Vec<_> = bal_10
            .iter()
            .map(|(addr, w)| (addr.clone(), fmt_word_hex(w)))
            .collect();
        let h11: Vec<_> = bal_11
            .iter()
            .map(|(addr, w)| (addr.clone(), fmt_word_hex(w)))
            .collect();

        let (lines10, _, _) =
            crate::db::allocate_pro_rata_accruals(cash, &h10, &fmt_word_hex(&sum_10)).unwrap();
        let (lines11, _, _) =
            crate::db::allocate_pro_rata_accruals(cash, &h11, &fmt_word_hex(&sum_11)).unwrap();

        assert_eq!(lines10.len(), 1);
        assert_eq!(lines10[0].0, norm_addr(a));
        assert_eq!(lines10[0].2, cash);

        assert_eq!(lines11.len(), 2);
        assert_eq!(lines11[0].0, norm_addr(a));
        assert_eq!(lines11[1].0, norm_addr(b));
        assert_eq!(
            lines11[0].2,
            "0x0000000000000000000000000000000000000000000000000000000000000258"
        );
        assert_eq!(
            lines11[1].2,
            "0x0000000000000000000000000000000000000000000000000000000000000190"
        );
    }
}
