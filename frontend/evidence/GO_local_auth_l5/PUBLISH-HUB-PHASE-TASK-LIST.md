# 发布中心 `/me/publish` · 阶段任务清单（① L5 收口 + ② 测试网）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；**禁止跳阶**）

**设计 SSOT（FROZEN）：** [PUBLISH-HUB-L5-DESIGN.md](./PUBLISH-HUB-L5-DESIGN.md)

**代码 SSOT：** `frontend/app/me/publish/` · `frontend/lib/me/publishHub*.ts` · `frontend/components/me/publish/`

**机读矩阵：** `frontend/lib/me/publishHubPhaseAModel.ts` · `frontend/lib/me/publishHubPhaseBModel.ts`

**诚实边界：** ① 五轨 MVP + 机读绿 **≠** ② staging 全矩阵 GO **≠** ③ Production GO。

---

## 总表

| 项 | 结论 |
|----|------|
| **① 有没有功能收口（五轨 MVP）** | **是**（PH-A-1～A-16 · ACTIVE · 2026-06-13） |
| **① 有没有 UI 冻结** | **是**（`data-tt-publish-hub-ui-frozen="1"` · 仅数据链/i18n/a11y/轨内容） |
| **① 有没有 L5 级 ACTIVE 收口** | **是（PH-A-9～A-16 · ACTIVE · 2026-06-12～13）** |
| **① 有没有 IA 边界冻结** | **是（100/100 · [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md) · 2026-06-13）** |
| **① 有没有 UX Wave 0 企业优化** | **是（100/100 · [ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md)）** |
| **① 有没有 Wave 1 Context Spine 代码收口** | **是（W1-A/B/L · [ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md) · 2026-06-12）** |
| **① 是否允许新增 Publish Hub 功能** | **否** — 仅 bugfix · 数据链 · i18n · a11y · 门闸 |
| **② 有没有收口** | **否 · Not Started** — 须 **G-1/G-2** + 下表 **PH-B-*** |
| **③ 有没有收口** | **否** — 见 [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) · [go-live-checklist](../../../docs/go-live-checklist.md) |

---

## ① 第一阶段 · 本地 · L5 级要求

**定义：** ① **L5 级 ACTIVE 收口** = 五轨 inventory **已落地** + **IA 边界 100** + **`smoke-publish-hub-local.sh` exit 0** + **ACTIVE 声明**。

### 1.1 L5 十维达标线（① · 全页 `/me/publish`）

| # | 维度 | L5 达标线 | PH-A 对应 | 状态 |
|---|------|-----------|-----------|------|
| 1 | 业务逻辑 | 五轨 inventory **同源 API/BFF**；不复制工作台状态机 | A-3～A-6 · A-15 | ✅ 完成 |
| 2 | IA | 单一入口 `/me/publish`；订单/帖子/发布中心 **三分** | A-1 · A-2 | ✅ 完成 |
| 3 | UI L5 | Auth L5 壳 · `publishHubL5` token · 统一 `PublishHubItemCard` | A-1 · A-8 | ✅ 完成 |
| 4 | UX | 未登录/未开通/空态/重试 · 汇总条 · 「全部」智能隐藏 | A-4 · A-7 | ✅ 完成 |
| 5 | i18n | `publish_hub_*` · nav 键 zh/en · `test:i18n:ci` | A-2～A-8 | ✅ 完成 |
| 6 | a11y | tablist · ≥44px CTA · 卡片 `alt` · 焦点环 | A-11 | ✅ 完成 |
| 7 | 测试 | contract + model test + smoke 末行 `TT_PUBLISH_HUB_SMOKE` | A-7 · A-8 | ✅ 完成 |
| 8 | 文档 | 设计 FROZEN · README · **本文任务清单** | 本文 | ✅ 完成 |
| 9 | 安全 | listing/帖子/订单 **仅 owner session** | A-3～A-6 | ✅ 完成 |
| 10 | 阶段诚实 | ① ACTIVE **≠** ② GO；无假完成叙事 | 全文 | ✅ 完成 |

**① L5 满分附加（非十维硬闸 · 产品抛光）：**

| 项 | 说明 | 状态 |
|----|------|------|
| 卡片 media-rich | listing `cover` 字段（API 有则接）· 社区帖单条深链 | ⚠️ 社区深链 ✅ · cover **②** |
| 段级 loading/error | `layout/loading.tsx` · `error.tsx` 与 Auth L5 同族复核 | ✅ **A-11** |
| Playwright 目视 | `/me/publish` 登录态五轨壳 + 筛选切换 | ✅ **A-10** |
| 企业审计机读 | `publishHubL5FullClosure` · 十维表机读对拍 | ✅ **A-9** |

---

### 1.2 ① 已完成（PH-A-1～A-8 · ACTIVE）

| ID | 交付项 | 状态 | 验收 |
|----|--------|------|------|
| **PH-A-1** | 路由 `/me/publish` + L5 壳 + 五轨筛选 | ✅ 完成 | `publishHubPage.contract` · `publishHubUiFreeze` |
| **PH-A-2** | 顶栏 **发布中心** + zh **我的帖子** + 商家轨 MVP | ✅ 完成 | `headerUserMenuNavModel` · `accountNavNamingP3` |
| **PH-A-3** | 收购轨 + `GET /me/acquisition-listings` + archive/delete | ✅ 完成 | `smoke-acquisition-pd009-local.sh` |
| **PH-A-4** | 行程轨 + 汇总条 + 「全部」隐藏空占位 | ✅ 完成 | `publishHubPage` · `publishHubUiFreeze` |
| **PH-A-5** | 治理轨 `?mine=1` + Hub/设置互指 | ✅ 完成 | `meSettingsL5` · `meIdentitiesPage` |
| **PH-A-6** | 向导轨 + 社区 preview | ✅ 完成 | `publishHubGuideModel` |
| **PH-A-7** | `smoke-publish-hub-local.sh` | ✅ 完成 | `TT_PUBLISH_HUB_SMOKE: OK` |
| **PH-A-8** | 统一 `PublishHubItem` 横向卡片 | ✅ 完成 | `publishHubItemModel` |

**① 当前绿集（窄 · 已可跑）：**

```bash
bash scripts/dev/smoke-publish-hub-local.sh
# 或
cd frontend && npm run test:i18n:ci && npm run test -- publishHubPage publishHubUiFreeze publishHubGuideModel publishHubItemModel accountNavNamingP3 headerUserMenuNavModel meSettingsL5 meIdentitiesPage --run
```

---

### 1.3 ① L5 收口 · 未完成（须在本阶段闭合）

| ID | 清单项 | 状态 | L5 维度 | 验收 / 未完成应在哪阶 |
|----|--------|------|---------|------------------------|
| **PH-A-9** | **L5 十维企业审计** + `publishHubL5FullClosure.contract.test.ts` 机读对拍本文 §1.1 | ✅ 完成 · 已冻结 | 7 · 8 · 10 | — |
| **PH-A-10** | Playwright **`e2e/publish-hub-l5.spec.ts`**（登录 · 筛选 · 五轨 `data-tt` 探针） | ✅ 完成 | 4 · 7 | — |
| **PH-A-15** | **`GET /me/publish-summary` BFF** + 前端 summary SSOT | ✅ 完成 | `publishHubServerSummaryModel` | — |
| **PH-A-16** | **订单↔发布中心 IA 边界** + `?identity=` 默认筛选 | ✅ 完成 | `ordersListL5` · `publishHubIdentityDefaultFilter` | — |
| **PH-A-11** | **a11y + 段级态**：loading/error 壳 · tab 键盘 · 卡片列表 SR | ✅ 完成 | 6 · 4 | — |
| **PH-A-12** | **卡片抛光**：社区 preview **按 post id 深链** · listing cover（API 无字段留 ②） | ✅ 完成 | 3 · 4 | cover **②** |
| **PH-A-13** | **① ACTIVE 声明**：`PUBLISH-HUB-PHASE1-CLOSURE.md` + `publish-hub-l5-local-gate.v1.json` | ✅ 完成 · ACTIVE | 8 · 10 | — |
| **PH-A-14** | 纳入 **`record-go-local-phase1-acceptance-log.sh`** 旁证（可选 · 与 G-0 同批） | ❌ 未完成 | 10 | ① |

**① L5 收口绿集（目标 · PH-A-9～A-13 完成后）：**

```bash
bash scripts/dev/smoke-publish-hub-local.sh
PLAYWRIGHT_PUBLISH_HUB=1 bash scripts/dev/smoke-publish-hub-local.sh   # A-10
cd frontend && npm run test -- publishHubL5FullClosure publishHubUiFreeze publishHubPage publishHubItemModel publishHubGuideModel --run   # A-9
```

**一句话（①）：** 五轨 **MVP + IA 边界 100 已冻结**（PH-A-9～A-16 · PH-IA-FREEZE）· **Wave1 Context Spine 代码已闭**（§1.4）· 可选 **A-14** G-0 旁证 · **不再在 ① 新增 Publish Hub 功能**。

---

### 1.4 ① Wave 1 · Context Spine 本地收口（W1-* · ACTIVE · 2026-06-12）

**SSOT：** [ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md) · `accountOperatingModelUxWave1Model.ts`

| # | ID | 清单项 | 状态 | 未完成应在哪阶 |
|---|-----|--------|------|----------------|
| 1 | W1-A1～A4 | ADR · context · api publish-summary · BFF upstream | ✅ 完成 | ② PH-B-1 staging 对拍 |
| 2 | W1-B1～B4 | switcher · 三向同步 · workbench · spine 行 | ✅ 完成 · UI 例外已文档化 | ② PW E1–E6 |
| 3 | W1-L1 | `smoke-publish-hub-local.sh` + Wave1 contract | ✅ 完成 | — |

```bash
bash scripts/dev/smoke-publish-hub-local.sh
cargo test -p traveltrust-api publish_summary
```

**诚实边界：** ① Wave1 代码 closure **≠** ② `TT_PUBLISH_HUB_STAGING: OK` **≠** ③ Production GO。

---

## ① IA 边界冻结（PH-IA-FREEZE · ACTIVE · 2026-06-13）

**SSOT：** [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md) · `publishHubIaBoundaryFreezeModel.ts`

| 冻结面 | 代码 SSOT | ① 允许 | ① 禁止 |
|--------|-----------|--------|--------|
| `/me/publish` | `PublishHubPageMain.tsx` | bugfix · 数据链 · i18n · a11y | 新增轨/社区回流 · layout 回流 |
| `/orders` 边界 copy | `OrdersListPageHeader.tsx` | 同上 | 删发布中心互指 |
| 顶栏命名 | `headerUserMenuNavModel.ts` | i18n · href 契约 | 发布中心↔我的帖子 对调/合并 |
| 商家互链 | `MerchantWorkbenchMarketExposureCard.tsx` | 门闸 copy | 删 `/me/publish?filter=merchant` |

**② 唯一合法新功能面：** 下表 **PH-B-1～B-10** + **[ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md)**（须 **G-1/G-2** 后开工）。

---

## ② 第二阶段 · 测试网 · 任务清单

**入口闸：** [PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)（**G-1/G-2 清零前禁止实施或 GO 宣称**）

| ID | 清单项 | 状态 | 依赖 | 验收 | W1 对拍 |
|----|--------|------|------|------|---------|
| **PH-B-1** | **traveltrust-api** `GET /me/publish-summary` 与 BFF 同形 **staging 对拍** | ❌ 未完成 | ② · G-2 | `smoke-publish-hub-staging.sh` | ① W1-A3/A4 代码 ✅ · **② 验收** |
| **PH-B-2** | 顶栏 **Workspace Context** ↔ 发布中心默认筛选轨 **staging E2E** | ❌ 未完成 | ② · G-1/G-2 | E2E + `headerUserMenuNavModel` | ① W1-B1～B4 代码 ✅ · **② 验收** |
| **PH-B-3** | **staging 五轨功能 CRUD 回归** | ❌ 未完成 | staging DB · 测试账号 | `smoke-publish-hub-staging.sh` | **W1-C1** |
| **PH-B-4** | **`GET /governance/proposals?mine=1`** 与 **Governor 投影** staging 对拍（非 MVP 空列表） | ❌ 未完成 | `GOVERNOR_ADDRESS` · indexer | 与治理 L5 .closure 同批 | **W1-C4** |
| **PH-B-5** | 收购/商家 listing **staging 下架** 与 `/market`  discover 一致性 | ❌ 未完成 | PD-009 ② SLA | acquisition smoke staging 扩展 | **W1-C2** |
| **PH-B-6** | 社区帖 **`/community/me/posts`** 跨设备与 API 一致（F-020 SLA） | ❌ 未完成 | ② 社区同步 | `communityMe` staging gate | — |
| **PH-B-7** | **`/me/publish` Playwright staging**（非 localhost mock） | ❌ 未完成 | B-3 | PW + 持久 host | **W1-C3** |
| **PH-B-8** | **ISS-007 / 93 路由矩阵** staging `release_gate=GO`（**非**窄切片 PARTIAL_GO） | ❌ 未完成 | G-1/G-2 | `evidence/GO_local_r002_verify` | — |
| **PH-B-9** | Stripe test · 测试网 webhook · 与发布中心 **无直接写链** 边界复核 | ❌ 未完成 | Phase ② 总闸 | PHASE2 runbook | — |
| **PH-B-10** | **文档**：设计 §6.2 行改 **ACTIVE** · ② 证据目录 `GO_phase2_*` | ❌ 未完成 | B-1～B-3 | 末行 `TT_PUBLISH_HUB_STAGING: OK` | **W1-D2** |

**② 禁止假完成：**

- ① `smoke-publish-hub-local.sh` **不得**冒充 **② staging GO**
- **`gen-r002-iss007-prereport.py` 43 锚 PASS** 仍可能 **`PARTIAL_GO`** — 见 [CONTRIBUTING · 禁止假完成](../../../CONTRIBUTING.md#no-false-completion)

**② 目标烟测（待建 · 骨架已就绪）：**

```bash
# 须 G-1/G-2 后 Owner scope · staging API/DB
export STAGING_API_BASE=https://your-staging-api
bash scripts/dev/smoke-publish-hub-staging.sh   # 目标末行 TT_PUBLISH_HUB_STAGING: OK phase=② wave1
```

**Wave 1 Sprint 任务卡：** [ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md) · ADR [ADR-20260613-active-workspace-context-switcher.md](../../../docs/adr/ADR-20260613-active-workspace-context-switcher.md)（**accepted** · ① 代码已闭）

---

## ③ 公网/生产 · 任务清单（另闸 · 摘要）

| ID | 清单项 | 状态 | W1 对拍 | 未完成应在哪阶 |
|----|--------|------|---------|----------------|
| **PH-C-1** | 链上提案 **exec 状态** 与发布中心 governance 轨同步 | ❌ 未完成 | **W1-P1** | **③** |
| **PH-C-2** | 真 bond / Governor **主网** 写链与 mine 过滤 | ❌ 未完成 | **W1-P1** | **③** |
| **PH-C-3** | Production GO · 真 PSP · `go-live-checklist` | ❌ 未完成 | **W1-P2** | **③** |
| **PH-C-4** | 全站 93 矩阵 · 每路由/角色 × 发布中心交叉 | ❌ 未完成 | **W1-P3** | **③** |

**③ 入口：** [go-live-checklist · GO Decision](../../../docs/go-live-checklist.md#go-decision-entry-point)

---

## 维护期 OPEN（① · 不阻塞 L5 收口）

| ID | 项 | 说明 |
|----|-----|------|
| **PH-M-1** | 社区轨 **删帖** 在发布中心 inline | 设计：删帖在「我的帖子」全页；若产品改 inline → 单独立项 |
| **PH-M-2** | 向导轨 **hide 编辑**（② 产品可选） | 见设计 §3.1 |
| **PH-M-3** | 水平卡片 **动画/骨架屏** | ① 可选 polish · 非 L5 硬闸 |

---

## 互指维护（改任务时同批）

| 文件 | 动作 |
|------|------|
| [PUBLISH-HUB-L5-DESIGN.md](./PUBLISH-HUB-L5-DESIGN.md) §6 | ①/② 状态列与本文 ID 对拍 |
| `publishHubPhaseAModel.ts` | PH-A-* status |
| `publishHubPhaseBModel.ts` | PH-B-* status |
| [app/me/publish/README.md](../../app/me/publish/README.md) | 绿集命令 |
| [GO_local_auth_l5/README.md](./README.md) | 发布中心一行 |

---

**Maintainer：** Sebastian Ward（塞巴斯蒂安·沃德）· ① 本地

**一句话结论：** **① 五轨 MVP + IA 100 + Wave1 Context Spine 已本地收口**；**② PH-B-1～B-10 / W1-C*** 须 **G-1/G-2**；**③ PH-C-* / W1-P*** 与 go-live 另闸。
