# TT · Wait Window · Public Route Matrix Inventory（LATEST）

**STATUS:** `INVENTORY_SSOT · OFFICIAL_AND_TRACK1_FREEZE · LOCAL_PREP_ALLOWED`  
**Stamp:** `2026-08-11T02:40:36Z`（闸口同步）  
**Parent Inventory:** [`TT-WAIT-WINDOW-EXTENDED-ISSUE-INVENTORY-LATEST`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-INVENTORY-LATEST.md) **v2-deep**  
**Remediation:** [`TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST.md) · Local Prep ACTIVE · **USDC_ONLY** · **Web3 地址不乱改** · **禁 Official Deploy**  
**Machine:** [`TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.json`](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.json)  
**Backend join:** Action → API/Domain/L7/L8 见 [`TT-BACKEND-TRUTH-ARCHITECTURE-LATEST`](./TT-BACKEND-TRUTH-ARCHITECTURE-LATEST.md)（capability map · 本矩阵仍是页/路由债，不替代后端 Spine）

**源：** `frontend/app/**/page.tsx` 枚举 **207** 路由 · ① 冻结交叉 [`WEB3-PAGES-PHASE1-INVENTORY`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-PAGES-PHASE1-INVENTORY.md) · FIVE-MAIN / Auth / Provider / Escrow-draft / Me-identities  
**Official 抽查：** `https://www.web3-ttg.com` HTTP 状态（本轮 · 未登录）

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

## 0 · 读前

```text
本矩阵 = 每页发布级债务地图 · 不授权 Freeze 期内开工
① UI 冻结 ≠ ② Staging GO ≠ ③ Production GO ≠ Reality Seal
支付/双边相关页 = USDC_ONLY（展示与叙事）
已部署 Web3 = FTB 地址不因本矩阵改动
```

| 列 | 含义 |
|----|------|
| **aud** | `pub` 公开 · `auth` 登录后 · `role` 角色 · `admin` 管理 |
| **ui_freeze** | `FROZEN_①` / `PARTIAL` / `NOT_FROZEN` / `ADMIN` / `N/A` |
| **official_http** | 本轮未登录 GET · `—` = 未探 |
| **gap_ids** | 链到 Extended Inventory / B* / H* |
| **when** | HOLD_ETA / POST_SERIAL / POST_GO_QUEUE / SEPARATE / ACCEPT / COVERAGE / CLOSED |

---

## 1 · 汇总

| Bucket | 路由数 | 说明 |
|--------|--------|------|
| public_marketing | 10 | `/` 五主 + legal/help/itinerary |
| market_guides | 9 | market / guides / guide register |
| community | 18 | 五主壳 + UGC 深页 |
| orders_money | 10 | **USDC_ONLY 硬关注** |
| auth | 5 | login/register/reset… |
| identity_me | 21 | me / provider / steward |
| governance | 14 | proposals / staking / fee… |
| other | 2 | discover / network |
| **admin** | **118** | 另表 · 不逐条冒充全站 GO |
| **TOTAL** | **207** | |

---

## 2 · 公开营销 / 五主（pub）

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/` | pub | FROZEN_① 五主 | 200 | 数据链 OK · CMS 多国 OPEN 见 CMS-* | ACCEPT / SEPARATE |
| `/traveltrust` | pub | FROZEN_① | 200 | — | ACCEPT |
| `/traveltrust/announcements` | pub | 维护 | 200 | B6 Announcements DEFER | SEPARATE |
| `/market` | pub | FROZEN_① | 200 | MARKET-L5 · ② 筛选 backlog | ACCEPT |
| `/did-rank` | pub | FROZEN_① | 200 | — | ACCEPT |
| `/help` | pub | 维护 | 200 | — | ACCEPT |
| `/privacy` | pub | 维护 | 200 | LEG-08 · 签收级？ | POST_GO_QUEUE |
| `/terms` | pub | 维护 | 200 | LEG-* | POST_GO_QUEUE |
| `/terms/community-guidelines` | pub | 维护 | — | — | ACCEPT |
| `/trust` | pub | 维护 | 200 | LEG-04 Trust Center | POST_GO_QUEUE |
| `/itinerary/new` | auth/pub | 维护 | 200 | 创建入口 | ACCEPT |
| `/legal/privacy` | pub | — | **404** | F-13 双路径 | POST_GO_QUEUE |
| `/legal/terms` | pub | — | **404** | F-13 | POST_GO_QUEUE |

---

## 3 · 市场 / 导游（pub/role）

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/guides` | pub | 维护 | 200 | — | ACCEPT |
| `/guides/[id]` | pub | 维护 | — | Guide EN bio DEFER G-02 | SEPARATE |
| `/guide` | role | 维护 | 200 | G-01 接待空 COVERAGE | COVERAGE |
| `/guide/register` | pub | FROZEN_① | 200 | — | ACCEPT |
| `/market/acquisition` | role | Hub 冻 + 子站① | 200 | G-04/05 bond ②③ | POST_GO_QUEUE |
| `/market/acquisition/[id]` | role | ① | — | — | ACCEPT |
| `/market/provider` | role | ① 子站 | 200 | — | ACCEPT |
| `/market/provider/showcase/[id]` | pub | ① | — | — | ACCEPT |
| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/discover` | pub | other | **307** | 可能跳转 market/home | ACCEPT |
| `/network` | pub | other | 200 | — | ACCEPT |

---

## 4 · 社区（pub/auth）· 五主壳冻

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/community` | pub | FROZEN_① shell | 200 | M-01 video READY · M-02 media 404 | SEPARATE |
| `/community/explore` | pub | ① shell | 200 | M-04 mobile/search DEFER | SEPARATE |
| `/community/tt` | pub | ① | — | — | ACCEPT |
| `/community/post/[id]` | pub | ① | — | M-03 评论写读 · M-07 | POST_GO / COVERAGE |
| `/community/topic/[tag]` | pub | ① | — | — | ACCEPT |
| `/community/user/[id]` | pub | ① | — | — | ACCEPT |
| `/community/activity` | auth | ① | — | MSG-* | SEPARATE |
| `/community/friends` | auth | ① | — | — | ACCEPT |
| `/community/feedback` | auth | ① | — | — | ACCEPT |
| `/community/guidelines` | pub | ① | — | — | ACCEPT |
| `/community/messages` | auth | ① | — | MSG-01 notifications | SEPARATE |
| `/community/messages/[id]` | auth | ① | — | — | SEPARATE |
| `/community/me` | auth | ① | — | — | ACCEPT |
| `/community/me/posts` | auth | ① | — | — | ACCEPT |
| `/community/me/likes` | auth | ① | — | — | ACCEPT |
| `/community/me/collects` | auth | ① | — | — | ACCEPT |
| `/community/me/reports` | auth | ① | — | — | ACCEPT |
| `/community/me/reports/[id]` | auth | ① | — | — | ACCEPT |

---

## 5 · 订单 / 支付 / Escrow（**USDC_ONLY**）

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/orders` | auth | L5 维护 | 200 | U-01 旁路 COVERAGE · USDC 列表已验 | COVERAGE / ACCEPT |
| `/orders/new` | auth | 维护 | — | — | ACCEPT |
| `/orders/[id]` | auth | 维护 | — | 可能重定向 escrow | ACCEPT |
| `/pay` | auth | ① Pay hub 收口 | 200 | B5-G-002 **CLOSED** · USDC · 终态诚实 | CLOSED / ACCEPT |
| `/escrow/[id]` 草稿 | auth | FROZEN_① Experience | — | U-08 CLOSED | CLOSED |
| `/escrow/[id]` 已上链 | auth | **NOT_FROZEN** | — | F-07 · Track1 后 | POST_SERIAL |
| `/escrow/[id]/chain` | auth | 维护 | — | W-04 fail-closed · H4 | ACCEPT |
| `/escrow/[id]/proof` | auth | 维护 | — | — | ACCEPT |
| `/escrow/[id]/rate` | auth | **NOT_FROZEN** | — | WEB3 inventory ⚠️ | POST_GO_QUEUE |
| `/disputes` | auth | 维护 | 200 | — | ACCEPT |
| `/disputes/[id]` | auth | 维护 | — | LEG-06 仲裁≠PSP | ACCEPT |
| `/me/payments` | auth | — | **404** 页 | U-03 · B4-G-009 | **POST_GO_QUEUE** |

---

## 6 · Auth

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/auth/login` | pub | FROZEN_① | 200 | SEC-10 session gate OK | ACCEPT |
| `/auth/register` | pub | FROZEN_① | 200 | SEC-01 OTP/auto-verify | POST_GO_QUEUE |
| `/auth/forgot-password` | pub | 维护 | 200 | SEC-02 reset stub | POST_GO_QUEUE |
| `/auth/reset-password` | pub | 维护 | 200 | SEC-02/07 | POST_GO_QUEUE |
| `/auth/verify-email` | pub | 维护 | 200 | SEC-01 | POST_GO_QUEUE |

---

## 7 · Me / 身份 / 入驻

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/me` | auth | 维护 | 200 | — | ACCEPT |
| `/me/identities` | auth | FROZEN_① Hub | 200 | G-05 PD-009 | ACCEPT |
| `/me/identities/*/settings` | auth | 维护 | — | 四角色 settings | ACCEPT |
| `/me/settings` | auth | 维护 | — | — | ACCEPT |
| `/me/settings/trust` | auth | 维护 | 200 | PFA-03 /me/trust | POST_GO_QUEUE |
| `/me/settings/profile` | auth | 维护 | — | — | ACCEPT |
| `/me/settings/privacy` | auth | 维护 | — | LEG | POST_GO_QUEUE |
| `/me/settings/language` | auth | 维护 | — | UXQ-01 i18n | SEPARATE |
| `/me/settings/notifications-prefs` | auth | 维护 | — | MSG-* | SEPARATE |
| `/me/settings/data` | auth | 维护 | — | — | ACCEPT |
| `/me/password` | auth | 维护 | — | SEC-04 session revoke | POST_GO_QUEUE |
| `/me/security` | auth | 维护 | — | SEC-* | POST_GO_QUEUE |
| `/me/onboarding` | auth | 维护 | — | — | ACCEPT |
| `/me/publish` | auth | 维护 | — | — | ACCEPT |
| `/me/referrals` | auth | 维护 | — | Growth | SEPARATE |
| `/provider` | role | 维护 | — | G-03 | POST_GO_QUEUE |
| `/provider/register` | pub | FROZEN_① | 200 | — | ACCEPT |
| `/steward/register` | pub | FROZEN_① | 200 | GOV-05 stake UI | POST_GO_QUEUE |

---

## 8 · 治理 / Staking（非五主 · ① 数据链收口）

| Route | aud | ui_freeze | official_http | gap_ids / note | when |
|-------|-----|-----------|---------------|----------------|------|
| `/governance` | pub/auth | ① 收口维护 | 200 | GOV-02 Hub PARTIAL | ACCEPT |
| `/governance/proposals` | auth | ① | 200 | — | ACCEPT |
| `/governance/proposals/new` | auth | ① | — | — | ACCEPT |
| `/governance/proposals/[id]` | auth | ① | — | — | ACCEPT |
| `/governance/delegate` | auth | ① | — | — | ACCEPT |
| `/governance/params` | auth | ① | — | GOV-03 TTG params | ACCEPT |
| `/governance/fee-routes` | auth | ① | — | GOV-01 DEFER depth | SEPARATE |
| `/governance/vault-forwards` | auth | ① | — | — | ACCEPT |
| `/governance/distribution-accruals` | auth | ① | — | — | ACCEPT |
| `/governance/distribution-accruals/[id]` | auth | ① | — | — | ACCEPT |
| `/governance/distribution-claim` | auth | ① | — | wallet claim · 主网资金后 | HOLD_ETA / POST_SEAL |
| `/governance/net-profit-ledger` | auth | ① | — | GOV-08 | HOLD_ETA |
| `/governance/vacancy-ledger` | auth | ① | — | 83 vacancy | SEPARATE |
| `/staking` | auth | ① 收口 | 200 | — | ACCEPT |

---

## 9 · Admin（118）· 压缩矩阵（不逐条冒充已验）

| 族 | 例路由 | gap_ids | when |
|----|--------|---------|------|
| Ops Orders/Disputes | `/admin/orders` · `/admin/disputes` | A-01…05 · **USDC H3** · Cert UAT | POST_GO_QUEUE |
| Finance | `/admin/finance*` · fee-router · reconciliation | C-05 USDC · USER_FUNDS | POST_GO / HOLD |
| Indexer | `/admin/indexer*` | W-04 · H4 | POST_SERIAL |
| CMS Content | `/admin/content/*` | CMS-* · B6 | SEPARATE |
| Official/OCS | `/admin/official/*` | Public Surface | SEPARATE |
| Growth | `/admin/growth/*` | — | SEPARATE |
| Community mod | `/admin/community/*` | MSG / mod | SEPARATE |
| Onboarding/PSP | `/admin/onboarding/*` | PSP-* | POST_GO_QUEUE |
| Governance admin | `/admin/governance*` · vacancy · region-* | 83 / GOV | SEPARATE / HOLD |
| Platform | config · flags · secrets · backup · observability | OPS-* · CFG-* | POST_GO_QUEUE |
| Inbox/Users | `/admin/inbox` · users · guides | RBAC-* · MSG | POST_GO_QUEUE |

**Official 未登录：** `/admin` · `/admin/orders` · `/admin/disputes` → 通常 **307/200 登录墙**（AUTH_GATED · 正向）。

**V65：** tip freeze · PRV-2 Cert UAT · G014 · 见 A-05/A-06。

---

## 10 · USDC_ONLY 路由关注表（发布级）

以下路由涉及金额/支付/双边时 **必须 USDC**（R-USDC-1）：

`/orders` · `/orders/[id]` · `/pay` · `/escrow/[id]` · `/escrow/[id]/chain` · `/disputes*` · `/me/payments`（若恢复） · `/guide` 接待金额 · `/admin/orders*` · `/admin/finance*` · `/admin/disputes*` · `/governance/distribution-claim` · `/governance/net-profit-ledger` · `/staking`（若展示资金）

---

## 11 · Official 抽查摘要（2026-08-11）

| 结果 | 路由 |
|------|------|
| **200** | `/` market did-rank community explore guides guide auth/* pay orders help privacy terms trust governance proposals staking provider/register guide/register steward/register me me/identities me/settings/trust market/acquisition|provider itinerary/new disputes network traveltrust* |
| **307** | `/discover` · `/admin*`（未登录登录墙） |
| **404** | `/me/payments` · `/legal/privacy` · `/legal/terms` |

---

## 12 · 诚实边界

- 207 路由枚举 **完整** · Admin 118 **族级** 覆盖（非每叶 Runtime Cert）  
- HTTP 200 ≠ 功能闭环 ≠ Content QA ≠ 法律签收  
- ① FROZEN ≠ ③ GO  
- 本矩阵 **不** 在 Freeze 期授权修复  

**下一动作：** 仍 Freeze → ETA Track1 → 再按 Remediation Ladder 开 **R-USDC-1** 等包。
