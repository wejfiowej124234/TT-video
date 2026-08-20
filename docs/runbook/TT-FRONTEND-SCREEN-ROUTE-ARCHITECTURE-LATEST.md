# TT · Frontend Screen / Route Architecture（Pack 02 · LATEST）

**STATUS:** `PACK02_FRONTEND_SCREEN_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改 Runtime / Web3 / FTB / 数据 / 权限 / 资金 · **不改五主结构**）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/frontend-design-matrix-seed.v1.yaml`](../../registry/frontend-design-matrix-seed.v1.yaml)  
**Route census:** [`TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.json`](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.json)（**207** · Admin **118**）  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-frontend-screen-route-architecture.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M2_SHALLOW_FRONTEND`:** **0** · **`M2_UNRESOLVED_ROUTE_POINTER`:** **0** · **`M2_UNRESOLVED_ACTION_CAPABILITY`:** **0** · **`M2_AMBIGUOUS_SCREEN_RUNTIME_STATUS`:** **0** · **`UNEXPLAINED_FRONTEND_GAP`:** **0**  
**本波 STOP：** Pack 02 CLOSED。**禁止**进入 **Phase 2**  
**禁止：** 为矩阵变绿修 UI · 改 **五主** 结构 · 把 Target 当 Live · 修 www **405** · execute **CI-02** / **$25**

① Pack 02 地图加深 ≠ ② staging GO ≠ ③ Production GO。

Official `https://www.web3-ttg.com` 是 Frontend 主要 AS-IS 取证面。207 路由枚举完整；Admin 118 是域不是第 16 张矩阵。只引用 Pack 01 / 03–13 已验证 ID。

---

## 0 · 行的读法

```text
Product Domain → Route → Screen/Page → Layout/Shell → Section → Component
  → User Action → Capability → API/Data Dependency → Auth/Role Boundary
  → Desktop/Mobile State → Loading/Empty/Error/Disabled → Runtime Status
  → Evidence → Known Gap
```

**硬分裂（写死）：** **Route Exists ≠ Screen Complete ≠ Action Works ≠ E2E Closed**

**AS-IS 写死：** 历史 www 登录 **405** = `ACTION_BLOCKED` 现 **CLOSED_REALITY** / `ACTION_WIRED` · Region Steward **TARGET_NOT_LIVE** · PM www chrome 当前 **10→10** 且 **$25 WAIT** · Official `/meta` NEW PM 100_000 · CMS 25T pulse · Official 移动端 **NOT_PROBED**。

---

## 1 · 207 路由普查（JSON 真源 · 不复制页债）

| Bucket | 条数 | 完整性 | FE-* |
|--------|------|--------|------|
| public_marketing | 10 | SCREEN_PARTIAL | HOME / TRAVELTRUST / DID-RANK / ITINERARY / LEGAL / CMS |
| market_guides | 9 | SCREEN_PARTIAL | MARKET / GUIDES / GUIDE-DASH / PROVIDER / ACQUISITION |
| community | 18 | SCREEN_PARTIAL | COMMUNITY / MESSAGES |
| orders_money | 10 | SCREEN_PARTIAL | ORDERS / ESCROW / DISPUTES / PAY |
| auth | 5 | ACTION_WIRED | LOGIN / REGISTER（历史 ACTION_BLOCKED / 405 SUPERSEDED） |
| identity_me | 21 | SCREEN_PARTIAL | ME / IDENTITIES / PROVIDER / STEWARD / GROWTH |
| governance | 14 | SCREEN_PARTIAL | GOVERNANCE / TRAVELTRUST |
| other | 2 | ROUTE_EXISTS | HOME（discover 307） |
| **admin** | **118** | ROUTE_EXISTS | CMS / OPS / FINANCE / 118-FAMILY |

未登录 Official：五主 **200** · `/auth/login` GET **200** POST 历史 **405** 现 Owner C2 **200** · `/admin*` **307** · `/legal/privacy` **404** · `/me/payments` **404**。

---

## 2 · 31 条屏幕（摘要）

| Domain | FE | Official runtime | 已知缺口 |
|--------|----|------------------|----------|
| PUBLIC | FE-HOME | SCREEN_PARTIAL | create 依赖 405 |
| TTG | FE-TRAVELTRUST | SCREEN_PARTIAL | **10→10** chrome ED · **$25 WAIT** bake |
| GUIDE | FE-MARKET | SCREEN_PARTIAL | book 405 |
| DID_RANK | FE-DID-RANK | ACTION_WIRED | 读 200 |
| COMMUNITY | FE-COMMUNITY | SCREEN_PARTIAL | 写 405 |
| AUTH | FE-AUTH-LOGIN | **ACTION_WIRED** | 历史 www **405** SUPERSEDED · GAP-LOGIN CLOSED_REALITY |
| TRAVELER | FE-ME | SCREEN_PARTIAL | /me/payments 404 |
| PROVIDER | FE-PROVIDER-REGISTER | SCREEN_PARTIAL | 405 |
| ACQUISITION | FE-MARKET-ACQUISITION | SCREEN_PARTIAL | PD-009 |
| ORDER_ESCROW | FE-ESCROW | SCREEN_PARTIAL | 1 USDC HANDOFF |
| GOVERNANCE | FE-GOVERNANCE | SCREEN_PARTIAL | #3 正交 |
| REGION_STEWARD | FE-STEWARD | **TARGET_NOT_LIVE** | Seat/Vault 未部署 |
| ADMIN | FE-ADMIN-118-FAMILY | ROUTE_EXISTS | **118** 非逐屏 E2E |
| FUTURE_APP | FE-FUTURE-APP | DESIGN_ONLY | 另一 L0 |

Desktop/Mobile：五主 ① desktop lock；Official 移动端 **NOT_PROBED**（原 Modal 列空，现记为缺口而非完成）。

---

## 3 · Phase 2 backlog（只记录）

| ID | 事实 |
|----|------|
| P2-LOGIN-405 | GET 200 ≠ 历史 Action Works；现 Owner C2 200 CLOSED_REALITY |
| P2-STEWARD-TARGET | Steward Target ≠ Live |
| P2-PM25-WAIT | 活 chrome 10→10；$25 WAIT www bake |
| P2-ADMIN-118-SCREENS | 118 Route Exists ≠ Screen Complete |
| P2-RESPONSIVE-I18N | 移动端未探 |
| P2-LEGAL-404 | /legal/* 404 |
| P2-ME-PAYMENTS-404 | 页 404 |
| P2-FUTURE-APP-L0 | DESIGN_ONLY |
| P2-PHASE2-NOT-STARTED | Phase 2 **STOP** |

**禁止**把上表当本波修复工单。**禁止**改五主结构。

**2A overlay（2026-08-15）：** `WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` **CLOSED_REALITY** on historical hop Official FE `2ba08bd4` — Dockerfile ARG/ENV only; Sheet 无「未配置」· 真实 QR。该 hop **SUPERSEDED as live product**（活面 `OPS-2026.08.20-v9` / `3e356617` / `2026-08-20T00:51:57Z`；historical `daa5ae87` SUPERSEDED）。**禁止** Header/Community/CMS 回流。

---

## 4 · 本波不做

- 改 FTB、Runtime、Web3、数据、权限、资金  
- 修 Login 405 结构/视觉或任何 UI 让矩阵变绿（FIVE-MAIN 仍冻；405 已 CLOSED_REALITY）  
- 把 Region Steward / $25 / Future App 画成 Live  
- 把 Admin 118 拆成第 16 张矩阵  
- 开工 **Phase 2**
