# PCP Phase 1 Full Platform Alignment · 20260703T171417Z

**Pipeline (唯一标准链路):** Database → PCP Governance → Public Engine Builder → Public API → Frontend

## Executive Verdict

| Gate | Result |
|------|--------|
| **Phase 1 Architecture Alignment** | **IN_PROGRESS** |
| **Community (baseline)** | **PASS** |
| **Domains fully aligned (7/7 layers PASS)** | **2 / 7** |
| **Phase 1 gaps (REFERENCE · PARTIAL · OLD_READ_PATH)** | **7** |
| **Blocking SSOT drift** | **0** |
| **TT_PCP_ARCHITECTURE_COMPLIANCE** | **PASS** |
| **PCP Full Pipeline Alignment (Phase 0.5)** | **PASS** |
| **Enterprise SSOT Alignment** | **PASS** |

## Domain Alignment Score

| Domain | Aligned layers | Score | Status |
|--------|----------------|-------|--------|
| community | 7/7 | 100% | ALIGNED |
| market | 4/7 | 57% | GAP |
| provider | 3/7 | 43% | GAP |
| acquisition | 3/7 | 43% | GAP |
| official_guide | 4/7 | 57% | GAP |
| campaign | 4/7 | 57% | GAP |
| admin_public_content_center | 7/7 | 100% | ALIGNED |

## Domain × Layer Matrix

| Domain | Layer | Status | Note | Phase 1 target |
|--------|-------|--------|------|----------------|
| community | governance | PASS | governed_community_posts_v1 | — |
| community | builder | PASS | pcp/feed_builder.rs | — |
| community | public_api | PASS | feed · detail · governed read paths | — |
| community | frontend | PASS | /community/* | — |
| community | registry | PASS | public-content-platform.v1.yaml | — |
| community | runbook | PASS | TT-PUBLIC-CONTENT-PLATFORM.md | — |
| community | evidence | PASS | phase0.5 validation chain | — |
| market | governance | GAP | Rust display_status filter (REFERENCE) | governed_market_guides_v1 · governed_market_listings_v1 · governed_discover_orders_v1 |
| market | builder | GAP | chain_off/market_public_surface.rs (REFERENCE) | pcp/market_builder.rs |
| market | public_api | PASS | GET /guides · discover/orders · listings | — |
| market | frontend | PASS | /guides · /market | — |
| market | registry | PASS | content_domains.market | — |
| market | runbook | PASS | runbook market section | — |
| market | evidence | GAP | No governed market migration evidence yet | phase1 market governed view evidence |
| provider | governance | GAP | Shared with market — no separate fork allowed | market_builder + governed_market_listings_v1 (variant=provider) |
| provider | builder | GAP | Shared with market — no separate fork allowed | market_builder + governed_market_listings_v1 (variant=provider) |
| provider | public_api | PASS | GET /market/provider/listings | — |
| provider | frontend | PASS | /market/provider | — |
| provider | registry | PASS | content_domains.provider | — |
| provider | runbook | GAP | Provider not isolated in runbook — inherits market REFERENCE note | Document provider under market_builder |
| provider | evidence | GAP | Shared market evidence pending | market phase1 evidence |
| acquisition | governance | GAP | Shared with market | market_builder + governed_market_listings_v1 (variant=acquisition) |
| acquisition | builder | GAP | Shared with market | market_builder + governed_market_listings_v1 (variant=acquisition) |
| acquisition | public_api | PASS | GET /market/acquisition/listings | — |
| acquisition | frontend | PASS | /market/acquisition | — |
| acquisition | registry | PASS | content_domains.acquisition | — |
| acquisition | runbook | GAP | Acquisition inherits market reference | runbook alignment |
| acquisition | evidence | GAP | Shared market evidence pending | market phase1 evidence |
| official_guide | governance | GAP | OCS + display_status via MarketBuilder reference | governed_guides_v1 |
| official_guide | builder | GAP | Guides public surface via MarketBuilder | pcp/market_builder.rs guides surface |
| official_guide | public_api | PASS | GET /api/v1/guides | — |
| official_guide | frontend | PASS | /guides | — |
| official_guide | registry | PASS | content_domains.official_guide | — |
| official_guide | runbook | PASS | runbook | — |
| official_guide | evidence | GAP | No governed guides evidence | phase1 guides migration evidence |
| campaign | governance | GAP | ops_cold_start + Public Ops partial | governed_campaign_surfaces_v1 |
| campaign | builder | GAP | ops_cold_start consumer (PARTIAL) | pcp/campaign_builder.rs |
| campaign | public_api | PASS | GET /official/cold-start/surfaces/* | — |
| campaign | frontend | PASS | cold-start surfaces | — |
| campaign | registry | PASS | content_domains.campaign | — |
| campaign | runbook | PASS | runbook campaign section | — |
| campaign | evidence | GAP | No campaign builder formalization evidence | phase1 campaign builder evidence |
| admin_public_content_center | governance | PASS | Public Ops write console (4 entities) | — |
| admin_public_content_center | builder | N/A | Write-path governance — no public builder | — |
| admin_public_content_center | public_api | PASS | /admin/official/public-operations/* | — |
| admin_public_content_center | frontend | PASS | /admin/official/public-operations | — |
| admin_public_content_center | registry | PASS | public-operations-mvp.v1.yaml | — |
| admin_public_content_center | runbook | PASS | Public Operations SSOT runbook | — |
| admin_public_content_center | evidence | PASS | Phase 0.5 validation + publish-queue probes | — |
| ddg | registry | PASS | registry/display-data-governance.v1.yaml → PCP cross-ref | — |
| ddg | runbook | PASS | PCP sub-capability pointer | — |
| ddg | evidence | PASS | SSOT alignment evidence | — |
| ocs | registry | PASS | registry/official-cold-start-dataset.v1.yaml → PCP cross-ref | — |
| ocs | runbook | PASS | PCP sub-capability pointer | — |
| ocs | evidence | PASS | SSOT alignment evidence | — |
| sopcp | registry | PASS | registry/single-official-public-catalog-policy.v1.yaml → PCP cross-ref | — |
| sopcp | runbook | PASS | PCP sub-capability pointer | — |
| sopcp | evidence | PASS | SSOT alignment evidence | — |
| ocip | registry | PASS | registry/official-catalog-identity-policy.v1.yaml → PCP cross-ref | — |
| ocip | runbook | PASS | PCP sub-capability pointer | — |
| ocip | evidence | PASS | SSOT alignment evidence | — |

## Legacy Read Paths

- `OLD-MKT-001` · **LEGACY** · market — Inline display_status filter in MarketBuilder reference path (`crates/api/src/chain_off/market_public_surface.rs`)
- `OLD-MKT-002` · **LEGACY** · market — Raw display_status predicate on market_listings (`crates/api/src/db/market_listings.rs`)
- `OLD-CAM-001` · **LEGACY** · campaign — Campaign public surface via ops_cold_start consumer (not pcp/campaign_builder) (`crates/api/src/db/ops_cold_start_campaigns_consumer.rs`)
- `OLD-COM-OK` · **ALIGNED** · community — Community public catalog uses governed view (aligned) (`crates/api/src/db/community.rs`)

## Phase 1 Gap List (eliminate REFERENCE · PARTIAL · EXPECTED_DIFFERENCE)

- **[OLD_READ_PATH]** `OLD-MKT-001` · market/governance — Inline display_status filter in MarketBuilder reference path
  - Fix: governed_market_* SQL view + pcp/market_builder.rs
- **[OLD_READ_PATH]** `OLD-MKT-002` · market/governance — Raw display_status predicate on market_listings
  - Fix: Read governed_market_listings_v1 in public catalog queries
- **[OLD_READ_PATH]** `OLD-CAM-001` · campaign/governance — Campaign public surface via ops_cold_start consumer (not pcp/campaign_builder)
  - Fix: pcp/campaign_builder.rs + governed campaign surfaces
- **[REFERENCE_IMPL]** `P1-MKT-GOV-001` · market/governance — No governed_market_* SQL views — public reads use inline display_status (REFERENCE_IMPL)
  - Fix: Add migrations + wire public API to governed views
- **[REFERENCE_IMPL]** `P1-MKT-BLD-001` · market/builder — MarketBuilder still in chain_off/market_public_surface.rs
  - Fix: Create pcp/market_builder.rs and re-export public surface builders
- **[REFERENCE_IMPL]** `P1-GUI-GOV-001` · official_guide/governance — Guides public catalog lacks governed SQL view
  - Fix: governed_guides_v1 migration + wire GET /guides
- **[PARTIAL]** `P1-CAM-BLD-001` · campaign/builder — CampaignBuilder not under pcp/ — ops_cold_start consumer
  - Fix: pcp/campaign_builder.rs + governed campaign surfaces

## Phase 1 Fix Order

1. [REFERENCE_IMPL] P1-MKT-GOV-001 — Add migrations + wire public API to governed views
2. [REFERENCE_IMPL] P1-MKT-BLD-001 — Create pcp/market_builder.rs and re-export public surface builders
3. [REFERENCE_IMPL] P1-GUI-GOV-001 — governed_guides_v1 migration + wire GET /guides
4. [PARTIAL] P1-CAM-BLD-001 — pcp/campaign_builder.rs + governed campaign surfaces
5. [OLD_READ_PATH] OLD-MKT-001 — governed_market_* SQL view + pcp/market_builder.rs
6. [OLD_READ_PATH] OLD-MKT-002 — Read governed_market_listings_v1 in public catalog queries

## Sub-Audit Evidence

- **architecture_compliance**: PASS — Community governed-view compliance (Phase 0.5 gate)
- **full_pipeline**: PASS — Phase ①/② pipeline matrix + community staging loop
- **phase_0_5_staging**: PASS — Publish/Unpublish · Surface OFF/ON · Feed+Detail
- **enterprise_ssot**: PASS — Cross-platform registry/governance/config alignment
