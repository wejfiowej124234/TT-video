# Official-First · Execution Parity（Official→Git→Local→Staging）

**STATUS:** `STOP_PRODUCTION_REALITY_DRIFT`  
**Pre-DB commit:** `a6fafe3d1` (execution-parity-pre-db-only)  
**Gate:** `PRODUCT_AND_DOCUMENTATION_PARITY` = **FAIL** · **PASS NOT_ISSUED**  
**`TT_PRODUCTION_GO`:** NO_GO  

## Zero gates (this wave)

| Gate | Value | Evidence |
|------|-------|----------|
| `UNAUTHORIZED_DRIFT` | **0** (identity plane) | 1to1 + plane-map PASS · Staging www=`3e356617…` |
| `DOC_TRUTH_CONFLICTS` | **0** (Local-SSOT ladder banner set) | DOC_RETAG wave1+2 |
| `OLD_PRODUCT_REFS` | **0** | [`OLD_PRODUCT_REFS_CLOSURE_20260822.json`](../../evidence/GO_official_product_reality_capture/OLD_PRODUCT_REFS_CLOSURE_20260822.json) |
| `RUNTIME_PARITY_GAPS` | **NOT_ZERO** | Live schema capture **PASS** · layered compare **DRIFT STOP** |

**因此禁止盖** `PRODUCT_AND_DOCUMENTATION_PARITY_PASS`。  
**禁止** `ACCEPT_ED` 清零 RUNTIME。**禁止**为过闸改官网 DB（DDL/DML/migration/repair）。

## Official Production schema Reality Capture

| Item | Value |
|------|-------|
| Status | `PASS_CAPTURE` (schema-only · read path · no user/business rows) |
| Stamp | `20260822T051209Z` |
| Aggregate | `1362c3a24908fb2aff0bf1985fe5658054ef0e39d69fbd3728bd033a1b9b7478` |
| Counts | extensions=3 · tables=168 · columns=1849 · indexes=507 · constraints=507 |
| Scripts | `scripts/dev/capture-official-prod-schema-readonly.sh` · `.py` |
| Compare | `scripts/dev/compare-official-prod-schema-layers.py` |

## Production Reality drift (STOP)

| Version | Description (from `_sqlx_migrations`) | In `crates/api/migrations` |
|---------|----------------------------------------|----------------------------|
| `20260816180000` | cms announcements hub roles campaign | **NO** |
| `20260816190000` | cms announcements role gov copy | **NO** |
| `20260816200000` | cms announcements role copy short | **NO** |

- Production applied migrations: **157**
- Git `crates/api/migrations` SQL files: **154** (prior “167” fingerprint included cargo-home sqlx test noise — not authoritative)
- All Git versions **are** on Production; Production is **ahead** of Git with 3 unknown SQL sources
- Artifact: [`PRODUCTION_REALITY_SCHEMA_DRIFT_LATEST.json`](../../evidence/GO_official_product_reality_capture/PRODUCTION_REALITY_SCHEMA_DRIFT_LATEST.json)

Local/Staging live schema compare: **NOT_CAPTURED_THIS_WAVE** (does not waive this STOP).

## RUNTIME closed this wave

| Surface | Artifact |
|---------|----------|
| API depth (unauth) | `RUNTIME_API_DEPTH_20260822.json` |
| CMS/Assets inventory | `RUNTIME_CMS_ASSETS_INVENTORY_20260822.json` |
| Env/flags policy | `RUNTIME_ENV_FLAGS_PARITY_20260822.json` (`.env.local` = DEV_ONLY) |
| DB migration fingerprint (Git tree) | `RUNTIME_DB_MIGRATION_FINGERPRINT_20260822.json` |
| Auth/Admin/i18n/identity | `RUNTIME_AUTH_ADMIN_I18N_IDENTITY_20260822.json` |
| Live schema capture | `OFFICIAL_PROD_SCHEMA_CAPTURE_LATEST.json` |
| Layered compare | `OFFICIAL_PROD_SCHEMA_LAYERED_COMPARE_LATEST.json` |

## DEFECT

Still **POST_PARITY_FIX_QUEUE** only (M7-07, M7-08, M8-07) — **no fix** until Parity PASS.

## Next (Owner only · not this agent auto-fix)

1. Recover or reconstruct the 3 Production-only migration SQL sources into Git **without** mutating Production, **or** Owner-written Reality decision that is **not** ACCEPT_ED-for-gate
2. Re-run layered compare → only if MATCH then `RUNTIME_PARITY_GAPS=0`
3. Four zeros true → then `PRODUCT_AND_DOCUMENTATION_PARITY_PASS`
4. Only after Parity PASS → POST_PARITY_FIX_QUEUE

## Forbidden

CMS/UI/功能优化 · Exact-Match · Mainnet · `TT_PRODUCTION_GO` 翻转 · Candidate→LIVE · Official DB mutation to green the gate  

**P0:** Sepolia ETA interrupt → Reality (`READY_AT=1787408352`).
