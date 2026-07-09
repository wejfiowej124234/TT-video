# PCP Full Pipeline Alignment · 20260703T174738Z

## Verdict

| Gate | Result |
|------|--------|
| **Phase ① Local (Configuration + Static Pipeline)** | **PASS** |
| **Phase ① Local Runtime** | **PASS** |
| **Phase ② Staging Runtime** | **PARTIAL** |
| **TT_PCP_ARCHITECTURE_COMPLIANCE** | **PASS** |
| **TT_PCP_PHASE_0_5 Sign-off** | **COMPLETE** |
| **PCP Full Pipeline Alignment Sign-off** | **PASS** |

Blocking gaps: **0** · Non-blocking: **2**

## Pipeline Matrix

| Domain | Layer | Phase ① | Phase ② | Note |
|--------|-------|---------|---------|------|
| community | database | PASS | PASS | community_posts table + migration |
| community | governance | PASS | PASS | governed_community_posts_v1 SQL view (P2) |
| community | builder | PASS | PASS | FeedBuilder · pcp/feed_builder.rs |
| community | public_api | PASS | PASS | feed · detail · profile · explore · tag stats |
| community | frontend | PASS | PASS | community routes consume /api/v1/community/* |
| market | database | PASS | PASS | guides · market_listings · discover_orders |
| market | governance | FAIL | PENDING | governed_market_* SQL views (P2) |
| market | builder | PASS | PASS | MarketBuilder · pcp/market_builder.rs |
| market | public_api | PASS | PASS | GET /guides · /discover/orders · market listings |
| market | frontend | PASS | PASS | guides · market hub · subsites |
| provider | database | PASS | PASS | market_listings variant=provider |
| provider | governance | PASS | PASS | shared governed_market_listings_v1 |
| provider | builder | PASS | PASS | MarketBuilder · pcp/market_builder.rs |
| provider | public_api | PASS | PASS | GET /market/provider/listings |
| provider | frontend | PASS | PASS | /market/provider |
| acquisition | database | PASS | PASS | market_listings variant=acquisition |
| acquisition | governance | PASS | PASS | shared governed_market_listings_v1 |
| acquisition | builder | PASS | PASS | MarketBuilder · pcp/market_builder.rs |
| acquisition | public_api | PASS | PASS | GET /market/acquisition/listings |
| acquisition | frontend | PASS | PASS | /market/acquisition |
| official_guide | database | PASS | PASS | guides + OCS bootstrap |
| official_guide | governance | PASS | PASS | governed_market_guides_v1 + OCS tier |
| official_guide | builder | PASS | PASS | MarketBuilder · GET /guides |
| official_guide | public_api | PASS | PASS | GET /api/v1/guides |
| official_guide | frontend | PASS | PASS | /guides |
| campaign | database | PASS | PASS | ops_cold_start_campaigns + items |
| campaign | governance | PARTIAL | PARTIAL | deploy workflow + surface assignment partial |
| campaign | builder | PARTIAL | PARTIAL | CampaignBuilder partial — consumer not pcp/ module |
| campaign | public_api | PASS | PASS | GET /official/cold-start/surfaces/* |
| campaign | frontend | PASS | PASS | homepage · market cold-start surfaces |
| admin_public_content_center | database | PASS | PASS | display_* columns on entities |
| admin_public_content_center | governance | PASS | PASS | Public Ops write console |
| admin_public_content_center | builder | PARTIAL | PARTIAL | N/A — governance write layer |
| admin_public_content_center | public_api | PASS | PASS | /admin/official/public-operations/* |
| admin_public_content_center | frontend | PASS | PASS | /admin/official/public-operations |
| ddg | governance | PASS | PASS | registry/display-data-governance.v1.yaml → PCP cross-ref |
| ddg | evidence_registry_runbook | PASS | PASS | SSOT + runbook pointers |
| ocs | governance | PASS | PASS | registry/official-cold-start-dataset.v1.yaml → PCP cross-ref |
| ocs | evidence_registry_runbook | PASS | PASS | SSOT + runbook pointers |
| sopcp | governance | PASS | PASS | registry/single-official-public-catalog-policy.v1.yaml → PCP cross-ref |
| sopcp | evidence_registry_runbook | PASS | PASS | SSOT + runbook pointers |
| ocip | governance | PASS | PASS | registry/official-catalog-identity-policy.v1.yaml → PCP cross-ref |
| ocip | evidence_registry_runbook | PASS | PASS | SSOT + runbook pointers |
| evidence_registry_runbook | governance | PASS | PASS | PCP SSOT + audit scripts |

## Gap List

- **[NON_BLOCKING]** `MKT-GOV-001` · market/governance — Market governed views incomplete on static scan
  - Fix: Verify migration 20260704110000 + market_catalog reads
- **[NON_BLOCKING]** `CAM-BLD-001` · campaign/builder — CampaignBuilder not formalized under pcp/ — uses ops_cold_start consumer
  - Fix: Phase 1: pcp/campaign_builder.rs + governed campaign surfaces

## Fix Order

1. [NON_BLOCKING] MKT-GOV-001 — Verify migration 20260704110000 + market_catalog reads
2. [NON_BLOCKING] CAM-BLD-001 — Phase 1: pcp/campaign_builder.rs + governed campaign surfaces
