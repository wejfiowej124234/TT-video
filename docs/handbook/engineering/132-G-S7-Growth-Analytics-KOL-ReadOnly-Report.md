# 132 · G-S7 Growth Analytics & KOL Read-Only Dashboard — Sprint Report

> **Sprint**：G-S7（102 Growth · 只读增长分析与 KOL 贡献看板）  
> **基准**：[131-G-S6](./131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report.md) · [124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 · **链上 GOV 发放** · Mainnet · **积分公式** · **奖励发放**  
> **总裁定**：**G-S7 GO（只读 Analytics + KOL）· G4/G7 运行时 GO**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S7 范围** | 注册漏斗 · 邀请码转化 · 积分/早鸟分布 · Airdrop 汇总 · Top referrers · KOL 贡献 · 异常占比 · 时间窗口 |
| **写路径** | **无** — 全部 GET · `read_only: true` |
| **124 G4** | KOL Center → **GO（G-S7 只读最小）** |
| **124 G7** | Growth Analytics → **GO（G-S7 只读最小）** |

---

## 2. 交付物

| 类型 | 路径 |
|------|------|
| **Report** | 本文 |
| **DB** | `crates/api/src/db/growth_analytics_ops.rs` |
| **Admin API** | `admin_growth_analytics_http.rs` |
| **Admin UI** | `/admin/growth/analytics` · `/admin/growth/kol-center` |
| **Gate** | `scripts/check-g-s7-growth-analytics-kol-readonly.sh` |
| **Smoke** | `scripts/dev/smoke-growth-analytics-kol-p0-local.sh` |
| **Playwright** | `frontend/e2e/g-s7-growth-analytics-kol-readonly.spec.ts` |

---

## 3. Admin API（只读）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/admin/growth/analytics/overview` | 概览 · 漏斗基数 · 积分/早鸟/空投/风控 |
| GET | `/api/v1/admin/growth/analytics/funnel` | 注册漏斗四步转化率 |
| GET | `/api/v1/admin/growth/analytics/top-referrers` | Top 推荐人榜 |
| GET | `/api/v1/admin/growth/kol-center` | KOL 码贡献列表 |
| GET | `/api/v1/admin/growth/kol-center/:code_id` | KOL 详情 + 近期邀请 |

**Query**：`days`（7/30/90）或 `from`/`to`（RFC3339）· `limit`

---

## 4. 明确不做

- 奖励发放 / 积分公式变更 / Observer 钩子
- GMV · 订单投影 · 链上 GOV · Mainnet tx
- trust-growth A/B（P4 Banner · 与 G7 无关）

---

## 5. 验证

**2026-06-07 复验**：`check-g-s7` exit 0 · `cargo test growth_analytics_ops` 2/2 · Vitest contract 2/2

```bash
bash scripts/check-g-s7-growth-analytics-kol-readonly.sh
bash scripts/dev/smoke-growth-analytics-kol-p0-local.sh
cd frontend && npx playwright test e2e/g-s7-growth-analytics-kol-readonly.spec.ts
cargo test -p traveltrust-api growth_analytics_ops
```

---

## 6. 124 / 125

见 [124](./124-102-Referral-Audit-Report.md) G4/G7 行 · [125](./125-Production-Feature-Gap-Matrix.md)。

---

**维护者：** G-S7 Growth Sprint · 2026-06-07
