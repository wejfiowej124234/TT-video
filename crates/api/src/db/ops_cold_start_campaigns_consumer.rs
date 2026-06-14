//! E2E-A-01 · Public read-only Cold Start Campaign consumer (deployed · active items only)

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

const DEP_DEPLOYED: &str = "deployed";
const ITEM_ACTIVE: &str = "active";

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
    pub surfaces: Vec<String>,
    pub deployed_at: DateTime<Utc>,
    pub items: Vec<ConsumerColdStartItem>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct DeployedCampaignRow {
    id: Uuid,
    name: String,
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
        _ => Ok(None),
    }
}

pub async fn get_deployed_cold_start_campaign_for_surface(
    pool: &PgPool,
    surface: &str,
) -> Result<Option<ConsumerColdStartCampaign>, sqlx::Error> {
    let surface = surface.trim();
    if surface.is_empty() {
        return Ok(None);
    }
    let Some(campaign) = sqlx::query_as::<_, DeployedCampaignRow>(
        r#"SELECT id, name, surfaces, deployed_at
           FROM ops_cold_start_campaigns
           WHERE status = $1 AND $2 = ANY(surfaces) AND deployed_at IS NOT NULL
           ORDER BY deployed_at DESC
           LIMIT 1"#,
    )
    .bind(DEP_DEPLOYED)
    .bind(surface)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(None);
    };

    let item_rows = sqlx::query_as::<_, ConsumerItemRow>(
        r#"SELECT id, item_type, item_ref_id, sort_order, payload
           FROM ops_cold_start_items
           WHERE campaign_id = $1 AND status = $2
           ORDER BY sort_order ASC, created_at ASC"#,
    )
    .bind(campaign.id)
    .bind(ITEM_ACTIVE)
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
        surfaces: campaign.surfaces,
        deployed_at: campaign.deployed_at,
        items,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deployed_status_constant_matches_migration() {
        assert_eq!(DEP_DEPLOYED, "deployed");
        assert_eq!(ITEM_ACTIVE, "active");
    }
}
