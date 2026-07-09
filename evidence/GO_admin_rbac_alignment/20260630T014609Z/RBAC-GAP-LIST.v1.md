# RBAC-GAP-LIST · TT_ADMIN_RBAC_ALIGNMENT_PROGRAM

**Generated:** 2026-06-30T01:46:09Z · **Phase:** ①

**Handlers aligned:** 24/25 · **Matrix routes:** 36 · **YAML routes:** 36

## Four clusters

| Cluster | Aligned | Gaps |
|---------|---------|------|
| **finance** | 4/5 | 1 |
| **community** | 12/12 | 0 |
| **audit** | 4/4 | 0 |
| **approval** | 4/4 | 0 |

## Open gaps

- `get_admin_fee_router_routed_events` · expected `require_finance_read_uid` · actual `unknown`

## Orphan split stubs (not mounted)

- `crates/api/src/routes/admin/admin_acquisition_suspend_http.rs`
- `crates/api/src/routes/admin/admin_approvals_http.rs`
- `crates/api/src/routes/admin/admin_audit_http.rs`
- `crates/api/src/routes/admin/admin_catalog_ops_http.rs`
- `crates/api/src/routes/admin/admin_catalog_revision_http.rs`
- `crates/api/src/routes/admin/admin_cold_start_http.rs`
- `crates/api/src/routes/admin/admin_content_http.rs`
- `crates/api/src/routes/admin/admin_country_market_http.rs`
- `crates/api/src/routes/admin/admin_cross_drift_http.rs`
- `crates/api/src/routes/admin/admin_data_policies_http.rs`
- `crates/api/src/routes/admin/admin_disputes_http.rs`
- `crates/api/src/routes/admin/admin_fee_router_routed_http.rs`
- `crates/api/src/routes/admin/admin_finance_summary_http.rs`
- `crates/api/src/routes/admin/admin_growth_airdrop_http.rs`
- `crates/api/src/routes/admin/admin_growth_analytics_http.rs`
- `crates/api/src/routes/admin/admin_growth_early_bird_http.rs`
- `crates/api/src/routes/admin/admin_growth_fraud_http.rs`
- `crates/api/src/routes/admin/admin_growth_ledger_http.rs`
- `crates/api/src/routes/admin/admin_growth_referral_http.rs`
- `crates/api/src/routes/admin/admin_guide_application_http.rs`
- `crates/api/src/routes/admin/admin_guides_http.rs`
- `crates/api/src/routes/admin/admin_metrics_home_http.rs`
- `crates/api/src/routes/admin/admin_official_accounts_http.rs`
- `crates/api/src/routes/admin/admin_official_guides_http.rs`
- `crates/api/src/routes/admin/admin_official_itinerary_templates_http.rs`
- `crates/api/src/routes/admin/admin_orders_http.rs`
- `crates/api/src/routes/admin/admin_poi_media_http.rs`
- `crates/api/src/routes/admin/admin_provider_application_http.rs`
- `crates/api/src/routes/admin/admin_region_share_reconcile_http.rs`
- `crates/api/src/routes/admin/admin_region_vault_forwarded_http.rs`
- `crates/api/src/routes/admin/admin_reviews_http.rs`
- `crates/api/src/routes/admin/admin_schema_http.rs`
- `crates/api/src/routes/admin/admin_steward_application_http.rs`
- `crates/api/src/routes/admin/admin_tenant_scopes_http.rs`
- `crates/api/src/routes/admin/admin_users_http.rs`
