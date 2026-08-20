# TT · Cross-Layer Capability Map（Pack 10 · LATEST）

**STATUS:** `PACK10_CAPABILITY_MAP_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改 Runtime / Web3 / FTB / 权限 / 资金）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/project-cross-maps-10-13.v1.yaml`](../../registry/project-cross-maps-10-13.v1.yaml)  
**Gate:** `python scripts/dev/check-cross-layer-capability-map.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`  

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

**`M10_SHALLOW_CAPABILITY`:** **0** · **`M10_UNRESOLVED_CROSSPACK_POINTER`:** **0** · **`M10_AMBIGUOUS_RUNTIME_CAPABILITY`:** **0** · **`UNEXPLAINED_CAPABILITY_GAP`:** **0**  
**本波 STOP：** Pack 10 CLOSED。**Pack 11** 是独立后续波（不在本包修复）。**禁止**把本包重开成 Pack 11 工单。  
**禁止：** 改 FTB / Runtime / Web3 / RBAC / 资金 · deploy / execute / 真钱 · 把 **CI-02** / PM $25 并进本包 · 复制/发明第二真源

Pack **03–09** 已闭合。本包是 **JOIN 图**：稳定 `CAP-*` → 已验证节点 ID。不是新 SSOT。  
Pack 01 的 18 个 `CAP-*` 全部入图。`CAP-AUTH-SESSION` 是登录接合键（Pack 01 种子漏了登录）。`CAP-ESCROW-SETTLEMENT` 是 `CAP-ESCROW-USDC` 的释放/退款别名。无 L7 的能力标 **`NONE_NOT_L7`**。

**硬分裂：** ① Local Map/Code ≠ ② Staging Verified ≠ ③ Official/Production Verified · Session ≠ Wallet · Admin publish ≠ Web3 execute · DEPLOYED ≠ WIRED ≠ OFFICIAL_LIVE ≠ CLOSED_REALITY

---

## 0 · 贯穿链（每行同一套字段）

```text
Product (Pack 01 CAP-*)
  → Frontend Route/Action (Pack 02 PAGE.* / ACTION.*)
  → Backend Domain/API (Pack 03 GP-* / capability_map)
  → Data SSOT/Storage (Pack 04 DATA-*)
  → Web3 Contract (Pack 05 W3-* 或 NONE_NOT_L7)
  → Money Flow (Pack 06 S* 或 NONE_NOT_MONEY)
  → Mutation Authority (Pack 07 AUTH-*)
  → Security Boundary (Pack 08 SEC-*)
  → Release/Runtime/Evidence (Pack 09 REL-*)
```

Reality Level 只用：`3_OFFICIAL_PARTIAL` / `NOT_LIVE` / `1_LOCAL` / `2_STAGING`。本波 **没有** Production GO 级 Reality。

---

## 1 · 20 条能力（摘要）

| CAP | FE / BE 要点 | Runtime | Reality |
|-----|----------------|---------|---------|
| CAP-AUTH-SESSION | `/auth/login` · `GP-01.AUTH.*` · `SEC-SESSION-BEARER` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL（历史 www **405** SUPERSEDED） |
| CAP-AI-ITINERARY | `HOME.ITINERARY.CREATE` · `DATA-ITINERARY-*` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-MARKET-GUIDE-BOOK | `/market` guides+orders · `S01/S02` · `W3-SR-FT` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-MARKET-PROVIDER | `PROVIDER.APPLY` · `AUTH-PROVIDER-APPLY` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-MARKET-ACQUISITION | `/market/acquisition` · PD-009 | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-REGION-STEWARD | `GP-07.STEWARD.CLAIM` · `W3-SEAT-REGISTRY` | **TARGET_NOT_LIVE** | **NOT_LIVE** |
| CAP-DID-RANK | `/did-rank` 200 | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-COMMUNITY | feed 200 · 写 401/429 | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-CMS-ANNOUNCE | `DATA-CMS-ANNOUNCEMENT` · `AUTH-CMS-PUBLISH` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-ESCROW-USDC | Wired→SR-FT→OLD FR · `S01–S04` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-ESCROW-SETTLEMENT | `GP-05` · `S07–S09` · 别名 USDC | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-TTG-GATEWAY | quote 401 · PM GOV-04 live · **PM $25 DEPLOYED≠Official** | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-DISPUTES | `DATA-DISPUTE` · `S09` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-MESSAGES | 订单消息 ≠ Community DM | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-ONBOARDING-FIAT | Stripe 正交 · `NONE_FIAT_ORTHOGONAL` | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-GROWTH | `/me/referrals` 401 | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-LEGAL-TRUST | footer | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-GOVERNANCE-PORTAL | Governor/Timelock/Safe · Proposal #3 非 Official | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-ADMIN-FOUR-CENTERS | `SEC-ADMIN-OPS` · 118 路由未展开 | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |
| CAP-I18N | header 语言钮 · Pack 01 仍浅 | OFFICIAL_LIVE | 3_OFFICIAL_PARTIAL |

无任何能力标 **CLOSED_REALITY**。Steward L7 Seat **不是** Official。

---

## 2 · Phase 2 backlog（只记录）

| ID | 事实 |
|----|------|
| P2-PACK01-AUTH-CAP | Pack 01 无登录 CAP |
| P2-ADMIN-118-UNEXPANDED | Admin 118 路由未展开（禁止第 16 张表） |
| P2-LOGIN-NOT-HAPPY-PATH | 历史 www 登录 405 SUPERSEDED · Owner C2 CLOSED_REALITY |
| P2-STEWARD-L7 | Seat/Vault NOT_DEPLOYED |
| P2-CI02-ETA | NEW FR DEPLOYED ≠ Official fee |
| P2-PM25-ETA | $25 DEPLOYED ≠ live impl |
| P2-ACQUISITION-BACKEND-COARSE | Pack 01 `backend_domain=ORDERS` 过粗 |
| P2-CMS-NO-GP | CMS 无 GP-01..08 |
| P2-PACK11-INDEPENDENT | HISTORICAL Pack 10 冻结；Pack 11 是独立后续波 |

**禁止**把上表当本波修复工单。

**2A overlay（2026-08-15）：** `WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` **CLOSED_REALITY**。`CAP-AUTH-SESSION` 仍是 Session；WalletConnect 走 `SEC-WALLET-EOA`。**禁止**把 Session 画成 Wallet。

---

## 3 · Pack 11–13

Pack 11 是独立后续波（`JNY-*` 旅程图）。本包 **不**把 JOIN 图扩成旅程。Pack 12–13 仍是指针种子。

---

## 4 · 本波不做

- 改 FTB、Runtime、Web3、权限、资金  
- 执行 **CI-02** 或 PM **$25**  
- 翻转 `TT_PRODUCTION_GO`  
- 把本包重开成 **Pack 11** 工单（Pack 11 是独立后续波）  
- 把 JOIN 图写成第二真源
