//! 工单处置、申诉台账、推荐快照

use sqlx::postgres::{PgConnection, PgPool};
use uuid::Uuid;

use super::types::{CommunityRankingSnapshotRow, CommunityReportAppealRow, CommunityReportRow};

pub async fn update_community_report_moderation_conn(
    conn: &mut PgConnection,
    id: Uuid,
    expected_version: i32,
    new_status: &str,
    admin_notes: Option<&str>,
    disposition: Option<&str>,
) -> Result<Option<CommunityReportRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityReportRow>(
        r#"
        UPDATE community_reports SET
            status = $1,
            admin_notes = COALESCE($2, admin_notes),
            disposition = COALESCE($3, disposition),
            version = version + 1,
            updated_at = now()
        WHERE id = $4 AND version = $5
        RETURNING
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
        "#,
    )
    .bind(new_status)
    .bind(admin_notes)
    .bind(disposition)
    .bind(id)
    .bind(expected_version)
    .fetch_optional(conn)
    .await
}

pub async fn update_community_report_moderation(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    new_status: &str,
    admin_notes: Option<&str>,
    disposition: Option<&str>,
) -> Result<Option<CommunityReportRow>, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    update_community_report_moderation_conn(
        &mut conn,
        id,
        expected_version,
        new_status,
        admin_notes,
        disposition,
    )
    .await
}

/// 运营侧申诉台账（新在前）；`limit` 由路由层钳制；`status_filter` 为表内 CHECK 值。
pub async fn list_community_report_appeals_admin(
    pool: &PgPool,
    limit: i64,
    report_id: Option<Uuid>,
    status_filter: Option<&str>,
) -> Result<Vec<CommunityReportAppealRow>, sqlx::Error> {
    match (report_id, status_filter) {
        (Some(rid), Some(st)) => {
            sqlx::query_as::<_, CommunityReportAppealRow>(
                r#"
                SELECT
                    id,
                    report_id,
                    appellant_id,
                    body,
                    status,
                    reviewer_note,
                    version,
                    created_at,
                    reviewed_at
                FROM community_report_appeals
                WHERE report_id = $1 AND status = $2
                ORDER BY created_at DESC
                LIMIT $3
                "#,
            )
            .bind(rid)
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
        (Some(rid), None) => {
            sqlx::query_as::<_, CommunityReportAppealRow>(
                r#"
                SELECT
                    id,
                    report_id,
                    appellant_id,
                    body,
                    status,
                    reviewer_note,
                    version,
                    created_at,
                    reviewed_at
                FROM community_report_appeals
                WHERE report_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                "#,
            )
            .bind(rid)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
        (None, Some(st)) => {
            sqlx::query_as::<_, CommunityReportAppealRow>(
                r#"
                SELECT
                    id,
                    report_id,
                    appellant_id,
                    body,
                    status,
                    reviewer_note,
                    version,
                    created_at,
                    reviewed_at
                FROM community_report_appeals
                WHERE status = $1
                ORDER BY created_at DESC
                LIMIT $2
                "#,
            )
            .bind(st)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
        (None, None) => {
            sqlx::query_as::<_, CommunityReportAppealRow>(
                r#"
                SELECT
                    id,
                    report_id,
                    appellant_id,
                    body,
                    status,
                    reviewer_note,
                    version,
                    created_at,
                    reviewed_at
                FROM community_report_appeals
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await
        }
    }
}

pub async fn get_community_report_appeal_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<CommunityReportAppealRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityReportAppealRow>(
        r#"
        SELECT
            id,
            report_id,
            appellant_id,
            body,
            status,
            reviewer_note,
            version,
            created_at,
            reviewed_at
        FROM community_report_appeals
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn review_community_report_appeal(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    new_status: &str,
    reviewer_note: Option<&str>,
) -> Result<Option<CommunityReportAppealRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityReportAppealRow>(
        r#"
        UPDATE community_report_appeals SET
            status = $1,
            reviewer_note = COALESCE($2, reviewer_note),
            version = version + 1,
            reviewed_at = now()
        WHERE id = $3 AND version = $4 AND status = 'pending'
        RETURNING
            id,
            report_id,
            appellant_id,
            body,
            status,
            reviewer_note,
            version,
            created_at,
            reviewed_at
        "#,
    )
    .bind(new_status)
    .bind(reviewer_note)
    .bind(id)
    .bind(expected_version)
    .fetch_optional(pool)
    .await
}

pub async fn insert_community_ranking_snapshot(
    pool: &PgPool,
    feed_mode: &str,
    item_count: i32,
    top_post_ids: &[Uuid],
    notes: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO community_ranking_snapshots (feed_mode, item_count, top_post_ids, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(feed_mode)
    .bind(item_count)
    .bind(top_post_ids)
    .bind(notes)
    .fetch_one(pool)
    .await
}

/// `feed_mode_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_community_ranking_snapshots(
    pool: &PgPool,
    feed_mode_pattern: Option<&str>,
    limit: i64,
) -> Result<Vec<CommunityRankingSnapshotRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityRankingSnapshotRow>(
        r#"
        SELECT id, feed_mode, item_count, top_post_ids, notes, created_at
        FROM community_ranking_snapshots
        WHERE ($1::text IS NULL OR feed_mode ILIKE $1 ESCAPE '\')
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(feed_mode_pattern)
    .bind(limit)
    .fetch_all(pool)
    .await
}
