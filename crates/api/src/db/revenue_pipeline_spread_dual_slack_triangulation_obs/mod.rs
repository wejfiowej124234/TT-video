//! **B-398** / **TT-B398**：**腿间** **`spread_blocks`** **与** **B-391** **`gap_blocks`** **及** **B-392** **`tail_slack_blocks`** **之** **双** **正** **slack** **三角化** **（** **只读** **DB** **+** **checkpoint** **；** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-396** **/** **B-397**：**不** **替代** **二者** **`dominance_signal`** **；** **本** **键** **在** **`inter_leg_drift`** **且** **两侧** **slack** **均** **为** **正** **时** **比较** **`spread`** **与** **`min/max(gap,tail)`** **分** **桶** **。**
//! **与** **B-395**：**不** **输出** **`spread_anomaly_layer`** **。**

mod constants;
mod math;
mod pg;
mod v1;

pub use constants::REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR;
#[allow(unused_imports)]
// `tests.rs` uses `super::revenue_pipeline_*_v1`; `pg.rs` imports `v1` directly
pub use v1::revenue_pipeline_spread_dual_slack_triangulation_observability_v1;

#[cfg(test)]
mod tests;
