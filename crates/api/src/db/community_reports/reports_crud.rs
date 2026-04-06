//! 举报写入、校验、列表（用户侧 + Admin 列表）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::types::CommunityReportRow;

pub async fn community_report_target_exists(
    pool: &PgPool,
    target_type: &str,
    target_id: Uuid,
) -> Result<bool, sqlx::Error> {
    match target_type {
        "post" => {
            let n: i64 =
                sqlx::query_scalar("SELECT COUNT(*)::bigint FROM community_posts WHERE id = $1")
                    .bind(target_id)
                    .fetch_one(pool)
                    .await?;
            Ok(n > 0)
        }
        "user" => {
            let n: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users WHERE id = $1")
                .bind(target_id)
                .fetch_one(pool)
                .await?;
            Ok(n > 0)
        }
        "comment" => {
            let n: i64 =
                sqlx::query_scalar("SELECT COUNT(*)::bigint FROM community_comments WHERE id = $1")
                    .bind(target_id)
                    .fetch_one(pool)
                    .await?;
            Ok(n > 0)
        }
        "message" => {
            let n: i64 = sqlx::query_scalar(
                "SELECT COUNT(*)::bigint FROM community_dm_messages WHERE id = $1",
            )
            .bind(target_id)
            .fetch_one(pool)
            .await?;
            Ok(n > 0)
        }
        "other" => Ok(true),
        _ => Ok(false),
    }
}

pub async fn insert_community_report(
    pool: &PgPool,
    reporter_id: Uuid,
    target_type: &str,
    target_id: Uuid,
    reason_code: &str,
    details: Option<&str>,
    evidence_ref: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
    let id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO community_reports (
            reporter_id, target_type, target_id, reason_code, details, evidence_ref
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
    )
    .bind(reporter_id)
    .bind(target_type)
    .bind(target_id)
    .bind(reason_code)
    .bind(details)
    .bind(evidence_ref)
    .fetch_one(pool)
    .await?;
    Ok(id)
}

pub async fn count_user_community_reports_since(
    pool: &PgPool,
    reporter_id: Uuid,
    since: DateTime<Utc>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM community_reports WHERE reporter_id = $1 AND created_at >= $2",
    )
    .bind(reporter_id)
    .bind(since)
    .fetch_one(pool)
    .await
}

pub async fn latest_user_community_report_created_at(
    pool: &PgPool,
    reporter_id: Uuid,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    sqlx::query_scalar::<_, DateTime<Utc>>(
        "SELECT created_at FROM community_reports WHERE reporter_id = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(reporter_id)
    .fetch_optional(pool)
    .await
}

/// 同一举报人对同一 `target_type`+`target_id` 在窗口内是否已有工单（任意状态均计，防重复灌单）。
pub async fn duplicate_community_report_on_target_exists(
    pool: &PgPool,
    reporter_id: Uuid,
    target_type: &str,
    target_id: Uuid,
    since: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar::<_, bool>(
        r#"SELECT EXISTS(
            SELECT 1 FROM community_reports
            WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND created_at >= $4
        )"#,
    )
    .bind(reporter_id)
    .bind(target_type)
    .bind(target_id)
    .bind(since)
    .fetch_one(pool)
    .await
}

/// 工单已结案（`resolved`/`dismissed`）后，利益相关方可发起申诉。
pub fn community_report_status_allows_user_appeal(status: &str) -> bool {
    matches!(status, "resolved" | "dismissed")
}

/// 举报人、被举报用户、帖子作者、评论作者、私信发送者可申诉（`other` 仅举报人）。
pub async fn community_user_may_file_appeal(
    pool: &PgPool,
    report: &CommunityReportRow,
    uid: Uuid,
) -> Result<bool, sqlx::Error> {
    if report.reporter_id == uid {
        return Ok(true);
    }
    match report.target_type.as_str() {
        "user" => Ok(report.target_id == uid),
        "post" => {
            let author: Option<Uuid> =
                sqlx::query_scalar("SELECT user_id FROM community_posts WHERE id = $1")
                    .bind(report.target_id)
                    .fetch_optional(pool)
                    .await?;
            Ok(author.map(|a| a == uid).unwrap_or(false))
        }
        "comment" => {
            let author: Option<Uuid> =
                sqlx::query_scalar("SELECT user_id FROM community_comments WHERE id = $1")
                    .bind(report.target_id)
                    .fetch_optional(pool)
                    .await?;
            Ok(author.map(|a| a == uid).unwrap_or(false))
        }
        "message" => {
            let sender: Option<Uuid> =
                sqlx::query_scalar("SELECT sender_id FROM community_dm_messages WHERE id = $1")
                    .bind(report.target_id)
                    .fetch_optional(pool)
                    .await?;
            Ok(sender.map(|a| a == uid).unwrap_or(false))
        }
        "other" => Ok(false),
        _ => Ok(false),
    }
}

pub async fn count_pending_appeals_for_report(
    pool: &PgPool,
    report_id: Uuid,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)::bigint
        FROM community_report_appeals
        WHERE report_id = $1 AND status = 'pending'
        "#,
    )
    .bind(report_id)
    .fetch_one(pool)
    .await
}

pub async fn insert_community_report_appeal(
    pool: &PgPool,
    report_id: Uuid,
    appellant_id: Uuid,
    body: &str,
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO community_report_appeals (report_id, appellant_id, body)
        VALUES ($1, $2, $3)
        RETURNING id
        "#,
    )
    .bind(report_id)
    .bind(appellant_id)
    .bind(body)
    .fetch_one(pool)
    .await
}

pub async fn get_community_report_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<CommunityReportRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityReportRow>(
        r#"
        SELECT
            id,
            reporter_id,
            target_type,
            target_id,
            reason_code,
            details,
            evidence_ref,
            status,
            version,
            admin_notes,
            disposition,
            created_at,
            updated_at
        FROM community_reports
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// 当前用户作为举报人提交的工单列表（新在前）；`limit` 由路由层钳制。
pub async fn list_community_reports_for_reporter(
    pool: &PgPool,
    reporter_id: Uuid,
    limit: i64,
) -> Result<Vec<CommunityReportRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityReportRow>(
        r#"
        SELECT
            id,
            reporter_id,
            target_type,
            target_id,
            reason_code,
            details,
            evidence_ref,
            status,
            version,
            admin_notes,
            disposition,
            created_at,
            updated_at
        FROM community_reports
        WHERE reporter_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(reporter_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// `target_type_pattern` / `reason_code_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_community_reports_admin(
    pool: &PgPool,
    limit: i64,
    status_filter: Option<&str>,
    reporter_id: Option<Uuid>,
    target_type_pattern: Option<&str>,
    reason_code_pattern: Option<&str>,
    target_id: Option<Uuid>,
) -> Result<Vec<CommunityReportRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityReportRow>(
        r#"
        SELECT
            id,
            reporter_id,
            target_type,
            target_id,
            reason_code,
            details,
            evidence_ref,
            status,
            version,
            admin_notes,
            disposition,
            created_at,
            updated_at
        FROM community_reports
        WHERE ($2::text IS NULL OR status = $2)
          AND ($3::uuid IS NULL OR reporter_id = $3)
          AND ($4::text IS NULL OR target_type ILIKE $4 ESCAPE '\')
          AND ($5::text IS NULL OR reason_code ILIKE $5 ESCAPE '\')
          AND ($6::uuid IS NULL OR target_id = $6)
        ORDER BY created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .bind(status_filter)
    .bind(reporter_id)
    .bind(target_type_pattern)
    .bind(reason_code_pattern)
    .bind(target_id)
    .fetch_all(pool)
    .await
}
