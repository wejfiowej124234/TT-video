//! TravelTrust 领域类型与抽象：Registry / Escrow / Staking / Reputation / Dispute
//!
//! 先链下实现，接口设计兼容后续上链。

pub mod access_fee_refund_v311;
pub mod destination_country_v311;
pub mod dispute_fee;
pub mod escrow;
pub mod fee_route_country;
pub mod indexer_v311_projections;
pub mod outbox;
pub mod preset_cities;
pub mod product_countries;
pub mod reputation;
pub mod service_fee_state_v311;
pub mod staking;
pub mod types;

pub use dispute_fee::required_arbitration_fee;
pub use escrow::{terminal_order_state_from_resolution_amounts, EscrowState, OrderState};
pub use fee_route_country::{
    resolve_fee_route_country_from_zh_destination, FeeRouteCountryResolve,
    FEE_ROUTE_COUNTRY_SSOT_FIELD,
};
pub use outbox::*;
pub use preset_cities::{is_preset_city_for_zh_country, preset_cities_zh_for_country};
pub use product_countries::{
    is_allowed_iso_country_code, is_allowed_zh_destination_country, normalize_iso_country_code,
    PRODUCT_COUNTRY_CODES, PRODUCT_COUNTRY_NAMES_ZH,
};
pub use reputation::{can_submit_review, ReviewWeight, ReviewWeightBreakdown};
pub use staking::StakeTier;
pub use types::*;
