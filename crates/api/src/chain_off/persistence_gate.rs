//! Release 构建下：无 PostgreSQL 连接时拒绝「可感知成功」的变异，避免仅内存落盘。
//! `cfg(test)` 单测仍可在无池 `ChainOffState` 上跑内存态。

use axum::http::StatusCode;
use axum::Json;
use serde_json::Value;

use super::ChainOffState;

/// 生产/预发：必须有 `DATABASE_URL` 成功连接后的池，否则变异返回 **503**。
/// 单元测试（`cargo test`）：允许无池，沿用内存 store。
pub(crate) fn ensure_durable_writes_available(
    state: &ChainOffState,
) -> Result<(), (StatusCode, Json<Value>)> {
    if state.db_pool.is_some() {
        return Ok(());
    }
    #[cfg(test)]
    {
        return Ok(());
    }
    #[cfg(not(test))]
    {
        Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "status": "error",
                "error": "database_required",
                "message": "database_required",
                "reason": "DATABASE_URL is not configured; durable writes are disabled",
            })),
        ))
    }
}
