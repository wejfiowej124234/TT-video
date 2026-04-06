//! **`correction_log`** / **`executor_executions`** 按链运维（**110 §3.1.4**；与 **04** 附录 DDL 一致）

use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;

/// **110 §3.1.4 Partial（只读）**：按链统计 **`correction_log`**、**`executor_executions`**；**不** DELETE。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct CorrectionExecutorChainScopeRollbackDryRun {
    pub chain_id: i64,
    pub correction_log_rows: i64,
    pub executor_executions_rows: i64,
}

pub async fn correction_executor_chain_scope_rollback_dry_run(
    pool: &PgPool,
    chain_id: i64,
) -> Result<CorrectionExecutorChainScopeRollbackDryRun, sqlx::Error> {
    let correction_log_rows: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM correction_log WHERE chain_id = $1"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    let executor_executions_rows: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM executor_executions WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    Ok(CorrectionExecutorChainScopeRollbackDryRun {
        chain_id,
        correction_log_rows,
        executor_executions_rows,
    })
}

pub fn correction_executor_chain_scope_rollback_expected_confirm(chain_id: i64) -> String {
    format!("CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_{}", chain_id)
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct CorrectionExecutorChainScopeRollbackExecuteSummary {
    pub chain_id: i64,
    pub deleted_correction_log: u64,
    pub deleted_executor_executions: u64,
}

/// 单事务按 **`chain_id`** 删除 **`correction_log`**、**`executor_executions`**（**不**动 **`orders`** / **`event_log`** 等）。
pub async fn correction_executor_chain_scope_rollback_execute(
    pool: &PgPool,
    chain_id: i64,
) -> Result<CorrectionExecutorChainScopeRollbackExecuteSummary, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let deleted_correction_log = sqlx::query(r#"DELETE FROM correction_log WHERE chain_id = $1"#)
        .bind(chain_id)
        .execute(&mut *tx)
        .await?
        .rows_affected();

    let deleted_executor_executions =
        sqlx::query(r#"DELETE FROM executor_executions WHERE chain_id = $1"#)
            .bind(chain_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();

    tx.commit().await?;

    Ok(CorrectionExecutorChainScopeRollbackExecuteSummary {
        chain_id,
        deleted_correction_log,
        deleted_executor_executions,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn correction_executor_chain_scope_rollback_expected_confirm_token() {
        assert_eq!(
            correction_executor_chain_scope_rollback_expected_confirm(137),
            "CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137"
        );
    }

    #[test]
    fn correction_executor_chain_scope_rollback_dry_run_json_shape() {
        let d = CorrectionExecutorChainScopeRollbackDryRun {
            chain_id: 137,
            correction_log_rows: 3,
            executor_executions_rows: 1,
        };
        let v = serde_json::to_value(&d).expect("json");
        assert_eq!(v["chain_id"], 137);
        assert_eq!(v["correction_log_rows"], 3);
    }

    #[test]
    fn correction_executor_chain_scope_rollback_execute_summary_json_shape() {
        let s = CorrectionExecutorChainScopeRollbackExecuteSummary {
            chain_id: 137,
            deleted_correction_log: 2,
            deleted_executor_executions: 1,
        };
        let v = serde_json::to_value(&s).expect("json");
        assert_eq!(v["deleted_correction_log"], 2);
    }
}
