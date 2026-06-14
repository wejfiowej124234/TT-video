//! G-S4 · 用户推荐中心只读聚合（102 §4.3 · 隐私边界：仅本人 · 不暴露被邀请人 PII）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use super::early_bird::resolve_early_bird_for_award;
use super::growth_ledger::{list_growth_ledger_admin, GrowthLedgerRow};
use super::growth_referral::ensure_user_referral_code;

#[derive(Debug, Clone, Serialize)]
pub struct MeReferralBinding {
    pub is_referred: bool,
    pub referred_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MeReferralStats {
    pub referrals_total: i64,
    pub referrals_register: i64,
    pub growth_points: i64,
    pub growth_fraud_status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MeEarlyBirdSummary {
    pub registration_rank: Option<i64>,
    pub stage_number: Option<i32>,
    pub multiplier: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct MeReferralEventSummary {
    pub id: Uuid,
    pub event_type: String,
    pub points_for_me: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MeReferralsSummary {
    pub referral_code: String,
    pub referral_link_path: String,
    pub binding: MeReferralBinding,
    pub stats: MeReferralStats,
    pub early_bird: MeEarlyBirdSummary,
    pub recent_referral_events: Vec<MeReferralEventSummary>,
    pub recent_ledger: Vec<GrowthLedgerRow>,
}

pub fn referral_link_path(code: &str) -> String {
    format!("/auth/register?ref={code}")
}

pub async fn get_me_referrals_summary(
    pool: &PgPool,
    user_id: Uuid,
    events_limit: i64,
    ledger_limit: i64,
) -> Result<MeReferralsSummary, sqlx::Error> {
    let referral_code = ensure_user_referral_code(pool, user_id).await?;
    let referral_link_path = referral_link_path(&referral_code);

    let user_row: (
        Option<Uuid>,
        i64,
        String,
        Option<i64>,
        Option<i32>,
    ) = sqlx::query_as(
        r#"
        SELECT referred_by_user_id, growth_points, growth_fraud_status,
               growth_registration_rank, early_bird_stage
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let (referred_by, growth_points, fraud_status, reg_rank, stage_col) = user_row;

    let referred_at: Option<(DateTime<Utc>,)> = if referred_by.is_some() {
        sqlx::query_as(
            r#"
            SELECT created_at
            FROM referral_events
            WHERE referred_user_id = $1 AND event_type = 'register'
            ORDER BY created_at ASC
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?
    } else {
        None
    };

    let ref_counts: (i64, i64) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*)::bigint,
            COUNT(*) FILTER (WHERE event_type = 'register')::bigint
        FROM referral_events
        WHERE referrer_user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let (_, multiplier) = resolve_early_bird_for_award(pool, user_id).await?;
    let early_bird = MeEarlyBirdSummary {
        registration_rank: reg_rank,
        stage_number: stage_col,
        multiplier,
    };

    let events_limit = events_limit.clamp(1, 50);
    let recent_referral_events: Vec<(Uuid, String, i64, i64, DateTime<Utc>)> = sqlx::query_as(
        r#"
        SELECT id, event_type, points_awarded_referrer, points_awarded_referred, created_at
        FROM referral_events
        WHERE referrer_user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(user_id)
    .bind(events_limit)
    .fetch_all(pool)
    .await?;

    let recent_referral_events = recent_referral_events
        .into_iter()
        .map(|(id, event_type, pts_ref, _pts_referred, created_at)| MeReferralEventSummary {
            id,
            event_type,
            points_for_me: pts_ref,
            created_at,
        })
        .collect();

    let ledger_limit = ledger_limit.clamp(1, 50);
    let recent_ledger =
        list_growth_ledger_admin(pool, Some(user_id), None, None, ledger_limit).await?;

    Ok(MeReferralsSummary {
        referral_code,
        referral_link_path,
        binding: MeReferralBinding {
            is_referred: referred_by.is_some(),
            referred_at: referred_at.map(|(t,)| t),
        },
        stats: MeReferralStats {
            referrals_total: ref_counts.0,
            referrals_register: ref_counts.1,
            growth_points,
            growth_fraud_status: fraud_status,
        },
        early_bird,
        recent_referral_events,
        recent_ledger,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn referral_link_path_includes_code() {
        assert_eq!(
            referral_link_path("TT-ABC123"),
            "/auth/register?ref=TT-ABC123"
        );
    }
}
