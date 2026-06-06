//! **SEQ10** `TravelTrustGovernor.proposalCount()` SSOT：`core`（链↔投影解析）+ `obs`（JSON/ops/admin）。
//! **`crate::chain_off::governance_proposal_count_ssot::*`** 路径与 **v1.76** 单文件期一致。

mod core;
mod obs;

pub(crate) use core::proposal_count_resolution_for_meta;
pub(crate) use obs::{
    merge_proposal_count_reconcile_probe_into_observability, proposal_count_observability_value,
    proposal_count_ssot_admin_overview_bundle,
};
