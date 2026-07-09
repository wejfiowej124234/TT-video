# 126 · G-S1 Referral Minimum Viable Loop — Sprint Report

> **Sprint**：G-S1（102 Growth · Referral Minimum Loop）  
> **基准**：[124-102-Referral-Audit](./124-102-Referral-Audit-Report.md) · [125-Production-Feature-Gap-Matrix](./125-Production-Feature-Gap-Matrix.md) · [102 蓝图](./102-Referral与早鸟增长系统v1.0实施蓝图.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze（120）· 报价主链 · Escrow/订单状态机  
> **总裁定**：**G-S1 GO（最小推荐闭环）· G2–G7 仍 HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S1 范围** | Admin Referral CRUD · register `referral_code` · 公开 validate · `?ref=` 预填 · 基础反作弊 · smoke |
| **未做（显式排除）** | 积分 · 早鸟 · GOV 发放 · Analytics · Airdrop · KOL Center · `/me/referrals` |
| **PI3 / Catalog** | **未改** · S5 gate 不受影响 |
| **124 G1 子项** | validate + register bind + Admin CRUD → **GO** |
| **汇合闸** | `smoke-growth-referral-p0-local.sh` **已建** |

---

## 2. 交付物清单

| 类型 | 路径 |
|------|------|
| **Audit（本文）** | `126-G-S1-Referral-Minimum-Loop-Report.md` |
| **Contract** | 本文 §4 · `frontend/app/admin/growth/referral-codes/adminGrowthReferralCodes.contract.test.ts` |
| **Smoke** | `scripts/dev/smoke-growth-referral-p0-local.sh` |
| **Gate** | `scripts/check-g-s1-referral-minimum-loop.sh` |
| **Playwright** | `frontend/e2e/g-s1-referral-minimum-loop.spec.ts` |

---

## 3. 实现矩阵（124 G1 对拍）

| ID | 能力 | 实现 | 判定 |
|----|------|------|------|
| G1-ADM | Admin Referral Code CRUD | `GET/POST/PATCH /api/v1/admin/growth/referral-codes` + `/admin/growth/referral-codes` | **GO** |
| G1-VAL | 公开校验 | `GET /api/v1/growth/referrals/validate?code=` | **GO** |
| G1-REG | 注册绑码 | `POST /auth/register` body `referral_code` + `referral_events` | **GO** |
| G1-UI | `?ref=` 预填 | `useRegisterPage` + `data-tt-register-referral-prefill` | **GO** |
| G1-CODE | 用户自有码 | `ensure_user_referral_code` on register | **GO** |
| G6-MIN | 反作弊基础 | inactive / max_uses / hourly rate / self-ref / `growth_fraud_signals` | **GO（最小）** |
| G2–G7 | 积分/早鸟/空投等 | **未实现** | **HOLD** |

---

## 4. HTTP 契约（G-S1 Contract）

### 4.1 公开

**`GET /api/v1/growth/referrals/validate?code=TT-XXX`**

- 200 `{ status, valid, code, code_type?, label?, is_active?, reason? }`
- 缺 `code` → 400 `referral_code_required`
- 无 DB → 503 `growth_db_unavailable`

### 4.2 注册

**`POST /auth/register`** — 增 optional `referral_code`（与 `?ref=` 同源）

- 无效码 → 400 `referral_code_invalid` | `referral_code_inactive` | `referral_code_exhausted` | `referral_rate_limited`
- 成功且绑码 → 200 含 optional `referral_bound { referral_code, referrer_user_id, referral_event_id }`
- 注册后自动分配 `users.referral_code`（`TT-` 前缀）

### 4.3 Admin（`admin.growth.read` / `admin.growth.write`）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/admin/growth/referral-codes` | `?is_active=&code_type=&limit=` |
| POST | `/api/v1/admin/growth/referral-codes` | `{ code?, code_type, owner_user_id, label?, max_uses? }` |
| PATCH | `/api/v1/admin/growth/referral-codes/:id` | `{ is_active?, label?, max_uses? }` |

---

## 5. 反作弊（G-S1 最小）

| 规则 | 行为 |
|------|------|
| 码不存在 / 格式非法 | validate `valid:false` · register 400 |
| `is_active=false` | 拒绝 |
| `use_count >= max_uses` | 拒绝 |
| referrer 1h 内 register 事件 ≥ 50 | 拒绝 + `growth_fraud_signals` HIGH |
| owner == 新用户 | `referral_self_forbidden` |
| 重复绑码 | `referral_already_bound` |

**未做**：同 IP/设备/钱包聚类 · 积分冻结 UI · Observer 挂钩。

---

## 6. Smoke / Playwright 证据

```bash
# ① 本地（须 API+FE 已起）
bash scripts/dev/smoke-growth-referral-p0-local.sh

# Gate（含单元测试）
bash scripts/check-g-s1-referral-minimum-loop.sh

# Playwright
cd frontend && npx playwright test e2e/g-s1-referral-minimum-loop.spec.ts
```

---

## 7. 124 / 125 状态更新

见 [124](./124-102-Referral-Audit-Report.md) §3 G1 行 · §7 G-S1 行 · [125](./125-Production-Feature-Gap-Matrix.md) §2 Growth 行。

---

## 8. 下一步（须 Owner 授权）

| Sprint | 内容 |
|--------|------|
| **G-S2** | `growth_point_ledger` + Observer（不改订单状态机） |
| **G-S3** | Early Bird 倍率 |
| **G-S4** | `/me/referrals` + KOL 读模型 |
| **G-S5** | Airdrop + Analytics |

---

**维护者：** G-S1 Growth Sprint · 2026-06-07
