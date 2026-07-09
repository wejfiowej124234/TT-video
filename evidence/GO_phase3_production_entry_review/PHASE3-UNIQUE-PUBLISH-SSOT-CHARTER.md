# Phase③ · 唯一发布 SSOT 宪章

**生效：** 2026-06-30  
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序，禁止跳阶）

---

## 1 · 发布链（写死）

```text
L0 → L6 → S5 → S6 → H1 → Phase② CLOSED → ③ Production Entry Review → Production GO
```

**SSOT 叙事：** [docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md](../../docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md)

---

## 2 · Phase② 状态（禁止 reopen）

| 项 | 结论 |
|----|------|
| **Phase②** | **CLOSED** @ `2026-06-30T09:52:37Z` |
| **reopen** | **FORBIDDEN**（`TT_PHASE2_REOPEN: NO`） |
| **H1** | PASS @ `20260630T094242Z` |
| **Deep Gate** | 8/8 @ `20260630T093714Z` |
| **证据** | [PHASE2-CLOSED.latest.json](../GO_phase2_testnet_graduation/PHASE2-CLOSED.latest.json) |

**② 完成后所有工作** 统一纳入 **Phase③ Production Entry Review** — 不得以 HAT/S6/parity 重跑冒充 Phase② 重开。

---

## 3 · Staging 运行时基线（冻结）

| 键 | 值 |
|----|-----|
| `runtime_baseline_sha` | `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6` |
| staging API | https://tt-api-staging.fly.dev |
| staging Web | https://tt-web-staging.fly.dev |
| `TT_LOCAL_FIRST_RUNTIME_DRIFT` | **NONE**（HEAD 可领先；非 runtime drift） |

机读：[DEPLOY-GOVERNANCE-RUNTIME-BASELINE.v1.json](./DEPLOY-GOVERNANCE-RUNTIME-BASELINE.v1.json)

---

## 4 · S5 / S6 触发纪律

| 变更类型 | S5 部署 | S6 Deep Gate | HAT 重跑 |
|----------|---------|--------------|----------|
| evidence / runbook / handbook / Phase③ 治理 JSON | **禁止** | **禁止**（除非 pin baseline SHA） | **禁止** |
| local dev 脚本（local `/meta` 等） | **禁止** | pin `PHASE2_EXPECT_GIT_SHA` = baseline | **禁止** |
| **staging runtime**（`crates/` · `frontend/` · `deploy/` · `registry/` · …） | **允许** | 部署后 **必须** | 按 SSOT |
| Fly secrets / config（`--secrets-only`） | 允许（无镜像 redeploy 闸） | 视变更 | 否 |

**机读守卫：**

- `scripts/dev/classify-deploy-change-scope.py`
- `scripts/ops/lib/deploy-governance-phase3-guard.sh`

**Owner 显式 runtime 部署：**

```bash
export DEPLOY_GOVERNANCE_FORCE_RUNTIME=1
export DEPLOYMENT_STATE=sync TESTNET_FREEZE_OVERRIDE=1
bash scripts/ops/run-deployment-three-state.sh sync --through-parity
```

**仅验收 staging @ baseline（HEAD 仅 evidence 领先时）：**

```bash
export PHASE2_EXPECT_GIT_SHA=d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6
bash scripts/dev/run-phase2-deep-release-gate.sh --expect-git-sha "$PHASE2_EXPECT_GIT_SHA"
```

---

## 5 · Phase③ 七轨

机读：[PHASE3-ENTRY-REVIEW-TRACKS.v1.json](./PHASE3-ENTRY-REVIEW-TRACKS.v1.json)

---

## 6 · 诚实边界

- ① 本地绿 / Phase② CLOSED **≠** ③ Production GO
- staging H1 PASS **≠** live PSP / mainnet / Production CDN GO

```text
TT_PHASE2_CLOSED: YES
TT_PHASE2_REOPEN: NO
TT_RUNTIME_BASELINE_FROZEN: d5aa447f
TT_PHASE3_PRODUCTION_ENTRY_REVIEW: ACTIVE
TT_PHASE3_PRODUCTION_GO: NO
```

---

## Runtime Consistency · ARCHIVED（2026-06-30T10:17:21Z）

**状态：** `ARCHIVED`（等同 `CLOSED`）@ baseline `d5aa447f`

**不再重审规则（写死）：** 除非发生**新的运行时代码或配置变更**并完成**新的 staging 部署**，否则 **Runtime Consistency 不再重新审计**。

**永不因此触发 Runtime Audit：**
- docs / evidence / runbook commit
- Repository Hygiene
- Production Entry Review 准备
- Manual Validation
- Legacy（TN-P1-009 / TN-P1-010）

**机读：** `LOCAL-STAGING-RUNTIME-CONSISTENCY-ARCHIVED.v1.json` · `PHASE3-PROGRAM-FLOW.v1.json`

```
Phase① → Phase② → Runtime Consistency ARCHIVED → Phase③ PER → Production GO
Legacy: TN-P1-009 / TN-P1-010（旁路 · 不参与主流程）
```

---

## Frozen Runtime Baseline（冻结资产 · 2026-06-30）

**`d5aa447f`** 不是「某次审计结论」，而是 **Frozen Runtime Baseline（冻结资产）**。

**Baseline 变更链（四步缺一不可）：**

```text
Runtime 代码/配置变更 → S5 Deploy → S6 Validation PASS → Baseline 记录更新
d5aa447f → e812xxxx → f91axxxx
```

**永不改变 Baseline：** README · evidence · runbook · docs · hygiene · manual · Legacy · mainnet prep

**机读：** `FROZEN-RUNTIME-BASELINE.v1.json` · `PHASE3-PROGRAM-FLOW.v1.json`

```text
Phase① → Phase② → Runtime Baseline (Frozen) → Runtime Consistency (Archived) → Phase③ → Production GO
Legacy: TN-P1-009 / TN-P1-010（永远旁路）
```

## Phase①/② 完成度清单语义（2026-06-30T10:26:47Z）

| # | 清单项 | 状态 | 说明 |
|---|--------|------|------|
| 9 | 本地 HEAD 与 staging 同 SHA | **N/A（按治理策略不要求）** | HEAD 可领先 Baseline（evidence/governance/docs）；**非** Phase② 未完成项 |
| 10 | Legacy TN-P1-009/010 | **PARKED** | 历史旁路，仅引用；**非**「没完成」 |
| 11 | FRCA 人工全链手操 | **PENDING（Phase③）** | Manual Validation 轨；**非** Phase①/② 完成度 |

机读：`PHASE12-COMPLETION-CHECKLIST-SEMANTICS.v1.json`

## 固定答复 · 审计封口（2026-06-30T10:34:40Z）

**问：** 本地和测试网一致了吗？

**答：** Runtime Consistency 已于 d5aa447f Frozen Baseline 完成并归档（ARCHIVED）。除非发生新的运行时代码/配置部署并完成 S5→S6，否则不再重审。

**纪律：** 禁止再生成新的 Phase① Audit · Phase② Audit · Runtime Consistency Audit（均已 COMPLETE → CLOSED → ARCHIVED）。

机读：`PHASE12-AUDIT-CLOSURE-POLICY.v1.json`

