# TT · Release / Runtime / Evidence Matrix（Pack 09 · LATEST）

**STATUS:** `PACK09_RELEASE_EVIDENCE_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改 FTB / Runtime / Secrets / 部署 / Timelock / 资金状态）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/release-runtime-evidence-matrix.v1.yaml`](../../registry/release-runtime-evidence-matrix.v1.yaml)  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Integrity stamp (historical):** [TT-V65-PRODUCTION-RELEASE-INTEGRITY-LATEST.md](./TT-V65-PRODUCTION-RELEASE-INTEGRITY-LATEST.md)  
**Engineering bind (under FTB):** [TT-ENGINEERING-SSOT-ANCHOR-LATEST.md](./TT-ENGINEERING-SSOT-ANCHOR-LATEST.md)  
**Gate:** `python scripts/dev/check-release-runtime-evidence-matrix.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M9_SHALLOW_RELEASE_NODE`:** **0** · **`M9_UNRESOLVED_ARTIFACT_IDENTITY`:** **0** · **`M9_AMBIGUOUS_RUNTIME_STATUS`:** **0** · **`UNEXPLAINED_RELEASE_TRANSITION`:** **0**  
**本波 STOP：** Pack 09 CLOSED。**Pack 10** 是独立后续波（不在本包修复）。**禁止**把本包重开成 Pack 10 工单。  
**禁止：** 改 FTB / Runtime / Secrets / 部署 / Timelock / 资金 · deploy / schedule / execute / cutover / 真钱 · 把 **CI-02** / PM $25 并进本包或升成 Official/Reality · 顺手修发布架构

Pack **03–08** 已闭合，只读引用。FTB `20260812` 是锁表。Solo Owner 发布模型：Owner Self Review + Evidence + Sign-off；**不是**第二 Approver。

**硬分裂（写死）：**

| 分裂 | 含义 |
|------|------|
| **① Local Map/Code ≠ ② Staging Verified ≠ ③ Official/Production Verified** | 本地地图/代码不是 staging 验收，更不是官网/生产验收 |
| **CODE_READY ≠ BUILT ≠ DEPLOYED ≠ WIRED ≠ OFFICIAL_LIVE ≠ REALITY_VERIFIED ≠ CLOSED_REALITY** | 状态机九态互不冒充 |
| **Scheduled / Deployed ≠ Official / Reality** | 链上有码或已 schedule **不得**升成 Official 或 Reality |
| **V65 RI PASS ≠ 当前 Official identity** | `20260804` SHA `16f29c7e` 是历史完整性戳，不是 `8df2ab21` |
| **Engineering SSOT dual-wait ≠ living recon** | SSOT 仍写 Track2/GOV-04 等待；recon 2026-08-15 `done=true` |
| **Sepolia Candidate ≠ Official** | pin `PSG-REL-20260720-WEB3-CAND-V2` = DEMOTED |
| **FTB 20260812 ≠ living L7/L8** | 锁表 Track1 SR；活路径 SR-FT |

另保留：**SUPERSEDED**（被替实现）· **ROLLED_BACK**（镜像回滚；**不能**回滚已 execute 的 Timelock）。

---

## 0 · 发布生命周期（AS-IS）

```text
Source/Branch/Tip
  → Build/Image
  → Config/Secrets          （只报 configured=true；本波不打印 secret）
  → Deploy                  （RI-02：Backup → Mig → API → Health → FE）
  → Runtime Identity        （/meta git_sha · digest · attestation）
  → Wiring                  （L7 pointer / proxy impl / feeRouter）
  → Official Traffic        （www + api.web3-ttg.com）
  → L7/L8 Observation       （recon + Indexer + /meta）
  → Probe/UAT/Real-Money
  → Reality Closure         （Hard Gate · TT_PRODUCTION_GO）

环境是平行关系，不是自动晋升：
  Local ①  ≠  Staging ②  ≠  Official Web / API / Indexer / Mainnet ③
```

**当前 Official 身份（③ · 2026-08-15）：** API `git_sha=8df2ab21…` · `build_time=2026-08-13T05:15:00Z` · `deployed_at=2026-08-12T23:44:18Z` · `psg_release_version=MAINNET-OFFICIAL-LIVE-PARTIAL` · Indexer lag **0** · checkpoint `25759530`（≥ release 25759423）。  
FE 另有 2026-08-14 Track2 bake `892650f7…`（与 API SHA **分裂**，进 Phase 2）。

---

## 1 · 24 条发布节点（摘要）

| ID | 环境 / 实例 | Status | 不得升成 |
|----|-------------|--------|----------|
| REL-ENV-LOCAL | Local ① | CODE_READY | Official / Reality |
| REL-ENV-STAGING | Staging ② 正交账本 | DEPLOYED | Official / Reality |
| REL-ENV-OFFICIAL-WEB | www Admin/FE | OFFICIAL_LIVE | Reality / CLOSED |
| REL-ENV-OFFICIAL-API | api.web3-ttg.com | OFFICIAL_LIVE | Reality / CLOSED |
| REL-ENV-INDEXER | lag 0 | OFFICIAL_LIVE | CLOSED |
| REL-ENV-MAINNET | chain_id=1 | OFFICIAL_LIVE | CLOSED |
| REL-SOURCE-TIP | 脏工作树 ≠ Official SHA | CODE_READY | Deployed / Official |
| REL-BUILD-IMAGE | 8df2ab21 bake | BUILT | Reality |
| REL-CONFIG-SECRETS | secret boolean only | DEPLOYED | CLOSED |
| REL-DEPLOY | Fly 2026-08-12 | OFFICIAL_LIVE | Reality |
| REL-RUNTIME-IDENTITY | /meta git_sha 8df2ab21 | OFFICIAL_LIVE | Reality |
| REL-OFFICIAL-TRAFFIC | SOLE_LIVE_SURFACE | OFFICIAL_LIVE | Reality |
| REL-L7-L8-OBS | recon UNEXPLAINED=0 | OFFICIAL_LIVE | CLOSED |
| REL-PROBE-UAT | 公开 200 · 历史登录 405 SUPERSEDED | OFFICIAL_LIVE | Reality |
| REL-REALITY-CLOSURE | GO 未过 | CODE_READY | CLOSED_REALITY |
| REL-ROLLBACK-BOUNDARY | L7 execute 不可回滚 | CODE_READY | CLOSED |
| REL-HARD-GATE | NO_GO | CODE_READY | Official / Reality |
| REL-SR-FT | `0xD1DAE665` WIRED+/meta | OFFICIAL_LIVE | CLOSED |
| REL-FR-OLD | `0x2aF47C` Official fee | OFFICIAL_LIVE | CLOSED |
| REL-CI02-FR-NEW | `0xb6bfED` 已部署未切 | **DEPLOYED** | WIRED / Official / Reality |
| REL-PM-PROXY | Official www 仍 GOV-04 1e18；L7 $25 4e16 | OFFICIAL_LIVE | CLOSED |
| REL-PM25 | `0x53d0dA` L7 execute done；Official bake waiting | **DEPLOYED** | WIRED / Official / Reality |
| REL-TRACK1-ESCROW | 10 USDC 封印 | REALITY_VERIFIED | CLOSED / 当前 Official create |
| REL-JP-VAULT | CI-03 无地址 | CODE_READY | Deployed / Official |

**DEPLOYED ≠ WIRED：** CI-02 hop B / PM $25 Official www bake 未升 Official。L7 `$25` execute 已完成，**不是** Official FE Live `$25`。

---

## 2 · 实例映射（禁止因 scheduled/deployed 升级）

| 实例 | 链上 | Official `/meta` | Pack 09 status |
|------|------|------------------|----------------|
| SR-FT | Wired.settlementRouter | `settlement_router` | OFFICIAL_LIVE |
| OLD FeeRouter | SR-FT.feeRouter | `fee_router` | OFFICIAL_LIVE |
| NEW FeeRouter **CI-02** | code yes · op **done=false** | 仍 OLD | **DEPLOYED** · ETA `2026-08-16T13:42:11Z` |
| PM Proxy | Official `/meta` **NEW PM** `0x882Ad` `100_000`；OLD `0xf7B7` **LEGACY**；www chrome GOV-04 `1e18` ED | NEW `primary_market_address` | OFFICIAL_LIVE（历史 null omit SUPERSEDED） |
| PM $25 impl | L7 execute **CLOSED**；Official bake **FORBIDDEN** | 不是 Official www Live | **DEPLOYED** · bake = FORBIDDEN ≠ remaining execute |
| Indexer | — | lag 0 | OFFICIAL_LIVE observe |
| Admin/FE | — | www 活表面 | OFFICIAL_LIVE · 登录非 Reality |
| JP Vault | **无地址** | null | CODE_READY |

Track1 封印 = **REALITY_VERIFIED**（守恒证据）≠ 当前 Official create（SR-FT）≠ **CLOSED_REALITY** ≠ Production GO。

---

## 3 · Phase 2 backlog（只记录，本波不修）

| ID | 类 | 事实 |
|----|----|------|
| P2-V65-RI-STAMP-LAG | OBSERVED_GAP | RI `16f29c7e` ≠ Official `8df2ab21` |
| P2-API-FE-SHA-SPLIT | OBSERVED_GAP | API `8df2ab21` vs FE `892650f7` |
| P2-ENG-SSOT-DUALWAIT-STALE | EXPLAINED_STALE_DOC | Engineering SSOT 仍写双等待 |
| P2-FTB-SR-LOCK-LAG | EXPLAINED stamp lag | FTB 锁表 Track1 SR |
| P2-META-PM-NULL | Historical L8 omit SUPERSEDED | Official `/meta` **NOW** NEW PM `0x882Ad`；剩余 = FTB overlay vs 活 `/meta` · www chrome **10→10** ED |
| P2-CI02-ETA | SCHEDULED | 独立梯子 · 本包不 execute |
| P2-PM25-ETA | SCHEDULED | 独立梯子 · 本包不 execute |
| P2-LOGIN-NOT-HAPPY-PATH | OBSERVED_GAP | 历史 www 登录 405 SUPERSEDED / Staging seed 401 |
| P2-STAGING-NOT-CURRENT-PIN | OBSERVED_GAP | Staging 正交 · 7 月 drift 已 SUPERSEDED_SNAPSHOT |

**禁止**把上表当本波重构或部署工单。

**Living overlay（2026-08-18）：** Official Web live pin `3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap v8（**≠** git checkout）。历史 hop `2ba08bd4` / WC bake **SUPERSEDED as live** · `WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` 仍 **CLOSED_REALITY**（历史 hop）。API live `8df2ab21`。环境行仍 `OFFICIAL_LIVE`，**禁止**把 Official Web 升成全局 CLOSED_REALITY。Cycle2 `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · `TT_PRODUCTION_GO=NO_GO`。

---

## 4 · 跨 Pack

| Pack | 关系 |
|------|------|
| **03** | INC-LOGIN · `/meta` L8 · Pause 503 |
| **05** | 合约图；本包回答「何时算发布完成」 |
| **06** | 美元 hops；S05 1 USDC 未 CLOSED |
| **07** | Timelock execute 权限活、剩余 ops 未 execute |
| **08** | Session ≠ Wallet；Admin publish ≠ execute |

**CI-02** 与 PM **$25** 继续各自独立 ETA/Reality 梯子。本包不 execute。

---

## 5 · 本波不做

- 改 FTB、Runtime、Secrets、部署、Timelock、资金状态  
- deploy / schedule / execute / cutover / 真钱  
- 执行 **CI-02** 或 PM **$25**  
- 翻转 `TT_PRODUCTION_GO`（保持 **NO_GO**）  
- 把本包重开成 **Pack 10** 工单（Pack 10 是独立后续波）  
- 把 ①/② 画成 ③，或把 DEPLOYED/scheduled 画成 OFFICIAL_LIVE / REALITY / CLOSED_REALITY
