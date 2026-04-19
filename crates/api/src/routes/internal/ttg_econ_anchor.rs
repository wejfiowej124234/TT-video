//! **`GET /api/v1/internal/ttg-econ-anchor`**：**TTG** **`total_supply`** **/** **`treasury_balance`** **数值投影**（**与** **`GET /meta` → `chain.ttg_econ_anchor`** **同源**；**N2** **机读** **薄** **端点**）。

use axum::extract::{Query, State};
use axum::response::IntoResponse;
use axum::Json;

use crate::routes::health_meta::ttg_econ_anchor::{snapshot, MetaQuery};
use crate::state::ApiMetaState;

/// 查询参数 **`ttg_econ_anchor_block`** **与** **`GET /meta?ttg_econ_anchor_block=`** **同义**。
pub async fn get_ttg_econ_anchor(
    Query(q): Query<MetaQuery>,
    State(state): State<ApiMetaState>,
) -> impl IntoResponse {
    Json(snapshot(&state, q.ttg_econ_anchor_block).await)
}
