# 130 · G-S5 Admin Growth Anti-Fraud & Reward Ops — Sprint Report

> **Sprint**：G-S5（102 Growth · Admin 风控与奖励运营）  
> **基准**：[129-G-S4](./129-G-S4-User-Referral-Center-Report.md) · [128-G-S3](./128-G-S3-EarlyBird-Multiplier-Report.md) · [124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 · 链上 GOV · Airdrop · KOL · Analytics  
> **总裁定**：**G-S5 GO（Admin 风控+奖励运营最小闭环）**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S5 范围** | 用户 `growth_fraud_status` · 信号列表 · 规则可视化 · ledger 审计/标记 · 漂移修复 |
| **积分性质** | **链下** · append-only ledger · 冻结阻止 Observer 新发分 |
| **未做** | 自动 fraud-scan 引擎 · Airdrop · KOL · Analytics · community 规则合并 |
| **124 G6** | Anti-Fraud → **GO（G-S5 最小）** |

---

## 2. 交付物

| 类型 | 路径 |
|------|------|
| **Report** | 本文 |
| **DB** | `crates/api/src/db/growth_fraud_ops.rs` |
| **Admin API** | `admin_growth_fraud_http.rs` · 扩展 `admin_growth_ledger_http.rs` |
| **Admin UI** | `/admin/growth/anti-fraud` · reward-ledger 增强 |
| **Gate** | `scripts/check-g-s5-admin-growth-fraud-reward-ops.sh` |
| **Smoke** | `scripts/dev/smoke-growth-fraud-reward-ops-p0-local.sh` |
| **Playwright** | `frontend/e2e/g-s5-admin-growth-fraud-reward-ops.spec.ts` |

---

## 3. Admin API 契约

| Method | Path | Perm | 说明 |
|--------|------|------|------|
| GET | `/api/v1/admin/growth/anti-fraud/rules` | read | 规则目录（只读可视化） |
| GET | `/api/v1/admin/growth/anti-fraud/signals` | read | `growth_fraud_signals` |
| GET | `/api/v1/admin/growth/anti-fraud/users` | read | 用户状态 + 信号计数 |
| GET | `/api/v1/admin/growth/anti-fraud/cases` | read | 开放 `growth_fraud_cases` |
| PATCH | `/api/v1/admin/growth/anti-fraud/users/:user_id` | **fraud** | 冻结/解冻 · 可选停用推荐码 |
| GET | `/api/v1/admin/growth/reward-ledger` | read | 增 `fraud_status` 筛选 |
| PATCH | `/api/v1/admin/growth/reward-ledger/:id` | **fraud** | 标记 `cleared/suspect/flagged` |
| POST | `/api/v1/admin/growth/reward-ledger/reconcile/fix` | write | 将 cache 对齐 ledger SUM |

---

## 4. 风控行为

- **`points_frozen` / `banned` / `airdrop_ineligible`** → Observer `SkippedFrozen`（G-S2 已有）
- 冻结时自动开 `growth_fraud_cases(open)` · 解冻写 `resolved`
- 推荐码：PATCH 可选 `disable_referral_codes` 停用 owner 全部码

---

## 5. 验证

```bash
bash scripts/check-g-s5-admin-growth-fraud-reward-ops.sh
bash scripts/dev/smoke-growth-fraud-reward-ops-p0-local.sh
cd frontend && npx playwright test e2e/g-s5-admin-growth-fraud-reward-ops.spec.ts
cargo test -p traveltrust-api growth_fraud_ops
```

---

## 6. 124 / 125

见 [124](./124-102-Referral-Audit-Report.md) G6 行 · [125](./125-Production-Feature-Gap-Matrix.md) Growth 完成度。

---

**维护者：** G-S5 Growth Sprint · 2026-06-07
