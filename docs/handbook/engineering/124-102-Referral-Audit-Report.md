# 124 · 102 Referral & Early Bird Blueprint Compatibility Audit

> **Sprint**：101/102 Blueprint Compatibility Audit  
> **蓝图 SSOT**：[102-Referral与早鸟增长系统 v1.0](./102-Referral与早鸟增长系统v1.0实施蓝图.md)（**已并入 101 v1.1.0 §8.2**）  
> **交叉基准**：[101 v1.1.0 §8.2](./101-CMS与内容运营中心实施蓝图.md) · [120-S5](./120-S5-Catalog-Release-Freeze-Report.md) · [PHASE3_ENTRY_GO](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) · [FINAL-SYSTEM-AUDIT](../../runbook/FINAL-SYSTEM-AUDIT-REPORT.md)  
> **日期**：2026-06-07  
> **纪律**：**仅审计** · **禁止** 新功能 · **禁止** 改 Escrow/订单状态机/支付/治理执行  
> **总裁定**：**102 Growth 平面 — HOLD（全模块运行时未实现）· 非 PI3 Production GO 阻塞**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **102 vs 代码** | **G-S1～G-S8 冻结** — 链下 Growth 运行时证据包 · **GROWTH_RELEASE_FREEZE_GO** |
| **G1–G7 运行时** | **G1–G7 全 GO** · **G-S8 Release Freeze GO** |
| **G0 DDL + RBAC + Nav** | **部分实现** — 表/列/权限/侧栏/i18n · 子路由 **404** |
| **P4 trust-growth** | **GO** — Banner A/B **≠** Growth Center（101/102 已分工） |
| **治理币 GOV** | **链上/治理域既有** · 102 Airdrop **链下未实现** |
| **平台 Production GO** | **Growth 不阻塞** — Entry/S5 显式排除 |

**102 审计结论：** **HOLD** · **REWRITE** §2 缺口表（users 列已 DDL 存在）

---

## 2. 审计方法

| 扫描 | 结果 |
|------|------|
| `20260607120200_cms_growth_p3.sql` | users 扩展 + 9 表 + early_bird 默认 3 stage |
| `crates/api/src/routes/` | **无** `growth` · **无** register `referral_code` |
| `frontend/app/me/referrals` | **不存在** |
| `frontend/app/auth/register` | **无** `?ref=` 预填 |
| `frontend/app/admin/growth/*` | **仅 Hub** · nav 指向 404 |
| `community_risk_signals` | **GO** — 可作 G6 复用基础 |
| Stripe/onboarding/orders | **未改** — 符合 102 §1.2 禁止项 |

---

## 3. G1–G7 功能矩阵

| ID | 模块 | 102 目标 | DB | API | Admin UI | 用户 UI | 分类 | 判定 | PI3 阻塞 | 工作量 | 测试范围 |
|----|------|----------|-----|-----|----------|---------|------|------|----------|--------|----------|
| **G0** | DDL + RBAC | 9 表 + 4 perm | **实现** | — | perm 矩阵 | — | **部分** | **HOLD** | 否 | **S**（已做） | migration apply · rbac gate |
| **G0** | 侧栏 Growth | 8 子路由 | — | — | Hub **仅** | — | **部分** | **HOLD** | 否 | **S** | admin shell nav audit |
| **G1** | Referral Codes | 码生成/绑定/`?ref=` | `referral_codes` **DDL** | **G-S1 GO** | **GO** | **无** | **部分** | **HOLD→G1 GO** | 否 | **M→S** | register E2E · validate API |
| **G1** | register 绑码 | `POST /auth/register` + optional code | `users.referred_by_*` **列** | **G-S1 GO** | — | **GO** | **部分** | **HOLD→G1 GO** | 否 | **M→S** | auth contract · 102 §4.2 |
| **G1** | 公开校验 | `GET /growth/referrals/validate` | — | **G-S1 GO** | — | — | **部分** | **HOLD→G1 GO** | 否 | **S** | public API smoke |
| **G2** | Early Bird | Stage 1–3 倍率 | `early_bird_stages` **seed 3 行** | **G-S3 GO** | **GO** | badge **无** | **部分** | **G-S3 GO** | 否 | **M→S** | 注册序号原子性 IT |
| **G3** | Airdrop Campaigns | 快照/计算/链下分配 | `airdrop_*` **DDL** | **G-S6 GO** | **GO** | 预计 GOV **无** | **部分** | **G-S6 GO** | 否 | **L→M** | 链下 snapshot/export · 无链上 |
| **G4** | KOL Center | KOL 贡献只读 | 读模型 **G-S7** | **G-S7 GO** | **GO** | `/me/referrals` **无** | **部分** | **G-S7 GO** | 否 | **M→S** | 无 GMV/订单投影 |
| **G5** | Reward Ledger | append-only 积分 | `growth_point_ledger` **DDL** | **G-S2 GO** | **GO** | **无** | **部分** | **G-S2 GO** | 否 | **L→M** | ledger SUM = users.growth_points |
| **G5** | Growth Observer | 挂钩既有 API 成功 | — | **G-S2 GO** | — | — | **部分** | **G-S2 GO** | 否 | **L→M** | 102 §5.4 各 trigger · 不改状态机 |
| **G6** | Anti-Fraud | growth 专用规则 | `users.growth_fraud_status` | **G-S5 GO** | **GO** | — | **部分** | **G-S5 GO** | 否 | **L→M** | 冻结/信号/ledger 标记 |
| **G7** | Growth Analytics | 转化漏斗 | 聚合 **G-S7** | **G-S7 GO** | **GO** | — | **部分** | **G-S7 GO** | 否 | **M→S** | ≠ trust-growth A/B |
| **—** | `/me/referrals` | 用户推荐中心 | — | **G-S4 GO** | — | **GO** | **部分** | **G-S4 GO** | 否 | **M→S** | UI + API 聚合 |
| **—** | 积分规则 v1.0 | email/KYC/首单/escrow | — | **G-S2 GO** | — | — | **部分** | **G-S2 GO** | 否 | **L→M** | 102 §5.2 幂等键 |
| **—** | GOV 空投链上 | ③ 才 transfer | — | **无** | — | — | **未实现** | **HOLD** | 否 | — | PI3-005 Mainnet 另轨 |
| **P4** | trust-growth | Banner A/B | trust_growth_* | **实现** | **GO** | 公开 config | **实现** | **GO** | 否 | — | F-032 · admin trust-growth |

---

## 4. 与治理币 / DID / 订单 / 支付边界

| 域 | 102 规划 | 现状 | 判定 | 说明 |
|----|----------|------|------|------|
| **治理币 GOV（链上）** | Airdrop ③ 链接 transfer | Governor/Token 既有 · **无** growth 投影 | **GO**（核心链） | 102 链下 airdrop **HOLD** |
| **DID Rank** | ≠ KOL Center | `did_rank` API + Admin 快照 **GO** | **GO** | G4 为 **增量** 读模型 |
| **订单/Escrow** | Observer only | 状态机 frozen · **G-S2** confirm 后只读 Observer | **GO** | 102 §1.2 合规 |
| **Stripe/入驻** | 不改 webhook | onboarding **GO** staging | **GO** | 首单积分 **G-S2 Observer** |
| **社区** | first_post 积分 trigger | community **GO** | **GO** | Observer **G-S2 GO** |

---

## 5. 过时设计（REWRITE）

| ID | 102 陈述 | 真源 | 修订 |
|----|----------|------|------|
| **RW-102-01** | §2「users 无 referral 列」 | migration 已 ALTER | 改为「**列存在 · 运行时未写**」 |
| **RW-102-02** | §2「referral_events 无表」 | DDL 存在 | 改为「**表空 · 无 writer**」 |
| **RW-102-03** | §0「Admin Growth 不存在」 | Hub+nav 存在 | 「**S1 stub · 无 CRUD**」 |
| **RW-102-04** | 独立 SSOT API 清单 | 101 §6.5 为准 | 102 保持 **索引** 角色 |

---

## 6. 反作弊 / 结算 / 后台运营

| 能力 | 102 要求 | 现状 | 判定 | PI3 阻塞 |
|------|----------|------|------|----------|
| 同 IP/设备/钱包检测 | G6 规则引擎 | community risk **部分** | **HOLD** | 否 |
| 积分冻结/空投资格取消 | `growth_fraud_status` | 列存在 · 无 UI | **HOLD** | 否 |
| 积分结算 append-only | `growth_point_ledger` | **G-S2 writer + 对账** | **GO（G-S2）** | 否 |
| Early Bird 结算 | 注册序号 × 倍率 | **G-S3 rank+stage+ledger 倍率** | **GO（G-S3）** | 否 |
| Airdrop 结算 | 快照 → 占比 → 链下记录 | 无 workflow | **HOLD** | 否 |
| Admin 运营后台 | 7 子模块 CRUD | referral+ledger+early-bird **G-S1/G-S2/G-S3** | **部分** | 否 |
| smoke-growth-referral | 101 汇合闸 | **G-S1 已建**（126） | **GO（G-S1）** | 否 |
| smoke-growth-ledger | G-S2 汇合闸 | **G-S2 已建**（127） | **GO（G-S2）** | 否 |
| smoke-growth-early-bird | G-S3 汇合闸 | **G-S3 已建**（128） | **GO（G-S3）** | 否 |
| smoke-growth-fraud-ops | G-S5 汇合闸 | **G-S5 已建**（130） | **GO（G-S5）** | 否 |

**Production GO：** 以上 **均非** PI3 阻塞；**③ 若承诺 GOV 空投** 则 G3+G5 **变为产品 HOLD**（非当前 PI3 清单项）。

---

## 7. 102 实施顺序 vs 建议（审计意见）

101 §11.3 轨 C（G-S1～G-S5）**仍有效**，但：

1. **不得** 在 120/S5 冻结期启动 G-S2+ Observer（触及 auth/orders 成功路径）without 新 Sprint  
2. **G-S1**（register ref + 码生成）可与 Catalog **并行**，但 **非** Production GO 前置  
3. **汇合闸** `smoke-growth-referral-p0-local.sh` 仍 **未建** — 首 Sprint 交付物

| Sprint | 102 交付 | 审计状态 | 判定 |
|--------|----------|----------|------|
| G-S1 | DB+RBAC+register ref | **G-S1 GO**（126） | **GO（最小闭环）** |
| G-S2 | Ledger+observer | **G-S2 GO**（127） | **GO（Ledger+Observer）** |
| G-S3 | Early Bird+倍率 | **G-S3 GO**（128） | **GO（序号+Stage+倍率）** |
| G-S4 | `/me/referrals` | **G-S4 GO**（129） | **GO（用户推荐中心）** |
| G-S5 | Admin 风控+奖励运营 | **G-S5 GO**（130） | **GO（冻结/ledger 审计）** |
| G-S6 | 链下 Airdrop 快照/计算 | **G-S6 GO**（131） | **GO（无链上发放）** |
| G-S7 | Analytics/KOL 只读 | **G-S7 GO**（132） | **GO（无写路径）** |
| G-S8 | Release Freeze | **G-S8 GO**（133） | **GROWTH_RELEASE_FREEZE_GO** |

---

## 8. 工作量汇总（102 / 101 §10.2）

| 轨 | 101 估算 | 审计剩余 |
|----|----------|----------|
| G0（已完成部分） | M | **~20%** |
| G1–G7 运行时 | **55–70 dev-days** | **~95% 未做** |
| 汇合 smoke | M | **100% 未做** |

---

## 9. 复验命令

```bash
bash scripts/check-101-102-blueprint-compatibility-audit.sh
bash scripts/check-g-s1-referral-minimum-loop.sh
bash scripts/check-g-s2-growth-ledger-observer.sh
bash scripts/check-g-s3-early-bird-multiplier.sh
bash scripts/check-g-s4-user-referral-center.sh
bash scripts/check-g-s5-admin-growth-fraud-reward-ops.sh
bash scripts/check-g-s6-airdrop-snapshot-reward-calc.sh
bash scripts/check-g-s7-growth-analytics-kol-readonly.sh
bash scripts/check-g-s8-growth-release-freeze.sh
# 期望：G-S1～G-S8 · GROWTH_RELEASE_FREEZE_GO

rg -l "growth/referral" crates/api/src/routes/
test -d frontend/app/me/referrals
```

---

## 10. 交叉引用

| 文档 | 关系 |
|------|------|
| [123-101-CMS-Audit](./123-101-CMS-Audit-Report.md) | M7→G1 依赖 |
| [125-Production-Feature-Gap-Matrix](./125-Production-Feature-Gap-Matrix.md) | 全站 GO/HOLD |
| [126-G-S1-Referral-Minimum-Loop-Report](./126-G-S1-Referral-Minimum-Loop-Report.md) | **G-S1 实施证据** |
| [127-G-S2-Growth-Ledger-Observer-Report](./127-G-S2-Growth-Ledger-Observer-Report.md) | **G-S2 Ledger+Observer** |
| [128-G-S3-EarlyBird-Multiplier-Report](./128-G-S3-EarlyBird-Multiplier-Report.md) | **G-S3 Early Bird+倍率** |
| [129-G-S4-User-Referral-Center-Report](./129-G-S4-User-Referral-Center-Report.md) | **G-S4 `/me/referrals`** |
| [130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report](./130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md) | **G-S5 Admin 风控+奖励运营** |
| [131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report](./131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report.md) | **G-S6 链下 Airdrop 快照/计算** |
| [132-G-S7-Growth-Analytics-KOL-ReadOnly-Report](./132-G-S7-Growth-Analytics-KOL-ReadOnly-Report.md) | **G-S7 只读 Analytics/KOL** |
| [133-G-S8-Growth-Release-Freeze-Report](./133-G-S8-Growth-Release-Freeze-Report.md) | **G-S8 Growth Release Freeze** |
| [104-Admin-Coverage-Gap](./104-Admin-Coverage-Gap-Report.md) | §1.11 Growth 矩阵 |

---

**维护者：** Blueprint Compatibility Audit · 2026-06-07
