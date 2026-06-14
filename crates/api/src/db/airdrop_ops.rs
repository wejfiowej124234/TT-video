//! G-S6 · Airdrop snapshot & reward calculation（102 §7 · 链下 only）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct AirdropCampaignRow {
    pub id: Uuid,
    pub name: String,
    pub gov_pool_amount: i64,
    pub status: String,
    pub snapshot_at: Option<DateTime<Utc>>,
    pub network_points_total: Option<i64>,
    pub snapshot_user_count: Option<i64>,
    pub eligible_points_total: Option<i64>,
    pub calculation_version: i32,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct AirdropSnapshotRow {
    pub id: Uuid,
    pub campaign_id: Uuid,
    pub user_id: Uuid,
    pub points_at_snapshot: i64,
    pub referral_invites: i64,
    pub referral_points_awarded: i64,
    pub early_bird_stage: Option<i32>,
    pub early_bird_multiplier: Option<f64>,
    pub growth_registration_rank: Option<i64>,
    pub growth_fraud_status: String,
    pub eligible: bool,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct AirdropAllocationRow {
    pub id: Uuid,
    pub campaign_id: Uuid,
    pub user_id: Uuid,
    pub points: i64,
    pub gov_amount: i64,
    pub status: String,
    pub tx_hash: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AirdropReconcileSummary {
    pub campaign_id: Uuid,
    pub status: String,
    pub snapshot_rows: i64,
    pub eligible_rows: i64,
    pub allocation_rows: i64,
    pub snapshot_points_sum: i64,
    pub eligible_points_sum: i64,
    pub allocation_points_sum: i64,
    pub network_points_total: Option<i64>,
    pub gov_pool_amount: String,
    pub allocation_gov_sum: String,
    pub drift_points: i64,
    pub drift_eligible: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct AirdropExportRow {
    pub user_id: Uuid,
    pub points_at_snapshot: i64,
    pub referral_invites: i64,
    pub referral_points_awarded: i64,
    pub early_bird_stage: Option<i32>,
    pub early_bird_multiplier: Option<f64>,
    pub growth_fraud_status: String,
    pub eligible: bool,
    pub calculated_points: Option<i64>,
    pub notional_gov_amount: Option<String>,
    pub allocation_status: Option<String>,
}

pub fn user_eligible_for_airdrop(fraud_status: &str) -> bool {
    fraud_status == "normal"
}

pub fn compute_notional_gov(user_points: i64, eligible_total: i64, pool: i64) -> i64 {
    if eligible_total <= 0 || user_points <= 0 || pool <= 0 {
        return 0;
    }
    // integer proportion: floor(user * pool / total)
    ((user_points as i128) * (pool as i128) / (eligible_total as i128)) as i64
}

pub async fn create_airdrop_campaign(
    pool: &PgPool,
    name: &str,
    gov_pool_amount: i64,
    created_by: Option<Uuid>,
) -> Result<AirdropCampaignRow, sqlx::Error> {
    sqlx::query_as(
        r#"
        INSERT INTO airdrop_campaigns (name, gov_pool_amount, status, created_by)
        VALUES ($1, $2, 'draft', $3)
        RETURNING id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
                  snapshot_user_count, eligible_points_total, calculation_version,
                  created_by, created_at, updated_at
        "#,
    )
    .bind(name)
    .bind(gov_pool_amount)
    .bind(created_by)
    .fetch_one(pool)
    .await
}

pub async fn list_airdrop_campaigns(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<AirdropCampaignRow>, sqlx::Error> {
    let limit = limit.clamp(1, 100);
    sqlx::query_as(
        r#"
        SELECT id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
               snapshot_user_count, eligible_points_total, calculation_version,
               created_by, created_at, updated_at
        FROM airdrop_campaigns
        ORDER BY created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_airdrop_campaign(
    pool: &PgPool,
    campaign_id: Uuid,
) -> Result<Option<AirdropCampaignRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
               snapshot_user_count, eligible_points_total, calculation_version,
               created_by, created_at, updated_at
        FROM airdrop_campaigns
        WHERE id = $1
        "#,
    )
    .bind(campaign_id)
    .fetch_optional(pool)
    .await
}

pub async fn lock_airdrop_snapshot(
    pool: &PgPool,
    campaign_id: Uuid,
) -> Result<AirdropCampaignRow, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let campaign: AirdropCampaignRow = sqlx::query_as(
        r#"
        SELECT id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
               snapshot_user_count, eligible_points_total, calculation_version,
               created_by, created_at, updated_at
        FROM airdrop_campaigns
        WHERE id = $1
        FOR UPDATE
        "#,
    )
    .bind(campaign_id)
    .fetch_one(&mut *tx)
    .await?;

    if campaign.status != "draft" {
        return Err(sqlx::Error::Protocol("campaign_not_draft".into()));
    }

    sqlx::query("DELETE FROM airdrop_snapshots WHERE campaign_id = $1")
        .bind(campaign_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        r#"
        INSERT INTO airdrop_snapshots (
            campaign_id, user_id, points_at_snapshot,
            referral_invites, referral_points_awarded,
            early_bird_stage, early_bird_multiplier, growth_registration_rank,
            growth_fraud_status, eligible
        )
        SELECT
            $1,
            u.id,
            u.growth_points,
            COALESCE(ref.invites, 0),
            COALESCE(ref.pts, 0),
            u.early_bird_stage,
            ebs.multiplier,
            u.growth_registration_rank,
            u.growth_fraud_status,
            (u.growth_fraud_status = 'normal')
        FROM users u
        LEFT JOIN (
            SELECT referrer_user_id,
                   COUNT(*)::bigint AS invites,
                   COALESCE(SUM(points_awarded_referrer), 0)::bigint AS pts
            FROM referral_events
            GROUP BY referrer_user_id
        ) ref ON ref.referrer_user_id = u.id
        LEFT JOIN early_bird_stages ebs
            ON ebs.stage_number = u.early_bird_stage AND ebs.is_active = true
        WHERE u.growth_points > 0
           OR COALESCE(ref.invites, 0) > 0
           OR u.growth_registration_rank IS NOT NULL
        "#,
    )
    .bind(campaign_id)
    .execute(&mut *tx)
    .await?;

    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM airdrop_snapshots WHERE campaign_id = $1",
    )
    .bind(campaign_id)
    .fetch_one(&mut *tx)
    .await?;

    let updated: AirdropCampaignRow = sqlx::query_as(
        r#"
        UPDATE airdrop_campaigns
        SET status = 'snapshot_locked',
            snapshot_at = now(),
            snapshot_user_count = $2,
            network_points_total = NULL,
            eligible_points_total = NULL,
            calculation_version = 0,
            updated_at = now()
        WHERE id = $1
        RETURNING id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
                  snapshot_user_count, eligible_points_total, calculation_version,
                  created_by, created_at, updated_at
        "#,
    )
    .bind(campaign_id)
    .bind(count.0)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(updated)
}

pub async fn calculate_airdrop_allocations(
    pool: &PgPool,
    campaign_id: Uuid,
    recalc: bool,
) -> Result<AirdropCampaignRow, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let campaign: AirdropCampaignRow = sqlx::query_as(
        r#"
        SELECT id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
               snapshot_user_count, eligible_points_total, calculation_version,
               created_by, created_at, updated_at
        FROM airdrop_campaigns
        WHERE id = $1
        FOR UPDATE
        "#,
    )
    .bind(campaign_id)
    .fetch_one(&mut *tx)
    .await?;

    let allowed = if recalc {
        matches!(campaign.status.as_str(), "snapshot_locked" | "calculated")
    } else {
        campaign.status == "snapshot_locked"
    };
    if !allowed {
        return Err(sqlx::Error::Protocol("campaign_snapshot_not_locked".into()));
    }

    sqlx::query("DELETE FROM airdrop_allocations WHERE campaign_id = $1")
        .bind(campaign_id)
        .execute(&mut *tx)
        .await?;

    let eligible_total: (i64,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(points_at_snapshot), 0)::bigint
        FROM airdrop_snapshots
        WHERE campaign_id = $1 AND eligible = true
        "#,
    )
    .bind(campaign_id)
    .fetch_one(&mut *tx)
    .await?;

    let pool_amount = campaign.gov_pool_amount;

    let snapshots: Vec<(Uuid, i64)> = sqlx::query_as(
        r#"
        SELECT user_id, points_at_snapshot
        FROM airdrop_snapshots
        WHERE campaign_id = $1 AND eligible = true AND points_at_snapshot > 0
        "#,
    )
    .bind(campaign_id)
    .fetch_all(&mut *tx)
    .await?;

    for (user_id, points) in snapshots {
        let gov = compute_notional_gov(points, eligible_total.0, pool_amount);
        if gov <= 0 {
            continue;
        }
        sqlx::query(
            r#"
            INSERT INTO airdrop_allocations (campaign_id, user_id, points, gov_amount, status)
            VALUES ($1, $2, $3, $4, 'pending')
            ON CONFLICT (campaign_id, user_id) DO UPDATE
            SET points = EXCLUDED.points, gov_amount = EXCLUDED.gov_amount, status = 'pending'
            "#,
        )
        .bind(campaign_id)
        .bind(user_id)
        .bind(points)
        .bind(gov)
        .execute(&mut *tx)
        .await?;
    }

    let version = campaign.calculation_version + 1;
    let updated: AirdropCampaignRow = sqlx::query_as(
        r#"
        UPDATE airdrop_campaigns
        SET status = 'calculated',
            network_points_total = $2,
            eligible_points_total = $2,
            calculation_version = $3,
            updated_at = now()
        WHERE id = $1
        RETURNING id, name, gov_pool_amount::bigint AS gov_pool_amount, status, snapshot_at, network_points_total,
                  snapshot_user_count, eligible_points_total, calculation_version,
                  created_by, created_at, updated_at
        "#,
    )
    .bind(campaign_id)
    .bind(eligible_total.0)
    .bind(version)
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(updated)
}

pub async fn airdrop_reconcile_summary(
    pool: &PgPool,
    campaign_id: Uuid,
) -> Result<Option<AirdropReconcileSummary>, sqlx::Error> {
    let Some(campaign) = get_airdrop_campaign(pool, campaign_id).await? else {
        return Ok(None);
    };

    let snap: (i64, i64, i64) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*)::bigint,
            COUNT(*) FILTER (WHERE eligible)::bigint,
            COALESCE(SUM(points_at_snapshot), 0)::bigint
        FROM airdrop_snapshots
        WHERE campaign_id = $1
        "#,
    )
    .bind(campaign_id)
    .fetch_one(pool)
    .await?;

    let eligible_sum: (i64,) = sqlx::query_as(
        r#"
        SELECT COALESCE(SUM(points_at_snapshot), 0)::bigint
        FROM airdrop_snapshots
        WHERE campaign_id = $1 AND eligible = true
        "#,
    )
    .bind(campaign_id)
    .fetch_one(pool)
    .await?;

    let alloc: (i64, i64, Option<i64>) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*)::bigint,
            COALESCE(SUM(points), 0)::bigint,
            COALESCE(SUM(gov_amount), 0)::bigint
        FROM airdrop_allocations
        WHERE campaign_id = $1
        "#,
    )
    .bind(campaign_id)
    .fetch_one(pool)
    .await?;

    let gov_sum = alloc.2.map(|v| v.to_string()).unwrap_or_else(|| "0".to_string());

    Ok(Some(AirdropReconcileSummary {
        campaign_id,
        status: campaign.status.clone(),
        snapshot_rows: snap.0,
        eligible_rows: snap.1,
        allocation_rows: alloc.0,
        snapshot_points_sum: snap.2,
        eligible_points_sum: eligible_sum.0,
        allocation_points_sum: alloc.1,
        network_points_total: campaign.network_points_total,
        gov_pool_amount: campaign.gov_pool_amount.to_string(),
        allocation_gov_sum: gov_sum,
        drift_points: alloc.1 - eligible_sum.0,
        drift_eligible: eligible_sum.0 - campaign.eligible_points_total.unwrap_or(0),
    }))
}

pub async fn list_airdrop_export_rows(
    pool: &PgPool,
    campaign_id: Uuid,
    limit: i64,
) -> Result<Vec<AirdropExportRow>, sqlx::Error> {
    let limit = limit.clamp(1, 10_000);
    let rows: Vec<(Uuid, i64, i64, i64, Option<i32>, Option<f64>, String, bool, Option<i64>, Option<i64>, Option<String>)> = sqlx::query_as(
        r#"
        SELECT
            s.user_id,
            s.points_at_snapshot,
            s.referral_invites,
            s.referral_points_awarded,
            s.early_bird_stage,
            s.early_bird_multiplier::float8,
            s.growth_fraud_status,
            s.eligible,
            a.points,
            a.gov_amount::bigint,
            a.status
        FROM airdrop_snapshots s
        LEFT JOIN airdrop_allocations a
            ON a.campaign_id = s.campaign_id AND a.user_id = s.user_id
        WHERE s.campaign_id = $1
        ORDER BY s.points_at_snapshot DESC
        LIMIT $2
        "#,
    )
    .bind(campaign_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(user_id, points_at_snapshot, referral_invites, referral_points_awarded, early_bird_stage, early_bird_multiplier, growth_fraud_status, eligible, calculated_points, gov, alloc_status)| {
                AirdropExportRow {
                    user_id,
                    points_at_snapshot,
                    referral_invites,
                    referral_points_awarded,
                    early_bird_stage,
                    early_bird_multiplier,
                    growth_fraud_status,
                    eligible,
                    calculated_points,
                    notional_gov_amount: gov.map(|v| v.to_string()),
                    allocation_status: alloc_status,
                }
            },
        )
        .collect())
}

pub async fn list_campaign_snapshots(
    pool: &PgPool,
    campaign_id: Uuid,
    limit: i64,
) -> Result<Vec<AirdropSnapshotRow>, sqlx::Error> {
    let limit = limit.clamp(1, 500);
    sqlx::query_as(
        r#"
        SELECT id, campaign_id, user_id, points_at_snapshot,
               referral_invites, referral_points_awarded,
               early_bird_stage, early_bird_multiplier::float8 AS early_bird_multiplier,
               growth_registration_rank, growth_fraud_status, eligible
        FROM airdrop_snapshots
        WHERE campaign_id = $1
        ORDER BY points_at_snapshot DESC
        LIMIT $2
        "#,
    )
    .bind(campaign_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eligible_only_normal() {
        assert!(user_eligible_for_airdrop("normal"));
        assert!(!user_eligible_for_airdrop("banned"));
    }

    #[test]
    fn proportion_math() {
        assert_eq!(compute_notional_gov(10_000, 1_000_000, 10_000_000), 100_000);
        assert_eq!(compute_notional_gov(0, 100, 1000), 0);
    }
}
