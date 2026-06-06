//! 社区处罚记录（160、04 §3.4）

use std::collections::HashSet;

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::{PgConnection, PgPool};
use sqlx::types::Json;
use uuid::Uuid;

use super::community_reports::CommunityReportRow;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityPenaltyRow {
    pub id: Uuid,
    pub report_id: Option<Uuid>,
    pub subject_user_id: Uuid,
    pub action: String,
    pub status: String,
    pub reason: Option<String>,
    pub created_by: Uuid,
    pub expires_at: Option<DateTime<Utc>>,
    pub metadata: Json<Value>,
    pub created_at: DateTime<Utc>,
}

/// 生效中的 `limit_feed`（未过期）：用于公共 Feed / 他人视角帖子列表与详情隐藏。
pub async fn subject_has_active_limit_feed_penalty(
    pool: &PgPool,
    subject_user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM community_penalties
        WHERE subject_user_id = $1
          AND status = 'active'
          AND action = 'limit_feed'
          AND (expires_at IS NULL OR expires_at > now())
        "#,
    )
    .bind(subject_user_id)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}

/// 生效中且阻断 UGC/社交写路径（发帖/评论/DM/点赞/收藏/关注/好友等）；`limit_feed`/`warn`/`other` 等不由此函数拦截（`limit_feed` 见 Feed 查询侧）。
pub async fn active_write_blocking_penalty_action(
    pool: &PgPool,
    subject_user_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar::<_, String>(
        r#"
        SELECT action FROM community_penalties
        WHERE subject_user_id = $1
          AND status = 'active'
          AND action IN ('mute', 'ban', 'shadow_ban')
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(subject_user_id)
    .fetch_optional(pool)
    .await
}

pub fn is_allowed_community_penalty_action(s: &str) -> bool {
    matches!(
        s,
        "warn" | "limit_feed" | "mute" | "ban" | "shadow_ban" | "content_remove" | "other"
    )
}

/// `AND` 子句：别名 **`u`**（`FROM users u`）对应用户**无**「公共向导榜剔除」生效处罚。
///
/// 与 **`active_write_blocking_penalty_action`** 的 **mute / ban / shadow_ban** 一致，并含 **limit_feed**（Feed 侧已限流展示；DID 榜同步剔除）。**warn** / **content_remove** / **other** 不据此剔除。
///
/// 用于 **`db::list_guides_did_rank_*`**（有 PostgreSQL 时）；**chain_off** 内存榜在 **`chain_off.db_pool` 存在**且 **`list_guides_did_rank` 回退内存**时，由 **`list_subject_user_ids_excluded_from_did_rank_guides`** 拉取同口径 **`subject_user_id`** 集合并过滤（见 **`routes/did_rank`**）；**无** **`db_pool`** 时**不**读库。
pub const AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES: &str = r#"
          AND NOT EXISTS (
            SELECT 1 FROM community_penalties pen
            WHERE pen.subject_user_id = u.id
              AND pen.status = 'active'
              AND pen.action IN ('mute', 'ban', 'shadow_ban', 'limit_feed')
              AND (pen.expires_at IS NULL OR pen.expires_at > now())
          )"#;

/// 与 **`AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES`** 同口径：返回应自 **DID 向导榜** 剔除的 **`subject_user_id`**（去重）。
///
/// 供 **`GET …/did-rank/guides`** 在 **PostgreSQL 榜查询失败**、回退 **chain_off** 内存排序时，仍按 **160** 处罚表剔除（批 **685**）。
pub async fn list_subject_user_ids_excluded_from_did_rank_guides(
    pool: &PgPool,
) -> Result<HashSet<Uuid>, sqlx::Error> {
    let rows: Vec<Uuid> = sqlx::query_scalar(
        r#"
        SELECT DISTINCT subject_user_id FROM community_penalties
        WHERE status = 'active'
          AND action IN ('mute', 'ban', 'shadow_ban', 'limit_feed')
          AND (expires_at IS NULL OR expires_at > now())
        "#,
    )
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().collect())
}

#[cfg(test)]
mod did_rank_penalty_filter_tests {
    #[test]
    fn and_user_not_excluded_from_did_rank_guides_covers_expected_actions() {
        let s = super::AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES;
        for a in ["mute", "ban", "shadow_ban", "limit_feed"] {
            assert!(
                s.contains(a),
                "expected `{a}` in AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES"
            );
        }
        assert!(s.contains("community_penalties"));
        assert!(s.contains("expires_at"));
    }
}

/// 结案并处罚时的默认对象：内容作者或被举报用户（`other` 类型无默认，须显式传 `subject_user_id`）。
pub async fn community_report_default_penalty_subject(
    pool: &PgPool,
    report: &CommunityReportRow,
) -> Result<Option<Uuid>, sqlx::Error> {
    match report.target_type.as_str() {
        "user" => Ok(Some(report.target_id)),
        "post" => {
            let author: Option<Uuid> =
                sqlx::query_scalar("SELECT user_id FROM community_posts WHERE id = $1")
                    .bind(report.target_id)
                    .fetch_optional(pool)
                    .await?;
            Ok(author)
        }
        "comment" => {
            let author: Option<Uuid> =
                sqlx::query_scalar("SELECT user_id FROM community_comments WHERE id = $1")
                    .bind(report.target_id)
                    .fetch_optional(pool)
                    .await?;
            Ok(author)
        }
        "message" => {
            let sender: Option<Uuid> =
                sqlx::query_scalar("SELECT sender_id FROM community_dm_messages WHERE id = $1")
                    .bind(report.target_id)
                    .fetch_optional(pool)
                    .await?;
            Ok(sender)
        }
        "other" => Ok(None),
        _ => Ok(None),
    }
}

pub async fn insert_community_penalty_conn(
    conn: &mut PgConnection,
    report_id: Option<Uuid>,
    subject_user_id: Uuid,
    action: &str,
    reason: Option<&str>,
    created_by: Uuid,
    expires_at: Option<DateTime<Utc>>,
    metadata: Option<Value>,
) -> Result<Uuid, sqlx::Error> {
    let meta = Json(metadata.unwrap_or_else(|| Value::Object(Default::default())));
    let id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO community_penalties (
            report_id, subject_user_id, action, reason, created_by, expires_at, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
    )
    .bind(report_id)
    .bind(subject_user_id)
    .bind(action)
    .bind(reason)
    .bind(created_by)
    .bind(expires_at)
    .bind(meta)
    .fetch_one(conn)
    .await?;
    Ok(id)
}

/// **`content_remove`** 处置：按工单目标下架内容（帖子 → **`archived`**；评论 → **`removed`**）。
pub async fn apply_content_remove_for_report_conn(
    conn: &mut sqlx::postgres::PgConnection,
    report: &CommunityReportRow,
) -> Result<(), sqlx::Error> {
    match report.target_type.as_str() {
        "post" => {
            sqlx::query(
                "UPDATE community_posts SET visibility_status = 'archived' WHERE id = $1",
            )
            .bind(report.target_id)
            .execute(conn)
            .await?;
        }
        "comment" => {
            sqlx::query(
                "UPDATE community_comments SET visibility_status = 'removed' WHERE id = $1",
            )
            .bind(report.target_id)
            .execute(conn)
            .await?;
        }
        _ => {}
    }
    Ok(())
}

pub async fn insert_community_penalty(
    pool: &PgPool,
    report_id: Option<Uuid>,
    subject_user_id: Uuid,
    action: &str,
    reason: Option<&str>,
    created_by: Uuid,
    expires_at: Option<DateTime<Utc>>,
    metadata: Option<Value>,
) -> Result<Uuid, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    insert_community_penalty_conn(
        &mut conn,
        report_id,
        subject_user_id,
        action,
        reason,
        created_by,
        expires_at,
        metadata,
    )
    .await
}

pub async fn list_community_penalties_admin(
    pool: &PgPool,
    limit: i64,
    subject_user_id: Option<Uuid>,
    report_id: Option<Uuid>,
    status_filter: Option<&str>,
) -> Result<Vec<CommunityPenaltyRow>, sqlx::Error> {
    let lim = limit.clamp(1, 200);
    match (subject_user_id, report_id, status_filter) {
        (Some(su), Some(rid), Some(st)) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE subject_user_id = $2 AND report_id = $3 AND status = $4
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(su)
            .bind(rid)
            .bind(st)
            .fetch_all(pool)
            .await
        }
        (Some(su), Some(rid), None) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE subject_user_id = $2 AND report_id = $3
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(su)
            .bind(rid)
            .fetch_all(pool)
            .await
        }
        (Some(su), None, Some(st)) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE subject_user_id = $2 AND status = $3
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(su)
            .bind(st)
            .fetch_all(pool)
            .await
        }
        (Some(su), None, None) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE subject_user_id = $2
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(su)
            .fetch_all(pool)
            .await
        }
        (None, Some(rid), Some(st)) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE report_id = $2 AND status = $3
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(rid)
            .bind(st)
            .fetch_all(pool)
            .await
        }
        (None, Some(rid), None) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE report_id = $2
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(rid)
            .fetch_all(pool)
            .await
        }
        (None, None, Some(st)) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                WHERE status = $2
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .bind(st)
            .fetch_all(pool)
            .await
        }
        (None, None, None) => {
            sqlx::query_as::<_, CommunityPenaltyRow>(
                r#"
                SELECT id, report_id, subject_user_id, action, status, reason, created_by,
                       expires_at, metadata, created_at
                FROM community_penalties
                ORDER BY created_at DESC
                LIMIT $1
                "#,
            )
            .bind(lim)
            .fetch_all(pool)
            .await
        }
    }
}
