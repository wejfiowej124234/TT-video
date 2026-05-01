# TT-9625 · 系统总脊（黄金路径一页）— 从注册到托管

**仓库路径（从根目录找本文件）：** `docs/runbook/TT-9625-golden-path-system-spine.md`  
**还能从哪进：** **[本目录说明 · README](README.md)**（`docs/runbook` 分层：日常 vs 专项）；根 **[README.md](../../README.md) · 文档索引**、**[CONTRIBUTING.md](../../CONTRIBUTING.md) · 必读入口**、**[96-索引](../spec/96-索引-全链路外生产验收分册.md) · Runbook 导航**。

**Version:** 0.1.20  
**Status:** Runbook — **「把整个项目连起来」的单文件入口**（阅读顺序 + **一条用户脊**上的 **Next → `apiUrl` → Axum → 数据/链**）；**不**替代 **[04](../spec/04-后端与API.md) / [14](../spec/14-合约-API-ABI-前后端对齐.md)** 契约正文、**不**替代 **[18](../spec/18-TravelTrust-全系统架构图.md)** 大图、**不**抄写 **96-18** 台账。**不**声称 **§2 五段表 = 全站每一页**（见 **§2.1**）。

**仍按执行顺序落地时：** 以 **[TT-9621](TT-9621-master-order-96-backend-db-chain-frontend.md)** Phase **A→D** 为准；本页解决 **「心智地图从哪一页开始读」**。

---

## 0. 何时打开本页

| 情形 | 建议 |
|------|------|
| 新人 / 久未碰仓库，问「请求从哪进、数据从哪出」 | **先读 §2 表**，再点开链接 |
| 已锁定本轮 scope | **TT-9621 步 0** + **96-18**；本页作 **脊** 对照 |
| 查 **某一 URL** 应对哪些 API | **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** |

---

## 1. 分叉总图（读完本页再走哪）

```text
TT-9625（本页 · 一条 user spine）
  ├→ 每天先干什么 ……………………………… TT-9621
  ├→ 领域 × 分层（谁拥有哪条链）………… TT-9622
  ├→ 全站 URL × API 矩阵 …………………… 96-20
  ├→ 页背后 9～17 规则闭环 ………………… 96-21
  ├→ 八类「闭没闭」速查 …………………… TT-9624
  ├→ **一条路到生产 GO（阶段 0～6）** ……… [TT-9626](TT-9626-zero-to-production-go-single-path.md)
  ├→ **先主脊→全站→生产（段 1～6 勾选）** … [TT-9627](TT-9627-delivery-order-spine-then-full-site.md)
  ├→ **主线/支线拆跑 + 合线闸门** ……… [TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)
  ├→ **页面·弹窗·分权限「是否已全验」读者预期** … [TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)（**93 §8.0**、**96-20** 文首）
  ├→ HTTP / ABI 真源 ……………………… 04 + 14 + frontend/lib/api.ts
  └→ 宏观图 + 模块表 ……………………… 18、18-补充、06、00-总表
```

---

## 2. 黄金路径总表（主脊）

**叙事**：注册（会话）→ 机读环境 **`GET /meta`** → 市场发现 → 创单 → 托管详情；**同一 `order_id`** 贯穿 **订单详情 / `/escrow/:id`**（与 **96-21 · 9** 对读）。

| # | 用户步 | 用户 URL（示例） | Next（入口 / 典型消费方） | `frontend/lib/api.ts` | Axum 聚合模块 | 数据 / 链（口径） |
|---|--------|------------------|---------------------------|------------------------|----------------|-------------------|
| **1** | 注册 / 登录 | `/auth/register`、`/auth/login` | `frontend/app/auth/register/page.tsx`、`frontend/app/auth/login/page.tsx` | `routes.register`、`routes.login`（`/auth/*`） | `crates/api/src/routes/auth.rs` | 会话与用户行；**POST `/auth/*` 须直连 API `BASE`**（见 **`apiUrl` 文内注释**） |
| **2** | 机读环境 | （首屏或业务前）`GET /meta` | 各 feature 内 `apiUrl(routes.meta)`（如市场、guides） | `routes.meta` → `/meta` | `crates/api/src/routes/health_meta.rs` | **`order_messages.chain_off_mounted`** 等；契约 **04 §3.4 · GET /meta** |
| **3** | 市场发现 | `/market` | `frontend/app/market/page.tsx` → `useMarketPage` | `routes.discoverOrders` → `/api/v1/discover/orders`（URL **仍为 discover**；页面主入口 **`/market`**，见 **04**） | `crates/api/src/routes/discover.rs` | 列表投影 / DB；空列表与 **chain_off** 语义须一致 |
| **4** | 新建订单 | `/orders/new` 或市场内下单 | `frontend/app/orders/new/page.tsx`；市场内 `BookGuideModal` 等 | `routes.orders` → **`/api/v1/orders`**（**POST** 创单见 **04**） | `crates/api/src/routes/orders.rs` | 订单行 + 状态初值；里程碑内或含链意图 |
| **5** | 托管详情 | `/escrow/:id` | `frontend/app/escrow/[id]/page.tsx` → `components/escrow/EscrowDetailSection` | `routes.orderById(id)`、`routes.orderChainSyncStatus(id)` 等 | **`orders`**（同域） | **`GET /api/v1/orders/:id`** 与 Escrow UI **同形**；链同步键与 **GET /meta** 机读表同源（见 **`api.ts` 长注释** / **04**） |

**域合并锚（代码）：** `crates/api/src/routes/mod.rs` → **`api_router()`**（`merge` 顺序与 **07 / 04 / 14** 对读）。

### 2.1 主脊之外：自由市场子站、社区、其它域（同样要「跑通」时去哪）

**§2 表**只钉 **「能付钱的主路径」**（会话 → 环境 → 发现 → 创单 → 托管），便于 **第一次**把栈串起来。**不**在下面逐行展开（避免本页变成第二份 **96-20**）：

| 你关心的面 | 典型 URL / 域 | 全站收口去哪 |
|------------|----------------|--------------|
| **自由市场** | **`/market`**（主入口）、**`/market/provider`**、**`/market/acquisition`** 等子站 | **[96-20 §5](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** 按 **URL 行** 对 API；主表 **#3** 的 **`discoverOrders`** 多从 **`/market`** 消费 |
| **社区**（动态、会话、帖子等） | `frontend/app/community/**` 等 | **同上 96-20** + **93 矩阵** 域行 + **[TT-9622](TT-9622-bounded-contexts-layering-and-integration-map.md)** **Community** 行 |
| **治理 / Admin / 钱包页** | 各 `app/governance/*`、`app/admin/*`、`app/me/*` … | **96-20** + **96-17** + **93**；发版前 **须** 进 **[TT-9626](TT-9626-zero-to-production-go-single-path.md)** **阶段 4～5** |

**结论：** **「其它页面、其它功能」** 的 **跑通与证据** = **96-20 矩阵 + 93 + R-002（+ R-003）** + **TT-9626**；**TT-9625** 是 **主脊样条**，不是全站枚举。**日常迭代** 若只想 **按域拆线、少跑主脊全手点**，见 **[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)**（**主线 / 支线**、**93 分批**、**合线** 闸门）。

---

## 3. 已落地竖切 vs 本条「全长」脊

| 范围 | 文档 | 说明 |
|------|------|------|
| **已示例**：meta + guides 目录 | **[TT-9623](TT-9623-vertical-slice-01-guides-catalog.md)** | 证明 **无 mock、真 API、gate 脚本** 的打法 |
| **竖切 02（公开半脊）** | **`scripts/gates/vertical-slice-02-main-spine.sh`** | **①** 机读：**`/health`** + **`/meta`** + **`/meta/build`** + **`GET /api/v1/discover/orders`**；**不**替代 **POST 会话/创单** 与 **托管详情**（须 **E2E/手点**） |
| **竖切 03（/market 公开读面）** | **`scripts/gates/vertical-slice-03-market-hub-public-smoke.sh`** | **①** 机读：**竖切 02** + **`GET /api/v1/guides`**（与 **`useMarketPage`** 同源）；**不**替代 **96-20** 全矩阵 / UI 抽屉 |
| **竖切 04（/community/explore 公开读面）** | **`scripts/gates/vertical-slice-04-community-explore-public-smoke.sh`** | **①** 机读：**`/health`** + **`GET /api/v1/community/feed`** + **`GET …/stats/posts-by-tag`**（与 **`community/explore/page.tsx`** **`getFeed`** 同源）；**不**替代 **96-20** 社区矩阵 / 登录流 |
| **段 2 编排（market+community）** | **`scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh`** | **①** 串 **竖切 03** + **竖切 04**；可选 **`TT9627_SEGMENT2_API_SMOKE`** + **`ci-local-delivery-minimum`** |
| **段 3 · R-002 预链（生成+校验）** | **`scripts/gates/vertical-slice-tt9627-segment3-r002-prereport-chain.sh`** | 委托 **`local-verify-r002-prereport-chain.sh`**；见 **[TT-9627 段 3.1](TT-9627-delivery-order-spine-then-full-site.md)** |
| **段 3 · R-002 校验（已有 report）** | **`scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh`** | 调用 **`validate-regression-report.py`**；**不**生成 **`report.json`**；见 **[R-002](../spec/R-002-回归执行闭环与发布准入.md)**、**[TT-9627 段 3.3](TT-9627-delivery-order-spine-then-full-site.md)** |
| **段 4 · 母表文件在位** | **`scripts/gates/vertical-slice-tt9627-segment4-spec-presence.sh`** | **①**；见 **[TT-9627 段 4.0](TT-9627-delivery-order-spine-then-full-site.md)** |
| **段 5 · 闭环/规则真源在位** | **`scripts/gates/vertical-slice-tt9627-segment5-spec-presence.sh`** | **①**；见 **[TT-9627 段 5.0](TT-9627-delivery-order-spine-then-full-site.md)** |
| **段 6 · 发版 GO 真源在位** | **`scripts/gates/vertical-slice-tt9627-segment6-spec-presence.sh`** | **①**；见 **[TT-9627 段 6.0](TT-9627-delivery-order-spine-then-full-site.md)** |
| **段 4～6 编排** | **`scripts/gates/vertical-slice-tt9627-segments-456-spec-presence.sh`** | **①** 串 **4+5+6**；见 **[TT-9627 · 段 4～6 编排](TT-9627-delivery-order-spine-then-full-site.md#tt-9627-segments-456-orchestration)** |
| **本条脊全长**：注册 → 市场 → 创单 → 托管 | **会话→创单→托管** 仍须 **E2E/手点** 或专 Runbook 收口 | **§2 表** 即 **验收提纲**；公开半脊见上 **竖切 02**；在 **96-18** 勾 **一条 P0** 后可另开 **全长竖切 Runbook**（编号与 **TT-9626** 发版总路线 **区分**） |

**拆线机读闸总表**（竖切 **01**、段 **1** 编排、**`ci-local`** 开关等与上表 **并集**）：**[TT-9628 · §0.0.2a](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-tt9627-gates-index)**。

---

## 4. 阶次

与 **CONTRIBUTING / AGENTS** 一致：**① 本地 → ② 测试网 → ③ 生产**；**禁止**用 **①②** 冒充 **③**。

---

## 5. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-04-30 | 首版：黄金路径总表 + 分叉总图 |
| 0.1.1 | 2026-04-30 | 文首：**仓库相对路径** + **README / CONTRIBUTING / 96-索引** 入口链 |
| 0.1.2 | 2026-04-30 | 文首：**`docs/runbook/README.md`** 分层导航 |
| 0.1.3 | 2026-04-30 | §1 分叉：**[TT-9626](TT-9626-zero-to-production-go-single-path.md)**（到生产 GO） |
| 0.1.4 | 2026-04-30 | **§2.1**：主脊 vs **自由市场子站 / 社区 / 全站**；修正 §3 与 **TT-9626** 命名冲突；**Status** 写明非全站 |
| 0.1.5 | 2026-04-30 | §1 分叉：**[TT-9627](TT-9627-delivery-order-spine-then-full-site.md)**（段式交付总清单） |
| 0.1.6 | 2026-04-30 | **§2.1** 结论段：互指 **[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)**（**主线/支线** 拆跑与 **合线**）。 |
| 0.1.8 | 2026-05-01 | **§3**：增 **竖切 02** 行（**`vertical-slice-02-main-spine.sh`** 公开半脊）；全长脊叙事与 **96-18** 专 Runbook 分工写清。 |
| 0.1.9 | 2026-05-01 | **§3**：**竖切 02** 文案含 **`/meta/build`**（与脚本一致）。 |
| 0.1.10 | 2026-05-01 | **§3**：增 **竖切 03** **`vertical-slice-03-market-hub-public-smoke.sh`**（**/market** 列表读面）。 |
| 0.1.11 | 2026-05-01 | **§3**：增 **竖切 04** **`vertical-slice-04-community-explore-public-smoke.sh`**（**/community/explore**）。 |
| 0.1.12 | 2026-05-01 | **§3**：增 **段 2 编排** **`vertical-slice-tt9627-segment2-hub-public-smoke.sh`**。 |
| 0.1.13 | 2026-05-01 | **§3**：增 **段 3 R-002 校验** **`vertical-slice-tt9627-segment3-r002-validate.sh`**。 |
| 0.1.14 | 2026-05-01 | **§3**：增 **段 3 R-002 预链** **`vertical-slice-tt9627-segment3-r002-prereport-chain.sh`**。 |
| 0.1.15 | 2026-05-01 | **§3**：增 **段 4 母表在位** **`vertical-slice-tt9627-segment4-spec-presence.sh`**。 |
| 0.1.16 | 2026-05-01 | **§3**：增 **段 5 真源在位** **`vertical-slice-tt9627-segment5-spec-presence.sh`**。 |
| 0.1.17 | 2026-05-01 | **§3**：增 **段 6 发版 GO 真源在位** **`vertical-slice-tt9627-segment6-spec-presence.sh`**。 |
| 0.1.18 | 2026-05-01 | **§3**：增 **段 4～6 编排** **`vertical-slice-tt9627-segments-456-spec-presence.sh`**。 |
| 0.1.19 | 2026-05-01 | **§3**：**段 4～6 编排** 外链锚 **`#tt-9627-segments-456-orchestration`**（与 **TT-9627** 对拍）。 |
| 0.1.20 | 2026-05-01 | **§3**：表后互指 **TT-9628 §0.0.2a** 机读闸总表 **`#tt-9628-tt9627-gates-index`**（与竖切 **01** / 段 **1** 编排 **并集**）。 |

---

**文档结束**
