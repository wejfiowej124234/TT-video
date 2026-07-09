//! PCP · Governed Public Views for Campaign surfaces (CampaignBuilder read path).
//!
//! Migrations: `20260704120000_governed_campaign_surfaces_v1.sql`
//! Entity ref eligibility (OCS accounts, DDG production filters) apply in Builder layer.

pub const GOVERNED_CAMPAIGN_SURFACES_VIEW: &str = "governed_campaign_surfaces_v1";
pub const GOVERNED_CAMPAIGN_ITEMS_VIEW: &str = "governed_campaign_items_v1";

pub const SURFACE_HOME_HERO: &str = "home_hero";
pub const SURFACE_MARKET_FEED: &str = "market_feed";
pub const SURFACE_COMMUNITY_FEED: &str = "community_feed";
