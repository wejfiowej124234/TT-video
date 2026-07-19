//! V3.1.1 ch.12 · Order.destination_country attribution SSOT · Gap BE-02 / S-05 / RT-02
//!
//! Persistence field name is `destination_country` (ISO3166-alpha2).
//! Input may still arrive as zh destination; resolve via product_countries — GPS must not override.

use crate::fee_route_country::{
    resolve_fee_route_country_from_zh_destination, FeeRouteCountryResolve,
};
use crate::product_countries::is_allowed_iso_country_code;

/// Constitution unique source field (V3.1.1)
pub const ORDER_DESTINATION_COUNTRY_FIELD: &str = "destination_country";

/// Resolve attribution ISO from zh destination (itinerary UX) → Order.destination_country value.
#[must_use]
pub fn destination_country_iso_from_zh(name_zh: &str) -> Option<&'static str> {
    match resolve_fee_route_country_from_zh_destination(name_zh) {
        FeeRouteCountryResolve::Routed {
            iso3166_alpha2, ..
        } => Some(iso3166_alpha2),
        FeeRouteCountryResolve::RejectUnmapped { .. } => None,
    }
}

/// Accept only a valid product ISO as Order.destination_country (no GPS override path).
#[must_use]
pub fn validate_order_destination_country_iso(iso: &str) -> bool {
    is_allowed_iso_country_code(iso)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn be02_field_name_and_iso_from_zh() {
        assert_eq!(ORDER_DESTINATION_COUNTRY_FIELD, "destination_country");
        assert_eq!(destination_country_iso_from_zh("日本"), Some("JP"));
        assert_eq!(destination_country_iso_from_zh("意大利"), None);
        assert!(validate_order_destination_country_iso("CN"));
        assert!(!validate_order_destination_country_iso("IT"));
    }
}
