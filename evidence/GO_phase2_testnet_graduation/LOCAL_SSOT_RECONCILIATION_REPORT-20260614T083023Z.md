# LOCAL SSOT vs Staging Deployment Reconciliation Report

**Stamp:** 20260614T083023Z  
**Local SSOT:** **Working Tree** (真实开发基线)  
**Staging:** `tt-api-staging` / `tt-web-staging` · git_sha `5ab1f8ba2229…`  
**Git HEAD:** `5ab1f8ba2229…` (✅ = staging)

**阶段口径：** ① → **②** → ③ · **Reliability Freeze · audit-only**

---

## Reconciliation Verdict

| 项 | 结论 |
|----|------|
| **Verdict** | **RECONCILIATION_REQUIRED** |
| **WT vs HEAD** | 278 modified · 1802 untracked |
| **WT vs Staging** | ❌ **not converged** |
| **HEAD vs Staging** | ✅ aligned |
| **Gaps** | C:3 H:5 M:4 L:2 |

**grep:** `TT_LOCAL_SSOT_RECONCILIATION: RECONCILIATION_REQUIRED 20260614T083023Z`

**机读：** `LOCAL_SSOT_RECONCILIATION_REPORT-20260614T083023Z.json` · `freeze-lift-backlog.v1.json`

---

## Aligned

- ✅ HEAD git_sha = staging /meta.build.git_sha
- ✅ escrow_factory_address: registry = staging /meta
- ✅ fee_router_address: registry = staging /meta
- ✅ governor_address: registry = staging /meta
- ✅ Sepolia spine audit OK (registry ↔ on-chain)
- ✅ check-staging-web-alignment PASS (prior: CORS/Sepolia/NEXT_PUBLIC core trio)

---

## Gap Registry

| ID | Sev | Category | Domain | Title |
|----|-----|----------|--------|-------|
| RECON-001 | **Critical** | local_exists_uncommitted | Version / SSOT | Working tree is Local SSOT but not in git |
| RECON-002 | **Critical** | evidence_code_semantic_mismatch | Indexer | TN-P1-010 CLOSED in evidence · selector fix only in working tree |
| RECON-003 | **Critical** | db_executed_not_in_repo | Database | CMS/Growth/guides migrations on disk · not in git |
| RECON-004 | **High** | local_exists_uncommitted | Admin / CMS / Growth | Admin HTTP handlers exist locally · not in HEAD |
| RECON-005 | **High** | local_exists_uncommitted | Admin UI | Admin FE route trees untracked |
| RECON-006 | **High** | local_exists_uncommitted | Governance UI | Governance module FE changes not committed |
| RECON-007 | **High** | config_exists_not_exposed | Governance / Meta | Governance token in registry · absent from staging /meta |
| RECON-008 | **High** | config_exists_not_exposed | Steward / Meta | REGION_STEWARD_STAKE_POOL_ADDRESS set · /meta staking_address null |
| RECON-009 | **Medium** | config_exists_not_exposed | Observability | /meta build.deployed_at null on staging |
| RECON-010 | **Medium** | local_exists_uncommitted | Indexer | indexer.rs substantial uncommitted delta |
| RECON-011 | **Medium** | local_exists_uncommitted | Contracts | Phase② contract artifacts untracked |
| RECON-012 | **Medium** | local_exists_uncommitted | API / Domain | New chain_off modules untracked |
| RECON-013 | **Low** | committed_not_deployed | Deploy | HEAD equals staging SHA · no committed-but-not-deployed gap |
| RECON-014 | **Low** | graduation_gate | Reliability | TN-P1-009 soak INFLIGHT (not SSOT drift) |

---

## Freeze Lift Backlog（Phase② 毕业后 · Single SSOT 收敛）

| ID | P | Title | Exit |
|----|---|-------|------|
| FLB-001 | P0 | Commit Indexer TN-P1-010 bundle | HEAD selectors match WT; cargo test -p traveltrust-api chain |
| FLB-002 | P0 | Track SQL migrations in git | 10 migrations in git; staging _sqlx_migrations stamp recorded |
| FLB-003 | P0 | Commit CMS/Growth/Admin API + chain_off domain | run-check-04-routes.sh exit 0; admin routes mounted |
| FLB-004 | P1 | Commit Admin + Governance frontend | admin/governance vitest contracts pass (subset) |
| FLB-005 | P1 | Fly env sync · meta exposure | /meta shows governance_votes_token_address + staking_address + deployed_at |
| FLB-006 | P1 | Deploy tt-api-staging from unified commit | staging /meta git_sha = new HEAD; reconcile compound_pass |
| FLB-007 | P1 | Deploy tt-web-staging from same SHA | check-staging-web-alignment FAIL=0 |
| FLB-008 | P2 | Commit contracts Phase② artifacts (if in scope) | phase2-sepolia-spine-audit OK |
| FLB-009 | P2 | Reconciliation verification gate | TT_LOCAL_SSOT_RECONCILIATION: RECONCILED; non-soak alignment gaps=0 |
| FLB-010 | P2 | Evidence SHA refresh (no closed-item rerun) | Evidence git_sha matches deployed HEAD post-FLB-006 |

**执行顺序：** FLB-001 → 002 → 003 → 004 → **005 env** → **006 API deploy** → **007 Web deploy** → 008 → **009 verification** → 010 evidence SHA refresh

**纪律：** Freeze 期间 **不执行** FLB · 不重跑 TN-P1-010/D6/soak 已关闭项 · 毕业后再收敛 WT→HEAD→Staging 为同一 SHA。

---

## Detail

### RECON-001 · Critical · local_exists_uncommitted

**Working tree is Local SSOT but not in git** (Version / SSOT)

- 278 modified + 1802 untracked vs HEAD 5ab1f8ba2229; staging /meta git_sha = HEAD (not working tree).
- **Impact:** Single Source of Truth split: developers run WT; staging runs HEAD; redeploy without commit drops latest work.
- **Fix:** Freeze Lift: structured commit waves (see FLB-001..003) then deploy from one SHA.

### RECON-002 · Critical · evidence_code_semantic_mismatch

**TN-P1-010 CLOSED in evidence · selector fix only in working tree** (Indexer)

- HEAD ESCROW=0x87,0x90,0x6b,0x1e STATUS=0x66,0x01,0xcb,0x31; WT ESCROW=0x83,0xa2,0x65,0xa7 STATUS=0x20,0x0d,0x2e,0xd2. TN-P1-010 evidence PASS; staging reconcile compound_pass=true (log path may mask RPC reads).
- **Impact:** Evidence claims indexer reconcile closed; git HEAD still has wrong eth_call selectors.
- **Fix:** FLB-001: commit mod.rs + indexer.rs bundle; redeploy API; append reconcile evidence with new git_sha.

### RECON-003 · Critical · db_executed_not_in_repo

**CMS/Growth/guides migrations on disk · not in git** (Database)

- 10 files: 20260607120000_cms_catalog_p1.sql, 20260607120100_cms_official_ops_p2.sql, 20260607120200_cms_growth_p3.sql, 20260607130000_cms_catalog_s2_004_pricing_tiers_media.sql, 20260607140000_growth_early_bird_g_s3.sql, 20260607150000_growth_airdrop_g_s6.sql, 20260608120000_sprint168_business_expansion.sql, 20260609120000_guides_hourly_rate_avatar_url.sql, 20260612120000_guides_public_title.sql, 20260613120000_guide_exit_requests.sql. Staging CMS/Growth admin API parity PASS → DB likely migrated out-of-band.
- **Impact:** Clone-from-git + migrate would miss schema; reproducibility broken.
- **Fix:** FLB-002: git add migrations + record staging _sqlx_migrations stamp in evidence.

### RECON-004 · High · local_exists_uncommitted

**Admin HTTP handlers exist locally · not in HEAD** (Admin / CMS / Growth)

- 17 untracked admin route modules (catalog, growth, official, …). Staging returns 200 — likely deployed from dirty tree earlier or partial overlap with HEAD routes.
- **Impact:** Admin console FE/BE parity fragile across environments.
- **Fix:** FLB-003: commit admin + catalog + growth route tree; verify admin mod.rs mounts.

### RECON-005 · High · local_exists_uncommitted

**Admin FE route trees untracked** (Admin UI)

- 7 dirs: content, conversion-analytics, governance, growth, guide-applications, official, region-share under frontend/app/admin/.
- **Impact:** Staging web may lack new admin pages present locally.
- **Fix:** FLB-004: commit admin FE; deploy tt-web-staging from same SHA as API.

### RECON-006 · High · local_exists_uncommitted

**Governance module FE changes not committed** (Governance UI)

- 21 modified files under frontend/app/governance/ (proposals, params, hub).
- **Impact:** Local governance UX ≠ staging until commit+deploy.
- **Fix:** FLB-004: include in frontend commit wave.

### RECON-007 · High · config_exists_not_exposed

**Governance token in registry · absent from staging /meta** (Governance / Meta)

- registry=0xac2e29ac7089e4863c21daf232cf8bbb025d91ca; local env=set; /meta governance_votes_token_address=null.
- **Impact:** Governance vote weight / getPastVotes UI cannot self-configure from meta on staging.
- **Fix:** FLB-005: set GOVERNANCE_VOTES_TOKEN_ADDRESS (or GOVERNANCE_TOKEN_ADDRESS) on Fly; redeploy API.

### RECON-008 · High · config_exists_not_exposed

**REGION_STEWARD_STAKE_POOL_ADDRESS set · /meta staking_address null** (Steward / Meta)

- env REGION_STEWARD_STAKE_POOL_ADDRESS=0x16F914f3…; meta reads STAKING_ADDRESS not REGION_STEWARD_*; registry=0x16f914f3d50f7aa02665589e715f94ca3b7ab47c.
- **Impact:** Steward stake API may work while meta observability / FE guards show null staking.
- **Fix:** FLB-005: align Fly STAKING_ADDRESS=pool or extend ChainConfig meta mapping (post-freeze code if needed).

### RECON-009 · Medium · config_exists_not_exposed

**/meta build.deployed_at null on staging** (Observability)

- TRAVELTRUST_DEPLOYED_AT not injected on tt-api-staging.
- **Impact:** Deploy audit trail weak for reconciliation.
- **Fix:** FLB-006: set TRAVELTRUST_DEPLOYED_AT on Fly release.

### RECON-010 · Medium · local_exists_uncommitted

**indexer.rs substantial uncommitted delta** (Indexer)

-  1 file changed, 162 insertions(+), 8 deletions(-)
- **Impact:** Indexer tick/reconcile behavior differs WT vs staging HEAD.
- **Fix:** FLB-001: commit with selector fix.

### RECON-011 · Medium · local_exists_uncommitted

**Phase② contract artifacts untracked** (Contracts)

- 18 untracked under contracts/ (scripts, src, abi, test).
- **Impact:** On-chain tooling not reproducible from git HEAD.
- **Fix:** FLB-007: commit contracts wave or document deploy-only exclusion.

### RECON-012 · Medium · local_exists_uncommitted

**New chain_off modules untracked** (API / Domain)

- 10 modules (guide_exit, identity_slots, slot_rbac, steward_seat, …).
- **Impact:** Business logic on disk not in HEAD/staging.
- **Fix:** FLB-003: commit API domain wave with routes.

### RECON-013 · Low · committed_not_deployed

**HEAD equals staging SHA · no committed-but-not-deployed gap** (Deploy)

- HEAD 5ab1f8ba2229 = staging git_sha; gap is WT→HEAD not HEAD→staging.
- **Impact:** None for committed code; WT is the drift source.
- **Fix:** N/A — focus FLB commit waves.

### RECON-014 · Low · graduation_gate

**TN-P1-009 soak INFLIGHT (not SSOT drift)** (Reliability)

- P2FC 72h soak; COMPLETED.json pending.
- **Impact:** Phase② graduation OPEN until soak + post-soak closure.
- **Fix:** Wait soak; run post-soak graduation (no redeploy required for soak itself).


**诚实边界：** 本地工作区 = 真实开发 SSOT；测试网 = 已提交 HEAD 快照；**毕业后**须 FLB 使三者收敛为 **one git SHA**。
