//! PCP · Governed Public Views for Market catalog (MarketBuilder read path).
//!
//! Migrations: `20260704110000_governed_market_catalog_v1.sql`
//! DDG filters (data_origin, dev email, display_origin policy) apply in Builder layer.

pub const GOVERNED_MARKET_GUIDES_VIEW: &str = "governed_market_guides_v1";
pub const GOVERNED_MARKET_LISTINGS_VIEW: &str = "governed_market_listings_v1";
pub const GOVERNED_DISCOVER_ORDERS_VIEW: &str = "governed_discover_orders_v1";

pub const MARKET_GUIDES_SURFACE: &str = "market_feed";
pub const MARKET_LISTING_SURFACE_PROVIDER: &str = "market_provider";
pub const MARKET_LISTING_SURFACE_ACQUISITION: &str = "market_acquisition";
pub const MARKET_LISTING_SURFACE_DEFAULT: &str = "market_feed";

pub fn market_listing_surface_key(variant: &str) -> &'static str {
    match variant {
        "provider" => MARKET_LISTING_SURFACE_PROVIDER,
        "acquisition" => MARKET_LISTING_SURFACE_ACQUISITION,
        _ => MARKET_LISTING_SURFACE_DEFAULT,
    }
}
