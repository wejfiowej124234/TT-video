# Governance Freeze v1

**Production Release Governance v1** · **Governance Root:** [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md)

**Verdict:** `GOVERNANCE_FREEZE_ACTIVE`  
**含义：** **治理层冻结**（Governance-layer freeze only）  
**Machine key:** `TT_GOVERNANCE_FREEZE`  
**Registry:** `registry/governance-freeze.v1.yaml`  
**Manifest:** `evidence/GO_production_readiness/governance-freeze/GOVERNANCE-FREEZE-MANIFEST-LATEST.json`

**Production Governance Principle #1:** [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md) — cite root; do not re-explain below.

---

## Definition（Principle #1）

> **Governance Freeze freezes release governance structure, schemas, templates, and process definitions. It does not freeze runtime state, evidence updates, certification progress, or deployment execution.**

**Structure Frozen · State Continues** — 不是「项目完全冻结」。

| | |
|---|---|
| **冻结的是** | 发布流程（Runbook）· Registry Schema · Book **结构** · Gate **定义** · Evidence **目录结构** · PREP Package **结构** |
| **不冻结的是** | Bug 修复 · Cert 执行与结果 · Dashboard 状态值 · Evidence **内容** · Readiness Book **状态刷新** · Web3 Freeze · Mainnet Package **正式生成** · Sign-off · Shadow Launch · Wave 部署 |

Timelock 期间所有更新应仅属于两类（**Structure Update 默认禁止**）：

1. **State Update（状态更新）** — Cert 进度 · Dashboard · Book 状态 · Evidence 增长  
2. **Execution（执行动作）** — Freeze · Generate Package · Sign-off · Deployment  

详见 [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md#update-types统一三类)。

---

## Phase transition

| From | To |
|------|-----|
| 建设发布体系 | **按发布体系执行发布** |

**唯一实质性阻塞 Production GO：** Phase ②-F（Cert #8–#12）

Governance Freeze **不阻塞** Web3 Freeze · Mainnet Package · Wave 广播 — 仅锁定**治理层结构**（见上方 Definition）。

---

## Structure frozen（治理结构不可改）

| Area | SSOT |
|------|------|
| Four-Gate Framework | `registry/production-go-four-gate-framework.v1.yaml` |
| Production Readiness Book 结构 | `gen-production-readiness-book.cjs` + rollups lib |
| Executive Summary | `PRODUCTION-READINESS-EXECUTIVE-SUMMARY-LATEST.md` |
| Deployment Readiness Matrix | `DEPLOYMENT-READINESS-MATRIX-LATEST.md` |
| Owner Checklist | `OWNER-MAINNET-DEPLOY-CHECKLIST-LATEST.md` |
| PREP Package 结构（8 组件） | `docs/runbook/templates/mainnet-package/` |
| Registry 字段命名 | 见 `registry/governance-freeze.v1.yaml` |
| Evidence 目录结构 | `evidence/GO_production_readiness/` |

---

## Timelock 期间只做三件事

1. **等待 Timelock 到期**
2. **状态同步（不改结构）**
   ```bash
   node scripts/dev/refresh-governance-status.cjs
   ```
3. **准备 Cert #8→#12 执行环境**，到期后立即按序推进：
   ```bash
   export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0 HAT_R1_ALLOW_SPEND_EXECUTE=1
   node scripts/dev/dashboard.cjs --execute --refresh
   # Cert #8 → #9 → #10 → #11 → #12
   ```

---

## Allowed vs Forbidden（Timelock 窗口）

| Allowed（State Update · Execution） | Forbidden（Structure change） |
|---------|-----------|
| Dashboard / Book **状态**刷新 | 新 Gate · 新 Book · 新 Registry · 新 Runbook |
| Cert **执行** · evidence 内容 / LATEST 更新 | Book / Matrix / Checklist **结构**调整 |
| Bug 修复（Cert / 验证中发现） | 新 Review 类别 · 新 Gate 框架 |
| Web3 Freeze · Generate Package · 部署执行 | Registry Schema / `machine_key` 重命名 |
| `refresh-governance-status.cjs` | 新 PREP 模板 · Evidence 目录树重组 |

---

## 解冻例外（仅此四类可改治理结构）

1. **Cert 链执行** — 状态变化 · 正常刷新（不算改结构）
2. **主网演练** — 发现治理流程缺陷
3. **审计** — 强制修改发布流程
4. **生产事故复盘** — 要求新增治理项

---

## 激活 Governance Freeze

```bash
node scripts/dev/run-governance-freeze.cjs
```

---

## Post-Timelock 执行链（不变）

```text
Cert #8–#12 → ②-F PASS → Web3 Freeze → Generate Package
  → Owner Sign-off → Shadow Launch → Wave 1
```

---

## 相关

- [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md) ← **Principle #1 SSOT**
- [PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md](PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md)
- [MAINNET-DEPLOYMENT-PACKAGE-V1.md](MAINNET-DEPLOYMENT-PACKAGE-V1.md)
- [PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md](PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md)
