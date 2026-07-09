# Phase② · Post-Graduation · Freeze-Lift Execution Plan

**Stamp:** 20260614T083606Z  
**Mode:** Planning-only until `TT_TESTNET_GRADUATION:CLOSED`  
**SSOT 目标：** 本地最新代码（WT）→ commit → deploy → **四层同一 SHA**  
**grep:** `TT_FREEZE_LIFT_EXECUTION_PLAN: ACTIVE 20260614T083606Z`

**阶段口径：** ① → **②** → ③ · **收敛-only · 不新增功能 · 不扩展测试范围**

---

## 前置条件（T0）

1. `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json`
2. `bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh` → **CLOSED**
3. 显式 **Freeze Lift** 授权（解除 TESTNET_STAGING_FREEZE 或 Owner 书面 GO）

---

## 四层 SSOT · 一致性矩阵（RECON-001～003）

| RECON | 维度 | WT | HEAD | Staging | Evidence | 目标态 |
|-------|------|-----|------|---------|----------|--------|
| **001** | code | delta | stale | stale | partial | 全 **match** |
| **001** | db_migrations | ahead | stale | unknown | no_stamp | git+stamp |
| **001** | deploy_version | — | 5ab1f8ba2229 | 5ab1f8ba2229 | old | **新 SHA S** |
| **002** | code | fixed | wrong | wrong | pass | **S** 含 fix |
| **002** | evidence_chain | — | gap | gap | TN-P1-010 | **S** 追加 |
| **003** | db_migrations | 10 files | missing | applied? | no_stamp | **10 in git** |

机读全表：`freeze-lift-consistency-matrix.v1.json`

---

## FLB-001～010 · 逐项执行审计

| ID | Wave | P | 收敛维度 | 退出闸 | 明确不做 |
|----|------|---|----------|--------|----------|
| FLB-001 | 1 | P0 | Commit TN-P1-010 Indexer bundle | HEAD selectors match WT; tests green | New indexer features; Expanded test matrix |
| FLB-002 | 1 | P0 | Migration inventory commit | 10 files tracked; stamp JSON on file | New migrations; Staging migrate unless drift detected |
| FLB-003 | 2 | P0 | Commit CMS/Growth/Admin API + chain_off | 04 routes exit 0 | New API surfaces; 04 spec expansion |
| FLB-004 | 2 | P1 | Commit Admin + Governance FE | No five-main freeze violations | Five-main routes UI; New Playwright suites |
| FLB-005 | 3 | P1 | Fly env · meta exposure | meta gov token + staking + deployed_at non-null | New env vars; Production keys |
| FLB-006 | 3 | P0 | Deploy tt-api-staging | compound_pass=true; git_sha match | Feature flags; New smoke suites |
| FLB-007 | 3 | P1 | Deploy tt-web-staging | FAIL=0 | Five-main UI changes; New E2E matrix |
| FLB-008 | 4 | P2 | Contracts artifacts commit | TT_PHASE2_SEPOLIA_SPINE_AUDIT: OK | New broadcasts; Mainnet |
| FLB-009 | 5 | P0 | Reconciliation verification | TT_LOCAL_SSOT_RECONCILIATION: RECONCILED | New audit dimensions; Full ISS-007 matrix |
| FLB-010 | 5 | P2 | Evidence SHA refresh | Evidence git_sha = Staging /meta | Rerun TN-P1-010 sprint; Rerun D6 |

---

## 执行时间线

```text
T0  CLOSED + G-09
T1  FLB-001 + FLB-002     (commit · P0 · Indexer + migrations)
T2  FLB-003 + FLB-004     (commit · domain + FE)
T3  FLB-005 + FLB-006 + FLB-007  (env + API + Web deploy)
T4  FLB-008               (optional contracts)
T5  FLB-009 + FLB-010     (RECONCILED + evidence SHA)
```

---

## Single SSOT 收敛判据

```
∃ SHA S:
  git status --porcelain 为空（或仅 docs/evidence 维护）
  HEAD = S
  Staging /meta.build.git_sha = S
  Evidence manifest + TN-P1-010 STATUS 引用 S
  TT_LOCAL_SSOT_RECONCILIATION: RECONCILED
```

---

## 命令索引（毕业后）

```bash
# T1
cargo test -p traveltrust-api
git add crates/api/src/chain/mod.rs crates/api/src/chain/indexer.rs
git add crates/api/migrations/202606*.sql

# T3（Owner 授权后）
bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh
bash scripts/dev/deploy-tt-web-staging.sh

# T5
bash scripts/dev/run-local-ssot-reconciliation-audit.sh
node scripts/dev/emit-freeze-lift-execution-plan.mjs
```

---

## 纪律

| ✅ 允许 | ❌ 禁止 |
|---------|---------|
| WT→HEAD commit 波次 | 新功能 / 新路由 / 五主 UI |
| 同 SHA deploy | 扩展 Playwright/ISS-007 矩阵 |
| FLB gate 命令 | 重跑 soak · D6 · 全量 TN-P1-010 |
| Evidence SHA 追加 | 审计标准扩展 |

**诚实边界：** Freeze-Lift 收敛 **≠** ③ Production GO

**当前 Freeze 态：** Soak INFLIGHT · WT 278+1805 files · Staging=5ab1f8ba2229…
