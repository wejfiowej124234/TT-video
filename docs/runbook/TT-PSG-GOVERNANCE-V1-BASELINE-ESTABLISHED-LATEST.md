# TT · PSG Governance v1 — BASELINE_ESTABLISHED

**STATUS:** `BASELINE_ESTABLISHED`（**不是** `COMPLETE`）  
**Machine:** `TT_PSG_GOVERNANCE_V1`  
**SSOT:** [`registry/psg-governance-v1-baseline.v1.yaml`](../../registry/psg-governance-v1-baseline.v1.yaml)  
**Ops path:** Feature → Incremental Audit → **RCP** → Deploy  

---

## 含义（写死）

| 是 | 否 |
|----|----|
| 以后所有 Runtime Change 走 RCP + Dependency Registry | 治理能力「做完了」 |
| 不再设计新的**一级**治理能力（v1 内） | P2/P3 / 十六维已落地 |
| 仅架构级问题才考虑 Governance **v2** | 可改 Tag / Archive / Cert / `TT_PRODUCTION_GO` |
| PSG 停止无限膨胀 | 本基线 = Production GO |

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

## 主线回来

```
TravelTrust Mainline
        │
        ├── 新功能 / Bug Fix / CMS / Market / Wallet / Web3 / Payment
        └── Production Release
              │
              Feature → Incremental Audit → RCP → Deploy
```

**禁止默认：** Feature → 继续设计 PSG。

---

## 诚实边界

① 本机读闸绿 ≠ ② Staging 全矩阵 GO ≠ ③ Production GO。  
冻结 Tag `v1.1.0-psg-go.20260717` / Release Archive **不可变**。
