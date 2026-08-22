# Official-First · Execution Parity（Official→Git→Local→Staging）

**STATUS:** `MIGRATION_RECOVERED_SCHEMA_CONVERGENCE_PENDING`  
**Pre-DB commit:** `a6fafe3d1` · **Drift-stop commit:** `da5f5798a`  
**Gate:** `PRODUCT_AND_DOCUMENTATION_PARITY` = **FAIL** · **PASS NOT_ISSUED**  
**`TT_PRODUCTION_GO`:** NO_GO  

## Zero gates (this wave)

| Gate | Value | Evidence |
|------|-------|----------|
| `UNAUTHORIZED_DRIFT` | **0** (identity plane) | 1to1 + plane-map PASS · Staging www=`3e356617…` |
| `DOC_TRUTH_CONFLICTS` | **0** (Local-SSOT ladder banner set) | DOC_RETAG wave1+2 |
| `OLD_PRODUCT_REFS` | **0** | [`OLD_PRODUCT_REFS_CLOSURE_20260822.json`](../../evidence/GO_official_product_reality_capture/OLD_PRODUCT_REFS_CLOSURE_20260822.json) |
| `RUNTIME_PARITY_GAPS` | **NOT_ZERO** | Migration bookkeeping **MATCH_1TO1** · schema convergence **PENDING** (3 view columns + Staging capture) |

**因此禁止盖** `PRODUCT_AND_DOCUMENTATION_PARITY_PASS`。  
**禁止** `ACCEPT_ED` 清零 RUNTIME。**禁止**为过闸改官网 DB（DDL/DML/migration/repair）。

## Migration recovery (Official Production API container)

| Item | Value |
|------|-------|
| Source | `tt-api-prod` `/app/crates/api/migrations` (read-only `fly ssh cat`) |
| Recovered | `20260816180000` · `20260816190000` · `20260816200000` |
| Checksum resync | **13** additional files synced from container (Git bytes ≠ Prod applied checksum) |
| Verify | `PROD_GIT_MIGRATION_VERIFY_LATEST.json` → **`MATCH_1TO1`** (157/157) |
| Evidence | `PROD_MIGRATION_RECOVERY_LATEST.json` |

## Production Reality drift (resolved bookkeeping / open schema)

| Version | Description | Git |
|---------|-------------|-----|
| `20260816180000` | cms announcements hub roles campaign | **RESTORED** |
| `20260816190000` | cms announcements role gov copy | **RESTORED** |
| `20260816200000` | cms announcements role copy short | **RESTORED** |

**Open schema gap (STOP · no guess-write):** 3 `SELECT *` view columns on Production not reproduced by fresh Git migrate — see `SCHEMA_CONVERGENCE_STATUS_LATEST.json`.  
**Staging:** schema capture blocked (no reachable DSN this wave).

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
