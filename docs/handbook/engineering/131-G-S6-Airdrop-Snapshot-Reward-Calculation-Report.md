# 131 · G-S6 Airdrop Snapshot & Reward Calculation — Sprint Report

> **Sprint**：G-S6（102 Growth · 链下 Airdrop 快照与奖励计算）  
> **基准**：[130-G-S5](./130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md) · [124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 · **链上 GOV 发放** · Mainnet  
> **总裁定**：**G-S6 GO（链下快照+计算+导出）· ③ 链上仍 HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S6 范围** | Campaign · 快照 · 比例计算 · 导出 · 对账 · 复算 |
| **快照字段** | growth_points · referral · early bird · fraud_status · eligible |
| **gov_amount** | **名义链下单位** · export disclaimer · **无 tx_hash 写入** |
| **124 G3** | Airdrop Campaigns → **GO（G-S6 链下最小）** |

---

## 2. 交付物

| 类型 | 路径 |
|------|------|
| **Report** | 本文 |
| **Migration** | `20260607150000_growth_airdrop_g_s6.sql` |
| **DB** | `crates/api/src/db/airdrop_ops.rs` |
| **Admin API** | `admin_growth_airdrop_http.rs` |
| **Admin UI** | `/admin/growth/airdrop-campaigns` |
| **Gate** | `scripts/check-g-s6-airdrop-snapshot-reward-calc.sh` |
| **Smoke** | `scripts/dev/smoke-growth-airdrop-snapshot-p0-local.sh` |
| **Playwright** | `frontend/e2e/g-s6-airdrop-snapshot-reward-calc.spec.ts` |

---

## 3. 工作流（102 §7.3 · 链下截断）

```
draft → snapshot_locked → calculated
         ↑ 锁定快照        ↑ 比例计算 / 复算
```

- **snapshot**：汇总 users 积分、referral 贡献、early bird、anti-fraud
- **eligible**：仅 `growth_fraud_status = normal` 参与分配
- **calculate**：`notional_gov = floor(user_points × pool / eligible_total)`
- **export**：JSON + Admin CSV 下载
- **reconcile**：快照/分配行数与积分漂移摘要

**明确不做**：`approved` / `distributed` / 链上 transfer / `tx_hash`

---

## 4. Admin API

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/admin/growth/airdrop-campaigns` |
| GET | `…/airdrop-campaigns/:id` |
| POST | `…/airdrop-campaigns/:id/snapshot` |
| POST | `…/airdrop-campaigns/:id/calculate` |
| POST | `…/airdrop-campaigns/:id/recalculate` |
| GET | `…/airdrop-campaigns/:id/reconcile` |
| GET | `…/airdrop-campaigns/:id/export` |
| GET | `…/airdrop-campaigns/:id/snapshots` |

---

## 5. 验证

**2026-06-07 复验**：`check-g-s6` exit 0 · `cargo test airdrop_ops` 2/2 · Vitest contract 1/1

```bash
bash scripts/check-g-s6-airdrop-snapshot-reward-calc.sh
bash scripts/dev/smoke-growth-airdrop-snapshot-p0-local.sh
cd frontend && npx playwright test e2e/g-s6-airdrop-snapshot-reward-calc.spec.ts
cargo test -p traveltrust-api airdrop_ops
```

---

## 6. 124 / 125

见 [124](./124-102-Referral-Audit-Report.md) G3 行 · [125](./125-Production-Feature-Gap-Matrix.md)。

---

**维护者：** G-S6 Growth Sprint · 2026-06-07
