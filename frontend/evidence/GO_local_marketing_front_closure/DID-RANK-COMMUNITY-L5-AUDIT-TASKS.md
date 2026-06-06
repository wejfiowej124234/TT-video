# 排行榜 + TT 社区 · L5 真实实现审计任务清单

**五页总表（含 `/` · `/market*`）：** [FIVE-PAGES-L5-AUDIT-TASKS.md](./FIVE-PAGES-L5-AUDIT-TASKS.md)



**阶段口径：** **① 本地** → **② 测试网** → **③ 公网/生产**（须顺序递进，禁止跳阶 GO）  

**审计来源：** 2026-06-03 深度排查（`/did-rank` + `/community/*`）· **2026-06-03 ① 收口冻结**  

**冻结 SSOT：** [DID-RANK-PHASE1-FREEZE.md](./DID-RANK-PHASE1-FREEZE.md) · [COMMUNITY-PHASE1-FREEZE.md](./COMMUNITY-PHASE1-FREEZE.md) · [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)  

**关联 SSOT：** [30-DID排行榜](../../../docs/spec/30-DID排行榜-页面规范.md) · [COMMUNITY-L5-CLOSURE](./COMMUNITY-L5-CLOSURE.md) · [COMMUNITY-L5-SYSTEM-AUDIT](./COMMUNITY-L5-SYSTEM-AUDIT.md) · [COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md) · [04-附录-did-rank §3.2](../../../docs/spec/04-附录-did-rank对接说明.md)



---



## ① 本地 · 已收口（2026-06-03）



### 排行榜 `/did-rank`



| ID | 项 | 状态 | 真源 / 验收 |

|----|-----|------|-------------|

| **P1-DR-01** | spec **30** 勘误：页内**不**运行时回退 `didRankMockData`；失败走 error banner + 空列表；可选 `devPreview` | **已闭** | `docs/spec/30-DID排行榜-页面规范.md` §4.5 · §6 · §8.2 |

| **P1-DR-06** | 排行榜组件 type import **`didRankMockData` → `didRankTypes`** | **已闭** | `components/did-rank/*` · `lib/didRankGuideReviewDisplay.ts` |

| **P1-DR-02** | **行程榜** `?board=itinerary` 挂载 · `GET /did-rank/itineraries` | **已闭** | `ItineraryRankBlock` · `useDidRankItineraryBoard` · `DidRankBoardShell` |

| **P1-DR-07** | **向导详情弹窗** 移除错误 **`/guides/${userUuid}`**；真实 UUID 仅链 **`/community/user/[id]`** | **已闭** | `DidRankGuideModal.tsx`（API `id` = user UUID） |

| **P1-DR-08** | **主榜 11～100** 与 API **`DID_RANK_LIMIT=100`** 诚实对齐（i18n · aria · JSON-LD · fold hint） | **已闭** | `didRankConstants` · `did_rank.rs` · `didRank_fullList11_100` |
| **P1-DR-16** | **向导榜 sort UI**（`?guide_sort=` ↔ API `sort=`） | **已闭** | `DidRankGuideSortControls` · `useDidRankPage` |
| **P1-DR-17** | **主榜 rank_delta**（PG `did_rank_rank_snapshots`） | **已闭** | travelers/guides cache keys |
| **P1-DR-18** | **SSR** `?period=` · `?guide_sort=` 首屏快照 | **已闭** | `didRankPageInitialData.server.ts` |
| **P1-DR-19** | **行程榜** fetch 失败 **DidRankFetchErrorBanner** + **rank_delta** + `id` 行键 | **已闭** | `DidRankItineraryRankBlock` · `did_rank.rs` itineraries snapshot |
| **P1-DR-DOC** | **`app/did-rank/README`** 与五签/行程挂载对拍 | **已闭** | 本文件 §① |
| **P1-DR-20** | **行程榜 UI** `rank_delta` 徽章 + 列主题 `itinerary` | **已闭** | `ItineraryRankBlock` · `didRankColumnTheme` |
| **P1-DR-21** | **行程深链** `?me=itinerary-<order_id>` + 自动切榜滚动 | **已闭** | `useDidRankDeepLinkAutoScroll` · `buildDidRankItineraryHighlightSearch` |
| **P1-DR-SPEC30** | **spec 30** 五签/行程挂载/URL 与实现对拍 | **已闭** | `docs/spec/30-DID排行榜-页面规范.md` §0.1 · §4 · §5 · §6 |
| **P1-DR-FREEZE** | **`DID-RANK-PHASE1-FREEZE`** 与五签/行程/11～100/**P1-DR-16～21** 对拍 | **已闭** | 本文件 §① · `didRankTheme.contract.test.ts` |
| **P1-MAIN-FIVE** | **`FIVE-MAIN-ROUTES-PHASE1-FREEZE`** §/did-rank 与五签/行程榜对拍（非历史 changelog「四签」） | **已闭** | 本文 §/did-rank · `app/did-rank/README.md` |
| **P1-MAIN-README** | **`frontend/README.md`** did-rank 五签/行程 与代码对拍 | **已闭** | `frontend/README.md` 入口段 |

| **P1-DR-09** | **副榜** period 切换时 **分页重置** | **已闭** | `DidRankSecondaryRankListBody` · `useEffect([period, board])` |

| **P1-DR-10** | **devPreview** UUID（`00000000-0000-4000-8000-*`）**不**链社区档案 | **已闭** | `isDidRankDevPreviewId` · `didRankUtils.test.ts` |

| **P1-DR-11** | **副榜** fetch 失败 → **`DidRankFetchErrorBanner`** + retry（非静默空列表） | **已闭** | `useDidRankSecondaryBoard.fetchError` · Provider/Acquisition blocks |



### TT 社区 `/community/*`



| ID | 项 | 状态 | 真源 / 验收 |

|----|-----|------|-------------|

| **P1-CM-02** | **`/community/me` Hub 取消** — redirect 叙事与 L5 文档对齐 | **已闭** | `COMMUNITY-L5-CLOSURE.md` · `app/community/me/README.md` |

| **P1-CM-08** | **`communitySubRoutes.contract.test.ts`**：`/community/me` → `kind: redirect`；`/community/me/reports` 含 `CommunityMeReportsPageMain` | **已闭** | `npx vitest run app/community/communitySubRoutes.contract.test.ts` exit 0 |

| **P1-CM-ACT-01** | **`/community/activity`** 页内诚实文案（获赞汇总 + `community_more_coming`）— **不**冒充通知中心 | **已闭（① 范围）** | `app/community/activity/page.tsx` 注释 + UI |

| **P1-CM-FRZ** | **Phase ① 收口冻结** — `COMMUNITY-PHASE1-FREEZE` · `data-tt-community-phase1-frozen` · 绿集脚本 | **已闭** | `bash scripts/dev/run-community-l5-green.sh` exit 0 |
| **P1-CM-04a** | **热榜/侧栏距离**：Feed 行含 **`distance_m`** 时 **`distanceIsPlaceholder=false`** | **已闭（① 有 geo 即用）** | `communityFeedHotDestinationRows` · `communityFeedAsideRowViewModel` |
| **P1-CM-13** | **`/community/tt`** → **`/community/explore`**（非静态 STUB 着陆） | **已闭** | `app/community/tt/page.tsx` `redirect` |
| **P1-CM-04b** | **热榜评分/打卡**：无 Feed 互动时 **`~` 占位披露**（同距离 pill 口径） | **已闭** | `communityFeedHotDestinationMetricsFromFeed` · aside/promo VM |
| **P1-CM-EXP-01** | **Explore 目的地** 静态目录 **sr-only + data-tt** 诚实标注 | **已闭** | `CommunityExplorePageDestinationsSection` · **② POI API** |
| **P1-CM-DOC** | **`COMMUNITY-L5-SYSTEM-AUDIT`** `/community/tt` 行改为 redirect | **已闭** | 本文件 §① |
| **P1-CM-REL-01** | **friends/messages** 关系链 showcase **`data-tt` + sr-only** 诚实披露（同 Explore static-v1 口径） | **已闭** | `CommunityRelationalShowcaseHonestyNote` · **P2-CM-15** staging 关注入 |
| **P1-DR-22** | **奖金池** 机读锚点 **`data-tt-did-rank-prize-pool-illustrative`** / **`api-connected`** | **已闭** | `DidRankPrizePoolSection.tsx` · `didRankTheme.contract.test.ts` |
| **P1-CM-16** | **Feed 搜索** **`api-text-q-v1` \| `client-filter-topic-v1`**（**`GET …/feed?q=`** + Enter→tag） | **已闭** | `useCommunityFeed.ts` · `CommunityFeedDiscoveryChrome.tsx` · `communitySubRoutes.contract` |
| **P1-CM-17** | **Feed showcase** 横幅 **`data-tt-community-feed-showcase="active-v1"`** | **已闭** | `CommunityFeedShowcaseNotice.tsx` |
| **P1-CM-ACT-02** | **`/community/activity`** 范围锚点 **`likes-summary-v1`** + **sr-only** | **已闭** | `activity/page.tsx` · `community_activity_scope_sr_hint` |
| **P1-CM-FBK-02** | **feedback** 列表源 **`data-tt-community-feedback-list-source`**（server / local-mixed）+ 注释对拍 API | **已闭** | `CommunityFeedbackListPanel.tsx` · `useCommunityFeedbackRemoteList.ts` |
| **P1-CM-HON-01** | **① 数据诚实** 机读 contract 并集 | **已闭** | `communityPhase1DataHonesty.contract.test.ts` · `run-community-l5-green.sh` |



**① 验收命令：**
```bash
# 排行榜冻结绿集
bash scripts/dev/run-did-rank-l5-green.sh

# TT 社区冻结绿集
bash scripts/dev/run-community-l5-green.sh
```



---



## ② 测试网 · 待办（产品数据 L5 / staging 密度）



### 排行榜 `/did-rank`



| ID | 项 | 说明 | 真源 |

|----|-----|------|------|

| **P2-DR-03** | 商家榜 **产品排序口径** | MVP `guide_id` 代理履约 → 真任务/GMV/刊登口径 | **30 §3.1** · **04 附录 D1** |

| **P2-DR-04** | 旅行收购榜 **产品排序口径** | 成功履约单数、撮合 GMV、委托/受托信誉 | **30 §3.2** · **04 附录 D1** |

| **P2-DR-05** | 旅行者 → **`/community/user/[id]`** 深链覆盖率 | UUID 档案链完整 E2E（含 staging 真用户） | **30 §8** · **D9** |

| **P2-DR-07** | staging **榜数据密度** + 副榜非空 E2E | 空库 honest empty ≠ ② GO | **04 附录 D2～D6** |

| **P2-DR-08** | **`93-D-DID`** 域矩阵 batch | **B-495** · `evidence/93-batch-D-did/` | `docs/runbook/93-matrix-batch-tracker.md` |

| **P2-DR-09** | 全路径 E2E：`?board=` · 副榜分页 · 分享链 | **①** 窄切片 **`93-matrix-path-did-rank-boards`** → staging 宽轨 | **30 §7.2** |

| **P2-DR-10** | ~~行程榜挂载~~ | **① 已交付** · **P1-DR-02**；② staging 密度 E2E | **30 §0.1** |

| **P2-DR-11** | ~~向导榜 sort UI~~ | **① 已交付** · **P1-DR-16** | **04 附录 §2** |

| **P2-DR-12** | **SSR** 扩展 | **`traveltrust_user_id` cookie → `X-User-Id` SSR 预取 `is_me`**；非默认 period 缓存 **②** | `serverForwardAuthHeaders.ts` · **① 子集已交付** |

| **P2-DR-13** | ~~主榜 100 行~~ | **① 已交付** · **P1-DR-08** | **30** · `did_rank.rs` |

| **P2-DR-14** | **实时轮询** staging 策略 | `NEXT_PUBLIC_DID_RANK_POLL_MS` 验收与 observability | `useDidRankLivePoll` |

| **P2-DR-15** | **rank_delta** 跨环境榜史 | ① 主榜 PG 快照已接 · ② staging 投影对拍 · 链上奖池真值 | `did_rank_snapshots` |
| **P2-DR-16** | **guides 榜 PG 失败 → chain_off 回退** 与处罚剔除对拍 | 罕见路径 · staging/IT 断言与 PG 主路径一致 | `did_rank.rs` · `community_penalties.rs` |
| **P2-DR-17** | **行程榜 11～100 UI**（若产品扩展） | ① 仅 Top10（**30 §0.1**）；② 若需与 API 100 行对齐再立项 | **30 §0.1** |



### TT 社区 `/community/*`


| ID | 项 | 说明 | 真源 |

|----|-----|------|------|

| **P2-CM-01** | **`/community/activity` 通知时间线** | **`GET …/me/activity`** + **`…/me/notifications`**（赞/评/关注/@提及 v1）；无已读/系统通知 | **31** · **① 子集已交付** · 完整收件箱 **②** |

| **P2-CM-03** | **真 UGC 密度** — 关闭/降级 dev **showcase** 注入 | staging Feed 不以 `tt-showcase-*` 充数 | `lib/communityShowcase.ts` · **U-02** |

| **P2-CM-04** | **Feed geo 全量真距离** | 无 `distance_m` 行仍占位 · PostGIS/POI 全量 | **G-09** · **G-04** · `feed_geo.rs`（**P1-CM-04a** 热榜已用 API 距离） |

| **P2-CM-05** | **Explore 目的地** 动态 POI | **`GET …/explore/destinations`** 聚合 + 地区分组；无独立 POI 目录 | **G-04** · **① 子集已交付** · PostGIS POI **②** |

| **P2-CM-06** | **friends/messages/explore 宽矩阵 E2E** | 超越 **①** narrow / social-flow | **U-03** · **93 ISS-008** |

| **P2-CM-07** | **CDN / 审核队列 / 举报 SLA** | UGC 生产管线 | **G-05** · **U-02** |

| **P2-CM-09** | **feedback** 以服务端列表为唯一真源 | 成功响应仅 server；失败/offline 仍 local | `useCommunityFeedbackRemoteList` · **① 已交付** |

| **P2-CM-10** | **HLS 转码 / 交互封面裁切** | 视频生产体验 | **U-06** |

| **P2-CM-11** | **`93-D-COM-API`** 域矩阵 | **B-493** | `evidence/93-batch-D-com-api/` |

| **P2-CM-12** | **Showcase 互动 localStorage** 与真帖隔离验收 | staging 禁止 `tt-showcase-*` 赞藏关注冒充 **②** | `communityShowcaseEngagementStorage` |

| **P2-CM-13** | **`/community/tt` 独立 Feed** | ① 已 redirect **`/community/explore`** · ② 若产品要独立 TT 流 | **31** D.6 |
| **P2-CM-14** | **Feed 全文检索 API** | **`GET …/feed?q=`**（ILIKE）+ Enter→tag；`api-text-q-v1` 机读 | `useCommunityFeed` · **① 已交付** · 全文索引 **②** |
| **P2-CM-15** | **friends/messages showcase 演示关系** | ① 已 **sr-only/`data-tt` 披露**（**P1-CM-REL-01**）；② staging 关闭注入 + 真关系 E2E | `communityFriendsPageDataLoad` · `useCommunityConversationPageThread` |
| **P2-CM-16** | **热榜指标全量真值** | ① 有 `distance_m`/互动即用 · 无则 `~` 占位；② 全帖 PostGIS/互动聚合 | **G-09** · **P1-CM-04a/b** |
| **P2-CM-17** | **`communityMockData` 类型模块更名** | 历史文件名降噪 · ② 可选 `communityTypes.ts`（无行为变更） | `lib/communityMockData.ts` |
| **P2-CM-18** | **COM-②-4～8 / drawer staging** | 真帖评论持久化 · PostDetail 交互 · 通知 API · C9 视觉复跑 · staging 视频 CDN | [COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md) |
| **P2-CROSS-01** | **Phase ② 开工总闸** | **G-0～G-4** 清零前禁止 staging GO 宣称 | [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) |



**② 入口闸：** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) **G-0～G-4** 清零后再实施/宣称。



---



## ③ 公网 / 生产 · 待办



### 排行榜 + 社区（产品 / 链 / GO）



| ID | 项 | 说明 |

|----|-----|------|

| **P3-DR-01** | 奖金池 **链上真值**查询与治理币发放叙事 | **30** · **go-live** · 禁止用 env 示意值冒充 |

| **P3-DR-02** | 主网/生产 **DID 榜** 与 escrow 真链对账 | **③** 触链单独闸 |

| **P3-DR-03** | **devPreview / JSON-LD** 生产禁开 | `NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW` 与 SEO 假名 **③** 闸 |

| **P3-DR-04** | **Live poll** 生产 SLO | 轮询频率 · 错误率 · 与主榜/副榜负载 |
| **P3-DR-05** | **`NEXT_PUBLIC_DID_RANK_PRIZE_POOL_AMOUNT`** 生产策略 | 禁止 env 覆盖冒充链上奖池 · 与 **P3-DR-01** 并联 | `didRankPrizePool.ts` |

| **P3-CM-01** | 生产 **WAF / CSP / 滥用防护** | **U-05** |
| **P3-CM-04** | **dev showcase / devPreview 生产硬关** | `TRAVELTRUST_COMMUNITY_SHOWCASE` · `DID_RANK_DEMO_PREVIEW` 部署闸 | `communityShowcase.ts` · `didRankDevPreviewGate.ts` |
| **P3-CM-02** | 生产 **PSP/CDN** 签名 URL · multipart 与 **MinIO** 本地证据区分 | **U-01** · 禁止 **①** TD-3 冒充 **③ GO** |

| **P3-CM-03** | **`go-live` / Production GO** 社区 **93 全矩阵** | **R-002** · **ISS-008** |



### 基础设施 · 数据库（全站 · **2026-06-03 定稿**）



**结论（③ 闸）：公网首发 / Production GO 不要求、也不应上分布式数据库。** 运行真源为 **单一托管 PostgreSQL**（`DATABASE_URL` + `sqlx::PgPool` + `crates/api/migrations`）。**CockroachDB / 全局分布式 SQL / 多活分片** 为 **远期 Target 拓扑**（见 **09 §3**、**41 §1.0**），**≠** Phase ③ 上线前置；用户与订单规模到阈值后再 **另立项** 升级（顺序 **L0 → L1/L2 → L3 → 最后 L4 分布式 SQL**）。



| ID | 项 | 说明 | 真源 / 验收 |

|----|-----|------|-------------|

| **P3-INFRA-01** | **③ = 单库 PostgreSQL** | `go-live` **§2.1～2.4** 仅要求生产 PG、迁移、备份/PITR；**禁止**为首发引入 Cockroach / Yugabyte / 自研分片 | [go-live-checklist §2](../../../docs/go-live-checklist.md) · [ops/RUNBOOK §Cockroach vs PG](../../../ops/RUNBOOK.md) |

| **P3-INFRA-02** | **L0 单库生产基线** | 连接池治理 **B-474～B-478**、备份/PITR **B-475**、池观测/压测 **B-476～B-479**；与 **go-live 2.3** 恢复演练并联 | [postgresql-layered-evolution L0](../../../docs/architecture/postgresql-layered-evolution-roadmap.md#五与发布节奏的建议对应) · **TT-B474～B479** |

| **P3-INFRA-03** | **只读副本（可选 · 仍非分布式）** | 高读报表 / 内部聚合可先 **PG 流复制只读**（`DATABASE_URL_RO`）；**不**等价于分布式 SQL | 同上 **§四·1** · **L2** |

| **P3-INFRA-04** | **分布式 SQL — 规模触发后另闸** | **TT-9627 §0.a**「单库→分布式」记为 **规划债 / 显式里程碑**，**非** ③ GO 阻塞项；触发后再走 **L3 拆库 → L4 评估** | [TT-9627 §0.a](../../../docs/runbook/TT-9627-delivery-order-spine-then-full-site.md) · **§六 刻意不做** |

| **P3-INFRA-05** | **升级触发条件（产品定标 · 占位）** | 建议指标（待 ADR 定稿）：注册 **MAU/DAU**、日 **订单峰值**、PG **CPU/连接池/慢 SQL** 持续超阈、**跨区写入 SLA** 需求出现；**未达阈禁止**以「架构完整性」提前上分布式 | 待 **ADR**；演进 SSOT 同上 roadmap |

| **P3-INFRA-06** | **文档漂移互读** | **09 §3** 标题「CockroachDB 设计」= **Target**；**§8 图示** 已标注 **≠ 现行 PG 已验收替代** — ③ 验收时 **勿** 将 Target 拓扑当 GO 勾选 | **09 §2.2 / §8** · **41 §1.0** |



**③ 数据库验收一句话：** 勾选 **go-live §2** + **L0 runbook 证据** = **③ 数据库 GO**；**未**完成 **P3-INFRA-05 定标 + L4 立项** = **不得** 宣称「已上分布式数据库」或把 Cockroach 当 Production 已落地。



---



## 读法



- **① 已闭** = UI 壳 + API 接线 + 诚实空态/演示 disclosure + 机读 contract 与文档同源 + **审计 B1～B4 数据链修复**。  

- **②** = 产品数据真值、staging 密度、宽 E2E、真 UGC/geo/通知、榜口径/行数扩展。  

- **③** = 链上、生产 PSP/CDN、公网 GO；**数据库 = 单托管 PG（L0）**，分布式 **延后至规模阈值**。  

- **禁止**用 **①** showcase/devPreview/示意奖池/占位距离 冒充 **②③ GO**（见 [CONTRIBUTING · 禁止假完成](../../../CONTRIBUTING.md#no-false-completion)）。

---

## ① 收口声明（2026-06-03 · P1 全闭 · 诚实锚点补闭）

**排行榜 + TT 社区：** 表内 **P1-DR-*** · **P1-CM-*** · **P1-MAIN-*** · **P1-CM-HON-01** 均已 **已闭**（真实 API 主路径 + 诚实空态/披露 + **`data-tt-*` 机读锚点** + 绿集）。**②③** 项见 **§② / §③**（含 **P2-CROSS-01** 总闸）；**未在本阶段实施**；**不得**将 **§①** 宣称等同于 **② staging GO** 或 **③ Production GO**。

**深度审计读法（2026-06-03）：** ① = 接线 + retry + 演示/示意 **带披露**；② = 产品数据真值/密度/宽 E2E；③ = 链上/生产 PSP·CDN/全矩阵 GO。

---

## 深度审计 · 功能矩阵（只读 · 2026-06-03）

**用途：** 逐页核对「是否 L5 真代码」；**① 已闭** 行 = 可跑通 + API 主路径 + 诚实披露；**②/③** 行 = 产品真值，**勿在 ① 改 UI**。

### `/did-rank` · 非 L5 产品真值（功能仍在 · 已披露）

| 功能 | ① 代码 | ②/③ |
|------|--------|-----|
| 奖金池金额 | API + `illustrative` + `data-tt-did-rank-prize-pool-*` | **③** 链上真值 P3-DR-01 |
| devPreview 榜行 | 门闸 + Header banner；**production 硬关** | **③** 部署验收 P3-DR-03 |
| 商家/收购排序 | **`list_market_did_rank_by_fulfillment`** MVP 口径已接线 | **②** 产品终态 GMV 口径 P2-DR-03/04 |
| 榜数据密度 | 诚实空列表 | **②** P2-DR-07/09 |
| SSR `is_me` 高亮 | **cookie 转发 SSR** + 客户端刷新 | **②** 全登录态 E2E |

### `/community/*` · 非 L5 产品真值（功能仍在 · 已披露）

| 功能 | ① 代码 | ②/③ |
|------|--------|-----|
| Feed showcase | dev 默认；**production/testnet 硬关** + 横幅 `data-tt` | **②** staging 密度 P2-CM-03/12/15 |
| 搜索 | **`feed?q=`** + 客户端滤 + Enter→tag | **②** 检索索引/排序 |
| 活动中心 | **`activity-events-v1`**（赞/评/关注/@）；非完整收件箱 | **②** 已读/系统通知 P2-CM-01 |
| Explore 目的地 | **`api-aggregate-v1`** 或 `static-v1` | **②** POI 目录 P2-CM-05 |
| 热榜 `~` 占位 | 无 geo/互动时 | **②** P2-CM-04/16 |
| feedback 离线 | API 失败时 **local-mixed** | **②** 离线策略验收 |

**① 无 P0 断链：** 无运行时 mock 榜回退；副榜/行程榜有 retry；发帖/Feed/社交主路径为真 HTTP。


