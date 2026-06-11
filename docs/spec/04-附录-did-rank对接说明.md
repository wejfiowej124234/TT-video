# 04 附录：did-rank 对接说明（50-B3）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **接口路径与 DB/chain_off 行为** | **§1** |
| **`period` / `rank_basis` 排序口径** | **§2** |
| **页面与产品 SSOT** | **[30-DID排行榜-页面规范](30-DID排行榜-页面规范.md)**；**五主路由 ① UI 壳** **[FIVE-MAIN-ROUTES](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** · **[88 §一](88-五主路由页身实现快照与UX缺口审计-20260330.md)**；**② 测试网验收清单** 见 **本附录 §3.2**、**[30 §7.2](30-DID排行榜-页面规范.md)** |
| **路由总表** | **[04 §3.4](04-后端与API.md)** |
| **信誉加权 · §3.1（MVP `sort=weighted` + env / 08-3 附录 A + Target 余项）** | **§2、§3.1**；**[08-3 附录 A](08-3-参数与门禁表.md#附录-a运维与实现映射非-26-key-数值对齐代码与-runbook)** |

**文档编号**：04 附录  
**用途**：**DID 排行榜**（did-rank）接口的**当前实现与数据源对接**说明，与 [04-后端与API](04-后端与API.md) §三、前端 did-rank 页一致。  
**受众**：后端、前端、产品。

---

## 1. 当前状态

| 项 | 说明 |
|------|------|
| **接口** | `GET /api/v1/did-rank/travelers`、`GET /api/v1/did-rank/guides`、`GET /api/v1/did-rank/itineraries` 已存在；**`GET /api/v1/did-rank/prize-pool`**、**`GET /api/v1/did-rank/providers`**、**`GET /api/v1/did-rank/acquisitions`**（① 已接线）。**有 DB 时**主榜/副榜按表查询；**无 DB 时**主榜回退 chain_off；副榜无池时空列表+note。 |
| **`is_me`** | 三条 GET 均为**公开可读**；请求带有效会话（Bearer 等，与 `extract_user_with_session_check` 一致）时，各列表项可含布尔字段 **`is_me`**：travelers/guides 表示该项 **用户 id** 为当前用户；itineraries 表示关联 **订单 `tourist_id`** 为当前用户。未登录或无效会话时恒为 `false` 或省略（实现为 `false`）。 |
| **前端** | did-rank 页与 apiClient（getDidRank*，已合并 `getAuthHeaders()`）已对接；响应经 `extractList` + `normalize*Row` 映射为页面类型；URL `?me=traveler-<uuid>` / `guide-<uuid>` 与列表项 `id` 对齐，且可与 `is_me` 并列使用（URL 优先高亮）。向导榜可选 **`?guide_sort=reviews`** / **`weighted`**（→ API **`sort=`** 同值、**§2** 对应 **`rank_basis`**）。 |
| **guides · 160 处罚剔除** | **PostgreSQL** 主路径：`db::list_guides_did_rank_*` 在 **`WHERE`** 中联 **`community_penalties`**（常量 **`AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES`**），剔除 **`subject_user_id`** 上 **`status=active`** 且 **`action IN (mute, ban, shadow_ban, limit_feed)`** 且 **（`expires_at IS NULL` 或 `expires_at > now()`）** 之向导用户；**`warn` / `content_remove` / `other` 不剔除**；**`rank_basis` 字符串不变**。**回退路径**：**`list_guides_did_rank` 失败**且 **`chain_off.db_pool` 存在**时，**`db::list_subject_user_ids_excluded_from_did_rank_guides`** 拉取同口径 **`subject_user_id`** 集，**`guides_from_chain_off_store`** 内存排序前剔除（批 **685**）。**无** **`db_pool`** 的纯内存 **chain_off** **不**读 **`community_penalties`**（见 **`crates/api/src/routes/did_rank.rs`**）。 |
| **GET `/meta` · `did_rank`** | 运维观测：**`chain_off_mounted`**、**`chain_off_db_pool`**（与根级 **`database_connected`** 同源）、**`guides_community_penalty_exclusion`**：**`db_backed`**（有 **`chain_off.db_pool`** 时剔除生效：PG 主路径或 **685** 内存回退过滤）、**`chain_off_memory_only`**（有 **chain_off** 无池）、**`no_chain_off`**（无 **chain_off**）；**`rule`** 与人读说明见 **`crates/api/src/routes/health_meta.rs`**（批 **686**）。 |

### 1.1 行程榜（`itineraries[]`）项 · 可选创作者社区链

| 字段（JSON） | 说明 |
|-------------|------|
| **`tourist_id`** / **`traveler_id`** | **可选**（实现上**恒同值**）。与关联订单旅行者 **`orders.tourist_id`** 同 UUID 字符串；**`traveler_id`** 为 **87** 与 **`GET /api/v1/orders`** 列表/详情 **`traveler_id`****=**`tourist_id` 双读口径一致。无关联旅行者或链下 store 中订单缺失时为 **`null`**（JSON）。 |
| **`creator_community_user_id`** | **可选**。字符串，须为与 **`/community/user/[id]`** 一致的用户 UUID（与社区作者主页路由同形）。有值时前端 `normalizeItineraryRow` 同时接受 **`creatorCommunityUserId`**（camelCase）并映射为页面类型字段 **`creatorCommunityUserId`**；仅当通过 `isDidRankCommunityProfileId`（与 `community/user/[id]/page` 一致之 UUID 正则）校验时，**`ItineraryTopCard`** 将**创作者昵称**渲染为链至社区主页的 `Link`，与 **`GuideTopCard`** 社区档案链同口径（**无**整卡 `role="button"` 嵌套 `Link`）。未返回、空串或非法格式时仅展示纯文本昵称。后端与 chain_off/mock 可无此字段；抽检数据可填合法 UUID。 |

### 1.2 商家榜 / 旅行收购榜（脊签 · ① MVP 已接线 · UI 同构）

| 项 | 说明 |
|----|------|
| **HTTP** | **`GET /api/v1/did-rank/providers`**、**`GET /api/v1/did-rank/acquisitions`**（**`?period=`** 与主榜同形）；**`GET /api/v1/did-rank/prize-pool`**（无 `period`）。 |
| **① 排序口径（MVP+）** | 有 **`chain_off.db_pool`** 时：**主序** = 窗口内 **`orders.status=completed`** 且 **`guide_id=owner`** 的 **履约单数**，其次 **`SUM(amount)`**、**`market_listings` published** 条数（**`variant=provider`****/**`acquisition`**）；**`rank_basis`** = **`provider_fulfillment_orders_then_gross_then_published_listings_in_window`****/**`acquisition_fulfillment_orders_then_gross_then_published_listings_in_window`**；项含 **`completed_fulfillment_orders`**、**`fulfillment_gross_total`**、**`published_listings`**、**`rank_delta`**。**`limit`** = **100**（与主榜同形）。**收购榜 owner（PD-009 · ① 已对齐）**：**任意** **`variant=acquisition`** listing **owner** 可入榜 — **无** **`owner_role_filter=region_steward`**。**非** 链上 GMV / 任务单 SSOT（**Target ②③** · **§3.2 D1**）。 |
| **Target（②③）** | 窗口内 **任务履约单数**、**撮合成交额**、**委托/受托信誉** 等与 **[30 §3.2 / §7.1](30-DID排行榜-页面规范.md)**、**[87 §1.4](87-TravelTrust-角色体系技术文档-融合架构版.md)** 定稿后替换 **`rank_basis`** 并同批机读闸。 |
| **前端** | **`getDidRankProviders`****/**`getDidRankAcquisitions`**、**`AcquisitionRankBlock`****/**`ProviderRankBlock`**、**`?board=`** 已接；副榜 **Top10 领奖台 + 11～100 折叠/分页** 与主榜同构；**`?me=provider-|acquisition-<uuid>`** 自动切脊签并滚到行；**回到我的排名** / **复制排名链接**；**`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`** 才注入主榜预览（各环境默认关）。 |

---

## 2. `period` 查询参数与响应元数据

| `?period=` | 含义 | 窗口下界 `since`（响应字段） |
|------------|------|------------------------------|
| `week` 或 `7d` | 近 7 天 | 请求时刻 UTC − 7 天，RFC3339 |
| `month` 或 `30d` | 近 30 天 | 请求时刻 UTC − 30 天 |
| `all`、空、非法值 | 全量 | `null` |

**仅 `GET /api/v1/did-rank/guides`**（`sort` 大小写不敏感、trim）：

- **`?sort=reviews`**：**`rank_basis`** = **`guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_{N}`**（**`N`** = 运行时门槛，默认 **3**）：仅 **`reception_count`（窗口内完成单数）≥ N** 的向导入榜；窗口内评价 **算术均分** 降序（无评价 **`NULLS LAST`**），其次接待金额合计、完成单数、`users.created_at`。默认 **`N`** 与代码常量 **`GUIDE_DID_RANK_MIN_COMPLETED_FOR_REPUTATION_SORTS`**（`users_sessions.rs`）一致；覆盖：**`DID_RANK_GUIDE_MIN_COMPLETED_FOR_REPUTATION_SORTS`**（**1～50**，见 **[08-3 附录 A](08-3-参数与门禁表.md#附录-a运维与实现映射非-26-key-数值对齐代码与-runbook)**）。
- **`?sort=weighted`**：**`rank_basis`**：默认 **`guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3`**；若 **`N≠3`** 且权重仍为默认 **0.6/0.4**，后缀为 **`…_min_completed_ge_{N}`**；若权重非默认，为 **`guide_weighted_volume_norm_w{pct}pct_review_avg_norm_w{q}pct_then_reception_gross_then_completed_count_min_completed_ge_{N}`**（**pct** 为 **0～100** 整数）。排序语义：**w_a** ×（接待金额 / 当期符合门槛向导之 max）+ **w_r** ×（评价 **1～5→0～1**）；**w_a/w_r** 由 **`DID_RANK_GUIDE_WEIGHTED_W_ACTIVITY` / `…_W_REPUTATION`** 成对解析（**0～1** 归一），默认 **0.6/0.4**（同代码常量）。
- **缺省或其它 `sort`**：**`rank_basis`** = **`guide_reception_gross_total_then_completed_count`**（30 §3 主序）。

前端 **`?guide_sort=`** 与 **`apiClient.getDidRankGuides(period, …)`** 查询串 **`sort=`** 同批。

**主榜三条**及**副榜两条**（providers/acquisitions）均在 JSON 根级返回：`status`、`period`（解析后的 canonical：`week` \| `month` \| `all`）、`since`（`null` 或字符串）、`limit`（固定 **100**）、**`rank_basis`**（排序主键说明，前端可忽略）、以及 `travelers` / `guides` / `itineraries` / `providers` / `acquisitions` 之一。无数据源时列表为空，可带 `note` 说明。列表项可选 **`rank_delta`**（相对上一请求同 **`cache_key`** 名次变化；正=上升）。**有 PostgreSQL** 时快照写入 **`did_rank_rank_snapshots`**（① 多实例/重启可复用；无表时回退进程内内存）。**`GET …/prize-pool`** 返回 **`monthly_amount`**、**`illustrative`**、**`source`**（`env` \| `governance_pool_db` \| `default`）；**`DID_RANK_PRIZE_POOL_MONTHLY_AMOUNT`** 优先；有 DB 且 **`governance_pool.balance`** 为十进制时可读 **`governance_pool_db`** 快照（仍 **illustrative**，非链上 SSOT）。

**当前排序口径（2026-03-28）**：有 DB 时 **travelers** 按窗口内 **`orders.completed_at`** 且 `status=completed` 的订单数（旅行者 `tourist_id`）降序，其次 `users.created_at`（`rank_basis`=`tourist_completed_orders_in_window`）；**guides** 按窗口内完成单的 **`SUM(orders.amount::numeric)`** 降序，其次完成单数，再 `users.created_at`（`rank_basis`=`guide_reception_gross_total_then_completed_count`）；响应项含 **`reception_gross_total`**（文本小数）、**`reception_count`**，并（**2026-04-03** 起）附 **`received_review_count`**（窗口内、已完成订单上且 `reviews.reviewee_id` 为向导用户 id 的评价条数）、**`avg_received_review_score`**（上列算术均分，无评价时为 `null`）— **在缺省** **`sort`** **下** **不改变** 上述主序与 `rank_basis`（可选 **`sort=reviews`** / **`sort=weighted`** 时见 §2 **`sort` 列表**）。**itineraries** 优先按关联订单 **`orders.completed_at`** 降序（`rank_basis`=`order_completed_at`）；若无完成单数据则回退为 **`itineraries.created_at`**（`rank_basis`=`itinerary_created_at_fallback`）。chain_off 回退：travelers 完成单计数；guides 以 `amount` 解析累加（f64，仅演示）+ 完成单数，并附与 DB 同语义的 **`received_review_count`** / **`avg_received_review_score`**；行程在无已完成订单窗口内数据时按订单 **`created_at`** 代理窗口（`rank_basis`=`itinerary_created_at_proxy`）。§3.1 **固定权重** **`sort=weighted`** 已落地；**`sort=reviews`/`weighted`** **≥3** **完成单** **入榜**（批 **682**）；**`w_*` 08-3 化** 等仍见 §3.1 **Target**。

---

## 3. 对接意向（实现期）

**机器验收（与 §2 `rank_basis` 对齐）**：`./scripts/check-55-quick-verify.sh`（或 **`.ps1`**）在对应端点为 **200** 且本机有 **jq** / JSON 解析时，对 **`?period=week`** 校验：**guides** — **`rank_basis`** = **`guide_reception_gross_total_then_completed_count`** 且 **`guides`** 为数组；并另请求 **`?period=week&sort=reviews`** 校验 **`rank_basis`** = **`guide_avg_received_review_then_reception_gross_then_completed_count_min_completed_ge_3`**；再请求 **`?period=week&sort=weighted`** 校验 **`rank_basis`** = **`guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count_min_completed_ge_3`**（**默认**无 **`DID_RANK_*`** env；若部署覆写 env，须同步断言或专环境机读）；**travelers** — **`rank_basis`** = **`tourist_completed_orders_in_window`** 且 **`travelers`** 为数组；**itineraries** — **`rank_basis`** ∈ {**`order_completed_at`**, **`itinerary_created_at_fallback`**, **`itinerary_created_at_proxy`**} 且 **`itineraries`** 为数组（`period=week` 时 **`since`** 为 RFC3339 字符串）。**`GET /meta`**（**jq** / **PowerShell** **`ConvertFrom-Json`**）：**`.did_rank`** 对象、**`guides_community_penalty_exclusion`** ∈ {**`db_backed`**, **`chain_off_memory_only`**, **`no_chain_off`**} 且与 **`chain_off_mounted`****/**`chain_off_db_pool`** 互证，**`rule`** 非空（批 **687**，与 §1 **`GET /meta · did_rank`** 一致）。**`smoke-api-public-routes`**（**.sh** / **`.ps1`**）要求 **`GET /api/v1/did-rank/itineraries`**、**`/guides`**、**`/travelers`** 均 **200**，并对 **`?period=week`** 与 **guides `sort=reviews`/`sort=weighted`** 校验上列 **`rank_basis`** 与 **`guides[]` / `travelers[]` / `itineraries[]`**（**.sh** 在 **jq** 存在时校验 **itineraries**；**`.ps1`** 始终校验；见 `scripts/README`、**07 §二 2.3**）。

| 数据源选项 | 说明 |
|------------|------|
| **信誉/评价聚合** | 以 03 评价、81 信誉等为输入，按分数/次数聚合排序后返回。 |
| **链上/链下混合** | 结合链上身份与链下行为数据，由产品定稿维度与权重。 |
| **外部 DID 服务** | 若接入外部 DID 或排行榜服务，在 04 §三 补充路径与鉴权，本文补充数据源与同步策略。 |

### 3.1 信誉 / 评价聚合（Target · 门禁草案）

**状态**：**完整** **`w_activity*A+w_reputation*R`** 产品定稿（可调 **`w_*`、反作弊下限数值、按 period 衰减等）仍 **Target**。三榜默认主序仍为 §2 **活动量 / 成交**（**无** §3.1 信誉轨入榜槛）。**Partial**：（1）§2 **`guides[]`** 附 **`received_review_count`** / **`avg_received_review_score`**；（2）**`?sort=reviews`** + **`reception_count≥3`** 入榜 + **`rank_basis`** **`…_min_completed_ge_3`**（批 **682**）；（3）**`?sort=weighted`** — **MVP 固定** **`w_activity=0.6`**、**`w_reputation=0.4`**，同上入榜槛，**A/R** 见 §2，**DB+chain_off** 对齐；（4）**160** **向导榜剔除**：**PostgreSQL** 主路径（批 **684**）+ **`db_pool` 存在时内存回退** 同口径（批 **685**）见 **§1**。**08-3** 其它运行时叙事仍 **Target**。**不**构成对外合规承诺。本节表格其余为草案。

| 维度 | 草案 |
|------|------|
| **输入单源** | 订单评价：**[03](03-业务流程与风控.md)** 评分路径、**`POST|GET /api/v1/orders/:id/reviews`**（[04 §3.4](04-后端与API.md)）；向导/用户信誉扩展字段（若有）以 **[81](81-经济模型-向导质押与订单押金.md)** 及后续表结构为准。 |
| **`rank_basis` 命名** | 与现有 **snake_case** 一致；若与活动量主序并存或替换，须使用**新**机器键（**禁止**静默复用 §2 现有枚举）。**已落地**：**`…_min_completed_ge_3`** 后缀表示 **`sort=reviews`/`weighted`** 的 **≥3** 完成单入榜（批 **682**）；若再增变体须在 §2、脚本断言与本节同步。 |
| **合成规则（择一或组合）** | 加权分 **`w_activity * A + w_reputation * R`**；**`w_*`** 默认 **0.6/0.4**，**成对 env** 覆盖见 **08-3 附录 A**（批 **683**）；是否按 **`period` 衰减** 仍 **Target**；变更走 **[07 §二 2.4](07-开发流程与顺序.md)**。 |
| **反作弊与下限** | **`sort=reviews`/`weighted`**：**默认** **`reception_count≥3`**；**`DID_RANK_GUIDE_*`** 已入 **[08-3 附录 A](08-3-参数与门禁表.md#附录-a运维与实现映射非-26-key-数值对齐代码与-runbook)**（批 **683**）；**160** **`community_penalties`** **active** **mute/ban/shadow_ban/limit_feed** **向导榜剔除**：**PostgreSQL** 主路径（批 **684**）+ **`chain_off.db_pool` + 内存回退**（批 **685**）见 **§1**；**无** **`db_pool`** 的纯内存 **chain_off**、**其它 action** 扩展仍 **Target**；定稿后互链 **03**、**Runbook** 相关节。 |
| **机器验收（落地后）** | **`sort=reviews`** / **`sort=weighted`** 对应 **`rank_basis`**（含 **`_min_completed_ge_3`**，批 **682**）已入 **`check-55-quick-verify`** / **`smoke-api-public-routes`**；若再增变体须追加断言。 |
| **实现落点** | **`crates/api/src/routes/did_rank.rs`**；查询层可能联表 **`reviews`** 或物化汇总视图；Schema 变更记入 **41 / 55** 与 **04** 相关节。 |

进一步增强时：按业务线补齐**统一排序口径**（period、权重、聚合窗口）并文档化；与 08、03、81 一致；**Target** 信誉聚合见 **§3.1** 与 [50 §六附](50-阶段-后续优化与开发清单.md)。**实现 SSOT**：`crates/api/src/routes/did_rank.rs`。

### 3.2 ② 测试网验收清单（产品数据 · 非 ① 壳层）

**用途**：收口 **§1.2 Target（②③）** 与 **① 本地** 已做 UI/机读窄切片的差距；**禁止**用 **①** `check-55` / **`93-matrix-path-did-rank-boards`** 窄 E2E 冒充本表 **GO**。**③ 公网/生产** 另闸（奖池真派奖、主网治理读等见 **§1.2 Target** 与 **[go-live-checklist](../go-live-checklist.md)**）。

**前置（② 环境）**：测试 **PostgreSQL** 已 migrate；API **`chain_off.db_pool`** 可用；**`GET /meta` → `.did_rank.guides_community_penalty_exclusion`** = **`db_backed`**；前端 **`API_BASE_URL`** 指向测试网 HTTPS；**不设** **`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`**（staging 禁主榜预览注入）；可选 **`DID_RANK_SEED_MARKET_DEMO=1`** 幂等注入副榜 demo listings（与 **`start-api-with-seed`** 同源）。

| # | 项 | ② 通过标准（勾一项写一项证据路径） | ③ 备注 |
|---|-----|-----------------------------------|--------|
| **D1** | **副榜排序真源** | 产品定稿 **`rank_basis`**（任务/收购 **履约单**、**撮合 GMV**、委托/受托 **信誉**，非 **`guide_id` 完成单代理**）；**`list_*_did_rank`** 联 **`market_listings`↔`orders`**（或专用聚合表）；**`check-55`/`smoke`** 断言新键；**[30 §7.2](30-DID排行榜-页面规范.md)** 同批 | 对外排行语义 |
| **D2** | **副榜数据密度** | staging PG 有 **≥10** 条可演示副榜行（seed 或真实业务）；**`limit=100`** 下 travelers/guides/providers/acquisitions **条数与 note** 与 UI 一致 | 满榜产品口径 |
| **D3** | **主榜无假数据** | 测试网 **无** `devPreview` 横幅；无 DB 时 **空列表+note** 或 **明确 chain_off 说明**，**不**满屏未标注假名次 | 诚实边界 |
| **D4** | **奖金池** | **`GET …/prize-pool`**：**`illustrative=true`** 仍须显式；**`source`** 与 **`GET …/governance/pool`**（若有）**对读**记录；月度派奖规则产品签字 | **③** 链上/派奖 SSOT |
| **D5** | **文档同批** | **[30 §7.1](30-DID排行榜-页面规范.md)** 台账与 **§1.2** 一致；**04 §3.4** providers/acquisitions **`rank_basis`** 行已更新 | 防评审误判 |
| **D6** | **E2E · 关键路径** | **[30 §8.6](30-DID排行榜-页面规范.md)**：进页 → period Tab → 四脊签 → 副榜 Top10+分页 → 向导详情 → 「回到我的排名」（Playwright，**测试网 baseURL**） | 窄切片 **≠** 本项 |
| **D7** | **E2E · 93 矩阵** | **[TT-96-20 R9](../runbook/TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)** / **[E2E 覆盖图](../runbook/TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)**：**`93-matrix-path-did-rank-boards`** + 角色/登录变体（staging） | 非 93 全域 GO |
| **D8** | **实时刷新（可选）** | **`NEXT_PUBLIC_DID_RANK_POLL_MS`** 在 staging 开闭各验一轮；**WebSocket** 若立项另开 ADR | WS **非** ② 必达 |
| **D9** | **旅行者公开页** | 有社区档案 UUID 时 **`/community/user/[id]`** 可点且 200；无档案时纯文本（**30 §8.7**） | 产品可选 |

**机读最低集（②，与上表并行）**：测试网 API 上 **`bash scripts/gates/smoke-api-public-routes.sh`** + **`bash scripts/dev/check-55-quick-verify.sh`** **exit 0**（含 **providers/acquisitions** **`…fulfillment…`** **`rank_basis`**、**`limit=100`**）；**`GET /meta`** **`.did_rank`** **`db_backed`**。

**互指**：[缺口总表 · P2 DID 行](缺口与待补-官方总表.md)、**[TT-9628 覆盖边界](../runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)**（**93 全矩阵 GO ≠ 单页 GO**）。

---

## 4. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2025-03-04 | 初版：占位说明、对接意向；50-B3 文档化。 |
| 1.1 | 2025-03-04 | §1 当前状态：有 DB 时按 role 查询；无 DB 时回退 chain_off；无数据源时返回空列表+note（50 已实现）。 |
| 1.2 | 2026-03-24 | §2：`period`/`since`/`limit` 与响应形状；§1 前端归一化说明。 |
| 1.3 | 2026-03-24 | §2：`rank_basis`；活动量排序（完成订单数 / 订单完成时间）与 DB+chain_off 对齐；itineraries 空完成单时回退 created_at。 |
| 1.4 | 2026-03-26 | 篇首 **读前摘要**（SSOT 指针）；与 [00-文档索引](00-文档索引.md) 版本表对齐为 1.0.1。 |
| 1.5 | 2026-03-26 | §1：`is_me` 与可选鉴权说明；前端 `getAuthHeaders`、URL `me` 与 uuid 对齐。 |
| 1.6 | 2026-03-28 | §2：**guides** 按接待金额合计 + 完成单数（**30 §3**）；`reception_gross_total` / `reception_count`；`rank_basis` 更新；chain_off f64 说明。 |
| 1.7 | 2026-03-28 | §3：**check-55-quick-verify** / **smoke-api-public-routes** 增 **`did-rank/guides`** 与 **`rank_basis`** 校验说明；与 **07 §二 2.3**、**缺口** P1-E 一致。 |
| 1.8 | 2026-03-28 | §3：机器验收补 **`did-rank/travelers`**（**`tourist_completed_orders_in_window`**）；脚本与 **00** 版本表同步。 |
| 1.9 | 2026-03-28 | §2：**itineraries** 三态 **`rank_basis`**（含 **`itinerary_created_at_proxy`**）；§3：**check-55** / **smoke** 收紧 **`did-rank/itineraries`**（**`itineraries[]`** + 枚举）；**frontend** `didRank.test.ts`；**07** / **缺口** / **00** 双写。 |
| 1.10 | 2026-03-28 | §3.1：信誉/评价聚合 **Target** 草案（输入、`rank_basis` 命名、合成、反作弊、机器验收、落点）；读前摘要；**04 §3.4** 前端路由补 **`/did-rank`**；**13-1** 表 1；**07** / **00** / **缺口** 双写。 |
| 1.11 | 2026-04-02 | **§1.1**：**`itineraries[]`** 可选 **`creator_community_user_id`** / 前端 **`creatorCommunityUserId`** 与 **`ItineraryTopCard`** 社区链口径（对齐 **07** 批 **550**）；**00** 版本表同步。 |
| 1.12 | 2026-04-03 | **§2**：**guides[]** 增 **`received_review_count`**、**`avg_received_review_score`**（与 §2 窗口一致；DB+chain_off）；**§3.1**：状态改为「加权排序未实现」+ **Partial** 附字段说明；**00** 版本表同步。 |
| 1.13 | 2026-04-03 | **§2**：**`GET …/guides?sort=reviews`** + **`rank_basis`** **`guide_avg_received_review_then_reception_gross_then_completed_count`**（DB+chain_off）；**§3** 机器验收扩 **smoke**/**check-55**；**§3.1** **Partial** 与双轨说明；前端 **`guide_sort`** / **`GuideRankBlock`** 切换；**07** 批 **680** 互证。 |
| 1.14 | 2026-04-03 | **§2**：**`sort=weighted`** + **`rank_basis`** **`guide_weighted_volume_norm_w60_review_avg_norm_w40_then_reception_gross_then_completed_count`**（固定 **0.6/0.4**，`users_sessions` 常量）；**§3**/**§3.1** 与 **smoke**/**check-55** 扩 **`sort=weighted`**；前端 **`guide_sort=weighted`** 三钮；**07** 批 **681** 互证。 |
| 1.15 | 2026-04-03 | **§2**：**`sort=reviews`/`weighted`** 增 **窗口内完成单 ≥3** 入榜；**`rank_basis`** 后缀 **`_min_completed_ge_3`**；**§3** 机器验收与 **`did_rank.rs`** 单测同步；**07** 批 **682** 互证。 |
| 1.16 | 2026-04-03 | **§2**/**§3.1**：**`DID_RANK_GUIDE_*`** env 覆盖 **`N`**/**`w_*`**；**`rank_basis`** 动态键；**08-3 附录 A** 登记；**07** 批 **683** 互证。 |
| 1.17 | 2026-04-03 | **§1**/**§3.1**：**`GET …/did-rank/guides`** **PostgreSQL** 路径剔除 **160** **`community_penalties`** **active** **mute/ban/shadow_ban/limit_feed**（**`db::community_penalties::AND_USER_NOT_EXCLUDED_FROM_DID_RANK_GUIDES`**）；**chain_off** **不**读处罚表；**07** 批 **684** 互证。 |
| 1.18 | 2026-04-03 | **§1**/**§3.1**：**`list_guides_did_rank` 失败回退** **chain_off** 时，若 **`chain_off.db_pool`** 存在：**`list_subject_user_ids_excluded_from_did_rank_guides`** + **`guides_from_chain_off_store`** 同口径剔除（批 **685**）；**无** **`db_pool`** 仍不读库；**07** 批 **685** 互证。 |
| 1.19 | 2026-04-03 | **§1**：**`GET /meta`** 增 **`did_rank`** 块（**`guides_community_penalty_exclusion`** **`db_backed`****/**`chain_off_memory_only`****/**`no_chain_off`****）与 **685** 路径同源；**04** **`GET /meta`** 双表登记；**07** 批 **686** 互证。 |
| 1.20 | 2026-04-03 | **§3**：**`smoke-api-public-routes`****+**`check-55-quick-verify`****（**.sh/.ps1**）在 **`/meta`** JSON 分支校验 **`.did_rank`** 形状及 **`guides_community_penalty_exclusion`****↔**`chain_off_*`** 一致性；**07** 批 **687** 互证。 |
| 1.21 | 2026-04-05 | **§1.1**：**`itineraries[]`** **`tourist_id`****/**`traveler_id`**（同值，**87** 与 **`GET /api/v1/orders`** 双读）；**04** §3.4 **`GET …/did-rank/itineraries`**；**`did_rank.rs`** 单测；**07** 批 **811** 互证。 |
| 1.22 | 2026-04-05 | **87** **订单旅行者** **UUID** **双读** **延伸至** **争议**：**04** §3.4 **`GET /api/v1/disputes*`**、**`POST …/resolve`** 与 **§三** **争议** **条**；**`chain_off/disputes.rs`** **`dispute_party_mirror`** + **`tests_disputes`**；**07** 批 **812** 互证（**非** did-rank 接口变更，附录版本随 **04** **1.0.333** **同批**）。 |
| 1.23 | 2026-04-19 | **§1.2**：旅行收购 **HTTP/DB** 仍为 **Target**（**历史**；**1.24+** 副榜 HTTP **MVP 已接线** — 以 **§1.2 正文** 为准）；**前端** 四脊签 + **`?board=acquisition`** + **`AcquisitionRankBlock`** 与 **[30 §7.1](30-DID排行榜-页面规范.md)** 台账对齐；**`parseDidRankBoardParam`** 真值已支持 **`acquisition`**。 |
| 1.24 | 2026-05-25 | **§1.2 / §2**：副榜 **`rank_basis`** 升级为 **履约单→金额→published listings**；**`limit=100`**；前端副榜 **Top10+11～100** 同构；**`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW`** 显式开启才注入主榜预览；机读闸 **`check-55`/`smoke`** 同步。 |
| 1.25 | 2026-05-25 | **§3.2**：新增 **② 测试网验收清单**（D1～D9）；读前摘要互指 **30 §7.2**。 |
| 1.26 | 2026-05-26 | **变更记录勘误**：**1.23** 行「HTTP/DB Target」标注 **历史**；**§1.2 正文**（**MVP 已接线** + **② 产品 Partial**）为 SSOT；**00 §六** 版本表同步。**无** API/前端源码变更。 |
