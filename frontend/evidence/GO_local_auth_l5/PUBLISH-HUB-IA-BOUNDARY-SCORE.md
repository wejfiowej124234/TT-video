# 发布中心 · 订单 · 头像下拉 · IA 边界评分（① 本地 · ACTIVE / FROZEN · 2026-06-13）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

| 项 | 结论 |
|----|------|
| **有没有 IA 边界收口** | **是（① · ACTIVE · 100/100）** |
| **有没有 IA 边界冻结** | **是（2026-06-13）** |
| **① 是否允许新增 Publish Hub 功能** | **否** — 仅 bugfix · 数据链 · i18n · a11y · 门闸 |
| **② 是否可继续推进** | **是** — PH-B-1～B-10 测试网验证项 |

---

## 评分表

| 维度 | 分 | 结论 |
|------|-----|------|
| 订单 vs 发布 **文档/代码 SSOT** | **100** | 三分法 + 五轨功能 · WORKSPACE + PUBLISH-HUB-L5-DESIGN |
| **用户可见 copy 对称性** | **100** | `/me/publish` ↔ `/orders` 互指 · 副标题/scope note |
| **下拉菜单 L5 分区** | **100** | 账户 / 我的 / 工具 · 社区帖不在发布中心 |
| **功能重复控制** | **100** | 社区轨移除 · QuickLinks compact · 工作台互指 |
| **文档一致 / 机读闸** | **100** | 五轨 SSOT 扫净 · smoke 窄集 · contract 绿 |
| **②③ 诚实边界** | **100** | B-1 api 真源 · B-2 switcher 全量 · staging CRUD 留 ② |

## **综合：100 / 100（① L5 IA BOUNDARY ACTIVE）**

---

## 冻结结论（ACTIVE · FROZEN · 2026-06-13）

**机读 marker：** `publish-hub-ia-boundary-20260613` · `publishHubIaBoundaryFreeze.contract.test.ts`

| 冻结范围 | SSOT | 允许（①） | 禁止（①） |
|----------|------|-----------|-----------|
| **`/me/publish` 页 IA** | `PublishHubPageMain.tsx` · `publishHubModel.ts` | bugfix · 数据链 · i18n · a11y · 门闸 | 新增第六轨 · 社区帖回流 · 结构/layout token 回流 |
| **`/orders` 边界 copy** | `OrdersListPageHeader.tsx` · `orders_list_publish_hub_*` | 同上 · copy 微调须 i18n 同批 | 删除发布中心互指 · 改订单/发布三分法叙事 |
| **顶栏菜单命名** | `headerUserMenuNavModel.ts` · [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md) | i18n · href 契约对齐 | **发布中心** 与 **我的帖子** 对调/合并 · 恢复社区帖进发布中心 |
| **商家工作台互链** | `MerchantWorkbenchMarketExposureCard.tsx` → `/me/publish?filter=merchant` | 数据链 · 门闸 copy | 删除互链 · 改 merchant 轨入口叙事 |

**data-tt 探针：**

- `data-tt-publish-hub-ia-boundary-frozen="1"`（`/me/publish`）
- `data-tt-orders-ia-boundary-frozen="1"`（`/orders` 列表壳）
- `data-tt-ui-frozen-ia-boundary="publish-hub-ia-boundary-20260613"`
- `data-tt-orders-list-publish-hub-link="1"`
- `data-tt-provider-workbench-publish-hub-link="1"`

**维护期纪律：** ① **不再在 ① 新增 Publish Hub 功能**；新能力（身份 switcher 全量 · staging CRUD · api 真源聚合等）**仅**在 **② PH-B-*** 清单推进。

**诚实边界：** ① IA 100 / smoke 绿 **≠** ② staging GO **≠** ③ Production GO。

---

## 机读验收

```bash
bash scripts/dev/smoke-publish-hub-local.sh
```

末行：`TT_PUBLISH_HUB_SMOKE: OK … ia-boundary`

**窄集 contract：**

```bash
cd frontend && npm run test -- publishHubIaBoundaryFreeze publishHubUiFreeze ordersListL5 headerUserMenuNavModel --run
```

---

## 互指

| 读者 | 文档 |
|------|------|
| 发布中心 L5 设计 | [PUBLISH-HUB-L5-DESIGN.md](./PUBLISH-HUB-L5-DESIGN.md) |
| 阶段任务（② only 新功能） | [PUBLISH-HUB-PHASE-TASK-LIST.md](./PUBLISH-HUB-PHASE-TASK-LIST.md) |
| 顶栏 utility | [HEADER-UTILITY-MENU-L5-FREEZE.md](./HEADER-UTILITY-MENU-L5-FREEZE.md) |
| 账户命名 P3 | [ACCOUNT-NAV-NAMING-P3.md](./ACCOUNT-NAV-NAMING-P3.md) |
| 商家工作台 | [PROVIDER-WORKBENCH-L5-FREEZE.md](../GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md) |
| 企业 UX Wave 0 | [ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md) |
| Agent | `AGENTS.md` |

**Maintainer：** Sebastian Ward（塞巴斯蒂安·沃德）· ① 本地

**一句话结论：** **① IA 边界 100 · 已冻结**；**② Wave 1 Sprint 已编任务卡**（[ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md)）· 须 **G-1/G-2** 后实施 **PH-B-1～B-10**。

---

## ② Wave 1 · 企业 UX 跃迁（Prepared · Not Started）

| Sprint | 关键交付 | PH-B | 状态 |
|--------|----------|------|------|
| **1A** | ADR + api publish-summary | B-1 | ❌ backlog |
| **1B** | 顶栏 Context Switcher ↔ 发布中心 | B-2 | ❌ backlog |
| **1C** | staging CRUD + PW | B-3 · B-7 | ❌ backlog |
| **1D** | `TT_PUBLISH_HUB_STAGING: OK` 证据 | B-10 | ❌ backlog |

**机读：** `accountOperatingModelUxWave1Model.ts` · `accountOperatingModelUxWave1.contract.test.ts`
