//! G-S7 · Growth analytics & KOL read-only aggregates（102 G4/G7 · 无写路径）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct GrowthAnalyticsWindow {
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct FraudStatusBreakdownRow {
    pub growth_fraud_status: String,
    pub user_count: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct EarlyBirdDistributionRow {
    pub early_bird_stage: Option<i32>,
    pub user_count: i64,
    pub points_sum: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct AirdropAnalyticsSummary {
    pub campaign_count: i64,
    pub snapshot_locked_count: i64,
    pub calculated_count: i64,
    pub total_snapshot_rows: i64,
    pub total_eligible_rows: i64,
    pub latest_campaign_name: Option<String>,
    pub latest_campaign_status: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GrowthAnalyticsOverview {
    pub window: GrowthAnalyticsWindow,
    pub registrations_total: i64,
    pub registrations_with_referral: i64,
    pub referral_events_total: i64,
    pub users_with_points: i64,
    pub total_growth_points: i64,
    pub referral_code_active_count: i64,
    pub referral_code_conversion_uses: i64,
    pub fraud_breakdown: Vec<FraudStatusBreakdownRow>,
    pub frozen_or_ineligible_count: i64,
    pub frozen_or_ineligible_pct: f64,
    pub early_bird_distribution: Vec<EarlyBirdDistributionRow>,
    pub airdrop: AirdropAnalyticsSummary,
}

#[derive(Debug, Clone, Serialize)]
pub struct RegistrationFunnelStep {
    pub step: &'static str,
    pub count: i64,
    pub rate_from_start_pct: f64,
    pub rate_from_previous_pct: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GrowthAnalyticsFunnel {
    pub window: GrowthAnalyticsWindow,
    pub steps: Vec<RegistrationFunnelStep>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct TopReferrerRow {
    pub user_id: Uuid,
    pub email: Option<String>,
    pub referral_code: Option<String>,
    pub invite_count: i64,
    pub points_awarded_referrer: i64,
    pub growth_points: i64,
    pub growth_fraud_status: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct KolContributionRow {
    pub id: Uuid,
    pub code: String,
    pub label: Option<String>,
    pub owner_user_id: Option<Uuid>,
    pub owner_email: Option<String>,
    pub use_count: i32,
    pub max_uses: Option<i32>,
    pub is_active: bool,
    pub invite_count: i64,
    pub points_awarded: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct KolInviteEventRow {
    pub referred_user_id: Uuid,
    pub points_awarded_referrer: i64,
    pub points_awarded_referred: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct KolContributionDetail {
    pub item: KolContributionRow,
    pub recent_invites: Vec<KolInviteEventRow>,
}

fn pct(n: i64, d: i64) -> f64 {
    if d <= 0 {
        0.0
    } else {
        (n as f64 / d as f64) * 100.0
    }
}

pub fn build_registration_funnel(
    registrations: i64,
    with_referral: i64,
    referral_events: i64,
    with_points: i64,
) -> Vec<RegistrationFunnelStep> {
    let steps = [
        ("registrations", registrations),
        ("with_referral", with_referral),
        ("referral_events", referral_events),
        ("with_points", with_points),
    ];
    let mut out = Vec::with_capacity(steps.len());
    let start = registrations.max(1);
    let mut prev = registrations;
    for (i, (step, count)) in steps.into_iter().enumerate() {
        out.push(RegistrationFunnelStep {
            step,
            count,
            rate_from_start_pct: pct(count, start),
            rate_from_previous_pct: if i == 0 {
                None
            } else {
                Some(pct(count, prev.max(1)))
            },
        });
        prev = count;
    }
    out
}

pub async fn growth_analytics_overview(
    pool: &PgPool,
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
) -> Result<GrowthAnalyticsOverview, sqlx::Error> {
    let registrations_total: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM users
        WHERE ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at < $2)
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(pool)
    .await?;

    let registrations_with_referral: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM users
        WHERE referred_by_user_id IS NOT NULL
          AND ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at < $2)
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(pool)
    .await?;

    let referral_events_total: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM referral_events
        WHERE ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at < $2)
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(pool)
    .await?;

    let users_with_points: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM users
        WHERE growth_points > 0
          AND ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at < $2)
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(pool)
    .await?;

    let total_growth_points: (i64,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(growth_points), 0)::bigint
        FROM users
        WHERE ($1::timestamptz IS NULL OR created_at >= $1)
          AND ($2::timestamptz IS NULL OR created_at < $2)
        "#,
    )
    .bind(from)
    .bind(to)
    .fetch_one(pool)
    .await?;

    let referral_code_active_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM referral_codes WHERE is_active = true",
    )
    .fetch_one(pool)
    .await?;

    let referral_code_conversion_uses: (i64,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(use_count), 0)::bigint
        FROM referral_codes
        WHERE is_active = true
        "#,
    )
    .fetch_one(pool)
    .await?;

    let fraud_breakdown: Vec<FraudStatusBreakdownRow> = sqlx::query_as(
        r#"
        SELECT growth_fraud_status, COUNT(*)::bigint AS user_count
        FROM users
        GROUP BY growth_fraud_status
        ORDER BY user_count DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let frozen_or_ineligible_count: i64 = fraud_breakdown
        .iter()
        .filter(|r| {
            r.growth_fraud_status != "normal"
        })
        .map(|r| r.user_count)
        .sum();
    let total_users: i64 = fraud_breakdown.iter().map(|r| r.user_count).sum();
    let frozen_or_ineligible_pct = pct(frozen_or_ineligible_count, total_users);

    let early_bird_distribution: Vec<EarlyBirdDistributionRow> = sqlx::query_as(
        r#"
        SELECT early_bird_stage, COUNT(*)::bigint AS user_count,
               COALESCE(SUM(growth_points), 0)::bigint AS points_sum
        FROM users
        GROUP BY early_bird_stage
        ORDER BY early_bird_stage NULLS LAST
        "#,
    )
    .fetch_all(pool)
    .await?;

    let airdrop = airdrop_analytics_summary(pool).await?;

    Ok(GrowthAnalyticsOverview {
        window: GrowthAnalyticsWindow { from, to },
        registrations_total: registrations_total.0,
        registrations_with_referral: registrations_with_referral.0,
        referral_events_total: referral_events_total.0,
        users_with_points: users_with_points.0,
        total_growth_points: total_growth_points.0,
        referral_code_active_count: referral_code_active_count.0,
        referral_code_conversion_uses: referral_code_conversion_uses.0,
        fraud_breakdown,
        frozen_or_ineligible_count,
        frozen_or_ineligible_pct,
        early_bird_distribution,
        airdrop,
    })
}

pub async fn growth_analytics_funnel(
    pool: &PgPool,
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
) -> Result<GrowthAnalyticsFunnel, sqlx::Error> {
    let overview = growth_analytics_overview(pool, from, to).await?;
    let steps = build_registration_funnel(
        overview.registrations_total,
        overview.registrations_with_referral,
        overview.referral_events_total,
        overview.users_with_points,
    );
    Ok(GrowthAnalyticsFunnel {
        window: overview.window,
        steps,
    })
}

async fn airdrop_analytics_summary(pool: &PgPool) -> Result<AirdropAnalyticsSummary, sqlx::Error> {
    let campaign_count: (i64,) =
        sqlx::query_as("SELECT COUNT(*)::bigint FROM airdrop_campaigns")
            .fetch_one(pool)
            .await?;
    let snapshot_locked_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM airdrop_campaigns WHERE status = 'snapshot_locked'",
    )
    .fetch_one(pool)
    .await?;
    let calculated_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM airdrop_campaigns WHERE status = 'calculated'",
    )
    .fetch_one(pool)
    .await?;
    let total_snapshot_rows: (i64,) =
        sqlx::query_as("SELECT COUNT(*)::bigint FROM airdrop_snapshots")
            .fetch_one(pool)
            .await?;
    let total_eligible_rows: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM airdrop_snapshots WHERE eligible = true",
    )
    .fetch_one(pool)
    .await?;
    let latest: Option<(String, String)> = sqlx::query_as(
        r#"
        SELECT name, status
        FROM airdrop_campaigns
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .fetch_optional(pool)
    .await?;

    Ok(AirdropAnalyticsSummary {
        campaign_count: campaign_count.0,
        snapshot_locked_count: snapshot_locked_count.0,
        calculated_count: calculated_count.0,
        total_snapshot_rows: total_snapshot_rows.0,
        total_eligible_rows: total_eligible_rows.0,
        latest_campaign_name: latest.as_ref().map(|(n, _)| n.clone()),
        latest_campaign_status: latest.map(|(_, s)| s),
    })
}

pub async fn list_top_referrers(
    pool: &PgPool,
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<TopReferrerRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT u.id AS user_id,
               u.email,
               u.referral_code,
               COUNT(re.id)::bigint AS invite_count,
               COALESCE(SUM(re.points_awarded_referrer), 0)::bigint AS points_awarded_referrer,
               u.growth_points,
               u.growth_fraud_status
        FROM referral_events re
        JOIN users u ON u.id = re.referrer_user_id
        WHERE ($1::timestamptz IS NULL OR re.created_at >= $1)
          AND ($2::timestamptz IS NULL OR re.created_at < $2)
        GROUP BY u.id, u.email, u.referral_code, u.growth_points, u.growth_fraud_status
        ORDER BY invite_count DESC, points_awarded_referrer DESC
        LIMIT $3
        "#,
    )
    .bind(from)
    .bind(to)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn list_kol_contributions(
    pool: &PgPool,
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<KolContributionRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT rc.id,
               rc.code,
               rc.label,
               rc.owner_user_id,
               ou.email AS owner_email,
               rc.use_count,
               rc.max_uses,
               rc.is_active,
               COUNT(re.id)::bigint AS invite_count,
               COALESCE(SUM(re.points_awarded_referrer), 0)::bigint AS points_awarded
        FROM referral_codes rc
        LEFT JOIN users ou ON ou.id = rc.owner_user_id
        LEFT JOIN referral_events re
            ON re.referral_code_id = rc.id
           AND ($1::timestamptz IS NULL OR re.created_at >= $1)
           AND ($2::timestamptz IS NULL OR re.created_at < $2)
        WHERE rc.code_type = 'kol'
        GROUP BY rc.id, rc.code, rc.label, rc.owner_user_id, ou.email,
                 rc.use_count, rc.max_uses, rc.is_active
        ORDER BY invite_count DESC, rc.use_count DESC
        LIMIT $3
        "#,
    )
    .bind(from)
    .bind(to)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_kol_contribution_detail(
    pool: &PgPool,
    code_id: Uuid,
    from: Option<DateTime<Utc>>,
    to: Option<DateTime<Utc>>,
    invite_limit: i64,
) -> Result<Option<KolContributionDetail>, sqlx::Error> {
    let item: Option<KolContributionRow> = sqlx::query_as(
        r#"
        SELECT rc.id,
               rc.code,
               rc.label,
               rc.owner_user_id,
               ou.email AS owner_email,
               rc.use_count,
               rc.max_uses,
               rc.is_active,
               COUNT(re.id)::bigint AS invite_count,
               COALESCE(SUM(re.points_awarded_referrer), 0)::bigint AS points_awarded
        FROM referral_codes rc
        LEFT JOIN users ou ON ou.id = rc.owner_user_id
        LEFT JOIN referral_events re
            ON re.referral_code_id = rc.id
           AND ($2::timestamptz IS NULL OR re.created_at >= $2)
           AND ($3::timestamptz IS NULL OR re.created_at < $3)
        WHERE rc.id = $1 AND rc.code_type = 'kol'
        GROUP BY rc.id, rc.code, rc.label, rc.owner_user_id, ou.email,
                 rc.use_count, rc.max_uses, rc.is_active
        "#,
    )
    .bind(code_id)
    .bind(from)
    .bind(to)
    .fetch_optional(pool)
    .await?;

    let Some(item) = item else {
        return Ok(None);
    };

    let recent_invites: Vec<KolInviteEventRow> = sqlx::query_as(
        r#"
        SELECT re.referred_user_id,
               re.points_awarded_referrer,
               re.points_awarded_referred,
               re.created_at
        FROM referral_events re
        WHERE re.referral_code_id = $1
          AND ($2::timestamptz IS NULL OR re.created_at >= $2)
          AND ($3::timestamptz IS NULL OR re.created_at < $3)
        ORDER BY re.created_at DESC
        LIMIT $4
        "#,
    )
    .bind(code_id)
    .bind(from)
    .bind(to)
    .bind(invite_limit)
    .fetch_all(pool)
    .await?;

    Ok(Some(KolContributionDetail {
        item,
        recent_invites,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn funnel_rates_from_counts() {
        let steps = build_registration_funnel(100, 40, 35, 20);
        assert_eq!(steps.len(), 4);
        assert_eq!(steps[0].step, "registrations");
        assert_eq!(steps[0].count, 100);
        assert!((steps[1].rate_from_start_pct - 40.0).abs() < 0.01);
        assert!((steps[3].rate_from_start_pct - 20.0).abs() < 0.01);
    }

    #[test]
    fn funnel_zero_safe() {
        let steps = build_registration_funnel(0, 0, 0, 0);
        assert_eq!(steps[0].rate_from_start_pct, 0.0);
    }
}
