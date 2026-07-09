# 125 · Production Feature Gap Matrix（101/102 × 全站真源）

> **Sprint**：101/102 Blueprint Compatibility & Production Readiness Audit  
> **输入**：[123-101-CMS-Audit](./123-101-CMS-Audit-Report.md) · [124-102-Referral-Audit](./124-102-Referral-Audit-Report.md) · [120-S5](./120-S5-Catalog-Release-Freeze-Report.md) · [121-PI3-002](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) · [122-PI3-001](./122-PI3-001-Production-Database-Backup-Readiness-Report.md) · [PHASE3_ENTRY_GO](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md)  
> **日期**：2026-06-07  
> **纪律**：审计 only · **禁止** 本 Sprint 开发  
> **总裁定**：**平台 Production GO — 受 PI3-001～006 约束 · 101/102 运营面 — HOLD**

---

## 1. 裁定层级（必读）

| 层级 | 含义 | 本矩阵 |
|------|------|--------|
| **A · 平台 Production GO** | PI3 + go-live §0–§11 + M-00 前核心链 | **101/102 不阻塞 A**（Entry/S5 明示） |
| **B · 101/102 运营就绪** | 冷启动/CMS/Growth/Official 控制台 | **HOLD** |
| **C · 蓝图文档真值** | 101/102/104 与代码一致 | 多项 **REWRITE** |

**GO/HOLD/REWRITE 列含义**

| 判定 | 定义 |
|------|------|
| **GO** | 满足当前冻结口径或平台 A 层要求 |
| **HOLD** | 未实现/部分实现 · 需新 Sprint · **默认非 A 层阻塞** |
| **REWRITE** | 蓝图/104 陈述过时 · **文档修订** · 非代码 Sprint |

---

## 2. 域别汇总矩阵

| 域 | 蓝图 | 实现度 | 判定 | A 层 PI3 阻塞 | B 层 101 就绪 | 剩余工作量 | 测试范围 |
|----|------|--------|------|---------------|---------------|------------|----------|
| **Catalog RO（M1–M6 读）** | 101 P1 | **~75%** RO+import | **GO**（120 冻结） | 否 | 部分 | **M** Admin CRUD | S5 gate · 112 smoke |
| **Catalog Admin CRUD** | 101 P0 | **0%** | **HOLD** | 否 | 否 | **XL** | 105 设计 · 新 Sprint |
| **Catalog FE Consumer** | 101 P0 | **~80%** flag=0 | **GO** | 否 | 部分 | **L** opt-in | S2b/S2c |
| **Official OPS M7–M10** | 101 P2 | **~15%** DDL | **HOLD** | 否 | 否 | **XL** | seed/env audit |
| **Growth G1–G7** | 102 P3 | **~95%** G-S1～G-S8 冻结 | **部分 GO**（链下 **GROWTH_RELEASE_FREEZE_GO** · 链上 GOV **HOLD**） | 否 | 否 | **链上另轨** | PI3-005 |
| **trust-growth P4** | 101 P4 | **~95%** | **GO** | 否 | GO | — | F-032 |
| **Legacy Admin P4** | 101 | **~90%** | **GO** | 否 | GO | P8 prod RBAC | phase3-entry admin |
| **Community** | — | FINAL PASS | **GO** | 否 | GO | — | C1–C7 |
| **Market/Orders/Escrow** | — | FINAL PASS | **GO** | 否 | GO | — | OED frozen |
| **Governance/DID** | — | 只读/观测 GO | **GO** | PI3-005 链 scope | 部分 | Mainnet 另闸 | 93 matrix |
| **Payment/Stripe** | — | staging test GO | **GO** | PI3-003 live | 部分 | live webhook | PI3-003 |
| **硬编码 cityDetails** | 101 §2 | 仍主读 UI | **HOLD** | 否 | 是（fallback） | S6 迁移 | W4 shadow |

---

## 3. 101/102 逐项矩阵（GO / HOLD / REWRITE）

| ID | 能力 | 状态 | 判定 | PI3 阻塞 | 工作量 | 测试 |
|----|------|------|------|----------|--------|------|
| M1–M5 catalog 数据 | DDL+import+RO | 部分 | **HOLD** | 否 | M–L | S2c/S4c |
| M6 POI 图 | RO+DDL+TS 流水线 | 部分 | **HOLD** | 否 | XL | S3/W5 |
| GET /catalog/* | 8 端点 | 实现 | **GO** | 否 | — | 112 |
| Admin content CRUD | 无 | 未实现 | **HOLD** | 否 | XL | 105 |
| M7–M10 Official | DDL+Hub | 部分 | **HOLD** | 否 | XL | env/seed |
| G1 Referral+register | G-S1 GO | **GO** | 否 | — | auth E2E |
| G2 Early Bird | G-S3 GO | **GO** | 否 | — | rank+倍率 IT |
| G3 Airdrop GOV | G-S6 GO（链下） | **GO** | 否* | — | 无链上 tx |
| G4 KOL Center | G-S7 GO（只读） | **GO** | 否 | — | 无 GMV 投影 |
| G5 Ledger+Observer | G-S2 GO | **GO** | 否 | — | 幂等 ledger |
| G6 Anti-Fraud | G-S5 GO | **GO** | 否 | — | 冻结/ledger |
| G7 Analytics | G-S7 GO（只读） | **GO** | 否 | — | ≠ trust-growth |
| /me/referrals | G-S4 GO | **GO** | 否 | — | 只读 API+UI |
| RW-101-01~05 | 蓝图过时 | — | **REWRITE** | 否 | doc | — |
| RW-102-01~04 | 102 缺口表过时 | — | **REWRITE** | 否 | doc | — |
| trust-growth A/B | 完整 | 实现 | **GO** | 否 | — | F-032 |
| 120 Catalog freeze | 生效 | 实现 | **GO** | 否 | — | S5 gate |
| 121 PI3-002 domain | HOLD | — | **HOLD** | **是** | Owner | 121 gate |
| 122 PI3-001 backup | HOLD | — | **HOLD** | **是** | Owner | 122 gate |

\* G3 若产品承诺 launch 时 GOV 空投则升为 **B 层 HOLD**；当前 PI3 清单 **不含** Growth。

---

## 4. 重复 / 过时 / 冲突登记

| 类型 | 项 | 处理 |
|------|-----|------|
| **重复** | trust-growth vs G7 | 保留并行 · 文档已分工 |
| **重复** | community risk vs G6 | G6 **扩展** community |
| **重复** | 105 Catalog Admin vs 101 M1–M6 | **同一 SSOT** · 105 设计 |
| **重复** | DID Rank vs G4 KOL | 不同产品面 · G4 读 orders |
| **过时** | 101 §0 P1「基本缺失」 | **REWRITE** → RO GO |
| **过时** | 104 无 catalog API | **REWRITE** → 112 |
| **过时** | 102 users 无列 | **REWRITE** → DDL only |
| **冲突** | 101 P0 Admin CRUD vs 120 禁止 | **120 优先** · Admin **HOLD** 正确 |

---

## 5. Production GO 阻塞项（A 层 · 仅 PI3）

| ID | 项 | 来源 | 状态 |
|----|-----|------|------|
| PI3-001 | Fly PG backup B-475 | 122 | **HOLD** |
| PI3-002 | 域名/CDN/CORS | 121 | **HOLD** |
| PI3-003 | Stripe Live | runbook | **HOLD** |
| PI3-004 | R-002 prod 93 | runbook | **HOLD** |
| PI3-005 | Mainnet §9 | runbook | **HOLD** |
| PI3-006 | go-live §0–§11 | runbook | **HOLD** |

**101/102 相关项：** **零** — 不在 A 层阻塞清单。

---

## 6. B 层 — 101/102 运营就绪（post-GA / 冷启动）

| 能力 | 判定 | 建议 Sprint |
|------|------|-------------|
| 无 TS 硬编码主读 | **HOLD** | Catalog S6+ · Consumer flag |
| Admin 编辑目录/POI | **HOLD** | 破 120 后 Admin CRUD |
| Official 冷启动控制台 | **HOLD** | P2 Official S4–S5 |
| Referral/早鸟/积分 | **部分 GO**（G-S1～G-S7 **GO** · 链上 GOV **HOLD**） | 链上 GOV 另轨 |
| GOV 链下空投 | **HOLD** | G-S5 + 产品签核 |
| smoke 汇合闸 | **HOLD** | 101 §11 两 smoke 脚本 |

---

## 7. 开发工作量总览（审计估算）

| 轨 | 101 原估 | 已完成（审计） | 剩余 |
|----|----------|----------------|------|
| P1 CMS RO+import | ~40 d | **~30 d** | **~10 d** Admin+publish |
| P1 CMS Admin+FE 切流 | ~110 d | **~5 d** nav/hub | **~105 d** |
| P2 Official | ~45 d | **~5 d** DDL | **~40 d** |
| P3 Growth | ~55–70 d | **~18 d** G-S1～G-S7 | **~20–35 d** |
| 文档 REWRITE | — | — | **~1 d** |

---

## 8. 测试范围矩阵

| 区域 | 现有 gate | 101/102 未来 gate |
|------|-----------|-------------------|
| Catalog | `check-s5-catalog-release-freeze.sh` | `smoke-admin-content-p0-local.sh` **未建** |
| CMS/Official Post-Growth | `check-134-cms-official-ops-post-growth-recheck.sh` | 134 §8 |
| Growth | `check-g-s8-growth-release-freeze.sh` | G-S1～G-S7 smoke **已建** |
| Admin shell | `phase3-entry-admin-pages-smoke.sh` | content/growth 404 预期 |
| Platform | `phase3-entry-recheck-gate.sh` | 含 Catalog S5 |
| Blueprint audit | `check-101-102-blueprint-compatibility-audit.sh` | 本 Sprint |

---

## 9. 审计结论与 Owner 动作

### 9.1 结论

| 平面 | 判定 |
|------|------|
| **A · 平台 Production GO** | **受 PI3 约束** · **101/102 非阻塞** |
| **B · 101 CMS 运营** | **HOLD** · Post-Growth 复评 [134](./134-101-CMS-Official-OPS-Post-Growth-Recheck-Report.md) |
| **B · 102 Growth** | **GROWTH_RELEASE_FREEZE_GO**（G-S8 · 链下 G1–G7 · 链上 GOV **HOLD**） |
| **C · 蓝图文档** | **REWRITE**（101 §0/§1/§11 · 102 §2 · 104 §1.9） |

### 9.2 Owner 动作（优先级）

| # | 动作 | 类型 |
|---|------|------|
| 1 | 闭合 PI3-001/002/003…（与 101/102 无关） | **A 层** |
| 2 | 修订 101/102/104 与 112/120 对齐 | **REWRITE** |
| 3 | 产品签核：launch 是否必须 Referral/Official CMS | **B 层 scope** |
| 4 | 若开 B 层：单独立项 Sprint · 破 120 冻结程序 | 开发 |

### 9.3 复验

```bash
bash scripts/check-101-102-blueprint-compatibility-audit.sh
bash scripts/check-s5-catalog-release-freeze.sh
bash scripts/check-pi3-001-production-database-backup-readiness.sh
bash scripts/check-134-cms-official-ops-post-growth-recheck.sh
```

---

## 10. 交叉引用

| 报告 | 链接 |
|------|------|
| CMS 专审 | [123](./123-101-CMS-Audit-Report.md) |
| Referral 专审 | [124](./124-102-Referral-Audit-Report.md) |
| G-S1 实施 | [126](./126-G-S1-Referral-Minimum-Loop-Report.md) |
| G-S2 实施 | [127](./127-G-S2-Growth-Ledger-Observer-Report.md) |
| G-S3 实施 | [128](./128-G-S3-EarlyBird-Multiplier-Report.md) |
| G-S4 实施 | [129](./129-G-S4-User-Referral-Center-Report.md) |
| G-S5 实施 | [130](./130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md) |
| G-S6 实施 | [131](./131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report.md) |
| G-S7 实施 | [132](./132-G-S7-Growth-Analytics-KOL-ReadOnly-Report.md) |
| G-S8 冻结 | [133](./133-G-S8-Growth-Release-Freeze-Report.md) |
| CMS Post-Growth | [134](./134-101-CMS-Official-OPS-Post-Growth-Recheck-Report.md) |
| Catalog 冻结 | [120](./120-S5-Catalog-Release-Freeze-Report.md) |
| Phase ③ Entry | [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) |

---

**维护者：** Blueprint Compatibility Audit · 2026-06-07
