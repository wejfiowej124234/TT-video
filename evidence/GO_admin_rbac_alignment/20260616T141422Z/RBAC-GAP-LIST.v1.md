# RBAC-GAP-LIST · TT_ADMIN_RBAC_ALIGNMENT_PROGRAM

**Generated:** 2026-06-16T14:14:22Z · **Phase:** ①

**Handlers aligned:** 22/25 · **Matrix routes:** 27 · **YAML routes:** 36

## Four clusters

| Cluster | Aligned | Gaps |
|---------|---------|------|
| **finance** | 3/5 | 2 |
| **community** | 11/12 | 1 |
| **audit** | 4/4 | 0 |
| **approval** | 4/4 | 0 |

## Open gaps

- `get_admin_finance_summary` · expected `require_finance_read_uid` · actual `require_admin_perm_uid`
- `get_admin_finance_summary_export` · expected `require_finance_read_uid` · actual `require_admin_perm_uid`
- `patch_admin_community_abuse_policy` · expected `require_community_super_uid` · actual `require_super_admin_uid`

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
