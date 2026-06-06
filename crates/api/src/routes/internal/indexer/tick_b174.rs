use chrono::Utc;
use serde_json::Value;

use crate::routes::internal::common;
use crate::state::ApiMetaState;

pub(crate) async fn persist_and_attach_b174_tick_fail_skip_obs(
    state: &ApiMetaState,
    body: &mut Value,
    logs_fetch_skipped: &[Value],
    events_applied: u32,
    events_new: u32,
) {
    let v = common::indexer_tick_fail_skip_bucket_observability_v1(
        Utc::now().to_rfc3339(),
        logs_fetch_skipped,
        events_applied,
        events_new,
    );
    *state.indexer_tick_fail_skip_bucket_obs_last.write().await = Some(v.clone());
    body["indexer_tick_fail_skip_bucket_observability"] = v;
}
