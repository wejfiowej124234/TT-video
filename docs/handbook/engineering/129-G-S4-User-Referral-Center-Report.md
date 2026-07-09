# 129 · G-S4 User Referral Center — Sprint Report

> **Sprint**：G-S4（102 Growth · `/me/referrals`）  
> **基准**：[128-G-S3](./128-G-S3-EarlyBird-Multiplier-Report.md) · [127-G-S2](./127-G-S2-Growth-Ledger-Observer-Report.md) · [126-G-S1](./126-G-S1-Referral-Minimum-Loop-Report.md) · [124](./124-102-Referral-Audit-Report.md) · [125](./125-Production-Feature-Gap-Matrix.md)  
> **日期**：2026-06-07  
> **纪律**：**不触碰** PI3 · Catalog Freeze · 报价主链 · 支付 · 链上 GOV · Airdrop · KOL · Analytics  
> **总裁定**：**G-S4 GO（用户推荐中心只读）· G-S5+ 仍 HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **G-S4 范围** | `/me/referrals` · `GET /api/v1/me/referrals` · 复制分享 · 隐私边界 |
| **积分性质** | **链下** growth_points · **无** GOV / 空投估算 |
| **未做** | KOL 增强视图 · GMV 漏斗 · 预计空投 GOV · Admin fraud UI |
| **124 `/me/referrals`** | **GO（G-S4 最小）** |

---

## 2. 交付物

| 类型 | 路径 |
|------|------|
| **Report** | 本文 |
| **DB** | `crates/api/src/db/me_referrals.rs` |
| **API** | `GET /api/v1/me/referrals` · `routes/me_referrals.rs` |
| **FE** | `/me/referrals` · settings nav 入口 |
| **Gate** | `scripts/check-g-s4-user-referral-center.sh` |
| **Smoke** | `scripts/dev/smoke-growth-user-referral-center-p0-local.sh` |
| **Playwright** | `frontend/e2e/g-s4-user-referral-center.spec.ts` |

---

## 3. API 契约（只读 · 须登录）

**GET** `/api/v1/me/referrals?events_limit=10&ledger_limit=10`

```json
{
  "status": "ok",
  "referrals": {
    "referral_code": "TT-ABC123",
    "referral_link_path": "/auth/register?ref=TT-ABC123",
    "binding": { "is_referred": false, "referred_at": null },
    "stats": {
      "referrals_total": 0,
      "referrals_register": 0,
      "growth_points": 0,
      "growth_fraud_status": "normal"
    },
    "early_bird": {
      "registration_rank": 800,
      "stage_number": 1,
      "multiplier": 3.0
    },
    "recent_referral_events": [],
    "recent_ledger": []
  }
}
```

- 首次访问 **lazy** 调用 `ensure_user_referral_code`
- **401** 未登录 · **503** growth DB 不可用

---

## 4. 隐私边界

| 规则 | 实现 |
|------|------|
| 仅本人数据 | `extract_user_with_session_check` |
| 不暴露被邀请人 PII | `recent_referral_events` 无 `referred_user_id` / email |
| 不暴露推荐人身份 | `binding` 仅 `is_referred` + `referred_at` |
| 无 KOL/GMV | 响应不含 orders 投影 |
| 无空投估算 | 不含 `airdrop_*` / GOV |

---

## 5. 前端

- **路由**：`/me/referrals`（非五主 · L5 设置族壳）
- **能力**：展示码/链接 · 复制到剪贴板 · 统计/早鸟/事件/ledger 摘要
- **入口**：`/me/settings` → 旅行分组「推荐与积分」

---

## 6. 验证

```bash
bash scripts/check-g-s4-user-referral-center.sh
bash scripts/dev/smoke-growth-user-referral-center-p0-local.sh
cd frontend && npx playwright test e2e/g-s4-user-referral-center.spec.ts
cargo test -p traveltrust-api me_referrals
```

---

## 7. 124 / 125

见 [124](./124-102-Referral-Audit-Report.md) `/me/referrals` 行 · [125](./125-Production-Feature-Gap-Matrix.md) Growth 完成度。

---

## 8. 下一步（G-S5+）

- Admin fraud 子模块
- Airdrop 链下快照（仍无链上 GOV）
- KOL 读模型（若产品单独立项）

---

**维护者：** G-S4 Growth Sprint · 2026-06-07
