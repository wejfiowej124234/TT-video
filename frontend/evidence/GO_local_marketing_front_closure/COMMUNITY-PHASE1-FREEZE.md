# `/community/*` TT 社区 · Phase ① 收口冻结（2026-06-03）

**阶段：① 本地** — **五主路由 UI 壳（已冻结）** + **发帖/评论/子路由/社交窄链 L5（2026-05-31 已闭 · 2026-06-03 审计收口）**；**不**表示 staging 真 UGC 密度、**② Phase ② GO**、**③ Production GO**、全站 **93** 矩阵已闭。

**代码真源：** `frontend/app/community/*` · `frontend/components/community/*` · `frontend/lib/community*` · `frontend/lib/apiClient/community/*`

**详细证据（发帖链 · PI-1 · MinIO · E2E 并集）：** [COMMUNITY-L5-CLOSURE.md](./COMMUNITY-L5-CLOSURE.md) · [COMMUNITY-L5-SYSTEM-AUDIT.md](./COMMUNITY-L5-SYSTEM-AUDIT.md)

**互指：** [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [31-TT社区](../../../docs/spec/31-TT社区页面设计.md) · [DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) · [COMMUNITY-PHASE-2-3-ROADMAP.md](./COMMUNITY-PHASE-2-3-ROADMAP.md) · [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)

---

## 收口结论（ACTIVE · FROZEN · ①）

| 维度 | ① 状态 | 真源 |
|------|--------|------|
| **五主路由 UI 壳** | **已冻结（2026-05-25）** | L1 Tab · 暖场 · **`COMMUNITY_SHELL_TAB_ACTIVE`** · `communityShellTheme` |
| **Feed / 抽屉 / 发帖链** | **已闭** | `PublishDrawer` · `useCommunityFeedPublishSubmit` · multipart · PI-1 **8/8** |
| **18 子路由机读** | **已闭** | `communitySubRoutes` **22** · `communityRouteDataHooks` **12** |
| **friends / messages 窄 E2E** | **已闭** | `e2e:community-social-flow` **4** |
| **弹窗 G-03** | **已闭** | Report / Login / QuickLinks contract + E2E |
| **`/community/me` Hub** | **redirect** | **`resolveCommunityMeHubRedirect`** · 独立子页 L5 → [`COMMUNITY-ME-L5-FREEZE`](../GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) |
| **`/community/activity`** | **已闭（① 诚实子集）** | **`GET …/me/activity`**（`getMeActivity`）· 获赞汇总 + 近期互动事件（赞/评/关注/@）；**`data-tt-community-activity-scope`** = **`activity-events-v1`** \| **`likes-summary-v1`** · **非**完整通知收件箱 → **②** |
| **Feed 搜索** | **已闭（① 子集）** | 非空 **`q`** → **`GET …/feed?q=`**（debounce · **`rank_basis: feed_text_search_v1`**）；空 **`q`** → 客户端滤已加载帖 + Enter→**tag** · **`data-tt-community-feed-search-mode`** = **`api-text-q-v1`** \| **`client-filter-topic-v1`** |
| **Explore 目的地** | **已闭（① 子集）** | **`GET …/explore/destinations`** 聚合优先 · **`data-tt-community-explore-dest-catalog`** = **`api-aggregate-v1`** \| **`static-v1`** → **②** POI 目录 |
| **feedback 列表** | **已闭（①）** | API 成功 → **`data-tt-community-feedback-list-source="server"`**（**不**与 local 合并）；失败/offline → **`local-mixed`** |
| **dev showcase** | **门闸（①）** | `communityShowcase.ts`：**`NODE_ENV=production` 硬关** · **`NEXT_PUBLIC_TRAVELTRUST_PHASE=2` / `DEPLOY_PROFILE=testnet|staging` 硬关** · dev 默认开 · **`CommunityFeedShowcaseNotice`** |
| **②③ backlog** | **OPEN** | 本文件 §②③ · **P2-CM-*** · **P3-CM-*** |

**维护期纪律（写死 · ① 冻结范围内）：**

| 允许 | 禁止 |
|------|------|
| API 接线 / fetch 映射 / loading·error·retry · **诚实 i18n**（同语义） | **L1 Tab / 壳 layout / 暖场叠层 / layout lock** 回流 |
| 发帖/评论/社交 **数据链路** bugfix · a11y | **`TT_COMMUNITY_*` / `TT_MARKETING_DARK_ROUTE_*COMMUNITY*`** token / 动效改版 |
| **`crates/api` community 路由** 与 **04 §3.4** 同批 HTTP | **新增 Community 功能**（须 **②** 立项） |
| Contract **对齐代码真值**（不放宽冻结断言） | 用 **showcase / 占位距离** 冒充 **②③ GO** |
| **`/governance/*`** 治理层（非五主壳） | 用 **C1–C12 槽 PASS** 冒充 **Phase ② GO** |

**动 `app/community/*` · `components/community/*` · `lib/community*` 路径时：** 须 **`bash scripts/dev/run-community-l5-green.sh` exit 0**（**①** vitest 窄集；**非** ②③ GO）。

**动 `PublishDrawer*` / 发帖 multipart / 头像链：** 另须 **`npm run e2e:pi1-community-all` exit 0**（**①** · 见 **COMMUNITY-L5-CLOSURE**）。

---

## 机读锚点

```text
data-tt-community-phase1-frozen="1"        # CommunityRouteShell 根壳
data-tt-community-dark-surface="…"
data-tt-community-feed-page="1"            # Feed 主列
data-tt-community-explore-page="1"
data-tt-community-friends-page="1"
data-tt-community-messages-page="1"
data-tt-community-activity-page="1"
data-tt-community-feedback-page="1"
data-tt-community-user-page="1"
data-tt-publish-drawer-type="photo|video|text"
# /community/me → redirect（非 Hub 页）；子页见 COMMUNITY-ME-L5-FREEZE
```

---

## ① 已闭项（P1-CM · 2026-06-03）

| ID | 项 |
|----|-----|
| **P1-CM-02** | `/community/me` Hub 取消 · redirect 叙事 |
| **P1-CM-08** | `communitySubRoutes.contract` · 18 路由锚点 |
| **P1-CM-ACT-01** | `/community/activity` 诚实文案（**非**完整通知收件箱） |
| **P1-CM-04a/b** | 热榜距离/评分/打卡 · 有 API 用真值 · 无则 **`~` 披露** |
| **P1-CM-13** | `/community/tt` → `/community/explore` redirect |
| **P1-CM-EXP-01** | Explore 目的地 catalog **`api-aggregate-v1` \| `static-v1`** + **sr-only + data-tt** |
| **P1-CM-REL-01** | friends/messages 关系链 showcase **sr-only + data-tt** 披露 |
| **（CLOSURE）** | PublishDrawer P0 · PI-1 8/8 · TD-3 MinIO 3/3 |
| **（CLOSURE）** | G-01～G-03 子路由 + 弹窗 + social-flow |
| **（CLOSURE）** | G-06 无 avatar URL 粘贴 · G-08 Phase① acceptance |
| **P1-CM-16** | Feed 搜索 **`api-text-q-v1`** \| **`client-filter-topic-v1`**（**`GET …/feed?q=`** 子集） |
| **P1-CM-17** | Feed showcase **`data-tt-community-feed-showcase="active-v1"`** + 生产/测试网 profile 硬关 |
| **P1-CM-ACT-02** | `/community/activity` **`likes-summary-v1`** \| **`activity-events-v1`** + sr-only |
| **P1-CM-ACT-03** | **`GET …/me/activity`** · **`GET …/me/notifications`**（同源别名） |
| **P1-CM-EXP-02** | Explore **`api-aggregate-v1`** \| **`static-v1`**（**`exploreRegionBlocksFromApiAggregate`**） |
| **P1-CM-FBK-02** | feedback **`data-tt-community-feedback-list-source`** · API 成功 **server-only** |
| **P1-CM-HON-01** | `communityPhase1DataHonesty.contract.test.ts` · `run-community-l5-green.sh` |

**② backlog（非 ① 缺陷）：** 通知时间线 · staging 关 showcase · 真 geo/POI · CDN/HLS · feedback **跨设备唯一真源 SLA** — 见 **§②** · **P2-CM-09**。

---

## ① 验收命令（收口日 · exit 0）

**日常维护（vitest 窄集 · 推荐）：**

```bash
bash scripts/dev/run-community-l5-green.sh
```

**发帖/头像数据链变更（另闸）：**

```bash
cd frontend && PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all
```

**① 全量证据复验（可选 · 须 API :8080）：**

```bash
bash scripts/evidence/run-community-phase1-local-evidence.sh
```

**五主并集闸（含 home/market/did-rank）：** `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh`

---

## ② 测试网 · 未闭（勿跳阶 GO）

| ID | 项 |
|----|-----|
| **P2-CM-01** | 通知收件箱（已读/未读/系统）· **①** 已有 **`activity-events-v1` 子集** |
| **P2-CM-03** | staging 真 UGC 密度（**①** 已生产/测试网 profile **硬关 showcase**） |
| **P2-CM-04** | 真 geo 距离全量 |
| **P2-CM-05** | 动态 POI 目录（**①** 已有 **`explore/destinations` 聚合子集**） |
| **P2-CM-06～11** | 宽 E2E · CDN/审核 · feedback SSOT · HLS · **93-D-COM-API** |
| **P2-CM-12～15** | showcase localStorage 隔离 · `/community/tt` 内容 · Feed 全文检索 API · friends/messages showcase 关系 |

**② 槽位：** C1–C12 **PASS** · **TT_PHASE2_GO_VERDICT: NOT_MET** — 见 **COMMUNITY-L5-CLOSURE** · **禁止** 槽 PASS = Phase ② GO。

入口闸：[PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) **G-0～G-4**

---

## ③ 公网 / 生产 · 未闭

| ID | 项 |
|----|-----|
| **P3-CM-01** | 生产 WAF / CSP / 滥用防护 |
| **P3-CM-02** | 生产 PSP/CDN 签名 URL |
| **P3-CM-03** | Production GO · 社区 **93 全矩阵** |

证据槽：[`evidence/GO_production/community/`](../../../evidence/GO_production/community/README.md) · **NOT STARTED**

---

## 读法

- **① FROZEN** = UI 壳 + 发帖/子路由/社交 **窄链 L5** + showcase 诚实披露 + vitest 绿集。  
- **②** = 真 UGC 密度 · geo · 通知 · CDN/HLS · 宽矩阵（**≠** C 槽 alone）。  
- **③** = Production GO。  
- **禁止假完成：** [CONTRIBUTING · 禁止假完成](../../../CONTRIBUTING.md#no-false-completion)
