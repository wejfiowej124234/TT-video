//! 社区审核工单审计行（160；与 `PATCH …/admin/community/moderation/:id` 同事务写入）

use chrono::{DateTime, Utc};
use sqlx::postgres::{PgConnection, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityModerationCaseRow {
    pub id: Uuid,
    pub report_id: Uuid,
    pub actor_id: Uuid,
    pub status_before: String,
    pub status_after: String,
    pub admin_notes_snapshot: Option<String>,
    pub disposition_snapshot: Option<String>,
    pub penalty_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

pub async fn insert_community_moderation_case_conn(
    conn: &mut PgConnection,
    report_id: Uuid,
    actor_id: Uuid,
    status_before: &str,
    status_after: &str,
    admin_notes_snapshot: Option<&str>,
    disposition_snapshot: Option<&str>,
    penalty_id: Option<Uuid>,
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO community_moderation_cases (
            report_id, actor_id, status_before, status_after,
            admin_notes_snapshot, disposition_snapshot, penalty_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
    )
    .bind(report_id)
    .bind(actor_id)
    .bind(status_before)
    .bind(status_after)
    .bind(admin_notes_snapshot)
    .bind(disposition_snapshot)
    .bind(penalty_id)
    .fetch_one(conn)
    .await
}

/// `status_before_pattern` / `status_after_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_community_moderation_cases_admin(
    pool: &PgPool,
    limit: i64,
    report_id: Option<Uuid>,
    actor_id: Option<Uuid>,
    status_before_pattern: Option<&str>,
    status_after_pattern: Option<&str>,
) -> Result<Vec<CommunityModerationCaseRow>, sqlx::Error> {
    let lim = limit.clamp(1, 200);
    sqlx::query_as::<_, CommunityModerationCaseRow>(
        r#"
        SELECT id, report_id, actor_id, status_before, status_after,
               admin_notes_snapshot, disposition_snapshot, penalty_id, created_at
        FROM community_moderation_cases
        WHERE ($1::uuid IS NULL OR report_id = $1)
          AND ($2::uuid IS NULL OR actor_id = $2)
          AND ($3::text IS NULL OR status_before ILIKE $3 ESCAPE '\')
          AND ($4::text IS NULL OR status_after ILIKE $4 ESCAPE '\')
        ORDER BY created_at DESC
        LIMIT $5
        "#,
    )
    .bind(report_id)
    .bind(actor_id)
    .bind(status_before_pattern)
    .bind(status_after_pattern)
    .bind(lim)
    .fetch_all(pool)
    .await
}
