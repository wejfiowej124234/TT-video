# TT · Incident Diagnostic Architecture（Pack 13 · LATEST）

**STATUS:** `PACK13_INCIDENT_DIAGNOSTIC_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改 Runtime / Web3 / FTB / 数据 / 权限 / 资金）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/project-cross-maps-10-13.v1.yaml`](../../registry/project-cross-maps-10-13.v1.yaml) `pack_13_incidents`  
**BTA trees:** [`registry/backend-truth-architecture.v1.yaml`](../../registry/backend-truth-architecture.v1.yaml) `incident_trees`（复用，不复制真源）  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-incident-diagnostic-architecture.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`  

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

**`M13_SHALLOW_INCIDENT`:** **0** · **`M13_UNRESOLVED_DIAGNOSTIC_POINTER`:** **0** · **`M13_AMBIGUOUS_ROOT_CAUSE`:** **0** · **`UNEXPLAINED_INCIDENT_PATH`:** **0**  
**本波 STOP：** Pack 13 CLOSED。**禁止**进入 **Phase 2**。Pack 01 是独立后续 Phase 1 波（不是 Phase 2）。  
**禁止：** 改 FTB / Runtime / Web3 / 数据 / RBAC / 资金 · 修 www **405** 刷绿 · 把 **CI-02** WAIT 当代码故障 · **DEPLOYED** 当 **WIRED** · L8 反改 L7

Pack **03–12** 已闭合。本包是 **诊断树 JOIN**：稳定 `INC-*` → 已验证 Layer / CAP / JNY / DEP / DATA / W3 / Money / AUTH / SEC / REL ID。不是新 SSOT。

**先定位层再修改。** Phase 1 只分类，不修复。

---

## 0 · 树的读法

```text
Symptom → Entry Probe → Layer → Capability/Journey → Dependency
  → Failure Class → Next Probe → Stop Condition → Root-Cause Class → Evidence
```

---

## 1 · 禁止跳层（写死）

| 症状 | 禁止跳到 | 正确层 |
|------|----------|--------|
| Login **405** | 账号 / DB reseed | **L3** 历史 Next 页 · `INC-LOGIN` · 现 **CLOSED_REALITY**；seed 401 = L5 |
| `/meta` 或 FTB 滞后 | 反改 L7 地址 | L7 最高 · `INC-L8-VS-L7` |
| 新合约已部署 | 当成 **WIRED** / Official | `DEPLOYED ≠ WIRED` · `INC-WEB3-WIRING` |
| **TIMELOCK** WAIT | 代码故障 | `GATE-CI02-ETA` / `GATE-PM25-ETA` · `INC-TIMELOCK-WAIT` |
| Reality 未闭 | 部署失败 | `GATE-1USDC-REALITY` · `INC-MONEY-SETTLEMENT` |
| Seat/Vault 空 | CI-02 WAIT 或账号 | **NOT_DEPLOYED** · `INC-STEWARD-NOT-DEPLOYED` |

---

## 2 · 16 条树（摘要）

| ID | Family | Root | AS-IS 样本 |
|----|--------|------|------------|
| INC-LOGIN | LOGIN_SESSION | L5_CREDENTIAL | **否** · 历史 www 405 CLOSED · seed 401 非账号重置 |
| INC-FE-BFF | FRONTEND_BFF | L0_HYDRATION | 否 |
| INC-500-503 | API | L2_PROXY | 否 · Pause=503 not 418 |
| INC-403 | RBAC | L5_RBAC | 否 |
| INC-DB-DRIFT | DB_MIGRATION | L6_DB | 否 · 最后才查库 |
| INC-CMS-OBJECT | CMS_OBJECT | CMS_OBJECT | 否 |
| INC-ADMIN | ADMIN | L5_RBAC | 否 · publish ≠ execute |
| INC-INDEXER-LAG | INDEXER_L8 | L8_INDEXER | 否 · 先 L7 receipt |
| INC-L8-VS-L7 | INDEXER_L8 | L8_STAMP_LAG | **是** · 禁止覆盖 L7 |
| INC-WEB3-WIRING | WEB3_CONTRACT_WIRING | DEPLOYED_NOT_WIRED | **是** · CI-02 NEW FR |
| INC-CHAIN-TX-FAIL | WEB3_CONTRACT_WIRING | L7_CHAIN | 否 |
| INC-MONEY-SETTLEMENT | MONEY_SETTLEMENT | REALITY_NOT_CLOSED | **是** · 1 USDC HANDOFF |
| INC-PM-TTG | TTG_PRIMARY_MARKET | TIMELOCK_ETA | **是** · PM25 WAIT |
| INC-TIMELOCK-WAIT | TIMELOCK_GOVERNANCE | TIMELOCK_ETA | **是** · CI-02 + PM25 |
| INC-STEWARD-NOT-DEPLOYED | REGION_STEWARD | NOT_DEPLOYED | **是** · Seat/Vault |
| INC-RELEASE-IDENTITY | RELEASE_RUNTIME_IDENTITY | RELEASE_IDENTITY | 否 · ①≠②≠③ |

---

## 3 · Phase 2 backlog（只记录）

| ID | 事实 |
|----|------|
| P2-LOGIN-405 | 历史 www 405 SUPERSEDED；GAP-LOGIN CLOSED_REALITY |
| P2-CI02-WAIT | CI-02 WAIT = TIMELOCK，不是代码故障 |
| P2-PM25-WAIT | PM25 WAIT = TIMELOCK，不是代码故障 |
| P2-SEAT-VAULT-ASIS | Seat/Vault NOT_DEPLOYED 样本 |
| P2-PHASE2-NOT-STARTED | Phase 2 Production-Grade Review **STOP** |

**禁止**把上表当本波修复或 execute 工单。

**2A overlay（2026-08-15）：** WalletConnect 「未配置」是 Docker ARG 洞，不是 INC-LOGIN / INC-FE-BFF / 账号。`WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` **CLOSED_REALITY**。失败只回修 bake 链。

---

## 4 · 本波不做

- 改 FTB、Runtime、Web3、数据、权限、资金  
- 修 Login 405 让 Journey 变绿  
- 执行 **CI-02** 或 PM **$25**  
- 翻转 `TT_PRODUCTION_GO`  
- 进入 **Phase 2** 升级  
- 用 L8 反改 L7，或把 WAIT / NOT_DEPLOYED / Reality 未闭画成同一种故障
