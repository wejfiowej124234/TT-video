# TT_STAGING_RC_BASELINE · Staging 唯一运行基线 enforcement

**Registry SSOT:** [`registry/staging-rc-baseline.v1.yaml`](../../registry/staging-rc-baseline.v1.yaml)  
**Active pointer:** [`evidence/GO_staging_rc_baseline/ACTIVE.json`](../../evidence/GO_staging_rc_baseline/ACTIVE.json)  
**Alignment runbook:** [`TT-STAGING-RC-SSOT-ALIGNMENT-CLEANUP.md`](TT-STAGING-RC-SSOT-ALIGNMENT-CLEANUP.md)

> **47/47 PASS 是结果，不是标准。** 标准写死为：任何 Public Surface（含未来新增）不得脱离 `TT_STAGING_RC_BASELINE` 体系；禁止为单模块另建第二套 Gate / Audit / Evidence。

## 写死纪律（canonical）

> 任何新增 Public Surface、业务模块或公开展示能力，必须先完成 **Baseline 注册**、**SSOT 建模**、**统一 Gate**、**统一 Audit**、**统一 Evidence**，并通过 **`TT_STAGING_RC_BASELINE` 验证**后，才允许进入 Staging；任何未纳入 Baseline 的模块 **不得部署**、**不得公开展示**、**不得视为 Release Candidate**。

机读锚点：`registry/staging-rc-baseline.v1.yaml` · `canonical_admission_policy`

---

## 企业生命周期（当前锚点 · 2026-07-04）

```
开发（完成）
    │
    ▼
SSOT（完成）
    │
    ▼
Baseline（完成）
    │
    ▼
Baseline Enforcement（完成）
    │
    ▼
Public Surface Governance（完成）
    │
    ▼
Release Candidate（完成）
    │
    ▼
RC Runtime Convergence（FROZEN_CLOSED · 2026-07-04）
    │
    ▼
Production Preparation（进行中）  ← 当前
    │
    ▼
Production Verification（待）
    │
    ▼
Production GO（待 · NO_GO）
```

**②** 止于 Staging RC + 统一 Public Surface Governance。**③** Production Cutover / GO 另闸，不替代 Baseline。

---

## 唯一标准（禁止第二套）

| 层 | 唯一真源 |
|----|----------|
| Baseline | `TT_STAGING_RC_BASELINE` · `registry/staging-rc-baseline.v1.yaml` |
| SSOT | `dataset.v1.json` → `assets.v1.json` → OCS `state.json` → governed views |
| Gate | `scripts/dev/lib/staging-rc-baseline-gate.sh` |
| Audit | `scripts/dev/audit-staging-rc-baseline-public-surfaces.cjs` |
| Evidence | `evidence/GO_staging_rc_baseline/` |
| Enforcement | `scripts/dev/validate-staging-rc-baseline-enforcement.cjs` |
| 统一模块 | `scripts/dev/lib/staging-rc-public-surface-unified.cjs` |

**禁止：** 按模块自建 Smoke Gate、独立 Audit JSON、绕过 Baseline 的 Staging deploy。

---

## Public Surface 准入（先于写页面）

与 **写死纪律（canonical）** 同源。新增或修改任一类公开展示，**第一件事不是写页面**，顺序为：

1. **Baseline 注册** — `registry/staging-rc-baseline.v1.yaml` · `expected_public_surface` / `campaign_surfaces`  
2. **SSOT 建模** — `dataset.v1.json` · OCS `state.json` · governed views（如需新实体）  
3. **统一 Gate** — `staging-rc-baseline-gate.sh` · Authorize（`run-staging-gated-public-surface-mutation.sh`）  
4. **统一 Audit** — 扩展 `staging-rc-public-surface-unified.cjs` + `audit-staging-rc-baseline-public-surfaces.cjs`  
5. **统一 Evidence** — `evidence/GO_staging_rc_baseline/` · `run-staging-rc-baseline-full-surface-audit.sh` exit 0  
6. **`TT_STAGING_RC_BASELINE` 验证** — `READY` · `ALIGNED` · `AUDIT: PASS` → 才允许 Staging deploy  

**未纳入 Baseline：** 不得 deploy · 不得公开展示 · 不得称 Release Candidate。

---

## 阶段口径

| 项 | 含义 |
|----|------|
| **② Staging 基线** | `TT_STAGING_RC_BASELINE: READY` — 唯一允许的运行态 |
| **Production Cutover** | **③** 独立闸 · 不在本轨自动放行 |
| **Production GO** | **NO_GO** |

---

## 写死纪律

1. **SSOT 唯一真源：** `dataset.v1.json` → `assets.v1.json` → OCS `state.json` → governed public views  
2. **禁止** 历史 Smoke、c3/c10/c12 corridor、非 OCS 公开展示、旧 UUID 卷内 404 媒体  
3. **禁止** 无 `DEPLOYMENT_STATE=sync|fix|freeze` 的 stateless staging deploy  
4. **允许** 仅：`deployment_sync` · `production_cutover_prep` · baseline realign 脚本  
5. **禁止** 新增业务功能（含新 public catalog 实体）

---

## 公开展示面（必须 = OCS · 统一 Baseline）

| 面 | 数量 |
|----|------|
| Community Feed | 10 |
| Public Guides（向导） | 10 |
| Market Provider（商家） | 10 |
| Market Acquisition（旅行收购） | 10 |
| Official Guides（官方攻略 · admin published） | 10 |
| Campaigns（deployed） | 10 |
| Campaign surfaces | home_hero · home_feed · market_feed · community_feed · community_featured · campaign_banner · landing_promo |
| Discover orders smoke | 0 |
| Corridor smoke | 0 |
| Official assets | 60 |

**统一 SSOT 模块：** `scripts/dev/lib/staging-rc-public-surface-unified.cjs`

---

## 命令

```bash
# 建立 / 刷新基线（写 ACTIVE.json + evidence）
bash scripts/dev/run-staging-rc-baseline-final-alignment.sh

# 只读 enforcement（不 mutate）
bash scripts/dev/run-staging-rc-baseline-enforcement-check.sh

# 全面公开展示面审计（Market/Provider/Acquisition/Guides/Itinerary/Official Guide/Community/Campaign · 统一 Baseline）
bash scripts/dev/run-staging-rc-baseline-full-surface-audit.sh

# Staging deploy 前自动 gate（已接入 phase2-staging-fly-deploy + deploy-tt-web-staging）
DEPLOYMENT_STATE=sync bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh
```

**Override（Owner only · 须书面登记）：** `TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1`  
**Baseline 对齐期间跳过 gate：** `STAGING_RC_BASELINE_ALIGNING=1`（编排脚本自动设置）

---

## Deploy 硬闸

**纪律：Deploy · 数据同步 · 环境变更 → 必须先过 Baseline Gate + 运行态校验。**

| 时机 | 函数 | 接入点 |
|------|------|--------|
| Deploy 前 | `staging_rc_baseline_gate_pre_deploy` | `phase2-staging-fly-deploy-and-sync.sh` · `deploy-tt-web-staging.sh` |
| Deploy 后 | `staging_rc_baseline_gate_post_deploy` | 同上（失败 → 须 realign） |
| 公开展示 mutation 前 | `staging_rc_baseline_gate_pre_change` | `run-staging-gated-public-surface-mutation.sh` |
| mutation 后 | `staging_rc_baseline_gate_post_change` | 同上 |
| Baseline 写 ACTIVE 后 | `post-baseline` enforcement | `run-staging-rc-baseline-final-alignment.sh` |

**公开展示 mutation 脚本**（`purge-*` · `align-*`）须满足其一：

- 由 `run-staging-rc-baseline-final-alignment.sh` 编排（`STAGING_RC_BASELINE_ALIGNING=1`）
- 经 `run-staging-gated-public-surface-mutation.sh` 包装（pre/post gate）
- Owner override

`tt-api-staging` / `tt-web-staging` deploy **前** 必须：

- `TT_STAGING_RC_BASELINE: READY`（live enforcement PASS）
- 或正在执行 baseline alignment（`STAGING_RC_BASELINE_ALIGNING=1`）

Deploy **后** 若 enforcement FAIL → 立即：

```bash
bash scripts/dev/run-staging-rc-baseline-final-alignment.sh
```

---

## 诚实边界

- **READY ≠ Production GO ≠ 发布**
- Enforcement 覆盖 **② Staging**；**③** Production Cutover 另闸
