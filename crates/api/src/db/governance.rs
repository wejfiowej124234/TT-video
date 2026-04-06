//! 治理池与发放记录（04 §3.4、49 G、50-G1）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 治理池单行（表仅保留一行）
#[derive(Debug)]
pub struct GovernancePoolRow {
    pub balance: Option<String>,
    pub currency: Option<String>,
    pub updated_at: DateTime<Utc>,
}

/// 发放记录行
#[derive(Debug)]
pub struct GovernanceRewardRow {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub amount: String,
    pub currency: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// 查询治理池（取第一行）
pub async fn get_governance_pool(pool: &PgPool) -> Result<Option<GovernancePoolRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (Option<String>, Option<String>, DateTime<Utc>)>(
        "SELECT balance, currency, updated_at FROM governance_pool ORDER BY updated_at DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await?;
    Ok(
        row.map(|(balance, currency, updated_at)| GovernancePoolRow {
            balance,
            currency,
            updated_at,
        }),
    )
}

/// 发放记录列表（按创建时间倒序，默认最多 100 条）
pub async fn list_governance_rewards(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<GovernanceRewardRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Option<Uuid>, String, Option<String>, String, DateTime<Utc>)>(
        "SELECT id, user_id, amount, currency, status, created_at FROM governance_reward_records ORDER BY created_at DESC LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, user_id, amount, currency, status, created_at)| GovernanceRewardRow {
                id,
                user_id,
                amount,
                currency,
                status,
                created_at,
            },
        )
        .collect())
}
