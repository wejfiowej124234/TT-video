//! /api/v1/internal/*（48 §2.2 routes/internal）
//! indexer_tick 成功后落盘运行时 indexer 状态（48 §12.3）
//! G4：PATCH feedback 官方回复/状态仅内网，产品定稿后可扩展公网权限（55 §八附续.6）
//!
//! B-181：按职责拆分子模块；**路由与行为**与原单文件一致。

mod common;
mod community;
mod indexer;
mod messages;
mod onboarding;
mod observability;
mod observability_shell;
mod reconcile;
mod public_catalog_surface;
mod reconcile_gates;
mod growth;
mod region_share_reconcile;

#[cfg(test)]
mod tests;

pub use community::{
    patch_feedback_official_reply, post_internal_community_ranking_snapshot,
    post_internal_scheduler_enqueue, post_internal_scheduler_run_next,
};
#[allow(unused_imports)]
pub use indexer::{
    indexer_reorg_rewind, indexer_replay, indexer_tick, IndexerReplayBody, IndexerReorgRewindBody,
};
#[allow(unused_imports)]
pub use messages::{post_internal_region_share_snapshot_line, process_resolution_outbox, RegionShareSnapshotLineBody};
#[allow(unused_imports)]
pub use observability::{
    indexer_head_vs_db_latest_block_drift_observability_v1, indexer_status, internal_alerts_test_fire,
    internal_incident_open, IndexerStatusQuery,
};
#[allow(unused_imports)]
pub use reconcile::{indexer_reconcile, IndexerReconcileBody};

use axum::routing::{get, patch, post};

use crate::state::ApiMetaState;

/// 测试与子模块调试：复用原 `internal.rs` 单模块下的 `use super::*` 习惯。
#[cfg(test)]
pub(crate) use common::*;
#[cfg(test)]
pub(crate) use community::*;
#[cfg(test)]
pub(crate) use indexer::*;
#[cfg(test)]
pub(crate) use observability::*;
#[cfg(test)]
pub(crate) use reconcile_gates::*;

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new()
        .merge(crate::routes::investor_distribution::internal_router())
        .route(
            "/api/v1/internal/process-resolution-outbox",
            post(process_resolution_outbox),
        )
        .route("/api/v1/internal/indexer-tick", post(indexer_tick))
        .route("/api/v1/internal/indexer-replay", post(indexer_replay))
        .route(
            "/api/v1/internal/indexer-reorg-rewind",
            post(indexer_reorg_rewind),
        )
        .route(
            "/api/v1/internal/indexer-reconcile",
            post(indexer_reconcile),
        )
        .route("/api/v1/internal/indexer-status", get(indexer_status))
        .route(
            "/api/v1/internal/region-share-snapshot-line",
            post(post_internal_region_share_snapshot_line),
        )
        .route(
            "/api/v1/internal/alerts/test-fire",
            post(internal_alerts_test_fire),
        )
        .route(
            "/api/v1/internal/incident/open",
            post(internal_incident_open),
        )
        .route(
            "/api/v1/internal/community/feedback/:id",
            patch(patch_feedback_official_reply),
        )
        .route(
            "/api/v1/internal/community/ranking/snapshot",
            post(post_internal_community_ranking_snapshot),
        )
        .route(
            "/api/v1/internal/scheduler/enqueue",
            post(post_internal_scheduler_enqueue),
        )
        .route(
            "/api/v1/internal/scheduler/run-next",
            post(post_internal_scheduler_run_next),
        )
        .route(
            "/api/v1/internal/public-catalog-surface/stats",
            get(public_catalog_surface::get_public_catalog_surface_stats),
        )
        .route(
            "/api/v1/internal/onboarding/payments/webhook",
            post(onboarding::post_internal_onboarding_payments_webhook),
        )
        .merge(growth::router())
        .merge(region_share_reconcile::router())
}
