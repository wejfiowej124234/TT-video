//! 160 §5：`community_risk_signals` / `community_policy_change_logs`（滥用命中留痕 + 策略变更审计）

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::postgres::PgPool;
use sqlx::types::Json;
use uuid::Uuid;

use super::community::CommunityAbusePolicyRow;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityRiskSignalRow {
    pub id: Uuid,
    pub subject_user_id: Uuid,
    pub signal_type: String,
    pub rule_id: String,
    pub severity: String,
    pub context: Json<Value>,
    pub created_at: DateTime<Utc>,
}

/// 滥用策略命中时 best-effort 写入；失败不影响主路径。
pub async fn insert_community_risk_signal(
    pool: &PgPool,
    subject_user_id: Uuid,
    signal_type: &str,
    rule_id: &str,
    severity: &str,
    context: Value,
) {
    let _ = sqlx::query(
        r#"INSERT INTO community_risk_signals (subject_user_id, signal_type, rule_id, severity, context)
           VALUES ($1, $2, $3, $4, $5)"#,
    )
    .bind(subject_user_id)
    .bind(signal_type)
    .bind(rule_id)
    .bind(severity)
    .bind(Json(context))
    .execute(pool)
    .await;
}

/// `signal_type_pattern` / `rule_id_pattern` / `severity_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
/// **`rule_id`** 对 **NULL** 按空串参与 **ILIKE**。
pub async fn list_community_risk_signals_admin(
    pool: &PgPool,
    limit: i64,
    subject_user_id: Option<Uuid>,
    signal_type_pattern: Option<&str>,
    rule_id_pattern: Option<&str>,
    severity_pattern: Option<&str>,
) -> Result<Vec<CommunityRiskSignalRow>, sqlx::Error> {
    let lim = limit.clamp(1, 200);
    sqlx::query_as::<_, CommunityRiskSignalRow>(
        r#"
        SELECT id, subject_user_id, signal_type, rule_id, severity, context, created_at
        FROM community_risk_signals
        WHERE ($1::uuid IS NULL OR subject_user_id = $1)
          AND ($2::text IS NULL OR signal_type ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR COALESCE(rule_id, '') ILIKE $3 ESCAPE '\')
          AND ($4::text IS NULL OR severity ILIKE $4 ESCAPE '\')
        ORDER BY created_at DESC
        LIMIT $5
        "#,
    )
    .bind(subject_user_id)
    .bind(signal_type_pattern)
    .bind(rule_id_pattern)
    .bind(severity_pattern)
    .bind(lim)
    .fetch_all(pool)
    .await
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CommunityPolicyChangeLogRow {
    pub id: Uuid,
    pub actor_id: Option<Uuid>,
    pub scope: String,
    pub summary: String,
    pub before_snapshot: Json<Value>,
    pub after_snapshot: Json<Value>,
    pub source: String,
    pub created_at: DateTime<Utc>,
}

/// `scope_pattern` / `summary_pattern` / `source_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_community_policy_change_logs_admin(
    pool: &PgPool,
    scope_pattern: Option<&str>,
    summary_pattern: Option<&str>,
    source_pattern: Option<&str>,
    actor_id_eq: Option<Uuid>,
    limit: i64,
) -> Result<Vec<CommunityPolicyChangeLogRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityPolicyChangeLogRow>(
        r#"
        SELECT id, actor_id, scope, summary, before_snapshot, after_snapshot, source, created_at
        FROM community_policy_change_logs
        WHERE ($1::text IS NULL OR scope ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR summary ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR COALESCE(source, '') ILIKE $3 ESCAPE '\')
          AND ($4::uuid IS NULL OR actor_id = $4)
        ORDER BY created_at DESC
        LIMIT $5
        "#,
    )
    .bind(scope_pattern)
    .bind(summary_pattern)
    .bind(source_pattern)
    .bind(actor_id_eq)
    .bind(limit)
    .fetch_all(pool)
    .await
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CommunityAbusePolicyPatch {
    pub comment_rate_window_sec: Option<i32>,
    pub comment_max_per_window: Option<i32>,
    pub comment_min_interval_sec: Option<i32>,
    pub comment_duplicate_lookback_sec: Option<i32>,
    pub post_rate_window_sec: Option<i32>,
    pub post_max_per_window: Option<i32>,
    pub post_min_interval_sec: Option<i32>,
    pub post_duplicate_lookback_sec: Option<i32>,
    pub report_rate_window_sec: Option<i32>,
    pub report_max_per_window: Option<i32>,
    pub report_min_interval_sec: Option<i32>,
    pub report_duplicate_target_lookback_sec: Option<i32>,
}

pub fn apply_community_abuse_policy_patch(
    mut p: CommunityAbusePolicyRow,
    patch: &CommunityAbusePolicyPatch,
) -> CommunityAbusePolicyRow {
    if let Some(v) = patch.comment_rate_window_sec {
        p.comment_rate_window_sec = v;
    }
    if let Some(v) = patch.comment_max_per_window {
        p.comment_max_per_window = v;
    }
    if let Some(v) = patch.comment_min_interval_sec {
        p.comment_min_interval_sec = v;
    }
    if let Some(v) = patch.comment_duplicate_lookback_sec {
        p.comment_duplicate_lookback_sec = v;
    }
    if let Some(v) = patch.post_rate_window_sec {
        p.post_rate_window_sec = v;
    }
    if let Some(v) = patch.post_max_per_window {
        p.post_max_per_window = v;
    }
    if let Some(v) = patch.post_min_interval_sec {
        p.post_min_interval_sec = v;
    }
    if let Some(v) = patch.post_duplicate_lookback_sec {
        p.post_duplicate_lookback_sec = v;
    }
    if let Some(v) = patch.report_rate_window_sec {
        p.report_rate_window_sec = v;
    }
    if let Some(v) = patch.report_max_per_window {
        p.report_max_per_window = v;
    }
    if let Some(v) = patch.report_min_interval_sec {
        p.report_min_interval_sec = v;
    }
    if let Some(v) = patch.report_duplicate_target_lookback_sec {
        p.report_duplicate_target_lookback_sec = v;
    }
    p
}

/// 与迁移 `CHECK` 对齐；违反时返回机器键。
pub fn validate_community_abuse_policy_row(
    p: &CommunityAbusePolicyRow,
) -> Result<(), &'static str> {
    if !(10..=86400).contains(&p.comment_rate_window_sec) {
        return Err("invalid_comment_rate_window_sec");
    }
    if !(1..=2000).contains(&p.comment_max_per_window) {
        return Err("invalid_comment_max_per_window");
    }
    if !(0..=3600).contains(&p.comment_min_interval_sec) {
        return Err("invalid_comment_min_interval_sec");
    }
    if !(0..=2_592_000).contains(&p.comment_duplicate_lookback_sec) {
        return Err("invalid_comment_duplicate_lookback_sec");
    }
    if !(60..=86400).contains(&p.post_rate_window_sec) {
        return Err("invalid_post_rate_window_sec");
    }
    if !(1..=500).contains(&p.post_max_per_window) {
        return Err("invalid_post_max_per_window");
    }
    if !(0..=86400).contains(&p.post_min_interval_sec) {
        return Err("invalid_post_min_interval_sec");
    }
    if !(0..=2_592_000).contains(&p.post_duplicate_lookback_sec) {
        return Err("invalid_post_duplicate_lookback_sec");
    }
    if !(60..=2_592_000).contains(&p.report_rate_window_sec) {
        return Err("invalid_report_rate_window_sec");
    }
    if !(1..=500).contains(&p.report_max_per_window) {
        return Err("invalid_report_max_per_window");
    }
    if !(0..=86400).contains(&p.report_min_interval_sec) {
        return Err("invalid_report_min_interval_sec");
    }
    if !(0..=7_776_000).contains(&p.report_duplicate_target_lookback_sec) {
        return Err("invalid_report_duplicate_target_lookback_sec");
    }
    Ok(())
}

pub async fn save_community_abuse_policy_and_audit_log(
    pool: &PgPool,
    actor_id: Uuid,
    after: &CommunityAbusePolicyRow,
    before: &CommunityAbusePolicyRow,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE community_abuse_policy SET
            comment_rate_window_sec = $1, comment_max_per_window = $2,
            comment_min_interval_sec = $3, comment_duplicate_lookback_sec = $4,
            post_rate_window_sec = $5, post_max_per_window = $6,
            post_min_interval_sec = $7, post_duplicate_lookback_sec = $8,
            report_rate_window_sec = $9, report_max_per_window = $10,
            report_min_interval_sec = $11, report_duplicate_target_lookback_sec = $12,
            updated_at = now()
           WHERE id = 1"#,
    )
    .bind(after.comment_rate_window_sec)
    .bind(after.comment_max_per_window)
    .bind(after.comment_min_interval_sec)
    .bind(after.comment_duplicate_lookback_sec)
    .bind(after.post_rate_window_sec)
    .bind(after.post_max_per_window)
    .bind(after.post_min_interval_sec)
    .bind(after.post_duplicate_lookback_sec)
    .bind(after.report_rate_window_sec)
    .bind(after.report_max_per_window)
    .bind(after.report_min_interval_sec)
    .bind(after.report_duplicate_target_lookback_sec)
    .execute(&mut *tx)
    .await?;
    let before_v =
        serde_json::to_value(before).unwrap_or_else(|_| Value::Object(Default::default()));
    let after_v = serde_json::to_value(after).unwrap_or_else(|_| Value::Object(Default::default()));
    sqlx::query(
        r#"INSERT INTO community_policy_change_logs
           (actor_id, scope, summary, before_snapshot, after_snapshot, source)
           VALUES ($1, $2, $3, $4, $5, $6)"#,
    )
    .bind(actor_id)
    .bind("community_abuse_policy")
    .bind("admin patch community_abuse_policy")
    .bind(Json(before_v))
    .bind(Json(after_v))
    .bind("admin_api")
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(())
}
