# TT · Backend Truth Architecture（LATEST）



> **ACTIVE V9 documentation pointer:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING`.  
> Fee/sale/gov claims that cite P4Cap sale sink · globalStakers 35.75% · R2_FINAL · Safe-as-V9-admin = **LEGACY / SUPERSEDED / DO_NOT_USE_AS_ACTIVE_TRUTH**. This file remains living for non-V9-token architecture / Money Path Reality where marked KEEP.

**STATUS:** `ACTIVE_ARCHITECTURE_SSOT` · **Pack 03** of [Project Master Map](./TT-PROJECT-MASTER-MAP-LATEST.md)  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/backend-truth-architecture.v1.yaml`](../../registry/backend-truth-architecture.v1.yaml) · [`TT-BACKEND-TRUTH-ARCHITECTURE-LATEST.json`](./TT-BACKEND-TRUTH-ARCHITECTURE-LATEST.json)  
**Gate:** `python scripts/dev/check-backend-truth-architecture.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`（本包只读 Reality，不翻转）  

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

**Overlay:** [L7↔L8 recon](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md) · FTB `20260812` **READ_ONLY**  
**Pack 03 九字段：** `M3_SHALLOW_NODE=0` · `M3_UNRESOLVED_POINTER=0` · Pack 03 **CLOSED**（不重开；Pack 05 为后续独立波）

本包 = **03 Backend Architecture & Runtime Matrix** 的活播种。全项目目录与职责见 **00 Master Map**；不要把 Data / Web3 / Governance / Security 再塞进这一张。

前端负责：**用户在哪里、看到什么、能点什么。**  
后端负责：**请求走哪里、业务在哪执行、钱在哪里流、数据在哪里存、链上发生什么、系统是否正确观察到、出了问题该查哪层。**

---

## 0 · 读前（硬规则）

```text
① 本地 → ② 测试网 → ③ 公网/生产   禁止跳阶
本包 = 后端工程母地图 · 不是再画一张 18
L7/L8 纳入架构与只读 Reality · 本轮不修改这些轨
DEPLOYED ≠ WIRED ≠ OFFICIAL_LIVE ≠ CLOSED_REALITY
先定位 Layer，再动手
```

| 禁止 | 正确 |
|------|------|
| 「登录不了」先改账号 / 先改 DB | 先走 **GP-01 / INC-LOGIN**：`/auth/login` → Cookie → `/me` → Proxy → RBAC |
| 「页面没数据」先改前端 | 先判 L7 receipt 还是 L8 Indexer 还是 L3 API 还是 L0 渲染 |
| 把 Web3 / Indexer 塞进 External | **L7 = 链上发生** · **L8 = 系统是否观察到** |
| 用本包冒充 Production GO | `TT_PRODUCTION_GO: NO_GO` |

**不替代：** [04](../spec/04-后端与API.md) · [14](../spec/14-合约-API-ABI-前后端对齐.md) · [18](../spec/18-TravelTrust-全系统架构图.md) · [FTB](./TT-FINAL-TRUTH-BASELINE-LATEST.md) · [TT-9625 用户脊](./TT-9625-golden-path-system-spine.md) · [前端路由矩阵](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.md)

---

## 1 · 八件套（职责不同）

```text
BACKEND TRUTH ARCHITECTURE
│
├── 01 Runtime Spine          请求死在哪一层？     L0 → L8
├── 02 Domain Matrix          某业务经过哪些层？
├── 03 Golden Paths           GP-01 → GP-08（APP 复用）
├── 04 Dependency Graph       谁依赖谁 · 能不能现在做？
├── 05 Incident Decision Trees 401/403/405/503/Indexer…
├── 06 Coverage Matrix        架构覆盖 · 非 93 全矩阵 GO
├── 07 Probe Registry         已有探针，不新发明生产闸
└── 08 Frontend ↔ Backend Capability Map
```

前端矩阵对拍：[Public Route Matrix](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.md)（页/路由）↔ 本包（请求/域/链/投影）。  
全项目目录：[Project Master Map](./TT-PROJECT-MASTER-MAP-LATEST.md)（本包 = **03**）。

**Domain inventory (2026-08-15)：** 八域已进 Domain Matrix + L3 nodes + GP/Probe/Failure — `ITINERARY` · `DISPUTES` · `MESSAGES`（订单线程，≠ Community DM）· `DID_RANK` · `ONBOARDING` · `GROWTH` · `GUIDES` · `PROVIDER`。  
Official 2026-08-15：`GET www /api/v1/me` 无会话 → **401**（L2 503 已闭）；`POST www /auth/login` 历史 **405** SUPERSEDED · Owner C2 **200** HttpOnly。

---

## 2 · Level A — Executive Map（Owner）

```text
Client → Edge → API → Auth/Domain → DB → Web3 → Indexer → Runtime Truth
 L0        L1     L3        L5         L6    L7      L8         L8
```

| 层 | 现在怎么读（只读 Reality） |
|----|---------------------------|
| L0 Web | Official `www` 活着 · App = `DESIGN_ONLY` |
| L2 Proxy | Official `GET /api/v1/me` 无 Bearer = **401**（503 占位已闭）· 见 [AUTH TRACE](./TT-AUTH-SESSION-RUNTIME-TRACE-LATEST.md) |
| L6 DB | 内部真源 · 不是登录失败的第一嫌疑 |
| L7 Web3 | Official create path = SR-FT（Track1 SR **SUPERSEDED**）· Track1 CLOSED_REALITY · **≠** GO |
| L8 Truth | Indexer / `/meta` / FTB · `TT_PRODUCTION_GO=NO_GO` |

红黄绿不要做成 PASS/FAIL。用生命周期：`WIRED` / `PRODUCT_READY_WAITING_RUNTIME` / `DEPLOYED_NOT_WIRED` / `CLOSED_REALITY` / `BLOCKED`。

---

## 3 · Level B — Runtime Spine（9 层）

```text
TravelTrust Backend Runtime Spine

L0  Client / Consumer
│    Web · Future App · Admin Console · Automation / Runner · Wallet
L1  Edge / Network
│    DNS · Cloudflare · TLS · Fly ingress · CORS · timeout / rate edge
L2  BFF / Proxy / Origin Routing
│    Next rewrite · proxyTraveltrustApi · SITE_URL · API_BASE_URL
L3  API Surface / Contract
│    /auth/* · /me · /admin/* · /orders · /community · /governance · /meta · /health
L4  Request Control / Middleware
│    Session · Bearer · Idempotency · Rate limit · Pause · Headers · validation
L5  Identity / Authorization / Domain
│    identity · roles · capabilities · admin RBAC · state machine · rules
L6  Persistence / Internal Data
│    PostgreSQL · migrations · sessions · CMS metadata · catalog · config
L7  Web3 Runtime / Money Path          ← 真正发生了什么
│    RPC · Escrow · Settlement · FeeRouter · PrimaryMarket · Seat
│    Region Vault · P4Cap · Governor · Timelock
L8  Projection / Runtime Truth / Release  ← 系统是否正确观察、投影、证明
     Indexer · checkpoint · event projection · Registry · /meta
     build identity · FTB · Evidence · Hard Gate · TT_PRODUCTION_GO
```

**为什么 L7 ≠ L8**

```text
Release tx PASS
↓
USDC conservation PASS          ← L7
↓
Indexer checkpoint 卡住         ← L8
↓
Official API/UI 看不到 Released
↓
Track2 不能 CLOSED_REALITY
```

`$25/TTG` 同理：L7 live = `1e18` · L8 Target = `4e16` · 必须双披露。真源：[Primary Market price SSOT](../../frontend/lib/governance/primaryMarketRuntimePriceSsot.ts)。

---

## 4 · Level C — Domain × Layer Matrix

| Domain | L3 API | L4 Gate | L5 Logic | L6 Data | L7 Web3 | L8 Projection |
| ------ | ------ | ------- | -------- | ------- | ------- | ------------- |
| Auth | `/auth/*` · `/me` | session | identity | users/sessions | — | session evidence |
| Community | posts/comments | idem/rate | ACL | posts/comments | — | — |
| CMS | public/catalog | public read | ownership | CMS metadata | — | Live vs fallback |
| Media | uploads / access | auth/size | object owner | object metadata | — | — |
| Orders | `/orders` | auth/idem | state machine | orders | Escrow | events |
| Settlement | chain-sync | capability | release rules | order projection | SR/FR | Indexer |
| TTG Sale | quote | wallet/auth | sale rules | purchase records | PM/P4Cap | Indexer/meta |
| Steward | admin/API | RBAC | Seat | seat projection | Seat/Vault/FR | Indexer |
| Governance | proposals | wallet | gov rules | proposal cache | Gov/Timelock | Indexer |
| Admin | `/admin/*` | RBAC | capabilities | audit | observe | /meta |
| Platform | `/health` `/meta` | public/rate | — | config | addresses | FTB / GO |

Auth drilldown：

```text
Login → Cookie/token → Session → /me → RBAC → UI Identity
```

Primary Market drilldown：

```text
Quote → PM Proxy → Impl → USDC → TTG → P4Cap → Event → Indexer → API → UI
```

---

## 5 · Golden Paths（GP-01…08）

后端不给每条路由画完整链。核心只固定这 8 条。未来 App：

```text
Web Client ─┐
            ├→ GP-01 ... GP-08
iOS/Android ┘
```

| ID | 路径 | 最少经过 |
|----|------|----------|
| **GP-01** | Login / Session | L0–L6 |
| **GP-02** | Community Write | L0, L2–L6 |
| **GP-03** | Media Upload | L0, L2–L6 |
| **GP-04** | Order → Escrow | L0, L3–L8 |
| **GP-05** | Settlement → Fee | L5–L8 |
| **GP-06** | USDC → TTG | L0, L3, L5, L7, L8 |
| **GP-07** | Region Fee → Vault/P4Cap → Claim | L5, L7, L8 |
| **GP-08** | Governance → Timelock → Spend | L0, L3, L5, L7, L8 |

**GP-06**

```text
Homepage
→ quote API
→ wallet
→ PrimaryMarket Proxy
→ implementation
→ USDC
→ P4Cap
→ TTG inventory
→ Purchase event
→ Indexer
→ API
→ UI   （live 1e18 vs candidate 4e16 双披露）
```

用户脊 [TT-9625](./TT-9625-golden-path-system-spine.md) 仍是「注册→meta→市场→创单→托管」阅读入口。本包的 GP 是**后端排障/复用**脊，两者互补。

---

## 6 · Dependency Graph（能不能现在做？）

```text
PrimaryMarket → TTG inventory → USDC → P4Cap → Governor → Timelock
```

```text
Region Fee → SettlementRouter → FeeRouter → SeatRegistry
                                      ├→ RegionVault → Claim
                                      └→ P4Cap
```

例：Vault **尚未**主网部署（CI-03）；FeeRouter NEW 已部署但 **未 execute**。不要把「代码写完」标成 DEPLOYED。  
一眼语言：

```text
RegionStewardVault JP
IMPLEMENTED     ✅
UNIT_PASS       ✅
DEPLOYED        ❌  CI-03 NOT_DEPLOYED
WIRED           ❌
OFFICIAL_LIVE   ❌
CLOSED_REALITY  ❌
```

节点 14 字段与生命周期枚见 YAML `node_fields` / `status_enum`。

### Pack 03 八域 L5/L6（本波闭合 · STOP）

表名来自 `crates/api/migrations` + `db/*`。**禁止**把 L6 projection 当 L7。

| Domain | L5 ACL | L6 表（已证） | Status |
|--------|--------|---------------|--------|
| ITINERARY | session · draft `owner_user_id` | `itinerary_custom_drafts` · `itineraries` | WIRED |
| DISPUTES | party / arbitrator / admin · else 404 | `disputes` JOIN `orders` | WIRED |
| MESSAGES | tourist \| guide user · else 403 | `order_messages` | WIRED |
| DID_RANK | public · `community_penalties` 剔除 | `orders` · `reviews` · `community_penalties` · `did_rank_rank_snapshots` | OFFICIAL_LIVE / WIRED |
| ONBOARDING | quote 公+限流 · entitlements session | `onboarding_entitlements` · `onboarding_payment_events` | WIRED |
| GROWTH | validate 公 · `/me/referrals` session | `referral_codes` · `referral_events` | WIRED |
| GUIDES | list `status=active` · write session | `guides`（`stake_amount` ≠ L7） | OFFICIAL_LIVE / WIRED |
| PROVIDER | session · dual-write | `role_applications` · `role_documents` | WIRED |

`M3_SHALLOW_NODE=0` · `M3_UNRESOLVED_POINTER=0` · Pack 03 **CLOSED**。不重开本包。

---

## 7 · Incident Decision Trees

### 登录不了 → INC-LOGIN（先 L3/L2/L4/L5）

```text
POST /auth/login ?
 ├─ 401 → Credential / Account (L5)
 ├─ 404/405 → Route (L3)  历史 Next 页 POST = 405 SUPERSEDED；现 Session/BFF 200
 ├─ 5xx → API runtime 或 Proxy (L2)
 └─ 200
      ↓
Cookie / token persisted?
 ├─ no → Cookie / Edge / Browser (L0/L1)
 └─ yes
      ↓
GET /api/v1/me ?
 ├─ 401 → Session (L4)
 ├─ 403 → RBAC (L5)
 ├─ 503 → Proxy / pause (L2/L4)  曾 ME_PROXY_503
 └─ 200
      ↓
UI still anonymous? → Hydration / client state (L0)
```

旁证：[AUTH SESSION TRACE](./TT-AUTH-SESSION-RUNTIME-TRACE-LATEST.md)

### 链上成功但页面没更新 → INC-INDEXER-LAG（先 L7 再 L8）

```text
Receipt status=1?          (L7)
 ↓
Indexer checkpoint >= tx block?  (L8)
 ├─ no → ingestion lag/stall
 └─ yes
      ↓
event projection exists?
 ├─ no → ABI / filter / address
 └─ yes → API 返回投影? → UI 渲染?
```

其它树（YAML `incident_trees`）：**403** · **404/405** · **418**（今日未观测；Pause = **503 `api_paused`**）· **429** · **500/503** · **DB drift** · **Chain tx fail**。

---

## 8 · Frontend ↔ Backend Capability Map

不是两座孤岛。每个前端 Action 有一个后端 capability key。

| Frontend | Backend | Domain | 落到 |
|----------|---------|--------|------|
| `AUTH.LOGIN.SUBMIT` | `GP-01.AUTH.LOGIN` | Auth | `POST /auth/login` |
| `AUTH.SESSION.HYDRATE` | `GP-01.AUTH.ME` | Auth | `GET /api/v1/me` |
| `COMMUNITY.COMMENT.REPLY` | `COMMUNITY.POST_COMMENT` | Community | `POST …/posts/:id/comments` |
| `COMMUNITY.MEDIA.UPLOAD` | `GP-03.MEDIA.UPLOAD` | Media | `POST …/uploads/community-posts` |
| `HOME.TTG_PURCHASE.SUBMIT` | `GP-06.PM.PURCHASE` | TTG | quote + PrimaryMarket |
| `HOME.ITINERARY.CREATE` | `GP-04.ORDERS.CREATE` | Orders | `POST /api/v1/orders` |
| `ESCROW.RELEASE.SUBMIT` | `GP-05.SETTLEMENT.RELEASE` | Settlement | SR + Indexer |
| `STEWARD.CLAIM.SUBMIT` | `GP-07.STEWARD.CLAIM` | Steward | Vault/P4Cap |
| `GOVERNANCE.PROPOSAL.QUEUE` | `GP-08.GOV.QUEUE` | Governance | Governor → Timelock |
| `ADMIN.RBAC.ACTION` | `ADMIN.RBAC` | Admin | `/api/v1/admin/*` |

点前端树上的按钮，应能回答：**哪个 API → 哪个 Domain → 哪张表 → 哪个合约 → 哪个 Indexer → 哪个 Reality。**

本轮只**播种** join key。不改 207 路由前端矩阵正文。

---

## 9 · Coverage · Probes · 本轮边界

Coverage = **架构覆盖已播种**。**≠** 93 全矩阵 GO · **≠** ② staging · **≠** ③ Production GO。

| Domain | GP | 架构行 | ③ |
|--------|----|--------|---|
| Auth | GP-01 | COVERED（有 TRACE） | OPEN |
| Community / Media | GP-02/03 | COVERED | OPEN |
| Orders / Escrow | GP-04 | COVERED | OPEN |
| Settlement | GP-05 | Track2 WIRED→SR-FT · 1 USDC Reality 未 PASS | NO_GO |
| TTG | GP-06 | 双披露 | NO_GO |
| Steward | GP-07 | CI-03 **NOT_DEPLOYED** | NO_GO |
| Governance | GP-08 | remaining CI-02 / PM $25 ETA | NO_GO |
| Platform `/meta` | — | OBSERVE_ONLY | NO_GO |

已有探针（不新开生产闸）：proxy vitest · `vertical-slice-02-main-spine.sh` · `smoke-api-public-routes.sh` · `check-official-mainnet-web3-alignment.sh`（只读）· 本包 `check-backend-truth-architecture.py`。

---

## 10 · 维护

改 Spine / Domain / GP / Incident / Capability Map → **同批**改 YAML，再跑：

```bash
python scripts/dev/check-backend-truth-architecture.py
```

须 exit 0。脚本会重写本目录 JSON companion。

**本轮明确不改：** FTB 地址、`/meta` 契约、Indexer 语义、Timelock/Governor/PrimaryMarket live 参数、`TT_PRODUCTION_GO`。
