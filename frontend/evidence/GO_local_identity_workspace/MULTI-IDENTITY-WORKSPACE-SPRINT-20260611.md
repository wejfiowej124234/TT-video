# Multi-Identity Workspace Completion Sprint（2026-06-11 · ① 启动）

> **2026-06-11 SSOT CONFIRMED：** [WORKSPACE-DEFINITION-SSOT.v1.md](./WORKSPACE-DEFINITION-SSOT.v1.md) **ACTIVE** — Hub active → Workspace 优先；Steward → `/governance?view=region`；Acquisition 子站即工作台 `/market/acquisition`；**不**新增 `/acquisition` · `/steward` operator 路由。

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

**产品规范：** 一个 Account + 多 Identity Slots + 多 Workspace

**下一阶段（L3 ① 已实施 · MOIS 待签）：** [LOCAL-MULTI-IDENTITY-CLOSURE.md](./LOCAL-MULTI-IDENTITY-CLOSURE.md) · [multi-operator-identity-sprint.v1.md](../../../docs/spec/artifacts/multi-operator-identity-sprint.v1.md)

**导航分层（LOCKED）：** Account → Identity Hub → **Workspace** → Order Bus → Settings

**诚实边界：** 本 Sprint **① 启动** ≠ ② staging 全矩阵 GO ≠ ③ Production GO；顶栏 **Workspace Switcher 仍 OUT（P3）**。

---

## 五身份审计矩阵

| 身份 | 工作台 | 待办/收件箱 | 订单中心 | 经营数据 | 设置 | 缺口 | Sprint 优先级 |
|------|--------|-------------|----------|----------|------|------|---------------|
| **Traveler** | 无（`/community` + `/orders`） | 社区抽屉链 | `/orders` | 社区资料统计 | `/me/settings/*` | Low | P4 命名统一 |
| **Guide** | **`/guide`** ✅ L5 已闭 | Inbox ✅ | Escrow 走廊 | Stats + 本周期 | guide/settings | Low | 维护 |
| **Merchant** | **`/provider`** ✅ | Inbox ✅ | `/orders?business_line=merchant_service` | **`GET /me` merchant stats** | merchant/settings | Low | 维护 |
| **Region Steward** | **`/governance?view=region`** ✅ | 治理页 | N/A | **`GET /me` steward** + pool/rewards | steward/settings | Low | 维护 |
| **Acquisition** | **`/market/acquisition`** ✅ | Studio/子站 | **`business_line=acquisition`** | subsite stats + trust | acquisition/settings | Low | 维护 |

**共用订单总线：** `GET /orders` → `/escrow/[id]` · 客户端按 `business_line` 分轨（`workspaceOrderBus.ts`）

---

## Sprint 分波（①）

| 波次 | 范围 | 状态 |
|------|------|------|
| **W0** | 审计 SSOT + `workspaceIdentityModel` + `workspaceOrderBus` | ✅ |
| **W1** | Merchant `/provider` 工作台 MVP（inbox + stats + nav） | ✅ |
| **W2** | Hub active CTA → Workspace；Settings/QuickLinks 工作台行 | ✅ |
| **W3** | Steward/Acquisition IA 对齐 SSOT（无新 operator 路由） | ✅ |
| **W4** | 后端 stats · `business_line` · 订单 role 过滤 · 前端 stats 接线 | ✅ 本提交 |
| **W5** | Build + Smoke + P2HA + 人工验收 → ② 同步 | 🔄 Owner 跑闸 |

---

## W4 数据层摘要（① · ACTIVE）

| 能力 | 后端 | 前端 |
|------|------|------|
| 列表 `business_line` | `order_business_line_for_chain_off` · `order_list_item_json` | `OrderListItem.business_line` |
| 订单过滤 | `GET /orders?business_line=` | `getOrders({ business_line })` · Guide/Merchant inbox |
| Provider stats | `merchant_workspace_stats` on `GET /me` | `/provider` stats 卡 |
| Acquisition stats | `acquisition_workspace_stats` + PG `listings_24h` | `AcquisitionSubsiteStatsPanel` |
| Steward stats | `steward_workspace_stats` | governance pool/rewards（既有） |
| `/me` ≡ `/me/stats` | `get_me_stats` → `get_me_impl` | 同源 |

**真源：** `crates/api/src/chain_off/workspace_stats.rs` · `frontend/lib/workspace/workspaceStatsModel.ts`

---

## ① 机读验收

```bash
cd frontend && npm run test -- workspaceStatsModel multiIdentityWorkspaceSprint workspaceIdentityModel guideWorkbenchL5 meIdentitiesUiFreeze --run
cargo test -p traveltrust-api workspace_stats::
bash scripts/dev/smoke-provider-onboarding-local.sh
bash scripts/dev/smoke-acquisition-pd009-local.sh
# W5：Owner 自留 exit 0
# bash scripts/dev/dev-preflight.sh
# bash scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh
```

---

## 导航真源

| 入口 | 文件 |
|------|------|
| Identity Hub CTA | `app/me/identities/page.tsx` · `meIdentitiesCoreCardModel.ts` |
| Settings Hub 行 | `meSettingsNavModel.ts`（`showGuideHub` / `showMerchantHub` / `showAcquisitionHub` / `showStewardHub`） |
| 社区 QuickLinks | `MeQuickLinksSection.tsx` |
| 顶栏订单 | `headerUserMenuNavModel.ts` → `/orders`（全角色共用） |

**Hub Active CTA（CONFIRMED）：**

| 身份 | Workspace |
|------|-----------|
| Guide | `/guide` |
| Merchant | `/provider` |
| Steward | `/governance?view=region` |
| Acquisition | `/market/acquisition` |

---

## OUT（仍有效）

- ~~顶栏 HeaderIdentitySwitcher（P3 单独立项）~~ → **MOIS-001 升格 P0**（见 [multi-operator-identity-sprint.v1.md](../../../docs/spec/artifacts/multi-operator-identity-sprint.v1.md) · **待签字**）
- 独立 `/acquisition` · `/steward` operator 工作台（延后拆线）
- ~~第五 `users.role` / 新 identity slot 类型~~ → **MOIS 废弃 role 经营真源**（**待 ADR**）
- 用 ① 窄切片冒充 ② staging 全矩阵 GO

---

**Maintainer：** Sebastian Ward · ① 本地 Sprint 主持
