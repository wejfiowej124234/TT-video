# PCP Full Pipeline Alignment · 20260703T234311Z

## Verdict

| Gate | Result |
|------|--------|
| **Phase ① Local (Configuration + Static Pipeline)** | **PASS** |
| **Phase ① Local Runtime** | **SKIPPED** |
| **Phase ② Staging Runtime** | **SKIPPED** |
| **TT_PCP_ARCHITECTURE_COMPLIANCE** | **PASS** |
| **TT_PCP_PHASE_0_5 Sign-off** | **PAUSED** |
| **PCP Full Pipeline Alignment Sign-off** | **PASS** |

Blocking gaps: **0** · Non-blocking: **1**

## Pipeline Matrix

| Domain | Layer | Phase ① | Phase ② | Note |
|--------|-------|---------|---------|------|
| community | database | PASS | PENDING | community_posts table + migration |
| community | governance | PASS | PENDING | governed_community_posts_v1 SQL view (P2) |
| community | builder | PASS | PENDING | FeedBuilder · pcp/feed_builder.rs |
| community | public_api | PASS | false | feed · detail · profile · explore · tag stats |
| community | frontend | PASS | PENDING | community routes consume /api/v1/community/* |
| market | database | PASS | PENDING | guides · market_listings · discover_orders |
| market | governance | FAIL | PENDING | governed_market_* SQL views (P2) |
| market | builder | PASS | PENDING | MarketBuilder · pcp/market_builder.rs |
| market | public_api | PASS | PENDING | GET /guides · /discover/orders · market listings |
| market | frontend | PASS | PENDING | guides · market hub · subsites |
| provider | database | PASS | PENDING | market_listings variant=provider |
| provider | governance | PASS | PENDING | shared governed_market_listings_v1 |
| provider | builder | PASS | PENDING | MarketBuilder · pcp/market_builder.rs |
| provider | public_api | PASS | PENDING | GET /market/provider/listings |
| provider | frontend | PASS | PENDING | /market/provider |
| acquisition | database | PASS | PENDING | market_listings variant=acquisition |
| acquisition | governance | PASS | PENDING | shared governed_market_listings_v1 |
| acquisition | builder | PASS | PENDING | MarketBuilder · pcp/market_builder.rs |
| acquisition | public_api | PASS | PENDING | GET /market/acquisition/listings |
| acquisition | frontend | PASS | PENDING | /market/acquisition |
| official_guide | database | PASS | PENDING | guides + OCS bootstrap |
| official_guide | governance | PASS | PENDING | governed_market_guides_v1 + OCS tier |
| official_guide | builder | PASS | PENDING | MarketBuilder · GET /guides |
| official_guide | public_api | PASS | PENDING | GET /api/v1/guides |
| official_guide | frontend | PASS | PENDING | /guides |
| campaign | database | PASS | PENDING | ops_cold_start_campaigns + items |
| campaign | governance | PASS | PENDING | governed_campaign_surfaces_v1 + governed_campaign_items_v1 |
| campaign | builder | PASS | PENDING | CampaignBuilder · pcp/campaign_builder.rs |
| campaign | public_api | PASS | PENDING | GET /official/cold-start/surfaces/* |
| campaign | frontend | PASS | PENDING | homepage · market cold-start surfaces |
| admin_public_content_center | database | PASS | PENDING | display_* columns on entities |
| admin_public_content_center | governance | PASS | PENDING | Public Ops write console |
| admin_public_content_center | builder | PARTIAL | PENDING | N/A — governance write layer |
| admin_public_content_center | public_api | PASS | PENDING | /admin/official/public-operations/* |
| admin_public_content_center | frontend | PASS | PENDING | /admin/official/public-operations |
| ddg | governance | PASS | PENDING | registry/display-data-governance.v1.yaml → PCP cross-ref |
| ddg | evidence_registry_runbook | PASS | PENDING | SSOT + runbook pointers |
| ocs | governance | PASS | PENDING | registry/official-cold-start-dataset.v1.yaml → PCP cross-ref |
| ocs | evidence_registry_runbook | PASS | PENDING | SSOT + runbook pointers |
| sopcp | governance | PASS | PENDING | registry/single-official-public-catalog-policy.v1.yaml → PCP cross-ref |
| sopcp | evidence_registry_runbook | PASS | PENDING | SSOT + runbook pointers |
| ocip | governance | PASS | PENDING | registry/official-catalog-identity-policy.v1.yaml → PCP cross-ref |
| ocip | evidence_registry_runbook | PASS | PENDING | SSOT + runbook pointers |
| evidence_registry_runbook | governance | PASS | PENDING | PCP SSOT + audit scripts |

## Gap List

- **[NON_BLOCKING]** `MKT-GOV-001` · market/governance — Market governed views incomplete on static scan
  - Fix: Verify migration 20260704110000 + market_catalog reads

## Fix Order

1. [NON_BLOCKING] MKT-GOV-001 — Verify migration 20260704110000 + market_catalog reads
