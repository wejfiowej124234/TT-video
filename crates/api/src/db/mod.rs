//! 业务库读写：users / sessions / guides / orders / reviews / disputes / itineraries / order_messages（04 §四、48 §六）
//! 当 DATABASE_URL 设置时：启动时从 DB hydrate 到 chain_off 内存；注册/登录/向导/订单/评价/争议/行程/聊天双写 DB。

#![allow(dead_code, unused_imports)]

pub use admin::*;
pub use admin_console_roles::*;
pub use admin_totp::*;
pub use admin_policies_tenants::*;
pub use api_versions::*;
pub use community::*;
pub use community_governance_audit::*;
pub use community_media_assets::*;
pub use community_moderation_cases::*;
pub use community_penalties::*;
pub use community_reports::*;
pub use compliance_internal_tools::*;
pub use config_center::*;
pub use correction_executor_audit::*;
pub use disputes::*;
pub use economic_aggregate::*;
pub use event_log::*;
pub use evidence::*;
pub use fee_router_events::*;
pub use governance::*;
pub use governance_proposals_projection::*;
pub use guides::*;
pub use idempotency::*;
pub use investor_share::*;
pub use investor_stake::*;
pub use investor_lock::*;
pub use investor_distribution::*;
pub use itineraries::*;
pub use jobs_scheduler_config::*;
pub use lifecycle_state_machines::*;
pub use media_signed_url::*;
pub use messages::*;
mod market_listing_drafts;
mod market_listings;
mod acquisition_trust;
mod onboarding;
mod role_identity;
pub use market_listing_drafts::*;
pub use market_listings::*;
pub use acquisition_trust::*;
pub use onboarding::*;
pub use role_identity::*;
mod migrate_embed;
pub use migrate_embed::apply_api_migrations;
pub use multi_table_chain_observability::multi_table_chain_id_footprint_matrix_rows;
pub use orders::*;
pub use orders_projection::*;
mod public_catalog_surface;
pub use public_catalog_surface::*;
pub use p5_country_ledger::*;
pub use reconciliation_reports::*;
pub use region_vault_events::*;
pub use stake_lock_projection_block_lag_obs::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR;
#[allow(unused_imports)] // B-115-1：HTTP/indexer 未接线前仅单测直引模块；保留与 `crate::db::*` 同形 re-export
pub use region_snapshot::*;
pub use reviews::*;
pub use trust_growth::*;
pub use users_sessions::*;
mod profile_avatar_presign_pending;
pub use profile_avatar_presign_pending::*;

mod admin;
mod admin_console_roles;
mod admin_totp;
mod admin_policies_tenants;
mod api_versions;
mod community;
mod community_governance_audit;
mod community_media_assets;
mod community_moderation_cases;
mod community_penalties;
mod community_reports;
mod compliance_internal_tools;
mod config_center;
mod correction_executor_audit;
mod disputes;
mod economic_aggregate;
mod event_log;
mod evidence;
mod fee_router_events;
mod governance;
mod governance_proposals_projection;
mod guides;
mod idempotency;
mod investor_share;
mod investor_stake;
mod investor_lock;
mod investor_distribution;
mod itineraries;
mod jobs_scheduler_config;
mod lifecycle_state_machines;
mod media_signed_url;
mod messages;
mod multi_table_chain_observability;
mod orders;
mod orders_projection;
mod p5_country_ledger;
mod reconciliation_reports;
mod region_vault_events;
mod stake_lock_projection_block_lag_obs;
mod region_snapshot;
mod reviews;
mod trust_growth;
mod users_sessions;
mod did_rank_market_boards;
mod did_rank_snapshots;
mod market_travel_bookmarks;
mod wallet_verify_challenges;
mod auth_audit_events;
mod seed_community_public_showcase;
mod seed_market_public_showcase;
mod user_security_notifications;
pub use did_rank_market_boards::*;
pub use user_security_notifications::*;
pub use did_rank_snapshots::*;
pub use market_travel_bookmarks::*;
pub use wallet_verify_challenges::*;
pub use auth_audit_events::*;
pub use seed_community_public_showcase::*;
pub use seed_market_public_showcase::*;

#[cfg(test)]
#[path = "role_identity_dual_write_db_api_tests.rs"]
mod role_identity_dual_write_db_api_tests;

#[cfg(test)]
#[path = "phase15_identity_s1_s4_db_api_tests.rs"]
mod phase15_identity_s1_s4_db_api_tests;
