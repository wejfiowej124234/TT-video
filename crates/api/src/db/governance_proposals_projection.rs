//! Governor 链上提案投影（**B-089 Completion**）：**`event_log`** 驱动，与 **`replay_governance_proposals_from_event_log`** 一致。

use num_bigint::BigUint;
use num_traits::Num;
use sqlx::postgres::PgPool;

#[derive(Debug, Clone)]
pub struct GovernanceProposalProjectionRow {
    pub chain_id: i64,
    pub proposal_id: String,
    pub proposer_hex: Option<String>,
    pub snapshot_block: i64,
    pub vote_start_block: i64,
    pub vote_end_block: i64,
    pub title: Option<String>,
    pub for_votes: String,
    pub against_votes: String,
    pub abstain_votes: String,
    pub chain_state: Option<String>,
    pub operation_id_hex: Option<String>,
}

fn topic_u256_decimal(topic: &str) -> Option<String> {
    let h = topic.trim().trim_start_matches("0x");
    if h.len() < 64 {
        return None;
    }
    let last = &h[h.len() - 64..];
    let b = BigUint::from_str_radix(last, 16).ok()?;
    Some(b.to_string())
}

fn topic_address(topic: &str) -> Option<String> {
    let h = topic.trim().trim_start_matches("0x");
    if h.len() < 40 {
        return None;
    }
    let addr = &h[h.len() - 40..];
    Some(format!("0x{}", addr.to_lowercase()))
}

fn word_u256_dec(word32: &[u8]) -> Option<String> {
    if word32.len() != 32 {
        return None;
    }
    let b = BigUint::from_bytes_be(word32);
    Some(b.to_string())
}

fn decode_abi_string_at(data: &[u8], abs_offset: usize) -> Option<String> {
    if abs_offset + 32 > data.len() {
        return None;
    }
    let len_u = BigUint::from_bytes_be(&data[abs_offset..abs_offset + 32]);
    let len: usize = len_u.to_string().parse().ok()?;
    let start = abs_offset + 32;
    if start + len > data.len() {
        return None;
    }
    let raw = &data[start..start + len];
    String::from_utf8(raw.to_vec()).ok()
}

/// 解析 **`ProposalCreated`** 的 `data`（ABI：**head 偏移** + **snapshot, voteStart, voteEnd** + **string**）。
pub fn decode_proposal_created_data(data_hex: &str) -> Option<(String, String, String, String)> {
    let s = data_hex.trim().trim_start_matches("0x");
    let raw = hex::decode(s).ok()?;
    if raw.len() < 128 {
        return None;
    }
    let snap = word_u256_dec(&raw[32..64])?;
    let vstart = word_u256_dec(&raw[64..96])?;
    let vend = word_u256_dec(&raw[96..128])?;
    let off = BigUint::from_bytes_be(&raw[0..32]);
    let off_u: usize = off.to_string().parse().ok()?;
    let title = decode_abi_string_at(&raw, off_u).unwrap_or_default();
    Some((snap, vstart, vend, title))
}

/// **`VoteCast`**：`data` = **uint256 support || uint256 weight**（各 32 字节）。
pub fn decode_vote_cast_data(data_hex: &str) -> Option<(u8, String)> {
    let s = data_hex.trim().trim_start_matches("0x");
    let raw = hex::decode(s).ok()?;
    if raw.len() < 64 {
        return None;
    }
    let sup = raw[31];
    let w = word_u256_dec(&raw[32..64])?;
    Some((sup, w))
}

/// **`ProposalQueued`**：topics[2] = **operationId**（bytes32）
pub fn topic_bytes32_hex(topic: &str) -> Option<String> {
    let h = topic.trim().trim_start_matches("0x");
    if h.len() < 64 {
        return None;
    }
    let last = &h[h.len() - 64..];
    Some(format!("0x{}", last.to_lowercase()))
}

pub fn decode_proposer_bytes(topic: &str) -> Option<Vec<u8>> {
    let addr = topic_address(topic)?;
    let h = addr.trim_start_matches("0x");
    hex::decode(h).ok()
}

/// 由 **`topics` + `data`** 应用单行投影（幂等合并）。
pub async fn apply_governance_projection_from_parsed_event(
    pool: &PgPool,
    chain_id: i64,
    event_name: &str,
    topics: &[String],
    data_hex: &str,
) -> Result<(), sqlx::Error> {
    match event_name {
        "ProposalCreated" => {
            let Some(pid) = topics.get(1).and_then(|t| topic_u256_decimal(t)) else {
                return Ok(());
            };
            let proposer = topics
                .get(2)
                .and_then(|t| decode_proposer_bytes(t.as_str()));
            let (snap, vs, ve, title) = decode_proposal_created_data(data_hex).unwrap_or_else(|| {
                ("0".into(), "0".into(), "0".into(), String::new())
            });
            let snap_i: i64 = snap.parse().unwrap_or(0).min(i64::MAX as u128) as i64;
            let vs_i: i64 = vs.parse().unwrap_or(0).min(i64::MAX as u128) as i64;
            let ve_i: i64 = ve.parse().unwrap_or(0).min(i64::MAX as u128) as i64;
            let title_opt = if title.is_empty() {
                None
            } else {
                Some(title)
            };
            sqlx::query(
                r#"
                INSERT INTO governance_proposals_projection (
                    chain_id, proposal_id, proposer, snapshot_block, vote_start_block, vote_end_block,
                    title, for_votes, against_votes, abstain_votes, chain_state, operation_id, updated_at
                )
                VALUES ($1, $2::numeric, $3, $4, $5, $6, $7, 0, 0, 0, 'pending', NULL, now())
                ON CONFLICT (chain_id, proposal_id) DO UPDATE SET
                    proposer = COALESCE(EXCLUDED.proposer, governance_proposals_projection.proposer),
                    snapshot_block = EXCLUDED.snapshot_block,
                    vote_start_block = EXCLUDED.vote_start_block,
                    vote_end_block = EXCLUDED.vote_end_block,
                    title = COALESCE(EXCLUDED.title, governance_proposals_projection.title),
                    updated_at = now()
                "#,
            )
            .bind(chain_id)
            .bind(&pid)
            .bind(proposer.as_deref())
            .bind(snap_i)
            .bind(vs_i)
            .bind(ve_i)
            .bind(title_opt)
            .execute(pool)
            .await?;
        }
        "VoteCast" => {
            let Some(pid) = topics.get(2).and_then(|t| topic_u256_decimal(t)) else {
                return Ok(());
            };
            let (support, weight_s) = decode_vote_cast_data(data_hex).unwrap_or((255, "0".into()));
            if support > 2 {
                return Ok(());
            }
            let sql = match support {
                1 => r#"UPDATE governance_proposals_projection SET for_votes = for_votes + $3::numeric, updated_at = now() WHERE chain_id = $1 AND proposal_id = $2::numeric"#,
                0 => r#"UPDATE governance_proposals_projection SET against_votes = against_votes + $3::numeric, updated_at = now() WHERE chain_id = $1 AND proposal_id = $2::numeric"#,
                _ => r#"UPDATE governance_proposals_projection SET abstain_votes = abstain_votes + $3::numeric, updated_at = now() WHERE chain_id = $1 AND proposal_id = $2::numeric"#,
            };
            sqlx::query(sql)
                .bind(chain_id)
                .bind(&pid)
                .bind(&weight_s)
                .execute(pool)
                .await?;
        }
        "ProposalQueued" => {
            let Some(pid) = topics.get(1).and_then(|t| topic_u256_decimal(t)) else {
                return Ok(());
            };
            let Some(op_hex) = topics
                .get(2)
                .and_then(|t| topic_bytes32_hex(t.as_str()))
            else {
                return Ok(());
            };
            let op_raw = hex::decode(op_hex.trim_start_matches("0x")).unwrap_or_default();
            sqlx::query(
                r#"
                UPDATE governance_proposals_projection
                SET operation_id = $3, chain_state = 'queued', updated_at = now()
                WHERE chain_id = $1 AND proposal_id = $2::numeric
                "#,
            )
            .bind(chain_id)
            .bind(&pid)
            .bind(&op_raw)
            .execute(pool)
            .await?;
        }
        "ProposalExecuted" => {
            let Some(pid) = topics.get(1).and_then(|t| topic_u256_decimal(t)) else {
                return Ok(());
            };
            sqlx::query(
                r#"
                UPDATE governance_proposals_projection
                SET chain_state = 'executed', updated_at = now()
                WHERE chain_id = $1 AND proposal_id = $2::numeric
                "#,
            )
            .bind(chain_id)
            .bind(&pid)
            .execute(pool)
            .await?;
        }
        "ProposalCanceled" => {
            let Some(pid) = topics.get(1).and_then(|t| topic_u256_decimal(t)) else {
                return Ok(());
            };
            sqlx::query(
                r#"
                UPDATE governance_proposals_projection
                SET chain_state = 'canceled', updated_at = now()
                WHERE chain_id = $1 AND proposal_id = $2::numeric
                "#,
            )
            .bind(chain_id)
            .bind(&pid)
            .execute(pool)
            .await?;
        }
        _ => {}
    }
    Ok(())
}

pub async fn list_governance_proposals_for_chain(
    pool: &PgPool,
    chain_id: i64,
    limit: i64,
) -> Result<Vec<GovernanceProposalProjectionRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (i64, String, Option<Vec<u8>>, i64, i64, i64, Option<String>, String, String, String, Option<String>, Option<Vec<u8>>)>(
        r#"
        SELECT chain_id, proposal_id::text, proposer, snapshot_block, vote_start_block, vote_end_block,
               title, for_votes::text, against_votes::text, abstain_votes::text,
               chain_state, operation_id
        FROM governance_proposals_projection
        WHERE chain_id = $1
        ORDER BY proposal_id DESC
        LIMIT $2
        "#,
    )
    .bind(chain_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(chain_id, proposal_id, proposer, snapshot_block, vote_start_block, vote_end_block, title, fv, av, ab, chain_state, op)| {
                GovernanceProposalProjectionRow {
                    chain_id,
                    proposal_id,
                    proposer_hex: proposer
                        .as_ref()
                        .map(|b| format!("0x{}", hex::encode(b))),
                    snapshot_block,
                    vote_start_block,
                    vote_end_block,
                    title,
                    for_votes: fv,
                    against_votes: av,
                    abstain_votes: ab,
                    chain_state,
                    operation_id_hex: op
                        .as_ref()
                        .map(|b| format!("0x{}", hex::encode(b))),
                }
            },
        )
        .collect())
}

pub async fn get_governance_proposal_projection(
    pool: &PgPool,
    chain_id: i64,
    proposal_id: &str,
) -> Result<Option<GovernanceProposalProjectionRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (i64, String, Option<Vec<u8>>, i64, i64, i64, Option<String>, String, String, String, Option<String>, Option<Vec<u8>>)>(
        r#"
        SELECT chain_id, proposal_id::text, proposer, snapshot_block, vote_start_block, vote_end_block,
               title, for_votes::text, against_votes::text, abstain_votes::text,
               chain_state, operation_id
        FROM governance_proposals_projection
        WHERE chain_id = $1 AND proposal_id = $2::numeric
        "#,
    )
    .bind(chain_id)
    .bind(proposal_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(
        |(chain_id, proposal_id, proposer, snapshot_block, vote_start_block, vote_end_block, title, fv, av, ab, chain_state, op)| {
            GovernanceProposalProjectionRow {
                chain_id,
                proposal_id,
                proposer_hex: proposer
                    .as_ref()
                    .map(|b| format!("0x{}", hex::encode(b))),
                snapshot_block,
                vote_start_block,
                vote_end_block,
                title,
                for_votes: fv,
                against_votes: av,
                abstain_votes: ab,
                chain_state,
                operation_id_hex: op
                    .as_ref()
                    .map(|b| format!("0x{}", hex::encode(b))),
            }
        },
    ))
}

pub async fn delete_governance_proposals_projection_for_chain(
    pool: &PgPool,
    chain_id: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(r#"DELETE FROM governance_proposals_projection WHERE chain_id = $1"#)
        .bind(chain_id)
        .execute(pool)
        .await?;
    Ok(r.rows_affected())
}

#[cfg(test)]
mod decode_tests {
    use super::*;

    #[test]
    fn decode_proposal_created_reads_uints_and_string() {
        // ABI: word0 = offset to string (128), words 1–3 = snapshot, voteStart, voteEnd.
        let mut w = vec![0u8; 128];
        w[31] = 0x80;
        w[63] = 3;
        w[95] = 10;
        w[127] = 20;
        let mut lenw = [0u8; 32];
        lenw[31] = 2;
        w.extend_from_slice(&lenw);
        w.extend_from_slice(b"hi");
        let hex = format!("0x{}", hex::encode(&w));
        let (a, b, c, t) = decode_proposal_created_data(&hex).expect("decode");
        assert_eq!(a, "3");
        assert_eq!(b, "10");
        assert_eq!(c, "20");
        assert_eq!(t, "hi");
    }
}
