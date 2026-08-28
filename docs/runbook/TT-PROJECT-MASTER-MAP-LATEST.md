# TT · Project Master Map（LATEST）

**Machine role:** `MAPS_OVER_TRUTH`（地图组织真源，不是新 SSOT）  
**Taxonomy:** `CONTENT_SEEDED_MAPS_OVER_TRUTH`  
**STATUS:** `PHASE_1_AS_IS_ARCHITECTURE_FROZEN`  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/project-architecture-taxonomy.v1.yaml`](../../registry/project-architecture-taxonomy.v1.yaml) · [`registry/project-final-master-map.v1.yaml`](../../registry/project-final-master-map.v1.yaml) · [`TT-PROJECT-MASTER-MAP-LATEST.json`](./TT-PROJECT-MASTER-MAP-LATEST.json) · [`TT-PROJECT-FINAL-MASTER-MAP-LATEST.json`](./TT-PROJECT-FINAL-MASTER-MAP-LATEST.json)  
**Depth audit:** [`TT-PROJECT-PACK-DEPTH-AUDIT-LATEST.md`](./TT-PROJECT-PACK-DEPTH-AUDIT-LATEST.md) · [`registry/project-pack-depth-audit.v1.yaml`](../../registry/project-pack-depth-audit.v1.yaml)  
**L7↔L8 recon:** [`TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md`](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)（Pack **00** `PHASE_1_AS_IS_ARCHITECTURE_FROZEN` · Pack **01**–**14** CLOSED · Phase 2B **FORBIDDEN** · Gap Audit **CLOSED** · **Phase 2A** convergence **ACTIVE** · Phase 1 总原则 FROZEN）  
**Gap Register:** [`TT-PHASE2-PRODUCTION-GRADE-GAP-REGISTER-LATEST.md`](./TT-PHASE2-PRODUCTION-GRADE-GAP-REGISTER-LATEST.md)  
**2A Convergence:** [`TT-PHASE-2A-FULL-MATRIX-CONVERGENCE-LATEST.md`](./TT-PHASE-2A-FULL-MATRIX-CONVERGENCE-LATEST.md)  
**Dashboard:** [`TT-PROJECT-ARCHITECTURE-COVERAGE-DASHBOARD-LATEST.md`](./TT-PROJECT-ARCHITECTURE-COVERAGE-DASHBOARD-LATEST.md)  
**Gate:** `python scripts/dev/check-project-final-master-map.py` · `python scripts/dev/check-project-architecture-taxonomy.py`  
**Official live surface:** `https://www.web3-ttg.com` · API `https://api.web3-ttg.com`  
**`TT_PRODUCTION_GO`:** `NO_GO`（本包是导航地图，不翻转 GO）  
**产品升阶唯一协议：** [V9修复工作流程](./TT-V9-FIX-WORKFLOW-LATEST.md)（`UNIQUE_PRODUCT_PROMOTION_PROTOCOL` · ≠ TTG V9 合约轨）

> **Official 产品真源（活面）：** `https://www.web3-ttg.com` · `git_sha=e95dc2b9dfb836d62287b4c61b8c880e5ca3bc26` · `build_time=2026-08-28T05:39:38Z` · image `deployment-01M13E4507AASFZYHYPRKR1Z8M` · API `59b4a4064839be9f5649ac974eaeae8739b774ec` · **≠** git checkout · previous Bundle `aa3ca1b1e3d5a1fa3c53080c4e539c9b9f3e56b5` / `5b98879c19d5630b29bfc236e1fba255219422d4` / API `8c522cdcfc655cfdcc5866d219dfc3254d833e32` SUPERSEDED as living · and `5c70d833a684e665d255f458a0efa1aa2b56b0cf` / `8c522cdcfc655cfdcc5866d219dfc3254d833e32` and `7b25440f9fe26dae3a5ed2c10c7b57eb1716c539` / `6255987700405ebaced1824b5838c25a2797f17c` and `f148be96ef2155f5843ae6abd773941fcd719a24` SUPERSEDED as living · historical OPS-v9 bake `3e356617a498b0faac42e4ae457343d36294a770` / API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` = **SUPERSEDED** as living Official · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md) · 升阶协议 [`TT-V9-FIX-WORKFLOW-LATEST`](./TT-V9-FIX-WORKFLOW-LATEST.md)  
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

这些包是 **把已有真源组织成能看懂、排障、开发、发布的工程地图**。  
**不是** 15 套新 SSOT。地址 / ABI / `/meta` / Hard Gate / GO 仍以 [FTB](./TT-FINAL-TRUTH-BASELINE-LATEST.md) · [04](../spec/04-后端与API.md) · [14](../spec/14-合约-API-ABI-前后端对齐.md) · Registry 为准。

---

## 0 · Phase 1 总原则（FROZEN · `THREE_TRUTH_PLANES`）

**Phase 1 不追求把 TravelTrust 写成完美系统，而是 100% 准确地画出今天真实是什么。**  
**Phase 2 Gap Audit** 已用这张冻结地图登记缺口（**CLOSED**）。**Phase 2A** 正在按梯子收敛并关闭已分类缺口。**Phase 2B** 架构升级评审仍 **FORBIDDEN**。  
**矩阵服从 Reality，而不是 Reality 为了矩阵好看而被修改。**

### 0.1 · 真源 ≠ 地图（三平面）

| 平面 | 范围 | 角色 | 禁止 |
|------|------|------|------|
| **Official 产品现实** | Web / API / Admin / DB | **当前产品**的主要取证面 | 用本地页冒充官网；因 405 换源 |
| **Web3 L7 Reality** | Chain / Timelock `operations.done` | Web3 事实的**最高真源** | 因 `/meta` 滞后而改链上读法 |
| **FTB / Registry** | 规则 / 冻结锚 | stamp 锁表 · 发布规则 | 用 `/meta` 覆盖 FTB，或用 FTB 覆盖 `/meta` |

**L8**（Indexer · Official `GET /meta` · 官网观察）= 产品/投影现实，**不是** L7。  
`DEPLOYED ≠ WIRED ≠ DEPLOYED_NOT_WIRED ≠ OFFICIAL_LIVE ≠ REALITY_VERIFIED ≠ CLOSED_REALITY ≠ SCHEDULED_WAITING_ETA ≠ SUPERSEDED ≠ NOT_DEPLOYED`。

官网某个字段滞后，**不得**反过来篡改链上事实。

### 0.2 · 方法（写死）

```text
                    Phase 1 · 建完整 AS-IS 地图
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   Official 产品现实       Web3 L7 Reality       FTB / Registry
 Web/API/Admin/DB         Chain/Timelock         规则/冻结锚
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                 1 张 Project Master Map
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
      专业矩阵              专业矩阵             专业矩阵
 Frontend/Backend/Data   Contract/Money      Security/Release...
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    多张 Cross Maps
             Capability / Journey / Dependency
                    / Incident / Reality
                              │
                              ▼
                     14 Dashboard
                              │
                              ▼
                   Phase 1 AS-IS FROZEN
                              │
                              ▼
             Phase 2 · Production-Grade Review
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          找问题            定优先级           优化/修复
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                 Local → Staging → Official
                              │
                              ▼
                    Reality / Evidence
```

**Web3 特殊处理：** 生命周期必须忠实。已 Official Live 写 `OFFICIAL_LIVE`；已部署等 Timelock 写 `DEPLOYED` / `SCHEDULED_WAITING_ETA`；已部署没接线写 `DEPLOYED_NOT_WIRED`；未部署写 `NOT_DEPLOYED`；被新路径替代写 `SUPERSEDED`；只有真实证据闭环才允许 `REALITY_VERIFIED` / `CLOSED_REALITY`。

**其它矩阵按 Official AS-IS 建。** Frontend / Backend / Data / Product / Admin / CMS / Auth 优先回答：*2026-08 当前官网真正运行的 TravelTrust 到底是什么样？*  
例：`www POST /auth/login` 历史 **405** 已 **SUPERSEDED**（BATCH-A **CLOSED_REALITY** · Owner C2 · 历史 hop Official FE **2ba08bd4** = 产品基线 **3e600076** + CLOSED Session/BFF `9959ae50` + WalletConnect bake · 历史 API **80eed10f**）。活面 Official 产品真源 = **OPS-2026.08.20-v9**（identity **`3e356617`** / image **`hybrid-…-v9`** / bootstrap **v8**）· historical pin **`daa5ae87`** SUPERSEDED · API **`8df2ab21`**。Phase 1 当时禁止为刷绿先修；现 **禁止回流** 重复审计 Session。`GAP-FE-BFF-BYPASS` **CLOSED_REALITY**。`OFFICIAL_FE_RELEASE_LINEAGE_REGRESSION` **CLOSED_REALITY**。`WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` **CLOSED_REALITY**（历史 hop · 禁止整包回滚 / 禁止 living HEAD）。`GAP-1USDC-HANDOFF` money-path **CLOSED_REALITY**（Owner A · Track2 L7+L8）。`GAP-E2E-JOURNEY` Official C2 non-money book hop **CLOSED_REALITY**。Pack 01 **HANDOFF** 仅剩全局 JNY / Owner GO remaining。

**Pack 12 红绿灯图必须保留。** 它把静态矩阵变成可导航工程地图：`CAP-AUTH → JNY-LOGIN → Frontend L0/L2 → Backend L3 → 405`，或 `Region Steward → Contract → Money → Authority → Security → Release → Dependency → NOT_DEPLOYED`。

**Phase 2 才审架构：** AS-IS → Production Requirement → GAP → Severity → Architecture Decision → Fix → Test → Staging → Official → Reality Evidence。Phase 1 不把「好像乱」修成「看起来整齐」。

---

## 0.3 · 判断（对用户方案的答复）

**方向正确。** 只做 Frontend Matrix + Backend Matrix 覆盖不了 TravelTrust。  
最终应是 **1 张总图 + 分职责矩阵 + 贯穿关系图**，用统一 ID 关联，**禁止超级矩阵**。

| 问 | 答 |
|----|----|
| 先冻 00–14 再填内容？ | **是。** 目录已冻；**01–13** 已是 **DEEP_PARTIAL**；**02** 已闭。Phase 2A **ACTIVE** · 2B **STOP**。仍保留 `SHALLOW_SEEDED` 分级词（现计数 0）。 |
| 要不要再加第 16 张矩阵？ | **不要。** 浅层标 `SHALLOW_SEEDED` / `NEEDS_DEEPENING`，缺口进现有矩阵。 |
| 覆盖百分比？ | **禁止 AI 估。** Pack 14 单品/Reality/GO % = `NOT_COMPUTED`。平面计数由状态机出。 |
| 官网登录有问题，还以官网为准？ | **是。** 登录走 GP-01 / INC-LOGIN，不因此改用本地页冒充 Official。 |

四视角已经够用：

| 视角 | 问题 | 包 |
|------|------|-----|
| 产品 | 我们提供什么能力？ | 01 · 11 |
| 工程 | 前端 / 后端 / 数据 / Web3 怎么实现？ | 02 · 03 · 04 · 05 · 06 · 10 |
| 控制 | 谁能改什么？ | 07 · 08 |
| 发布 | 有没有真上线、真钱、Evidence？ | 09 · 12 · 13 · 14 |

---

## 1 · TravelTrust Project Master Map

```text
TravelTrust Project Master Map
│
├─ A Product / Business     产品能力与业务流程          → 01 · 11
├─ B Frontend               页面 / Section / Action     → 02 · 10
├─ C Backend                API / Auth / Domain / DB    → 03 · 10
├─ D Data                   DB / CMS / Media / Indexer  → 04
├─ E Web3 / Money           Escrow / Settlement / PM    → 05 · 06
├─ F Governance             TTG / Seat / Governor       → 07
├─ G Security / Permission  RBAC / Wallet / Safe        → 08
├─ H Release / Runtime      Local → Official → Mainnet  → 09
└─ I Evidence / Final Truth SSOT / Reality / Hard Gate  → 09 · 14
```

打开这一页，只回答：**整个项目由哪几套系统组成。** 细节进对应矩阵。

---

## 2 · 00–14 目录（职责冻死）

```text
TRAVELTRUST SYSTEM ARCHITECTURE
│
├── 00 PROJECT MASTER MAP                         本页
├── 01 PRODUCT CAPABILITY MATRIX                  M1
├── 02 FRONTEND DESIGN MATRIX                     M2
├── 03 BACKEND ARCHITECTURE & RUNTIME MATRIX      M3  ← 已用 BTA 播种
├── 04 DATA TRUTH & STORAGE MATRIX                M4
├── 05 WEB3 CONTRACT ARCHITECTURE MATRIX          M5
├── 06 COMMERCIAL MONEY LIFECYCLE MATRIX          M6
├── 07 GOVERNANCE & ECONOMIC MATRIX               M7
├── 08 SECURITY / IDENTITY / AUTHORITY MATRIX     M8
├── 09 RELEASE / RUNTIME / EVIDENCE MATRIX        M9
├── 10 FRONTEND ↔ BACKEND CAPABILITY MAP          X10
├── 11 END-TO-END GOLDEN JOURNEYS                 X11
├── 12 DEPENDENCY / BLOCKER GRAPH                 X12
├── 13 INCIDENT DIAGNOSTIC TREES                  P13
└── 14 MASTER COVERAGE DASHBOARD                  P14
```

用户原稿「8 个核心矩阵」在 **Web3 拆成架构 + 资金生命周期** 之后，内容矩阵是 **01–09 共 9 张**（Data 单列 + Web3 拆分）。目录编号按用户 00–14 冻死，不再改名。

---

## 3 · 缺口检查（对照官网 + 现仓，不另开矩阵）

对照 Official `www.web3-ttg.com`（2026-08-15 未登录抽查）和 `crates/api/src/routes/mod.rs` 的 `api_router()`。  
**缺的不是第 16 张矩阵，是这些域必须写进已有矩阵：**

| 缺口 | 官网 / 代码事实 | 放进 |
|------|-----------------|------|
| **AI 行程** | 首页英雄位 · 10 国定制旅行 | **01** 一等能力，不是附属 |
| **CMS 内容运营** | 首页公告「来自 Admin CMS — 无静态 fallback」· Production Preparation 唯一持续主线 | **01 + 04** 必填域 |
| **五角色** | `/traveltrust` 游客/向导/商家/收购/主理人 | **01** |
| **市场三子站** | `/market` 旅行预约 / 商家 / 旅行收购 | **01 + 02** |
| **社区深链** | `/community` 动态·消息·好友·媒体 | **01 + 03 + 04** |
| **DID 排行榜** | 五主路由 + `did_rank` router | **01 + 03** |
| **Admin 118 路由** | Public Route Matrix 207 中 118 为 admin | **02 + 08** 域，不开 Admin Matrix |
| **双资金轨** | `/traveltrust` 写明 TTG 网关 **与 USDC 托管分轨** | **05 架构 / 06 资金**；Fiat/Stripe = **正交**，进 06 备注 |
| **双身份** | Session + 连接钱包；社区未登录钱包 disabled | **08** |
| **内容所有权三角** | CMS vs OCS vs Public Ops vs API vs Catalog fallback | **04** |
| **双轨发布** | Official mainnet ≠ Sepolia DEMOTED ≠ Staging | **09** |
| **争议 / 消息 / 法务披露** | FAQ + `/disputes` + `/messages` + 信任中心 | **01** |
| **i18n** | 顶栏语言按钮 | **02 列**，不开 i18n 矩阵 |
| **未来 App** | BTA L0 `DESIGN_ONLY` | **02/03 的 L0 消费者** |
| **CFG / PER** | 已冻结 | **09 冻结章节** |
| **`/meta` vs FTB 地址** | L8 观察可能列出 lineage 地址，不等于 L7 Official live | **05 只读 vs 09**；本波不改 FTB |

**明确不开的矩阵：** CMS / Admin / i18n / Mobile / Observability / CFG / Legal / Fiat / 超级矩阵。

现仓已有、只做指针、禁止再抄一份：

| 包 | 活真源（已存在） |
|----|------------------|
| 02 | [Public Route Matrix](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.md)（207 路由） |
| 03 | [Backend Truth Architecture](./TT-BACKEND-TRUTH-ARCHITECTURE-LATEST.md)（L0–L8） |
| 01 | [`product-capability-matrix.v1.yaml`](../../registry/product-capability-matrix.v1.yaml)（19 CAP · AS-IS 405 / Steward TARGET / www chrome 10→10+$25 WAIT · Official `/meta` NEW PM 100_000） |
| 04 运营面 | [`cms-asset-matrix.v1.yaml`](../../data/catalog/cms-asset-matrix.v1.yaml) |
| 05 / 09 | [FTB](./TT-FINAL-TRUTH-BASELINE-LATEST.md) · [`mainnet-address-registry.v1.yaml`](../../registry/mainnet-address-registry.v1.yaml) |
| 06 / 07 | [83](../spec/83-区域治理与收益分配-协议白皮书.md) · [83-GROUNDED](../../evidence/GO_mainnet_money_path/WEB3-DESIGN-CONSISTENCY-83-GROUNDED-LATEST.md) |
| 08 | [`admin-rbac-permissions.v1.yaml`](../../registry/admin-rbac-permissions.v1.yaml) · [AUTH TRACE](./TT-AUTH-SESSION-RUNTIME-TRACE-LATEST.md) |
| 11 | [TT-9625 用户脊](./TT-9625-golden-path-system-spine.md) |

---

## 4 · Official 抽查（本波证据脚注 · 未登录）

登录有问题 **仍然以官网为活表面**。禁止用「先重置账号 / 先改 DB」起手。

| 探针 | 结果 | 落层 |
|------|------|------|
| `GET /` `/market` `/traveltrust` `/community` `/auth/login` | 页面 200 · 五主 + CMS + 五角色 + TTG/USDC 分轨披露 | L0 |
| `POST https://www.web3-ttg.com/auth/login` | **200** Owner Official C2（历史 **405** SUPERSEDED · GAP-LOGIN CLOSED_REALITY） | L3 · INC-LOGIN 已闭 L3；seed 401 = L5 |
| `GET https://www.web3-ttg.com/api/v1/me` 无 Bearer | **401**（L2 503 占位已闭） | L4 预期 |
| `GET https://api.web3-ttg.com/meta` | **200** `chain_id=1` pause=false · indexer lag=0 · checkpoint `25759530` · `MAINNET-OFFICIAL-LIVE-PARTIAL` | L8 |
| `GET …/community/feed` · `…/discover/orders` | **200** | L3 公开读 |
| `GET …/governance/ttg-exchange/quote` | **401** `STRICT_SESSION_GATE=1` | L4 · 进 08 |
| `/auth/login` · `/community` 钱包按钮 | disabled（未登录） | L0 + 08 双身份 |

**不要**从「数据库显示成功」推导「链上成功」。那是 04 要登记的 Data ID 行。

---

## 5 · Pack 03 八域已盘进 BTA（本波）

`api_router()` 36 模块现均映射到 BTA 域（`gap=0`）。八个新一等域：

| 域 | L3 | GP | Probe | Failure |
|----|----|----|-------|---------|
| ITINERARY | POST /api/v1/itineraries* | GP-04 | PROBE-ITINERARY | 401 / 503 |
| DISPUTES | /api/v1/disputes* | GP-04 | PROBE-DISPUTES | 401 / ACL 404 |
| MESSAGES | /api/v1/orders/:id/messages | GP-04 | PROBE-ORDER-MESSAGES | 401 · **≠ Community DM** |
| DID_RANK | /api/v1/did-rank/* | GP-04 | PROBE-DID-RANK | empty projection |
| ONBOARDING | /api/v1/onboarding/* + Stripe hook | GP-01 | PROBE-ONBOARDING | 401 / 429 / Stripe null |
| GROWTH | growth + me/referrals + trust-growth | GP-01 | PROBE-GROWTH | 401 / 503 |
| GUIDES | /api/v1/guides* | GP-04 | PROBE-GUIDES | empty catalog |
| PROVIDER | POST /api/v1/provider-applications | GP-01 | PROBE-PROVIDER | 401 |

随后 **04** Data Truth 已逐 Data ID 播种；**08→02→01→05→06→07→09→10–13** 已从既有真源播种。  
**14** 由闸口状态机写出 [`TT-PROJECT-MASTER-COVERAGE-DASHBOARD-LATEST.json`](./TT-PROJECT-MASTER-COVERAGE-DASHBOARD-LATEST.json)：覆盖率 **`NOT_COMPUTED`**。  
**深度：** 15 包有行；**03 + 04 + 05 + 06 + 07 + 08 + 09 + 10 + 11 + 12 + 13 = DEEP_PARTIAL**。其余见 [深度审计](./TT-PROJECT-PACK-DEPTH-AUDIT-LATEST.md)。`packs_seeded=15` **不是**覆盖率。

Web3 / Indexer / GO **继续只读 Reality**。本波不改 FTB、`/meta` 契约、Indexer、Timelock、`TT_PRODUCTION_GO`。

---

## 6 · 填写顺序（本波已执行）

```text
00 冻结构
 → 03 八域 inventory（已闭）
 → 04 Data Truth（已播种）
 → 08 Security → 02 Frontend → 01 Product
 → 05 Contract Architecture → 06 Money Lifecycle
 → 07 Governance → 09 Release
 → 10–13 Cross-map
 → 14 Dashboard 状态机（产品 % = NOT_COMPUTED；平面计数已算）
```

---

## 7 · Pack 14 仪表盘（状态机 · 非产品完成率）

真源 JSON：[`TT-PROJECT-MASTER-COVERAGE-DASHBOARD-LATEST.json`](./TT-PROJECT-MASTER-COVERAGE-DASHBOARD-LATEST.json) · 人读：[`TT-PROJECT-ARCHITECTURE-COVERAGE-DASHBOARD-LATEST.md`](./TT-PROJECT-ARCHITECTURE-COVERAGE-DASHBOARD-LATEST.md)

| 平面 | 机读 | 禁止解读 |
|------|------|----------|
| ARCHITECTURE_MAP_COMPLETE | Pack 01–13 `DEEP_PARTIAL` 13/13 | 不是产品 100% |
| OFFICIAL_LIVE | PARTIAL | 不是 REALITY_VERIFIED |
| REALITY_VERIFIED | false（money-path hop CLOSED_REALITY Owner A · Official book hop CLOSED_REALITY · Pack 01 still **HANDOFF** for global JNY / Owner GO） | 不是全局 CLOSED_REALITY |
| CLOSED_REALITY | false | 不是 PRODUCTION_GO |
| PRODUCTION_GO | `NO_GO` | 不得因地图闭合翻 GO |

| System | Coverage | Reality | Open P0/P1 | Current Gate |
|--------|----------|---------|------------|--------------|
| Product | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `MAP_COMPLETE_GAPS_OPEN` |
| Frontend | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `ACTION_WIRED`（历史 405 CLOSED_REALITY） |
| Backend | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `MAP_COMPLETE_GAPS_OPEN` |
| Data | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `MAP_COMPLETE_GAPS_OPEN` |
| Web3 | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `NO_GO`（Hard GO / 全局 Reality；living P0 false；1 USDC money-path hop closed） |
| Governance | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `TARGET_NOT_LIVE` |
| Security | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `ACTION_BLOCKED` |
| Release | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `NO_GO` |
| Evidence | `NOT_COMPUTED` | `NOT_COMPUTED` | `NOT_COMPUTED` | `NO_GO` |

Web3 须见 `OFFICIAL_LIVE` / `DEPLOYED` / `SCHEDULED_WAITING_ETA` / `NOT_DEPLOYED` / `SUPERSEDED` / `LEGACY`。Frontend 须见 `ROUTE_EXISTS` / `SCREEN_PARTIAL` / `ACTION_WIRED` / `ACTION_BLOCKED`（历史） / `TARGET_NOT_LIVE`。当前 Gap：CI-02 hop B WAIT · PM $25 L7 **LEGACY**（www bake FORBIDDEN）· 1 USDC · Login 405 CLOSED_REALITY · Region Steward。

① 绿 / 本地收口 ≠ ② staging GO ≠ ③ Production GO。窄切片 GO 不得冒充全站矩阵 GO。

---

## 7a · 深度分级（有行 ≠ 九项字段）

金标准：Purpose / SSOT / Runtime / Dependency / Probe / Failure Class / Security Boundary / Evidence / Status。  
完整表：[TT-PROJECT-PACK-DEPTH-AUDIT-LATEST.md](./TT-PROJECT-PACK-DEPTH-AUDIT-LATEST.md)

| Pack | 分级 |
|------|------|
| 00 | **NAV_ONLY** · 已总装 · `PHASE_1_AS_IS_ARCHITECTURE_FROZEN` |
| 03 | **DEEP_PARTIAL**（八域 L3+L5+L6 · `M3_SHALLOW_NODE=0` · CMS/ADMIN 仍缺 L3） |
| 04 | **DEEP_PARTIAL**（23 Data ID 十四字段 · `M4_SHALLOW_ROW=0` · L7≠L8≠PG） |
| 05 | **DEEP_PARTIAL**（20 合约节点九字段 · `M5_SHALLOW_NODE=0` · Seat/Vault NOT_DEPLOYED） |
| 06 | **DEEP_PARTIAL**（S01–S14 十四资金字段 · `M6_SHALLOW_FLOW=0` · Safe/P4Cap INTERIM ≠ 83 Vault） |
| 07 | **DEEP_PARTIAL**（24 权威 hops · `M7_SHALLOW_AUTHORITY=0` · READ≠MUTATE≠ADMIN≠GOVERN≠EXECUTE） |
| 08 | **DEEP_PARTIAL**（24 安全 hops · `M8_SHALLOW_SECURITY=0` · Session≠Wallet · Safe 1/1≠团队审批） |
| 09 | **DEEP_PARTIAL**（24 发布 hops · `M9_SHALLOW_RELEASE_NODE=0` · DEPLOYED≠WIRED≠OFFICIAL_LIVE≠CLOSED_REALITY） |
| 10 | **DEEP_PARTIAL**（20 CAP 贯穿 · `M10_SHALLOW_CAPABILITY=0` · Steward TARGET_NOT_LIVE · 登录 405） |
| 11 | **DEEP_PARTIAL**（14 JNY-* · `M11_SHALLOW_JOURNEY=0` · OFFICIAL_LIVE ≠ END_TO_END_CLOSED_REALITY） |
| 12 | **DEEP_PARTIAL**（16 DEP-*/GATE-* · `M12_SHALLOW_DEPENDENCY=0` · #3 ≠ CI-02 ≠ PM25） |
| 13 | **DEEP_PARTIAL**（16 INC-* · `M13_SHALLOW_INCIDENT=0` · 405=L3 · WAIT≠代码） |
| 01 | **DEEP_PARTIAL**（19 CAP · `M1_SHALLOW_PRODUCT=0` · 405 PARTIAL · Steward TARGET_NOT_LIVE · www chrome 10→10 · $25 WAIT · Official `/meta` NEW PM 100_000） |
| 02 | **DEEP_PARTIAL**（31 FE-* · 207/118 · `M2_SHALLOW_FRONTEND=0` · 405 ACTION_BLOCKED · Steward TARGET · 10→10/$25 WAIT www chrome ED） |
| 14 | **COUNTS_ONLY** · 平面计数已算 · 单品 % 仍 `NOT_COMPUTED` · `packs_seeded` 不是覆盖率 |

官网同日复探仍以 `https://www.web3-ttg.com` 为准。  
**L7/L8 对账：** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md) — Wired+`/meta` 均指向 SR-FT；FTB `20260812` 锁表仍写 Track1 SR = **EXPLAINED stamp lag**（禁止用 `/meta` 改 FTB）。`GET /did-rank` **200**。  
**九字段加深：** Pack **00** 本波已总装并签发 **`PHASE_1_AS_IS_ARCHITECTURE_FROZEN`**（**禁止 Phase 2**）；Pack **01**–**14** CLOSED。`UNEXPLAINED_CONFLICT=0` 必须保持。

---

## 8 · 硬规则

1. **THREE_TRUTH_PLANES。** Official = 产品现实取证面；Web3 = L7+Timelock 最高真源；FTB = 冻结锚。地图组织真源，不是新 SSOT。  
2. **矩阵服从 Reality。** 禁止为整齐而合并生命周期。  
3. **一张矩阵一个问题。** 合约依赖 ≠ 一美元去向 ≠ 谁能改系统。  
4. **先定位包和层，再动手。** 登录失败 = GP-01，不是改账号；Phase 1 不修 405 刷绿。官网产品缺陷升阶只走 [V9修复工作流程](./TT-V9-FIX-WORKFLOW-LATEST.md)，地图不是第二套 hop。  
5. **L7 ≠ L8。** `DEPLOYED ≠ WIRED ≠ OFFICIAL_LIVE ≠ CLOSED_REALITY`。  
6. **Pack 12 红绿灯图保留。** 静态地图 → 可导航工程地图。  
7. **官网是活表面。** 登录故障记进 08 + 03，不换源。  
8. **禁止** 用本包宣称 Production GO。Phase 2 才 Production-Grade Review。

---

## 9 · Pack 00 总装（`PHASE_1_AS_IS_ARCHITECTURE_FROZEN`）

Join key = **`cap_id`**. Pack **10** 是九专业架构的贯穿表，不是新真源。  
反向索引由状态机写出：[`TT-PROJECT-FINAL-MASTER-MAP-LATEST.json`](./TT-PROJECT-FINAL-MASTER-MAP-LATEST.json)。

### 9.1 · 九专业架构

| Pack | 矩阵 | 专业 | 稳定 ID |
|------|------|------|---------|
| 01 | M1 | Product / Business | `CAP-*` |
| 02 | M2 | Frontend | `FE-*` |
| 03 | M3 | Backend | `N-L*`, `GP-0*` |
| 04 | M4 | Data | `DATA-*` |
| 05 | M5 | Web3 | `W3-*` |
| 06 | M6 | Money | `S01`–`S14` |
| 07 | M7 | Authority | `AUTH-*` |
| 08 | M8 | Security | `SEC-*` |
| 09 | M9 | Release | `REL-*` |

### 9.2 · 四张贯穿图

| Pack | 图 | 稳定 ID |
|------|----|---------|
| 10 | Capability join | `CAP-*` → product/frontend/backend/data/web3/money/authority/security/release |
| 11 | E2E Journey | `JNY-*` |
| 12 | Dependency / Gate | `DEP-*` / `GATE-*` |
| 13 | Incident / Diagnostic | `INC-*` |

追踪口诀：`CAP-*` → `FE-*` / Action → `GP-*` / API / ACL → `DATA-*` → `W3-*` L7/L8 → `S0*` 资金 → `AUTH-*` → `SEC-*` → `REL-*` → `GATE-*`/`DEP-*` 阻塞 → `INC-*` 证据。

样例：`CAP-AUTH-SESSION` → `FE-AUTH-LOGIN` / `JNY-TRAVELER-LOGIN` `AUTH.LOGIN.SUBMIT` → `GP-01` `POST /auth/login` → `DATA-SESSION` → `NONE_NOT_L7` → `AUTH-TRAVELER-SELF` → `SEC-SESSION-BEARER` → `REL-PROBE-UAT` → `DEP-LOGIN-WWW-405` / `GATE-CI02-ETA` 正交 → `INC-LOGIN`。官网 www POST **405** = 历史 AS-IS，现 **CLOSED_REALITY**（Owner C2 **200** HttpOnly）。

样例：`CAP-REGION-STEWARD` → `FE-STEWARD` → `JNY-REGION-STEWARD-CLAIM` → `GATE-SEAT-CI01` → `INC-STEWARD-NOT-DEPLOYED` · `W3-SEAT-REGISTRY` **NOT_DEPLOYED** · **TARGET_NOT_LIVE**。

### 9.3 · 冻结的真实状态（与 Pack 14 平面一致）

| 平面 / Gap | 机读 |
|------------|------|
| ARCHITECTURE_MAP_COMPLETE | Pack 01–13 `DEEP_PARTIAL` 13/13 · **不是**产品 100% |
| OFFICIAL_LIVE | **PARTIAL** |
| REALITY_VERIFIED | **false** · Track2 **1 USDC** money-path **CLOSED_REALITY** Owner A · Official book hop **CLOSED_REALITY** · Pack 01 still **HANDOFF** for global JNY / Owner GO |
| CLOSED_REALITY | **false** |
| PRODUCTION_GO | **NO_GO** |
| Login www 405 | `FE-AUTH-LOGIN` `ACTION_WIRED` · `DEP-LOGIN-WWW-405` · `INC-LOGIN` · **CLOSED_REALITY** |
| CI-02 | `GATE-CI02-ETA` `SCHEDULED_WAITING_ETA`（hop B Official FR cutover WAIT / FORBIDDEN） |
| PM $25 | Pack 05 `W3-PM-IMPL-25` **LEGACY** · Official sale = NEW PM `0x882Ad…` · `GATE-PM25-ETA` remaining = Official www bake **FORBIDDEN** |
| Region Steward / Seat | `TARGET_NOT_LIVE` / `NOT_DEPLOYED` |

`M00_UNRESOLVED_PACK=0` · `M00_UNRESOLVED_POINTER=0` · `M00_ORPHAN_ID=0` · `M00_DEPENDENCY_CYCLE=0` · `M00_STATUS_DRIFT=0` · `UNEXPLAINED_TRUTH_CONFLICT=0`。

**冻结基线 STOP。禁止 Phase 2B execute。禁止修 405。禁止 execute CI-02 hop B / 禁止 bake Official www。PM $25 L7 已历史 CLOSED。禁止部署 Seat/Vault。禁止改 FTB 地址 / Runtime Secrets / FIVE-MAIN UI。下一步 = Owner 书面 GO 或继续 NO_GO。**

### 9.4 · Phase 2 Gap Audit（本波 overlay · 不解冻 00–14）

唯一登记：[`TT-PHASE2-PRODUCTION-GRADE-GAP-REGISTER-LATEST.md`](./TT-PHASE2-PRODUCTION-GRADE-GAP-REGISTER-LATEST.md) · `OPEN_GAPS` / `OPEN_P0` **以 Gap Register 机读为准**（禁止手填旧 `27`/`2` 冒充活计数）。  
Audit **CLOSED** · Cycle2 `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · `TT_PRODUCTION_GO=NO_GO`。下一步 = Owner 书面 **GO** 或 **继续 NO_GO**。

