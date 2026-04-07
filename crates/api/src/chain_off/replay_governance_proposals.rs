//! **`event_log`** → **`governance_proposals_projection`** 回放（**B-089 Completion**）。

use serde::Serialize;
use sqlx::postgres::PgPool;

use crate::db::{self, apply_governance_projection_from_parsed_event};

#[derive(Debug, Clone, Default, Serialize)]
pub struct GovernanceProposalReplayStats {
    pub rows_scanned: u32,
    pub applied_ok: u32,
    pub skipped_no_topics: u32,
    pub apply_errors: u32,
}

fn topics_from_payload(payload: &serde_json::Value) -> Option<Vec<String>> {
    let arr = payload.get("topics")?.as_array()?;
    let mut out = Vec::with_capacity(arr.len());
    for x in arr {
        out.push(x.as_str()?.to_string());
    }
    Some(out)
}

fn data_hex_from_payload(payload: &serde_json::Value) -> Option<String> {
    let d = payload.get("data")?;
    d.as_str().map(String::from)
}

/// 清空本链投影后，按 **`event_log`** 顺序重放（与 **reorg rewind** 配套）。
pub async fn replay_governance_proposals_from_event_log(
    pool: &PgPool,
    chain_id: i64,
) -> Result<GovernanceProposalReplayStats, sqlx::Error> {
    let rows = db::list_event_log_governance_projection_rows(pool, chain_id).await?;
    let mut stats = GovernanceProposalReplayStats {
        rows_scanned: rows.len() as u32,
        ..Default::default()
    };
    for row in rows {
        let payload = row.payload.0;
        let Some(topics) = topics_from_payload(&payload) else {
            stats.skipped_no_topics += 1;
            continue;
        };
        let data_hex = data_hex_from_payload(&payload).unwrap_or_else(|| "0x".to_string());
        match apply_governance_projection_from_parsed_event(
            pool,
            chain_id,
            row.event_type.as_str(),
            &topics,
            &data_hex,
        )
        .await
        {
            Ok(()) => stats.applied_ok += 1,
            Err(_) => stats.apply_errors += 1,
        }
    }
    Ok(stats)
}
