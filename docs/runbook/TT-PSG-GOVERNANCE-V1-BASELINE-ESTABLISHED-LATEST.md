# TT · PSG Governance v1 — BASELINE_ESTABLISHED

**STATUS:** `BASELINE_ESTABLISHED`（**不是** `COMPLETE`）· **FROZEN**  
**Machine:** `TT_PSG_GOVERNANCE_V1`  
**SSOT:** [`registry/psg-governance-v1-baseline.v1.yaml`](../../registry/psg-governance-v1-baseline.v1.yaml)  
**Ops path:** Feature → Local Validation → Incremental Audit → **RCP Gate** → Staging Deploy → Verification  

---

## 含义（写死）

| 是 | 否 |
|----|----|
| 以后所有 Runtime Change 走 RCP + Dependency Registry | 治理能力「做完了」 |
| 不再设计新的**一级**治理能力（v1 内） | P2/P3 / 十六维已落地 |
| 仅架构级问题才考虑 Governance **v2** | 可改 Tag / Archive / Cert / `TT_PRODUCTION_GO` |
| PSG 停止无限膨胀 | 本基线 = Production GO |

---

## 治理纪律（v1 · 防膨胀 · 不新增 Gate）

> **PSG Governance v1 进入 `BASELINE_ESTABLISHED` 后，不允许在 v1 中新增一级治理能力；新增能力必须满足「新的架构级治理问题无法通过现有 Capability、RCP 或 Incremental Audit 覆盖」这一条件，方可启动 PSG Governance v2 设计。普通 Bug、功能开发、模块治理和专项修复，应优先复用 v1 能力，而不是扩展治理框架。**

| 场景 | 默认动作 |
|------|----------|
| Bug / 功能 / 模块治理 / 专项修复 | **复用** Certification · RCP · Incremental Audit · Dependency Registry 域扩展 |
| Runtime Change（数据/配置/部署漂移类） | **走** Feature → Local Validation → Incremental Audit → RCP → Staging Deploy → Verification |
| 「想加一个新的一级治理能力」 | **禁止**（v1 内） |
| 现有 Capability / RCP / Incremental Audit **无法覆盖**的架构级治理问题 | **才可**启动 Governance **v2** 设计（须 Owner 书面章程） |

**禁止：** 随项目迭代不断往 PSG 加一级能力、平行 Gate 语言、Wave C/D 规则堆。

---

## 基线包含什么

| 构件 | 路径 |
|------|------|
| Runtime Dependency Registry | `registry/runtime-dependency-registry.v1.yaml` |
| Derived JSON | `registry/runtime-dependency-registry.derived.v1.json` |
| Generator | `scripts/dev/generate-rcp-registry-derived.py` |
| RCP Gate | `scripts/gates/check-psg-runtime-change-propagation.cjs` |
| Gate binder | `registry/psg-runtime-change-propagation.v1.yaml` |
| Evolution roadmap（P1/P2/P3 声明） | `registry/psg-post-baseline-governance-evolution.v1.yaml` |
| Evidence | `evidence/GO_psg_governance/RUNTIME_CHANGE_PROPAGATION/` |

---

## 主线回来（Governance 设计轨退出）

```
TravelTrust Mainline
        │
        ├── 新功能 / Bug Fix / CMS / Market / Wallet / Web3 / Payment
        └── Production Release
              │
              Feature → Local Validation → Incremental Audit → RCP Gate
                    → Staging Deploy → Verification
```

**禁止默认：** Feature → 继续设计 PSG。  
**默认纳入：** 所有新增功能走现有 PSG Governance **v1** 流程；**无需**新增一级治理能力。

---

## 诚实边界

① 本机读闸绿 ≠ ② Staging 全矩阵 GO ≠ ③ Production GO。  
冻结 Tag `v1.1.0-psg-go.20260717` / Release Archive **不可变**。  
Governance v1 **BASELINE_ESTABLISHED · FROZEN** ≠ Governance COMPLETE。
