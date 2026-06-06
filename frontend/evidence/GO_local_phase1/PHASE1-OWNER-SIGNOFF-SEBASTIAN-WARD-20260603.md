# Phase ① · 维护者签字证据（Sebastian Ward · 塞巴斯蒂安·沃德 · 2026-06-03）

**单人维护者索引：** [SOLO-MAINTAINER-SIGNATURE-INDEX.md](./SOLO-MAINTAINER-SIGNATURE-INDEX.md)

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；**本文件仅 ①**）

**诚实边界：** 本签字 **≠** ② staging 全矩阵 GO **≠** ③ Production GO **≠** 法务/监管合规审查结论。

---

## 签字栏

| 角色 | 签字 | 日期 | 范围 |
|------|------|------|------|
| **Product / Owner** | **Sebastian Ward（塞巴斯蒂安·沃德）** | 2026-06-03 | Phase ① 本地封版维护项收口（五主 UI 冻结边界内数据链、①.5 identity、Web3 四页 ① 清单） |
| **Engineering** | **Sebastian Ward（塞巴斯蒂安·沃德）** | 2026-06-03 | 代码 + 机读绿集 + `cargo test` / vitest ① 证据（见下表） |
| **Compliance** | **Sebastian Ward（塞巴斯蒂安·沃德）**（**Owner 自证 · 非法律顾问**） | 2026-06-03 | ① 工程台账与 PD 锁定对拍；**不**构成 KYC/AML/证券等监管 sign-off |

---

## ① 本轮工程收口（代码真源）

| 项 | 状态 | 证据 |
|----|------|------|
| **`GET /api/v1/me/wallets`** · **`GET /api/v1/me/role-applications`** | ✅ | `crates/api/src/routes/me.rs` · `chain_off/me.rs` · `db/role_identity/mod.rs` |
| **`PUT /api/v1/me`** → PG **`users`** + **`wallets`** 主钱包双写 | ✅ | `put_me_impl` · `sync_primary_wallet_dual_write` |
| **PD-003 注册 role** · provider/region_steward → **`traveler`** | ✅ | `chain_off/auth.rs` · `registration_role_stored` |
| **注册/PUT 主钱包 → `wallets` 双写** | ✅ | `auth.rs` register · `put_me_impl` |
| **`/me/identities` 读 `role_applications` SSOT** | ✅ | `useMeIdentitiesCoreCardSignals` · `getMeRoleApplications` |
| **子站 L-008** · PG 行 **`data_origin: postgres_catalog`** | ✅ | `marketCatalogAdapter.ts` |
| **子站 L-005** · **`meta.has_more` + 摘要文案** | ✅ | `market_subsite.rs` · `MarketSubsiteFilterBar` |
| **①.5 S1–S4 IT** | ✅（须 `DATABASE_URL` 跑满） | `bash scripts/dev/run-phase15-s1-s4-it-green.sh` |
| **L-001 / L-002 / L-004** · ① **诚实 mock** 机读锚点 | ✅ | [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](../GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md) · `web3PagesPhase1DataHonesty.contract.test.ts` |
| **① 工程封版声明** | ✅ | [`PHASE1-LOCAL-ENGINEERING-CLOSED-20260603.md`](./PHASE1-LOCAL-ENGINEERING-CLOSED-20260603.md) |

---

## 仍留 ② / ③（不得用本签字冒充）

| 域 | 应落阶 |
|----|--------|
| **真** USDC 解锁支付 / **真** AI 行程 / **链上** acquisition bond | **② / ③**（① 仅诚实 mock UI） |
| staging GO / Stripe 真 webhook / 测试网部署 | **②** |
| Production GO · 主网真链 · 全站 93 矩阵 | **③** |

---

## 互指

- [`identity-unified-model.v1.md`](../../../docs/spec/artifacts/identity-unified-model.v1.md) §7.2
- [`PHASE1-ENTERPRISE-CLOSURE-AUDIT.md`](../../../docs/runbook/PHASE1-ENTERPRISE-CLOSURE-AUDIT.md)
- [`GO_local_phase1/README.md`](./README.md)

**记录人：** Sebastian Ward（塞巴斯蒂安·沃德）· 单人独立开发 · 仓库 Owner 自检签字
