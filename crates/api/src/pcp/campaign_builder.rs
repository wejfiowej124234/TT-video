//! PCP CampaignBuilder · Cold-start / Campaign public surfaces (Phase 1 Batch 2).
//!
//! Builder Contract:
//!   Input:  Governed Public Views (`governed_campaign_*_v1`) + entity ref resolution (OCS/DDG unchanged)
//!   Output: Public DTO via GET /official/cold-start/surfaces/:surface
//!
//! Does not duplicate Governance rules (deploy status / publish_status / schedule) — reads Governed Views only.

pub use crate::db::{
    get_governed_campaign_for_surface, ConsumerColdStartCampaign, ConsumerColdStartItem,
    GOVERNED_CAMPAIGN_ITEMS_VIEW, GOVERNED_CAMPAIGN_SURFACES_VIEW, SURFACE_COMMUNITY_FEED,
    SURFACE_HOME_HERO, SURFACE_MARKET_FEED,
};

pub const BUILDER_ID: &str = "campaign_builder";
pub const DOMAIN: &str = "campaign";
