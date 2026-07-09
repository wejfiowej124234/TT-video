# 127 · G-S2 Growth Ledger & Observer — Sprint Report

> **Sprint**：G-S2（102 Growth · Ledger + Observer）  
> **基准**：[126-G-S1](./126-G-S1-Referral-Minimum-Loop-Report.md) · [124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md) · [102 蓝图 §5](./102-Referral与早鸟增长系统v1.0实施蓝图.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 webhook · 治理币发放 · Escrow/订单状态机定义  
> **总裁定**：**G-S2 GO（Ledger + Observer 最小闭环）· G-S3～G-S5 仍 HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S2 范围** | `growth_point_ledger` 幂等写入 · Observer 挂钩 · 可配置事件分 · 对账 · Admin Ledger 查询 |
| **未做（显式排除）** | Early Bird 倍率 · GOV/Airdrop · KOL · Analytics · `/me/referrals` · 用户侧 ledger UI |
| **状态机** | **未改** `OrderState` / 支付 / Escrow 合约 — 仅在 **API 成功返回后** 只读检测 |
| **124 G5** | ledger + observer → **GO（G-S2 最小）** |

---

## 2. 交付物

| 类型 | 路径 |
|------|------|
| **Report** | 本文 |
| **DB** | `crates/api/src/db/growth_ledger.rs` · `growth_observer.rs` |
| **Internal** | `POST /api/v1/internal/growth/award-points` · `observe` · `GET reconcile` |
| **Admin** | `GET /api/v1/admin/growth/reward-ledger` · `…/reconcile` · FE `/admin/growth/reward-ledger` |
| **Smoke** | `scripts/dev/smoke-growth-ledger-observer-p0-local.sh` |
| **Gate** | `scripts/check-g-s2-growth-ledger-observer.sh` |
| **Playwright** | `frontend/e2e/g-s2-growth-ledger-observer.spec.ts` |

---

## 3. 实现矩阵

| 能力 | 实现 | 判定 |
|------|------|------|
| append-only ledger | `growth_point_ledger` INSERT + `idempotency_key` UNIQUE | **GO** |
| 物化缓存 | `users.growth_points` 同事务递增 | **GO** |
| 幂等 | 重复 key → Duplicate · 不双记 | **GO** |
| 对账 | `reconcile_user` / `list_drift` · Admin + Internal | **GO** |
| Observer · 邮箱验证 | `auth_verify_email` 成功后 | **GO** |
| Observer · DID/钱包 | `POST …/wallet/verify/confirm` | **GO** |
| Observer · 首帖 | `POST …/community/posts` count=1 | **GO** |
| Observer · 首单/Escrow | `confirm-completion` 成功后只读计数 | **GO** |
| 推荐人双侧 | `referral_*` source + referred_by | **GO** |
| KYC 积分 | Internal `observe` · 待 KYC API 挂接 | **部分** |
| Early Bird | multiplier 固定 **1.0** | **HOLD（G-S3）** |

---

## 4. 可配置事件（102 §5.2 默认 · G-S2 无倍率）

| source | 默认 points | 触发 |
|--------|-------------|------|
| `email_verified` | 100 | verify-email |
| `kyc_verified` | 200 | internal observe / 未来 KYC |
| `did_wallet_verified` | 50 | wallet verify confirm |
| `first_post` | 50 | 首条 community post |
| `first_order_completed` | 300 | 首笔 completed order |
| `first_escrow_completed` | 500 | 首笔 escrow completed |
| `referral_email_verified` | 50 | 被推荐人邮箱验证 |
| `referral_kyc_verified` | 100 | 被推荐人 KYC |
| `referral_first_order_completed` | 200 | 被推荐人首单 |
| `referral_first_escrow_completed` | 200 | 被推荐人首 Escrow 单 |

**Env 覆盖**

- `TRAVELTRUST_GROWTH_OBSERVER=0` — 关闭 Observer  
- `TRAVELTRUST_GROWTH_OBSERVER_DISABLE=first_post,…` — 按 source 禁用  
- `TRAVELTRUST_GROWTH_POINTS_EMAIL_VERIFIED=100` — 按 source 覆盖分值  

---

## 5. HTTP 契约摘要

### Internal（须 operator secret）

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/v1/internal/growth/award-points` | 幂等发积分 |
| POST | `/api/v1/internal/growth/observe` | `{ user_id, event }` |
| GET | `/api/v1/internal/growth/reconcile?limit=` | 漂移列表 |

### Admin（`admin.growth.read`）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/admin/growth/reward-ledger` | `?user_id=&source=&limit=` |
| GET | `/api/v1/admin/growth/reward-ledger/reconcile` | 单用户或 drift 列表 |

---

## 6. 验证命令

```bash
bash scripts/check-g-s2-growth-ledger-observer.sh
bash scripts/dev/smoke-growth-ledger-observer-p0-local.sh
cd frontend && npx playwright test e2e/g-s2-growth-ledger-observer.spec.ts
cargo test -p traveltrust-api growth_observer growth_ledger
```

---

## 7. 124 / 125 更新

见 [124](./124-102-Referral-Audit-Report.md) G5/G-S2 行 · [125](./125-Production-Feature-Gap-Matrix.md) Growth 完成度。

---

## 8. 下一步（G-S3+）

| Sprint | 内容 |
|--------|------|
| **G-S3** | Early Bird stage · multiplier 写入 ledger |
| **G-S4** | `/me/referrals` · KOL 读模型 |
| **G-S5** | Airdrop · Analytics |

---

**维护者：** G-S2 Growth Sprint · 2026-06-07
