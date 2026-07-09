//! CampaignBuilder · public campaign surface reads from Governed Views (PCP Phase 1 Batch 2).

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::governed_campaign::{
    GOVERNED_CAMPAIGN_ITEMS_VIEW, GOVERNED_CAMPAIGN_SURFACES_VIEW,
};

#[derive(Debug, Clone, sqlx::FromRow)]
struct ConsumerItemRow {
    id: Uuid,
    item_type: String,
    item_ref_id: Option<Uuid>,
    sort_order: i32,
    payload: Value,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConsumerColdStartItem {
    pub id: Uuid,
    pub item_type: String,
    pub sort_order: i32,
    pub payload: Value,
    pub resolved: Value,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConsumerColdStartCampaign {
    pub id: Uuid,
    pub name: String,
    pub campaign_kind: String,
    pub surfaces: Vec<String>,
    pub deployed_at: DateTime<Utc>,
    pub items: Vec<ConsumerColdStartItem>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct DeployedCampaignRow {
    id: Uuid,
    name: String,
    campaign_kind: String,
    surfaces: Vec<String>,
    deployed_at: DateTime<Utc>,
}

async fn resolve_item(pool: &PgPool, row: &ConsumerItemRow) -> Result<Option<Value>, sqlx::Error> {
    let Some(ref_id) = row.item_ref_id else {
        return Ok(None);
    };
    match row.item_type.as_str() {
        "official_account" => {
            let row: Option<(Uuid, String, String, Option<Uuid>, bool)> = sqlx::query_as(
                r#"SELECT id, display_label, account_kind, linked_guide_id, showcase_eligible
                   FROM ops_official_accounts
                   WHERE id = $1 AND is_active = true"#,
            )
            .bind(ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((id, display_label, account_kind, linked_guide_id, showcase_eligible)) = row else {
                return Ok(None);
            };
            if !showcase_eligible {
                return Ok(None);
            }
            Ok(Some(json!({
                "id": id,
                "display_label": display_label,
                "account_kind": account_kind,
                "linked_guide_id": linked_guide_id,
            })))
        }
        "itinerary_template" => {
            let row: Option<(Uuid, String, Option<String>, Option<String>, Option<Uuid>)> = sqlx::query_as(
                r#"SELECT id, title, country_iso::text, cover_image_url, author_account_id
                   FROM ops_official_itinerary_templates
                   WHERE id = $1 AND publish_status = 'published'"#,
            )
            .bind(ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((id, title, country_iso, cover_image_url, author_account_id)) = row else {
                return Ok(None);
            };
            Ok(Some(json!({
                "id": id,
                "title": title,
                "country_iso": country_iso,
                "cover_image_url": cover_image_url,
                "author_account_id": author_account_id,
            })))
        }
        "guide_post" => {
            let row: Option<(Uuid, String, Option<String>, Option<String>, Option<Uuid>, Vec<String>)> =
                sqlx::query_as(
                    r#"SELECT id, title, destination, cover_url, community_post_id, tags
                       FROM ops_official_guide_posts
                       WHERE id = $1 AND publish_status = 'published'"#,
                )
                .bind(ref_id)
                .fetch_optional(pool)
                .await?;
            let Some((id, title, destination, cover_url, community_post_id, tags)) = row else {
                return Ok(None);
            };
            Ok(Some(json!({
                "id": id,
                "title": title,
                "destination": destination,
                "cover_url": cover_url,
                "community_post_id": community_post_id,
                "tags": tags,
            })))
        }
        "guide" => {
            let row: Option<(Uuid, String, Option<String>, String, bool, i32)> = sqlx::query_as(
                r#"SELECT id, city, public_title, display_status, featured, display_priority
                   FROM guides WHERE id = $1 AND display_status = 'published'"#,
            )
            .bind(ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((id, city, public_title, display_status, featured, display_priority)) = row else {
                return Ok(None);
            };
            Ok(Some(json!({
                "id": id,
                "city": city,
                "public_title": public_title,
                "display_status": display_status,
                "featured": featured,
                "display_priority": display_priority,
            })))
        }
        "order" => {
            let row: Option<(Uuid, String, i32)> = sqlx::query_as(
                r#"SELECT id, display_status, display_priority FROM orders
                   WHERE id = $1 AND display_status = 'published'"#,
            )
            .bind(ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((id, display_status, display_priority)) = row else {
                return Ok(None);
            };
            Ok(Some(json!({
                "id": id,
                "display_status": display_status,
                "display_priority": display_priority,
            })))
        }
        "market_listing" => {
            let row: Option<(Uuid, String, serde_json::Value, bool, i32)> = sqlx::query_as(
                r#"SELECT id, variant, payload, featured, display_priority FROM market_listings
                   WHERE id = $1 AND status = 'published' AND display_status = 'published'"#,
            )
            .bind(ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((id, variant, payload, featured, display_priority)) = row else {
                return Ok(None);
            };
            Ok(Some(json!({
                "id": id,
                "variant": variant,
                "payload": payload,
                "featured": featured,
                "display_priority": display_priority,
            })))
        }
        "community_post" => {
            let row: Option<(Uuid, String, Option<String>, Vec<String>)> = sqlx::query_as(
                r#"SELECT id, body, destination, tags FROM community_posts
                   WHERE id = $1 AND display_status = 'published'"#,
            )
            .bind(ref_id)
            .fetch_optional(pool)
            .await?;
            let Some((id, body, destination, tags)) = row else {
                return Ok(None);
            };
            Ok(Some(json!({
                "id": id,
                "body": body,
                "destination": destination,
                "tags": tags,
            })))
        }
        _ => Ok(None),
    }
}

/// Latest deployed campaign for a public surface (Governed View read path).
pub async fn get_governed_campaign_for_surface(
    pool: &PgPool,
    surface: &str,
    campaign_kind: Option<&str>,
) -> Result<Option<ConsumerColdStartCampaign>, sqlx::Error> {
    let surface = surface.trim();
    if surface.is_empty() {
        return Ok(None);
    }

    let campaign = if let Some(kind) = campaign_kind.filter(|k| !k.is_empty()) {
        let sql = format!(
            "SELECT id, name, campaign_kind, surfaces, deployed_at \
             FROM {GOVERNED_CAMPAIGN_SURFACES_VIEW} \
             WHERE campaign_kind = $1 AND $2 = ANY(surfaces) \
             ORDER BY deployed_at DESC \
             LIMIT 1"
        );
        sqlx::query_as::<_, DeployedCampaignRow>(&sql)
            .bind(kind)
            .bind(surface)
            .fetch_optional(pool)
            .await?
    } else {
        let sql = format!(
            "SELECT id, name, campaign_kind, surfaces, deployed_at \
             FROM {GOVERNED_CAMPAIGN_SURFACES_VIEW} \
             WHERE $1 = ANY(surfaces) \
             ORDER BY deployed_at DESC \
             LIMIT 1"
        );
        sqlx::query_as::<_, DeployedCampaignRow>(&sql)
            .bind(surface)
            .fetch_optional(pool)
            .await?
    };
    let Some(campaign) = campaign else {
        return Ok(None);
    };

    let items_sql = format!(
        "SELECT id, item_type, item_ref_id, sort_order, payload \
         FROM {GOVERNED_CAMPAIGN_ITEMS_VIEW} \
         WHERE campaign_id = $1 \
         ORDER BY sort_order ASC, created_at ASC"
    );
    let item_rows = sqlx::query_as::<_, ConsumerItemRow>(&items_sql)
        .bind(campaign.id)
        .fetch_all(pool)
        .await?;

    let mut items = Vec::with_capacity(item_rows.len());
    for row in item_rows {
        let resolved = match resolve_item(pool, &row).await? {
            Some(v) => v,
            None => continue,
        };
        items.push(ConsumerColdStartItem {
            id: row.id,
            item_type: row.item_type,
            sort_order: row.sort_order,
            payload: row.payload,
            resolved,
        });
    }

    Ok(Some(ConsumerColdStartCampaign {
        id: campaign.id,
        name: campaign.name,
        campaign_kind: campaign.campaign_kind,
        surfaces: campaign.surfaces,
        deployed_at: campaign.deployed_at,
        items,
    }))
}
