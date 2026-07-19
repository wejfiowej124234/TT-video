# TT · V3.1.1 Final Release Engineering（当前正式发版实例）

**Machine:** `TT_V311_FINAL_RELEASE_ENGINEERING`  
**Instance Registry:** [`registry/v311-final-release-engineering.v1.yaml`](../../registry/v311-final-release-engineering.v1.yaml)  
**唯一梯子（全版本）：** [`TT-TRAVELTRUST-RELEASE-ENGINEERING-LADDER-LATEST.md`](./TT-TRAVELTRUST-RELEASE-ENGINEERING-LADDER-LATEST.md) · [`registry/traveltrust-release-engineering-ladder.v1.yaml`](../../registry/traveltrust-release-engineering-ladder.v1.yaml)  
**上层 PSG：** [`TT-PSG-PRODUCTION-GOVERNANCE-DOMAINS-LATEST.md`](./TT-PSG-PRODUCTION-GOVERNANCE-DOMAINS-LATEST.md) — 本文件 = **Release Engineering 域**实例，**≠** 全部 PSG  
**ACTIVE 地址基线：** `v311_sepolia_clean_baseline` · chain `11155111` · [`registry/v311-sepolia-address-matrix-freeze.v1.json`](../../registry/v311-sepolia-address-matrix-freeze.v1.json)  
**Drift Audit：** [`FULL-SYSTEM-DRIFT-AUDIT-LATEST.md`](../../evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.md) · `python scripts/dev/run-v311-full-system-drift-audit.py`  
**经济真源（LOCK）：** [`TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md`](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md)  
**范围：** ② Sepolia Final Release Candidate · **≠** ③ Production GO  
**Ladder:** `20260718-enterprise-final`

本文件 = **V3.1.1 实例状态**。梯子定义与后续版本以 **Canonical Ladder** 为准；Freeze / GO 须 **PSG 多域汇聚**，非本域单绿。

---

## 0 · 唯一发布原则（写死）

| ID | 原则 |
|----|------|
| **P1** | RC LOCK 只在 −1…7.5 完成后；锁 **Release Package** |
| **P2** | RC-02 + Manual + **P10.5 Readiness Review** 在 Freeze / GO 前 |
| **P3** | 纯 Sepolia `11155111` 唯一认证数据集 |
| **P4** | 已 PASS/LOCKED 禁止回头改；否则撤销 Cert 并从最早受影响 Phase 重验 |
| **P5** | Canonical Ladder = **唯一** Formal Release Engineering；禁止平行正式发版梯子 |
| **P6** | RE ⊂ PSG；Phase 3「PSG Baseline」≠ PSG 总框架；Freeze/GO ≠ RE 单域 PASS |

---

## 1 · Final 梯子（本实例）

```text
Phase −1   Final Closure Audit
        │
Phase 0    Repository Hygiene
        │
Phase 0.5  Configuration Baseline     → TT_CONFIGURATION_BASELINE
        │
Phase 1    Full Alignment
        │
Phase 2    Deployment Certification
        │
Phase 2.5  Data Certification         → TT_DATA_CERT
        │
Phase 3    PSG Baseline               （本实例已 PASS）
        │
Phase 4    Web3 Function Certification
          └── F-02 Timelock 48h
        │
Phase 5    Web3 UI / UX Certification
        │
Phase 6    Full Product Certification
        │
Phase 6.5  Security & Operations      → TT_OPERATIONS_CERT
        │
Phase 7    Documentation & Evidence
        │
Phase 7.5  Release Package Freeze     → TT_RELEASE_PACKAGE = LOCKED
        │
Phase 8    RC Candidate LOCK
        │
Phase 9    RC-02 Long Stability（24h）
        │
Phase 10   Manual Review
        │
Phase 10.5 Production Readiness Review → TT_PRODUCTION_READINESS_REVIEW = PASS
        │
TT_PSG_SEPOLIA_FREEZE
        │
Production GO（另闸）
```

---

## 2 · 关键 Gate（本轮定稿）

### 2.5 · `TT_DATA_CERT`

CMS · OCS · Public Catalog · Provider · Guide · Destination · Country · Media · i18n · AI Search · API/Indexer/Search Projection  

**要求：** 无重复 / 孤儿 / Legacy ACTIVE / 错误引用 · 媒体可访问 · Public Surface 一致  

### 10.5 · `TT_PRODUCTION_READINESS_REVIEW`

**非重测。** 回答：全 Phase PASS？无 OPEN P0/P1？已接受风险已登记？Registry/Runbook/Evidence 齐全？满足发布策略？  

**之后才** `TT_PSG_SEPOLIA_FREEZE` → Production GO。

---

## 3 · 退出标准

| Phase | Machine | 退出 |
|-------|---------|------|
| **−1** | `TT_V311_FINAL_CLOSURE_AUDIT` | OPEN = 0 |
| **0** | `TT_V311_REPOSITORY_CLEAN` + `TT_GIT_HYGIENE` | PASS |
| **0.5** | **PASS_OWNER_ACTIONS_FOR_UI_FULL**（Sepolia ENV ✅ · FE/WC → Phase 5） |
| **1** | `TT_V311_SOURCE_ALIGNMENT` | 七层对齐 |
| **2** | `TT_V311_DEPLOYMENT_CERT` | PASS |
| **2.5** | `TT_DATA_CERT` | PASS |
| **3** | `TT_PSG_V311_BASELINE` | PASS（已锁） |
| **4** | `TT_V311_WEB3_FULL_FUNCTION_CERT` | **54 / 0 / 0** |
| **5** | `TT_V311_WEB3_UI_UX_FULL_CERT` | 真钱包 Full |
| **6** | `TT_V311_WEB3_FULL_PRODUCT_CERT` | PASS |
| **6.5** | `TT_OPERATIONS_CERT` | PASS |
| **7** | `TT_DOCUMENT_EVIDENCE_FREEZE` | Docs+Evidence 冻 |
| **7.5** | PREFLIGHT_PASS · **NOT_LOCKED** |
| **8** | `TT_RC_CANDIDATE` | **LOCKED** |
| **9** | `TT_RC02_STABLE` | 绑定 24h |
| **10** | Human | Manual PASS |
| **10.5** | `TT_PRODUCTION_READINESS_REVIEW` | PASS → 可 Freeze |

---

## 4 · 当前诚实落点（Timelock 并行刷新）

**Board：** [`TIMELOCK-PARALLEL-BOARD-LATEST.md`](../../evidence/GO_phase2_v311_final_release/TIMELOCK-PARALLEL-BOARD-LATEST.md)

| Phase | 状态 |
|-------|------|
| **−1** | IN_PROGRESS（CLOSED=21/30 · 余 Execute/Product/UI Full/Package LOCK/Freeze） |
| **0** | READY_FOR_RC |
| **0.5** | **PASS_OWNER_ACTIONS_FOR_UI_FULL**（Sepolia ENV ✅ · FE/WC → Phase 5） |
| **1** | **PASS** |
| **2** | **PASS** |
| **2.5** | **PASS**（Guide/Search/API Projection 已收口） |
| **3** | **PASS** |
| **4** | IN_PROGRESS（F-02 Queued · ETA `2026-07-20T11:37:37Z`） |
| **5** | PARTIAL（真钱包 Full ❌） |
| **6** | OPEN |
| **6.5** | **PASS**（②） |
| **7** | **READY** |
| **7.5** | PREFLIGHT_PASS · **NOT_LOCKED** |
| **8 … 10.5** / Freeze / GO | BLOCKED / NOT_CLAIMED |

**纪律：** 无合约 / ACTIVE / Runtime / Registry 突变。**Execute 后统一** `54/0/0` → 关闭全部 OPEN → Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO。

---

## 5 · Timelock · Execute 短链

并行包：[`TT-V311-F02-TIMELOCK-WAIT-PARALLEL-LATEST.md`](./TT-V311-F02-TIMELOCK-WAIT-PARALLEL-LATEST.md)

Execute 后：Function Cert → 补完 P5…P7.5 → P8 → **新开** P9 → P10 → **P10.5** → Freeze → GO  

---

## 6 · 非目标

- ≠ Docs 冒充 Data / Ops / Readiness Review  
- ≠ Manual 直接 Freeze（跳过 10.5）  
- ≠ ③ Production GO  
- ≠ 另开平行 Formal Release 梯子  
