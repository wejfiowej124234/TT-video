//! PCP MarketBuilder · Market / Provider / Acquisition / Official Guide public catalog (Phase 1).
//!
//! Builder Contract:
//!   Input:  Governed Public Views (`governed_market_*_v1`) + DDG filters (chain_off helpers)
//!   Output: Public DTO via existing market/guides/listings handlers
//!
//! Does not duplicate Governance rules (display_status / surface / schedule) — reads Governed Views only.

pub use crate::db::{
    get_governed_market_guide_by_id, governed_discover_order_exists, governed_market_guide_exists,
    list_governed_market_guides, list_governed_market_listings_by_variant,
    select_governed_public_market_listing_by_id, GOVERNED_DISCOVER_ORDERS_VIEW,
    GOVERNED_MARKET_GUIDES_VIEW, GOVERNED_MARKET_LISTINGS_VIEW, MARKET_GUIDES_SURFACE,
    market_listing_surface_key,
};

/// DDG + local walkthrough helpers (not Governance — do not reimplement display_status/surface here).
pub use crate::chain_off::{
    cmp_public_display_sort, dedupe_guides_latest_per_user, infer_market_listing_data_origin,
    is_dev_catalog_email, is_dev_market_listing_payload, is_non_production_market_listing,
    public_catalog_surface_filter_enabled,
};

pub const BUILDER_ID: &str = "market_builder";
pub const DOMAIN: &str = "market";
