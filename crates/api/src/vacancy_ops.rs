//! W4b · Vacancy ops reconciliation + indexer health (read-only · no reserve recompute).

use serde_json::{json, Value};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VacancyReconciliationOps {
    pub reconcile_status: String,
    pub drift: bool,
    pub last_checked_block: Option<u64>,
    pub projection_block: Option<u64>,
    pub mode: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VacancyIndexerHealthOps {
    pub last_indexed_block: Option<u64>,
    pub last_indexed_log_index: Option<u32>,
    pub last_event_at: Option<String>,
    pub vacancy_event_count: u64,
    pub indexer_checkpoint_block: Option<u64>,
    pub lag_blocks: Option<i64>,
}

pub fn build_reconciliation_ops(
    runtime_status: &str,
    runtime_reconcile_mode: &str,
    indexer_checkpoint_block: Option<u64>,
    projection_block: Option<u64>,
) -> VacancyReconciliationOps {
    let runtime_active = runtime_status.eq_ignore_ascii_case("ACTIVE");
    let mode = if runtime_active {
        "LIVE_RECONCILE".to_string()
    } else {
        runtime_reconcile_mode.to_string()
    };
    let (reconcile_status, drift) = if runtime_active {
        ("PENDING_LIVE_CHECK".to_string(), false)
    } else {
        ("PASS".to_string(), false)
    };

    VacancyReconciliationOps {
        reconcile_status,
        drift,
        last_checked_block: indexer_checkpoint_block,
        projection_block,
        mode,
    }
}

pub fn build_indexer_health_ops(
    projection_block: Option<u64>,
    projection_log_index: Option<u32>,
    last_event_at: Option<String>,
    vacancy_event_count: u64,
    indexer_checkpoint_block: Option<u64>,
) -> VacancyIndexerHealthOps {
    let lag_blocks = match (indexer_checkpoint_block, projection_block) {
        (Some(cp), Some(pb)) if cp >= pb => Some((cp - pb) as i64),
        _ => None,
    };
    VacancyIndexerHealthOps {
        last_indexed_block: projection_block.or(indexer_checkpoint_block),
        last_indexed_log_index: projection_log_index,
        last_event_at,
        vacancy_event_count,
        indexer_checkpoint_block,
        lag_blocks,
    }
}

pub fn reconciliation_ops_to_json(ops: &VacancyReconciliationOps) -> Value {
    json!({
        "reconcileStatus": ops.reconcile_status,
        "drift": ops.drift,
        "lastCheckedBlock": ops.last_checked_block,
        "projectionBlock": ops.projection_block,
        "mode": ops.mode,
    })
}

pub fn indexer_health_ops_to_json(h: &VacancyIndexerHealthOps) -> Value {
    json!({
        "lastIndexedBlock": h.last_indexed_block,
        "lastIndexedLogIndex": h.last_indexed_log_index,
        "lastEventTimestamp": h.last_event_at,
        "vacancyEventCount": h.vacancy_event_count,
        "indexerCheckpointBlock": h.indexer_checkpoint_block,
        "lagBlocks": h.lag_blocks,
    })
}

pub fn runtime_activation_label(runtime_status: &str) -> String {
    if runtime_status.eq_ignore_ascii_case("ACTIVE") {
        "Active".to_string()
    } else {
        "Pending".to_string()
    }
}

pub fn event_explorer_ledger_fields(
    topic0: &str,
    topics: &[String],
    data: &serde_json::Value,
) -> serde_json::Value {
    use crate::vacancy_ledger_indexer::parse_vacancy_event;
    let Some(ev) = parse_vacancy_event(topic0, topics, data) else {
        return serde_json::json!({});
    };
    match ev {
        crate::vacancy_ledger_indexer::VacancyIndexerEvent::VacancyEntered {
            principal,
            reserve,
            swept,
            disbursed,
            ..
        }
        | crate::vacancy_ledger_indexer::VacancyIndexerEvent::SweepExecuted {
            principal,
            reserve,
            swept,
            disbursed,
            ..
        }
        | crate::vacancy_ledger_indexer::VacancyIndexerEvent::ReserveReached {
            principal,
            reserve,
            swept,
            disbursed,
            ..
        }
        | crate::vacancy_ledger_indexer::VacancyIndexerEvent::JurisdictionReserveDisbursed {
            principal,
            reserve,
            swept,
            disbursed,
            ..
        } => serde_json::json!({
            "principal": principal,
            "reserve": reserve,
            "swept": swept,
            "disbursed": disbursed,
        }),
        crate::vacancy_ledger_indexer::VacancyIndexerEvent::StewardActivated {
            steward_activation_epoch_id,
            ..
        } => serde_json::json!({ "stewardActivationEpochId": steward_activation_epoch_id }),
        crate::vacancy_ledger_indexer::VacancyIndexerEvent::GraceStarted { .. } => {
            serde_json::json!({})
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pre_v1_runtime_reconcile_pass_without_drift() {
        let ops = build_reconciliation_ops("PENDING", "SKIPPED_PRE_V1", Some(87654321), Some(87654320));
        assert_eq!(ops.reconcile_status, "PASS");
        assert!(!ops.drift);
        assert_eq!(ops.mode, "SKIPPED_PRE_V1");
    }

    #[test]
    fn indexer_health_computes_lag_from_checkpoint_minus_projection() {
        let h = build_indexer_health_ops(Some(87654320), Some(3), None, 12, Some(87654321));
        assert_eq!(h.lag_blocks, Some(1));
        assert_eq!(h.vacancy_event_count, 12);
    }
}
