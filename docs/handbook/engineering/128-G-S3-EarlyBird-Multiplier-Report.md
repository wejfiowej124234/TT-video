# 128 · G-S3 Early Bird & Multiplier — Sprint Report

> **Sprint**：G-S3（102 Growth · Early Bird Program）  
> **基准**：[127-G-S2](./127-G-S2-Growth-Ledger-Observer-Report.md) · [126-G-S1](./126-G-S1-Referral-Minimum-Loop-Report.md) · [124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 · 链上 GOV  
> **总裁定**：**G-S3 GO（早鸟序号+倍率）· G-S4/G-S5 仍 HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S3 范围** | 注册原子序号 · Stage 配置 · Observer 倍率 · ledger 审计字段 · Admin 管理/对账 |
| **积分性质** | **链下** growth_points · **无** GOV mint/transfer |
| **未做** | Airdrop · KOL · Analytics · `/me/referrals` · 用户 badge UI |
| **124 G2** | Early Bird → **GO（G-S3 最小）** |

---

## 2. 交付物

| 类型 | 路径 |
|------|------|
| **Report** | 本文 |
| **Migration** | `20260607140000_growth_early_bird_g_s3.sql` |
| **DB** | `crates/api/src/db/early_bird.rs` |
| **Ledger** | `growth_ledger.rs` — `points = base × multiplier` |
| **Register** | `assign_early_bird_on_register` · 响应 `early_bird` |
| **Admin API** | `GET/PATCH …/early-bird/stages` · `GET …/reconcile` |
| **Admin UI** | `/admin/growth/early-bird` |
| **Gate** | `scripts/check-g-s3-early-bird-multiplier.sh` |
| **Smoke** | `scripts/dev/smoke-growth-early-bird-p0-local.sh` |
| **Playwright** | `frontend/e2e/g-s3-early-bird-multiplier.spec.ts` |

---

## 3. 设计摘要（102 §6）

### 3.1 注册序号（原子）

- 表 `growth_registration_seq` 单行计数器
- 注册 PG 持久化成功后：`growth_registration_rank` + `users.early_bird_stage`
- 响应 optional：`early_bird { registration_rank, stage_number, multiplier }`

### 3.2 Stage 默认（migration seed）

| Stage | 序号 | 倍率 |
|-------|------|------|
| 1 | 1–1000 | 3.0× |
| 2 | 1001–5000 | 2.0× |
| 3 | 5001–10000 | 1.5× |
| 4+ | >10000 | 1.0×（无 stage 列） |

### 3.3 Observer 发分

`award_growth_points` 读取用户冻结的 `early_bird_stage` → 查 `early_bird_stages.multiplier` →  
`points = round(base_points × multiplier)` · ledger 写入 `base_points` / `early_bird_multiplier` / `early_bird_stage`

### 3.4 Env

- `TRAVELTRUST_GROWTH_EARLY_BIRD=0` — 关闭序号分配与倍率（恒 1.0×）

---

## 4. Admin 契约

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/admin/growth/early-bird/stages` | Stage 列表 + 各 stage 用户数 |
| PATCH | `/api/v1/admin/growth/early-bird/stages/:stage_number` | `is_active` / rank 区间 / `multiplier` |
| GET | `/api/v1/admin/growth/early-bird/reconcile` | 序号计数器 · 已分配用户 · mismatch |

---

## 5. 验证

```bash
bash scripts/check-g-s3-early-bird-multiplier.sh
bash scripts/dev/smoke-growth-early-bird-p0-local.sh
cd frontend && npx playwright test e2e/g-s3-early-bird-multiplier.spec.ts
cargo test -p traveltrust-api early_bird
```

---

## 6. 124 / 125

见 [124](./124-102-Referral-Audit-Report.md) G2 行 · [125](./125-Production-Feature-Gap-Matrix.md) Growth 完成度。

---

## 7. 下一步（G-S4+）

- `/me/referrals` 用户中心
- KOL 读模型
- Airdrop 链下快照（仍无链上 GOV）

---

**维护者：** G-S3 Growth Sprint · 2026-06-07
