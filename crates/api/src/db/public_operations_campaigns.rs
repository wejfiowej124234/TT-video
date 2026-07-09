//! Unified Campaign Center · kinds + defaults (SSOT-CAMPAIGN · F-OO-14～19)

pub const CAMPAIGN_KIND_COLD_START: &str = "cold_start";
pub const CAMPAIGN_KIND_HOMEPAGE: &str = "homepage";
pub const CAMPAIGN_KIND_MARKET: &str = "market";
pub const CAMPAIGN_KIND_COMMUNITY: &str = "community";
pub const CAMPAIGN_KIND_FESTIVAL: &str = "festival";
pub const CAMPAIGN_KIND_HOLIDAY: &str = "holiday";
pub const CAMPAIGN_KIND_REGIONAL: &str = "regional";

pub const PUBLIC_OPS_CAMPAIGN_KINDS: &[&str] = &[
    CAMPAIGN_KIND_COLD_START,
    CAMPAIGN_KIND_HOMEPAGE,
    CAMPAIGN_KIND_MARKET,
    CAMPAIGN_KIND_COMMUNITY,
    CAMPAIGN_KIND_FESTIVAL,
    CAMPAIGN_KIND_HOLIDAY,
    CAMPAIGN_KIND_REGIONAL,
];

pub const PUBLIC_OPS_ENTITY_ITEM_TYPES: &[&str] = &[
    "guide",
    "order",
    "market_listing",
    "community_post",
];

pub fn is_valid_public_ops_campaign_kind(kind: &str) -> bool {
    PUBLIC_OPS_CAMPAIGN_KINDS
        .iter()
        .any(|k| k.eq_ignore_ascii_case(kind.trim()))
}

pub fn normalize_public_ops_campaign_kind(kind: &str) -> Option<String> {
    let k = kind.trim().to_lowercase();
    if is_valid_public_ops_campaign_kind(&k) {
        Some(k)
    } else {
        None
    }
}

pub fn default_surfaces_for_campaign_kind(kind: &str) -> Vec<String> {
    match kind.trim().to_lowercase().as_str() {
        CAMPAIGN_KIND_HOMEPAGE => vec!["home_hero".into()],
        CAMPAIGN_KIND_MARKET => vec!["market_feed".into()],
        CAMPAIGN_KIND_COMMUNITY => vec!["community_feed".into()],
        CAMPAIGN_KIND_FESTIVAL | CAMPAIGN_KIND_HOLIDAY => vec!["landing_promo".into()],
        CAMPAIGN_KIND_REGIONAL => vec!["home_hero".into(), "market_feed".into()],
        _ => vec!["home_hero".into(), "market_feed".into(), "community_feed".into()],
    }
}

pub fn campaign_kind_feature_id(kind: &str) -> Option<&'static str> {
    match kind.trim().to_lowercase().as_str() {
        CAMPAIGN_KIND_HOMEPAGE => Some("F-OO-14"),
        CAMPAIGN_KIND_MARKET => Some("F-OO-15"),
        CAMPAIGN_KIND_COMMUNITY => Some("F-OO-16"),
        CAMPAIGN_KIND_FESTIVAL => Some("F-OO-17"),
        CAMPAIGN_KIND_HOLIDAY => Some("F-OO-18"),
        CAMPAIGN_KIND_REGIONAL => Some("F-OO-19"),
        CAMPAIGN_KIND_COLD_START => Some("F-OO-04"),
        _ => None,
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PublicOpsCampaignPreview {
    pub campaign_id: uuid::Uuid,
    pub campaign_kind: String,
    pub name: String,
    pub surface: String,
    pub surface_match: bool,
    pub deploy_status: String,
    pub publish_status: String,
    pub item_count: usize,
    pub items: Vec<super::AdminColdStartItemRow>,
}

pub async fn preview_public_ops_campaign(
    pool: &sqlx::PgPool,
    id: uuid::Uuid,
    surface: &str,
) -> Result<Option<PublicOpsCampaignPreview>, sqlx::Error> {
    let Some((campaign, items)) =
        super::get_cold_start_campaign_with_items_admin(pool, id).await?
    else {
        return Ok(None);
    };
    let surface_match = campaign.surfaces.is_empty() || campaign.surfaces.iter().any(|s| s == surface);
    Ok(Some(PublicOpsCampaignPreview {
        campaign_id: campaign.id,
        campaign_kind: campaign.campaign_kind.clone(),
        name: campaign.name.clone(),
        surface: surface.to_string(),
        surface_match,
        deploy_status: campaign.status.clone(),
        publish_status: campaign.publish_status.clone(),
        item_count: items.len(),
        items,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kinds_cover_six_campaign_features() {
        for kind in [
            CAMPAIGN_KIND_HOMEPAGE,
            CAMPAIGN_KIND_MARKET,
            CAMPAIGN_KIND_COMMUNITY,
            CAMPAIGN_KIND_FESTIVAL,
            CAMPAIGN_KIND_HOLIDAY,
            CAMPAIGN_KIND_REGIONAL,
        ] {
            assert!(campaign_kind_feature_id(kind).is_some());
        }
    }
}
