//! Shared structs for the `indexer-reconcile` OK-path split (TT-MOD line-count gate).
use serde_json::Value;
use uuid::Uuid;

/// Fields gathered before SSOT / compound-gate evaluation.
pub(crate) struct IndexerReconcileOkObs {
    pub indexer_reconcile_duration_batch_stats_observability: Value,
    pub chain_context: Value,
    pub reconcile_gate_value: Value,
    pub want_rpc: Option<u8>,
    pub rpc_samples: Option<Vec<serde_json::Value>>,
    pub rpc_skip: Option<&'static str>,
    pub rpc_sample_meta: Option<Value>,
    pub economic_projection_row_counts: Option<Value>,
    pub orders_chain_health_observability: Value,
    pub chain_observation: Option<Value>,
    pub event_log_escrow_coverage: Option<Value>,
    pub multi_table_chain_observability: Option<Value>,
    pub reorg_sentinel_observability: Option<Value>,
    pub indexer_finality_triple_observability: Option<Value>,
    pub indexer_tick_fail_skip_bucket_observability: Option<Value>,
    pub governor_proposal_tail_drift_observability: Option<Value>,
    pub governor_proposal_state_chain_vs_projection_observability: Option<Value>,
    pub timelock_delay_meta_mirror_observability: Option<Value>,
    pub governance_pool_meta_chain_alignment_observability: Option<Value>,
    pub fee_router_log_verify: Option<Value>,
    pub region_vault_log_verify: Option<Value>,
}

/// State after SSOT bundles, compound gate, summary assembly, and optional persist.
pub(crate) struct IndexerReconcileOkAfterSsot {
    pub obs: IndexerReconcileOkObs,
    pub orders_deadline_ops_check: Value,
    pub governor_view_params_ops_check: Value,
    pub governor_token_timelock_ops_check: Value,
    pub timelock_delay_ops_check: Value,
    pub governor_proposal_threshold_ops_check: Value,
    pub timelock_governor_admin_ops_check: Value,
    pub governor_proposal_count_ops_check: Value,
    pub reconcile_compound_pass: bool,
    pub compound_gate: Value,
    pub ssot_parallel_chain_snapshot: Value,
    pub ssot_parallel_chain_snapshot_gate: Value,
    pub orders_projection_gate_for_http: Value,
    pub report_id: Option<Uuid>,
    pub orders_chain_health_trend_snapshot_for_resp: Option<Value>,
}
