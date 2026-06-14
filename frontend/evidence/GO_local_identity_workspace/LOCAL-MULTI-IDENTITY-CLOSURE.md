# L3 · Local Multi-Identity Closure（① 本地）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

**状态：** **ACTIVE**（2026-06-11 · L3 实施）

**验收账号（唯一）：** `multi-demo@test.com` / `Test123!`

**诚实边界：** ① L3 闭环 **≠** ② staging GO **≠** MOIS 全量迁移（见 [multi-operator-identity-sprint.v1.md](../../../docs/spec/artifacts/multi-operator-identity-sprint.v1.md)）

---

## 目标

同一 Account 在 **① 本地** 完成四轨 **写权限 + Workspace 闭环**（数据模型不变）：

| 轨 | 查看 | 设置 | 创建/提交 | 订单/治理 |
|----|------|------|-----------|-----------|
| Guide | Hub `/me/identities` | `PATCH /me/guide-profile` | 向导资料 active | `/guide` · trip 订单 |
| Merchant | 同上 | `PATCH /me/merchant-profile` | `POST …/market/provider/listings` | `/provider` inbox |
| Region Steward | 同上 | `PATCH /me/region-steward-profile` | 资料 active | `GET …/governance/protocol-reference` |
| Acquisition | 同上 | `PATCH /me/acquisition-profile` | `POST …/market/acquisition/listings` | Order Bus · acquisition 轨 |

---

## 代码真源（L3）

| 能力 | 路径 |
|------|------|
| 槽位 RBAC | `crates/api/src/chain_off/slot_rbac.rs` |
| 槽位派生 | `crates/api/src/chain_off/identity_slots.rs` |
| 商家市场门闸 | `crates/api/src/routes/market_merchant_gate.rs` |
| 身份资料门闸 | `crates/api/src/chain_off/identity_slot_profiles.rs` |
| `GET /me` 多槽 stats | `crates/api/src/chain_off/me.rs` |
| 种子账号 | `crates/api/src/chain_off/auth.rs` · `seed_multi_identity_demo_account` |

**规则：** 写路径认 **merchant/steward/guide 槽 active**（申请 approved + guides active），**不**再要求 `users.role` 互斥覆盖。

---

## ① 机读验收

```bash
# 前提：docker postgres · SEED_TEST_ACCOUNTS=1 · API :8080
# 推荐：scripts\start-api-with-seed.bat（Step 6c + 6p 默认跑）
cargo test -p traveltrust-api slot_rbac::
bash scripts/dev/smoke-multi-identity-closure-local.sh
```

**期望末行：** `smoke-multi-identity-closure: ALL PASS`

---

## 手测路径（浏览器 · :3012）

1. 登录 `multi-demo@test.com`
2. `/me/identities` — 五槽：guide / merchant / region_steward **active**
3. 各 Hub CTA → `/guide` · `/provider` · `/governance?view=region` · `/market/acquisition`
4. Settings「身份资料」— 四轨 settings 可保存

---

## 与 MOIS 关系

| L3（本文） | MOIS-001 |
|------------|----------|
| 不改 schema | `operator_slots` 表 |
| `users.role` 仍存在（guide 主 RBAC） | 废弃经营真源 |
| 槽位 + 申请单 SSOT | + Workspace Context Header |

**L3 DONE 后可开 MOIS M0 签字，不跳阶上 ②。**

---

**Maintainer：** Sebastian Ward · ① 本地
