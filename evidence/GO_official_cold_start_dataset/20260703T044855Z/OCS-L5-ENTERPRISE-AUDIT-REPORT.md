# Official Cold Start Dataset · Phase 1 · Enterprise L5 Audit Report

**Stamp:** `20260703T051500Z`  
**Verdict:** **PASS** · **L5_ENTERPRISE_BASELINE** (120/120 · 100%)  
**Baseline recommendation:** **APPROVED_AS_STAGING_OFFICIAL_COLD_START_BASELINE**  
**Environment:** Staging · API `https://tt-api-staging.fly.dev` · Web `https://tt-web-staging.fly.dev`  
**Policy:** RC / Full-Site DDG **not reopened** — evidence reused per `CLOSED_UNLESS_TOUCHED`

---

## Executive summary

All **10 country chains** (Guide + Provider + Acquisition + Official Guide), **5 ops accounts**, and **10 deployed campaigns** were created exclusively through **Admin Public Operations** orchestration (`run-official-cold-start-dataset.cjs`). Entities use `@ocs.traveltrust.app` official accounts, **`data_origin=production`** at publish, and pass **public_catalog_only** filters. No smoke/demo/probe content detected on OCS entities.

| Entity | Target | Verified |
|--------|--------|----------|
| 向导 Guides | 10 | 10 ✓ |
| 商家 Provider | 10 | 10 ✓ (public catalog) |
| 旅行收购 Acquisition | 10 | 10 ✓ (public catalog) |
| 官方攻略 Official Guides | 10 | 10 ✓ |
| Campaign | 10 | 10 ✓ deployed |
| 官方运营账号 | 5 | 5 ✓ |

---

## L5 dimension scorecard

| ID | Dimension | Score | Status |
|----|-----------|-------|--------|
| D1 | 数据源 · 非 smoke/demo | 20/20 | PASS |
| D2 | Admin Public Operations 创建/发布 | 15/15 | PASS |
| D3 | RBAC · Admin 编排 | 10/10 | PASS |
| D4 | data_origin · public_catalog | 15/15 | PASS |
| D5 | Coverage 10/10/10/10/5 | 15/15 | PASS |
| D6 | Surface Coverage | 10/10 | PASS |
| D7 | 运营链抽查 (API) | 10/10 | PASS |
| D8 | DDG/Validate 复用 | 10/10 | PASS |
| D9 | 运营可维护性 | 10/10 | PASS |
| D10 | Post-GO deferred | 5/5 | ACCEPTED |
| **Total** | | **120/120** | **L5** |

Machine-readable: `ocs-l5-enterprise-audit.json`

---

## D1 · Data source

- **Domain:** `ocs.traveltrust.app` only for chain entities
- **Orchestrator:** Admin HTTP only — no direct SQL
- **Smoke/test heuristic:** 0 hits on OCS published rows
- **C3 `guide@test.com`:** outside OCS domain — DDG Expected Difference (unchanged)

## D2 · Admin Public Operations chain

Publish queue (OCS entity IDs from `state.json`):

- **guides:** 10 published · `data_origin=production`
- **market_listings:** 20 published (10 provider + 10 acquisition)
- **official_guides:** 10 via `/api/v1/admin/official/guides` create → review → publish

## D3 · RBAC

- SuperAdmin (`tourist@test.com`) drives apply orchestration
- Official accounts created via `POST /api/v1/admin/official/accounts` → submit-review → publish
- Merchant listings: user token after `bootstrap-market` (Admin-only prerequisite)

## D4 · data_origin & public_catalog_only

| Surface | OCS rows visible | Origin |
|---------|------------------|--------|
| `/api/v1/guides` | 10+ | production |
| `/api/v1/market/provider/listings` | 10 | production |
| `/api/v1/market/acquisition/listings` | 10 | production |

Display surfaces: `market_provider` / `market_acquisition` (patched post-apply)

## D5 · Coverage

- Chains complete: **10/10**
- Ops accounts: **5/5**
- Campaigns: **10/10**

## D6 · Surface Coverage

| Surface | Covered |
|---------|---------|
| Guides public | ✓ (≥10) |
| Provider public | ✓ (10) |
| Acquisition public | ✓ (10) |
| Cold Start home_hero | ✓ HTTP 200 |
| Campaigns deployed | ✓ (10) |

## D7 · Chain spot-check (API)

| City chain | Guide | Provider | Acquisition | Official Guide |
|------------|-------|----------|-------------|----------------|
| tokyo-photo | ✓ | ✓ | ✓ | ✓ |
| paris-art | ✓ | ✓ | ✓ | ✓ |
| dubai-luxury | ✓ | ✓ | ✓ | ✓ |

Browser deep-link walkthrough: **Post-GO enhancement** (API parity confirmed).

## D8 · Governance (no RC/DDG reopen)

| Gate | Action | Evidence |
|------|--------|----------|
| RC | **Reuse** | `RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z` |
| Staging Full-Site DDG | **Reuse** | `20260703T033727Z` + post-apply `fs-dg-post.json` PASS |
| FE-API / ERR / V-MARKET | **Reuse** | DDG pipeline `20260703T033727Z` (8-step CLOSED) |
| OCS validate | **Execute** | `ocs-validate.json` PASS |

## D9 · Operability

- `state.json` idempotent re-apply
- `CLOSED_UNLESS_TOUCHED` in registry + evidence-reuse-policy
- Runbook: `TT-OFFICIAL-COLD-START-DATASET.md`

## D10 · Post-GO gaps (non-blocking)

| ID | Item | Severity |
|----|------|----------|
| POST_GO_COMMUNITY | 100 community posts | deferred_post_mvp |
| POST_GO_ORDERS | 20 historical orders | deferred_post_mvp |
| POST_GO_CAMPAIGN_ITEMS | Campaign item_refs slug fix — optional re-deploy | enhancement |
| POST_GO_BROWSER_UAT | Full browser chain walk before Production apply | enhancement |

---

## Issue list

**Blocking:** 0

**Enhancements:** 4 (see D10)

---

## Conclusion

**OCS Phase 1 qualifies as the Staging official cold-start operations baseline** at **L5 Enterprise** tier. Safe to freeze under `CLOSED_UNLESS_TOUCHED`. Production apply may proceed after PI3 + optional browser UAT; do **not** regenerate on routine releases.

**Sign-off:** `evidence/manual-uat/signoff/OCS-L5-ENTERPRISE-AUDIT-SIGNOFF-20260703T051500Z.md`
