//! Governance 链上只读 SSOT：磁盘目录 `chain_off/governance_ssot/`；`crate::chain_off::governance_*_ssot` 由 `chain_off/mod.rs` 再导出保持不变。

pub mod governance_governor_token_timelock_ssot;
pub mod governance_proposal_count_ssot;
pub mod governance_proposal_state_chain_vs_projection_b149;
pub mod governance_proposal_tail_drift_b172;
pub mod governance_proposal_threshold_ssot;
pub mod governance_timelock_delay_meta_mirror_b173;
pub mod governance_timelock_delay_ssot;
pub mod governance_timelock_governor_admin_ssot;
pub mod governance_view_params_ssot;
