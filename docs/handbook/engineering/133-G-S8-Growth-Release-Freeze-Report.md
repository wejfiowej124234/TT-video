# 133 · G-S8 Growth Release Freeze Report

> **Sprint**：G-S8（102 Growth · 运行时发布冻结证据包）  
> **审计 SSOT**：[126](./126-G-S1-Referral-Minimum-Loop-Report.md)–[132](./132-G-S7-Growth-Analytics-KOL-ReadOnly-Report.md)（G-S1～G-S7）  
> **交叉基准**：[124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md) · [120-S5](./120-S5-Catalog-Release-Freeze-Report.md)  
> **日期**：2026-06-07  
> **纪律**：**不新增功能** · **不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 · **链上 GOV/Mainnet**  
> **结论**：**GROWTH_RELEASE_FREEZE_GO**

---

## 1. 冻结结论

| 维度 | 判定 |
|------|------|
| G-S1～G-S7 报告链完整（126–132） | **GO** |
| 一键复跑 gate | **GO** — `bash scripts/check-g-s8-growth-release-freeze.sh` |
| 2026-06-07 本地复跑 | **PASS** · `GROWTH_RELEASE_FREEZE_GO` |
| 102 G1–G7 运行时（链下） | **GO** — Referral · Ledger · Early Bird · `/me/referrals` · Anti-Fraud · Airdrop 链下 · Analytics/KOL 只读 |
| 链上 GOV 空投 / Mainnet tx | **HOLD** — 非本冻结包范围 |
| 平台 Production GO | **Growth 不阻塞** — 与 Entry/S5/PI3 清单一致 |

**G-S8 正式标记**：102 Growth **链下运行时证据包已冻结**；任何 prod 链上 GOV 发放、Airdrop `approved`/`distributed`、积分公式变更须 **新 Sprint + 显式 Owner 授权**，不得借 G-S8 默认宣称 ③ 链上已验收。

---

## 2. 证据包索引（G-S1 → G-S7）

| Sprint | 报告 | 模块 | 状态 | 一键 gate |
|--------|------|------|------|-----------|
| G-S1 | [126](./126-G-S1-Referral-Minimum-Loop-Report.md) | Referral + register `?ref=` | **GO** | `check-g-s1-referral-minimum-loop.sh` |
| G-S2 | [127](./127-G-S2-Growth-Ledger-Observer-Report.md) | Ledger + Observer | **GO** | `check-g-s2-growth-ledger-observer.sh` |
| G-S3 | [128](./128-G-S3-EarlyBird-Multiplier-Report.md) | Early Bird 倍率 | **GO** | `check-g-s3-early-bird-multiplier.sh` |
| G-S4 | [129](./129-G-S4-User-Referral-Center-Report.md) | `/me/referrals` | **GO** | `check-g-s4-user-referral-center.sh` |
| G-S5 | [130](./130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md) | Anti-Fraud + Reward Ops | **GO** | `check-g-s5-admin-growth-fraud-reward-ops.sh` |
| G-S6 | [131](./131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report.md) | 链下 Airdrop 快照/计算 | **GO** | `check-g-s6-airdrop-snapshot-reward-calc.sh` |
| G-S7 | [132](./132-G-S7-Growth-Analytics-KOL-ReadOnly-Report.md) | Analytics + KOL 只读 | **GO** | `check-g-s7-growth-analytics-kol-readonly.sh` |
| **G-S8** | **本报告 133** | **Release Freeze** | **FREEZE GO** | **`check-g-s8-growth-release-freeze.sh`** |

**G-S8 一键 gate 串联**：证据 preflight → G-S1～G-S7 逐 Sprint 复跑 → 7 份 contract Vitest → 7 组 cargo test → 冻结边界断言。

---

## 3. 功能矩阵（124 G1–G7 · 冻结口径）

| ID | 模块 | 运行时 | 写路径 | 冻结备注 |
|----|------|--------|--------|----------|
| **G1** | Referral Codes + register | **GO** | Admin write · register bind | 公开 validate · hourly bind limit |
| **G2** | Reward Ledger + Observer | **GO** | internal award-points | append-only · 幂等键 · 不改订单状态机 |
| **G3** | Airdrop Campaigns | **GO（链下）** | snapshot/calculate/recalc | **无** approve/distribute/tx_hash |
| **G4** | KOL Center | **GO（只读）** | **无** | 无 GMV/订单投影 |
| **G5** | Reward Ledger Admin | **GO** | reconcile/fix · fraud mark | 人工调账审批流 **未建** |
| **G6** | Anti-Fraud | **GO** | freeze/unfreeze · ledger patch | 自动 fraud-scan 引擎 **HOLD** |
| **G7** | Growth Analytics | **GO（只读）** | **无** | ≠ P4 trust-growth A/B |
| **—** | `/me/referrals` | **GO** | **无** | 用户只读聚合 |
| **—** | 链上 GOV 发放 | **HOLD** | — | PI3-005 / Mainnet 另轨 |

---

## 4. 默认开关与环境（冻结口径）

| 项 | 默认 / 前提 | 语义 |
|----|-------------|------|
| **Growth DB** | `DATABASE_URL` 设置时启用 | `chain_off.db_pool` · migration `20260607120200` + G-S3/G-S6 增量 |
| **Growth 功能 flag** | **无独立 FE/API kill-switch** | 运行时随 PG + Admin RBAC；**非** Catalog `ENABLED=0` 模式 |
| **Observer 挂钩** | 代码内嵌 · auth/orders/community 成功路径 | G-S2 已接 · **不改** Escrow/支付 webhook |
| **Airdrop 工作流** | `draft → snapshot_locked → calculated` | export disclaimer: `off_chain_notional_only_no_on_chain_transfer` |
| **trust-growth P4** | `TRUST_GROWTH_ENV` 等（见 `.env.example`） | Banner A/B · **≠** Growth Center G7 |

---

## 5. RBAC 权限（冻结不变）

| Permission ID | 用途 | 典型角色 |
|---------------|------|----------|
| `admin.growth.read` | Growth Center 读 · Analytics/KOL | SuperAdmin · Ops · CS · Risk · Finance · Auditor |
| `admin.growth.write` | 码/早鸟/Airdrop campaign 编辑 | SuperAdmin · Ops |
| `admin.growth.publish` | 蓝图预留 · **Airdrop approve 未实现** | SuperAdmin only |
| `admin.growth.fraud` | 冻结/解冻 · ledger fraud mark | SuperAdmin · Ops · Risk |

**源码 SSOT**：`admin_rbac.rs` · `frontend/lib/admin/adminPermissionIds.ts` · Admin 侧栏 `adminShellGrowthNavLinks.ts`

---

## 6. 反作弊边界（G-S5/G-S6 冻结）

| 规则 | 行为 |
|------|------|
| `growth_fraud_status` | `normal` / `points_frozen` / `airdrop_ineligible` / `banned` |
| Observer 新发分 | `points_frozen` / `banned` / `airdrop_ineligible` → **SkippedFrozen** |
| Airdrop eligible | 快照时仅 `growth_fraud_status = normal` 参与分配 |
| Admin 运营 | PATCH 用户状态 · 可选停用推荐码 · ledger `cleared/suspect/flagged` |
| **未做** | 自动 fraud-scan 引擎 · community 规则合并 · KOL GMV 对拍 |

---

## 7. 链下空投免责声明（G-S6 冻结）

- `gov_pool_amount` / `notional_gov_amount` 为 **链下名义单位**，用于比例计算与 CSV/JSON 导出。
- Export API 响应含：`disclaimer: off_chain_notional_only_no_on_chain_transfer`
- Admin UI 文案：`admin_growth_airdrop_disclaimer`（zh/en）
- **禁止**：写入 `tx_hash` · 状态 `approved`/`distributed` · Mainnet broadcast

---

## 8. 仍 HOLD 项（不得借 G-S8 冒充 GO）

| 项 | 判定 | 说明 |
|----|------|------|
| 链上 GOV 空投 transfer | **HOLD** | ③ · PI3-005 Mainnet 另闸 |
| Airdrop approve/distribute | **HOLD** | DDL 有列 · 运行时未接 |
| 人工调账审批 inbox | **HOLD** | G5 蓝图 · 未建 |
| 自动 fraud-scan POST | **HOLD** | internal 路由未建 |
| KOL GMV / orders 投影 | **HOLD** | G4 只读最小 |
| Early Bird 用户 badge UI | **HOLD** | Admin GO · 用户侧 badge 无 |
| Growth prod feature flag | **HOLD** | 无 kill-switch · 依赖 PG+RBAC |

---

## 9. G-S8 一键 gate

**2026-06-07 复验**：`check-g-s8` exit 0 · contract Vitest 8/8 · cargo growth tests 7/7 · **`GROWTH_RELEASE_FREEZE_GO`**

```bash
bash scripts/check-g-s8-growth-release-freeze.sh
```

| Step | 内容 |
|------|------|
| 0/4 | 报告 126–132 · smoke · Playwright spec · disclaimer · RBAC 存在性 |
| 1/4 | 逐 Sprint 复跑 `check-g-s1` … `check-g-s7` |
| 2/4 | 7 份 Admin Growth contract Vitest 批量 |
| 3/4 | cargo test：`growth_referral` · `growth_observer` · `early_bird` · `me_referrals` · `growth_fraud_ops` · `airdrop_ops` · `growth_analytics_ops` |
| 4/4 | 无 Mainnet airdrop writer · analytics `read_only` · nav 完整 |

**成功输出**：`G-S8 growth release freeze gate: PASS` + **`GROWTH_RELEASE_FREEZE_GO`**

**失败输出**：`GROWTH_RELEASE_FREEZE_HOLD`（exit 1）

---

## 10. Smoke / Playwright（① 本地 · 非 gate 默认跑）

| Sprint | Smoke | Playwright |
|--------|-------|------------|
| G-S1 | `smoke-growth-referral-p0-local.sh` | `g-s1-referral-minimum-loop.spec.ts` |
| G-S2 | `smoke-growth-ledger-observer-p0-local.sh` | `g-s2-growth-ledger-observer.spec.ts` |
| G-S3 | `smoke-growth-early-bird-p0-local.sh` | `g-s3-early-bird-multiplier.spec.ts` |
| G-S4 | `smoke-growth-user-referral-center-p0-local.sh` | `g-s4-user-referral-center.spec.ts` |
| G-S5 | `smoke-growth-fraud-reward-ops-p0-local.sh` | `g-s5-admin-growth-fraud-reward-ops.spec.ts` |
| G-S6 | `smoke-growth-airdrop-snapshot-p0-local.sh` | `g-s6-airdrop-snapshot-reward-calc.spec.ts` |
| G-S7 | `smoke-growth-analytics-kol-p0-local.sh` | `g-s7-growth-analytics-kol-readonly.spec.ts` |

Playwright 需 API+FE 已起；G-S8 gate **仅验 spec 存在 + contract Vitest**。

---

## 11. 124 / 125 更新

- [124](./124-102-Referral-Audit-Report.md) · G-S8 冻结行 · 复验命令增 `check-g-s8`
- [125](./125-Production-Feature-Gap-Matrix.md) · Growth gate → `check-g-s8-growth-release-freeze.sh`
- `check-101-102-blueprint-compatibility-audit.sh` → `GROWTH_PLANE_RELEASE_FREEZE_GS8`

---

**报告状态**：**GROWTH_RELEASE_FREEZE_GO** · 一键 gate 绿 · **链上 GOV 仍 HOLD**
