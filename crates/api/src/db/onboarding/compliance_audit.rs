//! **96-04 / 96-18 R3**：合规审计事件表。

use sqlx::PgPool;
use uuid::Uuid;

use super::types::OnboardingComplianceAuditEventListRow;

/// **96-04 / 96-18 R3**：**`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** 命中后 **best-effort** 插入（**不**含 email）。
pub async fn insert_onboarding_compliance_audit_event(
    pool: &PgPool,
    user_id: Uuid,
    request_id: Option<&str>,
    route: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO onboarding_compliance_audit_events (user_id, request_id, route)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(user_id)
    .bind(request_id)
    .bind(route)
    .execute(pool)
    .await?;
    Ok(())
}

/// **Admin 70 / 96-18**：**`onboarding_compliance_audit_events`** 列表（**`user_id`** 可选；**`created_at DESC`**）。
pub async fn list_onboarding_compliance_audit_events_admin(
    pool: &PgPool,
    filter_user_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<OnboardingComplianceAuditEventListRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingComplianceAuditEventListRow>(
        r#"
        SELECT id, created_at, user_id, request_id, route, decision, screening_tier, api_error
        FROM onboarding_compliance_audit_events
        WHERE ($1::uuid IS NULL OR user_id = $1)
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(filter_user_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}
