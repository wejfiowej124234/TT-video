//! Admin Cold Start Campaigns M10 (O-S4 · 101/103 SSOT)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

const PUB_DRAFT: &str = "draft";
const PUB_IN_REVIEW: &str = "in_review";
const PUB_PUBLISHED: &str = "published";
const PUB_ARCHIVED: &str = "archived";

const DEP_DRAFT: &str = "draft";
const DEP_IN_REVIEW: &str = "in_review";
const DEP_DEPLOYED: &str = "deployed";
const DEP_ROLLED_BACK: &str = "rolled_back";
const DEP_ARCHIVED: &str = "archived";

const ITEM_OFFICIAL_ACCOUNT: &str = "official_account";
const ITEM_ITINERARY_TEMPLATE: &str = "itinerary_template";
const ITEM_GUIDE_POST: &str = "guide_post";

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminColdStartItemRow {
    pub id: Uuid,
    pub campaign_id: Uuid,
    pub item_type: String,
    pub item_ref_id: Option<Uuid>,
    pub sort_order: i32,
    pub status: String,
    pub payload: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub ref_label: Option<String>,
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct AdminColdStartCampaignRow {
    pub id: Uuid,
    pub name: String,
    pub status: String,
    pub surfaces: Vec<String>,
    pub publish_status: String,
    pub version: i32,
    pub deployed_at: Option<DateTime<Utc>>,
    pub rolled_back_at: Option<DateTime<Utc>>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

async fn list_campaign_items(
    pool: &PgPool,
    campaign_id: Uuid,
) -> Result<Vec<AdminColdStartItemRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT i.id, i.campaign_id, i.item_type, i.item_ref_id, i.sort_order, i.status, i.payload,
                  i.created_at, i.updated_at,
                  CASE
                    WHEN i.item_type = 'official_account' THEN a.display_label
                    WHEN i.item_type = 'itinerary_template' THEN t.title
                    WHEN i.item_type = 'guide_post' THEN g.title
                    ELSE NULL
                  END AS ref_label
           FROM ops_cold_start_items i
           LEFT JOIN ops_official_accounts a ON i.item_type = 'official_account' AND a.id = i.item_ref_id
           LEFT JOIN ops_official_itinerary_templates t ON i.item_type = 'itinerary_template' AND t.id = i.item_ref_id
           LEFT JOIN ops_official_guide_posts g ON i.item_type = 'guide_post' AND g.id = i.item_ref_id
           WHERE i.campaign_id = $1
           ORDER BY i.sort_order ASC, i.created_at ASC"#,
    )
    .bind(campaign_id)
    .fetch_all(pool)
    .await
}

async fn reload_campaign(
    pool: &PgPool,
    id: Uuid,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    match get_cold_start_campaign_admin(pool, id).await? {
        Some(row) => Ok(Ok(row)),
        None => Ok(Err("not_found")),
    }
}

pub async fn list_cold_start_campaigns_admin(
    pool: &PgPool,
    publish_status: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminColdStartCampaignRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, name, status, surfaces, publish_status, version, deployed_at, rolled_back_at,
                  created_by, created_at, updated_at
           FROM ops_cold_start_campaigns
           WHERE ($1::text IS NULL OR publish_status = $1)
           ORDER BY updated_at DESC
           LIMIT $2"#,
    )
    .bind(publish_status)
    .bind(limit.clamp(1, 200))
    .fetch_all(pool)
    .await
}

pub async fn get_cold_start_campaign_admin(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminColdStartCampaignRow>, sqlx::Error> {
    sqlx::query_as(
        r#"SELECT id, name, status, surfaces, publish_status, version, deployed_at, rolled_back_at,
                  created_by, created_at, updated_at
           FROM ops_cold_start_campaigns WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_cold_start_campaign_with_items_admin(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<(AdminColdStartCampaignRow, Vec<AdminColdStartItemRow>)>, sqlx::Error> {
    let Some(campaign) = get_cold_start_campaign_admin(pool, id).await? else {
        return Ok(None);
    };
    let items = list_campaign_items(pool, id).await?;
    Ok(Some((campaign, items)))
}

pub struct CreateColdStartCampaignInput {
    pub name: String,
    pub surfaces: Vec<String>,
}

fn normalize_surfaces(surfaces: &[String]) -> Vec<String> {
    surfaces
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

pub async fn create_cold_start_campaign_admin(
    pool: &PgPool,
    actor_id: Uuid,
    input: CreateColdStartCampaignInput,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    let name = input.name.trim();
    if name.is_empty() {
        return Ok(Err("invalid_name"));
    }
    let surfaces = normalize_surfaces(&input.surfaces);
    let now = Utc::now();
    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO ops_cold_start_campaigns
           (name, status, surfaces, publish_status, created_by, created_at, updated_at)
           VALUES ($1, 'draft', $2, 'draft', $3, $4, $4)
           RETURNING id"#,
    )
    .bind(name)
    .bind(&surfaces)
    .bind(actor_id)
    .bind(now)
    .fetch_one(pool)
    .await?;
    insert_cold_start_audit(
        pool,
        actor_id,
        request_id,
        "ops.cold_start.campaign.created",
        id,
        json!({ "name": name, "surfaces": surfaces }),
    )
    .await?;
    reload_campaign(pool, id).await
}

#[derive(Debug, Default)]
pub struct PatchColdStartCampaignInput {
    pub name: Option<String>,
    pub surfaces: Option<Vec<String>>,
}

pub async fn patch_cold_start_campaign_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    input: PatchColdStartCampaignInput,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    let row = get_cold_start_campaign_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status == PUB_ARCHIVED || row.status == DEP_ARCHIVED {
        return Ok(Err("archived"));
    }
    if row.status == DEP_DEPLOYED {
        return Ok(Err("deployed_readonly"));
    }
    let name = input
        .name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(row.name.as_str());
    let surfaces = input
        .surfaces
        .map(|v| normalize_surfaces(&v))
        .unwrap_or(row.surfaces);
    sqlx::query(
        r#"UPDATE ops_cold_start_campaigns
           SET name = $2, surfaces = $3, version = version + 1, updated_at = $4
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(name)
    .bind(&surfaces)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_cold_start_audit(
        pool,
        actor_id,
        request_id,
        "ops.cold_start.campaign.updated",
        id,
        json!({ "name": name, "surfaces": surfaces }),
    )
    .await?;
    reload_campaign(pool, id).await
}

async fn validate_item_ref(
    pool: &PgPool,
    item_type: &str,
    item_ref_id: Uuid,
) -> Result<Result<(), &'static str>, sqlx::Error> {
    match item_type {
        ITEM_OFFICIAL_ACCOUNT => {
            let exists: Option<(Uuid,)> =
                sqlx::query_as("SELECT id FROM ops_official_accounts WHERE id = $1")
                    .bind(item_ref_id)
                    .fetch_optional(pool)
                    .await?;
            if exists.is_none() {
                return Ok(Err("official_account_not_found"));
            }
        }
        ITEM_ITINERARY_TEMPLATE => {
            let exists: Option<(String,)> = sqlx::query_as(
                "SELECT publish_status FROM ops_official_itinerary_templates WHERE id = $1",
            )
            .bind(item_ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((ps,)) = exists else {
                return Ok(Err("itinerary_template_not_found"));
            };
            if ps != PUB_PUBLISHED {
                return Ok(Err("itinerary_template_not_published"));
            }
        }
        ITEM_GUIDE_POST => {
            let exists: Option<(String,)> = sqlx::query_as(
                "SELECT publish_status FROM ops_official_guide_posts WHERE id = $1",
            )
            .bind(item_ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((ps,)) = exists else {
                return Ok(Err("guide_post_not_found"));
            };
            if ps != PUB_PUBLISHED {
                return Ok(Err("guide_post_not_published"));
            }
        }
        _ => return Ok(Err("invalid_item_type")),
    }
    Ok(Ok(()))
}

pub struct CreateColdStartItemInput {
    pub item_type: String,
    pub item_ref_id: Uuid,
    pub sort_order: i32,
    pub payload: Value,
}

pub async fn create_cold_start_item_admin(
    pool: &PgPool,
    campaign_id: Uuid,
    actor_id: Uuid,
    input: CreateColdStartItemInput,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartItemRow, &'static str>, sqlx::Error> {
    let campaign = get_cold_start_campaign_admin(pool, campaign_id).await?;
    let Some(campaign) = campaign else {
        return Ok(Err("not_found"));
    };
    if campaign.publish_status == PUB_ARCHIVED || campaign.status == DEP_DEPLOYED {
        return Ok(Err("campaign_locked"));
    }
    let item_type = input.item_type.trim();
    match validate_item_ref(pool, item_type, input.item_ref_id).await? {
        Ok(()) => {}
        Err(code) => return Ok(Err(code)),
    }
    let now = Utc::now();
    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO ops_cold_start_items
           (campaign_id, item_type, item_ref_id, sort_order, status, payload, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'pending', $5, $6, $6)
           RETURNING id"#,
    )
    .bind(campaign_id)
    .bind(item_type)
    .bind(input.item_ref_id)
    .bind(input.sort_order)
    .bind(input.payload)
    .bind(now)
    .fetch_one(pool)
    .await?;
    insert_cold_start_audit(
        pool,
        actor_id,
        request_id,
        "ops.cold_start.item.created",
        campaign_id,
        json!({ "item_id": id, "item_type": item_type, "item_ref_id": input.item_ref_id }),
    )
    .await?;
    let items = list_campaign_items(pool, campaign_id).await?;
    match items.into_iter().find(|i| i.id == id) {
        Some(item) => Ok(Ok(item)),
        None => Ok(Err("not_found")),
    }
}

pub async fn delete_cold_start_item_admin(
    pool: &PgPool,
    campaign_id: Uuid,
    item_id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<(), &'static str>, sqlx::Error> {
    let campaign = get_cold_start_campaign_admin(pool, campaign_id).await?;
    let Some(campaign) = campaign else {
        return Ok(Err("not_found"));
    };
    if campaign.status == DEP_DEPLOYED {
        return Ok(Err("campaign_locked"));
    }
    let deleted = sqlx::query(
        "DELETE FROM ops_cold_start_items WHERE id = $1 AND campaign_id = $2",
    )
    .bind(item_id)
    .bind(campaign_id)
    .execute(pool)
    .await?;
    if deleted.rows_affected() == 0 {
        return Ok(Err("item_not_found"));
    }
    insert_cold_start_audit(
        pool,
        actor_id,
        request_id,
        "ops.cold_start.item.deleted",
        campaign_id,
        json!({ "item_id": item_id }),
    )
    .await?;
    Ok(Ok(()))
}

pub async fn submit_cold_start_campaign_review(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    let row = get_cold_start_campaign_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != PUB_DRAFT {
        return Ok(Err("not_draft"));
    }
    if row.status != DEP_DRAFT && row.status != DEP_ROLLED_BACK {
        return Ok(Err("invalid_deploy_status"));
    }
    sqlx::query(
        r#"UPDATE ops_cold_start_campaigns
           SET publish_status = 'in_review', status = 'in_review', updated_at = $2
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    insert_cold_start_audit(
        pool,
        actor_id,
        request_id,
        "ops.cold_start.campaign.submit_review",
        id,
        json!({}),
    )
    .await?;
    reload_campaign(pool, id).await
}

pub async fn request_cold_start_campaign_deploy(
    pool: &PgPool,
    id: Uuid,
    requested_by: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Result<Uuid, &'static str>, sqlx::Error> {
    let row = get_cold_start_campaign_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != PUB_IN_REVIEW || row.status != DEP_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let item_count: (i64,) = sqlx::query_as(
        "SELECT count(*)::bigint FROM ops_cold_start_items WHERE campaign_id = $1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    if item_count.0 == 0 {
        return Ok(Err("no_items"));
    }
    let mut tx = pool.begin().await?;
    let approval_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO admin_approval_requests
           (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
           VALUES ('ops.cold_start.deploy', 'ops_cold_start_campaign', $1, $2, 'pending', $3, $4, $5, $6)
           RETURNING id"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(json!({ "publish_status": row.publish_status, "status": row.status, "name": row.name }))
    .bind(json!({ "publish_status": PUB_PUBLISHED, "status": DEP_DEPLOYED }))
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.cold_start.deploy.requested', 'ops_cold_start_campaign', $1, $2, $3, $4, $5)"#,
    )
    .bind(id.to_string())
    .bind(requested_by)
    .bind(request_id)
    .bind(json!({ "approval_id": approval_id }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(Ok(approval_id))
}

pub async fn deploy_cold_start_campaign_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    let row = get_cold_start_campaign_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.publish_status != PUB_IN_REVIEW || row.status != DEP_IN_REVIEW {
        return Ok(Err("not_in_review"));
    }
    let now = Utc::now();
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE ops_cold_start_campaigns
           SET publish_status = 'published', status = 'deployed', deployed_at = $2,
               rolled_back_at = NULL, version = version + 1, updated_at = $2
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(now)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"UPDATE ops_cold_start_items SET status = 'active', updated_at = $2
           WHERE campaign_id = $1 AND status IN ('pending', 'rolled_back')"#,
    )
    .bind(id)
    .bind(now)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.cold_start.deployed', 'ops_cold_start_campaign', $1, $2, $3, $4, $5)"#,
    )
    .bind(id.to_string())
    .bind(actor_id)
    .bind(request_id)
    .bind(json!({ "surfaces": row.surfaces, "version": row.version + 1 }))
    .bind(now)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    reload_campaign(pool, id).await
}

pub async fn approve_cold_start_deploy_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approver_id: Uuid,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<(Uuid, Uuid)>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let existing: Option<(String, String, String, Uuid, String)> = sqlx::query_as(
        r#"SELECT action, resource_type, resource_id, requested_by, status
           FROM admin_approval_requests WHERE id = $1 FOR UPDATE"#,
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(existing) = existing else {
        return Ok(None);
    };
    if existing.0 != "ops.cold_start.deploy" || existing.4 != "pending" {
        return Ok(None);
    }
    if existing.3 == approver_id {
        return Ok(None);
    }
    let campaign_id = Uuid::parse_str(&existing.2).unwrap_or_else(|_| Uuid::nil());
    if campaign_id.is_nil() {
        return Ok(None);
    }
    sqlx::query(
        r#"UPDATE admin_approval_requests SET status = 'approved', approved_by = $2, approve_reason = $3, approved_at = $4
           WHERE id = $1"#,
    )
    .bind(approval_id)
    .bind(approver_id)
    .bind(reason)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    match deploy_cold_start_campaign_admin(pool, campaign_id, approver_id, request_id).await? {
        Ok(_) => Ok(Some((approval_id, campaign_id))),
        Err(_) => Ok(None),
    }
}

pub async fn rollback_cold_start_campaign_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    let row = get_cold_start_campaign_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.status != DEP_DEPLOYED {
        return Ok(Err("not_deployed"));
    }
    let now = Utc::now();
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE ops_cold_start_campaigns
           SET status = 'rolled_back', rolled_back_at = $2, updated_at = $2
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(now)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"UPDATE ops_cold_start_items SET status = 'rolled_back', updated_at = $2
           WHERE campaign_id = $1 AND status = 'active'"#,
    )
    .bind(id)
    .bind(now)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
           VALUES ('ops.cold_start.rolled_back', 'ops_cold_start_campaign', $1, $2, $3, $4, $5)"#,
    )
    .bind(id.to_string())
    .bind(actor_id)
    .bind(request_id)
    .bind(json!({ "publish_status": row.publish_status }))
    .bind(now)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    reload_campaign(pool, id).await
}

pub async fn archive_cold_start_campaign_admin(
    pool: &PgPool,
    id: Uuid,
    actor_id: Uuid,
    request_id: Option<&str>,
) -> Result<Result<AdminColdStartCampaignRow, &'static str>, sqlx::Error> {
    let row = get_cold_start_campaign_admin(pool, id).await?;
    let Some(row) = row else {
        return Ok(Err("not_found"));
    };
    if row.status == DEP_DEPLOYED {
        return Ok(Err("must_rollback_first"));
    }
    let now = Utc::now();
    sqlx::query(
        r#"UPDATE ops_cold_start_campaigns
           SET publish_status = 'archived', status = 'archived', updated_at = $2
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(now)
    .execute(pool)
    .await?;
    sqlx::query(
        r#"UPDATE ops_cold_start_items SET status = 'archived', updated_at = $2 WHERE campaign_id = $1"#,
    )
    .bind(id)
    .bind(now)
    .execute(pool)
    .await?;
    insert_cold_start_audit(
        pool,
        actor_id,
        request_id,
        "ops.cold_start.campaign.archived",
        id,
        json!({}),
    )
    .await?;
    reload_campaign(pool, id).await
}

async fn insert_cold_start_audit(
    pool: &PgPool,
    actor_id: Uuid,
    request_id: Option<&str>,
    action: &str,
    campaign_id: Uuid,
    payload: Value,
) -> Result<(), sqlx::Error> {
    super::insert_admin_audit_log(
        pool,
        actor_id,
        request_id,
        action,
        Some("ops_cold_start_campaign"),
        Some(campaign_id.to_string().as_str()),
        &payload,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_surfaces_trims_empty() {
        assert_eq!(
            normalize_surfaces(&[" home ".into(), "".into(), "market".into()]),
            vec!["home", "market"]
        );
    }
}
