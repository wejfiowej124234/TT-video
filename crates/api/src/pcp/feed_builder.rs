//! PCP FeedBuilder · Community public feed (Phase 0 first PCP consumer).
//!
//! Builder Contract:
//!   Input:  Governed Public View (`governed_community_posts_v1`) + moderation filters
//!   Output: Public DTO via existing community feed handlers
//!
//! Does not duplicate Governance rules — reads Governed View only.

pub use crate::db::{
    list_feed, list_feed_by_following, list_feed_hot, list_viewer_own_non_production_feed_supplement,
    FEED_BUILDER_SURFACE, GOVERNED_VIEW,
};

pub const BUILDER_ID: &str = "feed_builder";
pub const DOMAIN: &str = "community";
