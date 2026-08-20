# TT · Commercial Money / Value Lifecycle Matrix（Pack 06 · LATEST）

**STATUS:** `PACK06_MONEY_LIFECYCLE_DEEPENED`  
**Stamp:** `2026-08-18`  
**Machine:** [`registry/commercial-money-lifecycle-matrix.v1.yaml`](../../registry/commercial-money-lifecycle-matrix.v1.yaml)  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-commercial-money-lifecycle-matrix.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M6_SHALLOW_FLOW`:** **0** · **`M6_UNRESOLVED_DESTINATION`:** **0** · **`M6_AMBIGUOUS_MONEY_SSOT`:** **0** · **`UNEXPLAINED_VALUE_FLOW`:** **0**  
**本波 STOP：** Pack 06 CLOSED。Pack 07 为后续独立波；本包不重开。  
**禁止：** deploy / schedule / execute / cutover / 真钱 · 用 `/meta`、Indexer、PG 改 FTB 或反向覆盖链上 · 把 **CI-02** / PM $25 并进本包 · 把 NEW FeeRouter、JP Vault、PM $25 impl 或 83 Vault/Snapshot/Claim 画成 Official

Pack **03** / **04** / **05** 已闭合，只读引用。FTB `20260812` 是锁表。  
**硬规则：** 合约图 ≠ 资金路径 ≠ 谁能改系统。Fiat/Onboarding **正交** 于 USDC Escrow 与 TTG Primary Market。

---

## 0 · 状态枚举（写死）

| 值 | 用在哪 |
|----|--------|
| **CURRENT_OFFICIAL_LIVE** | 官网现在走的钱：Wired → SR-FT `0xD1DAE665` → OLD FR `0x2aF47C` → Safe/P4Cap；Official `/meta` NEW PM `0x882Ad` · 100_000 TTG/USDC。www chrome 仍 10→10 / 1e18 = Expected Difference |
| **SCHEDULED_WAITING_ETA** | **仅** CI-02 NEW FR `0xb6bfED` hop B（WAIT / FORBIDDEN until Owner auth） |
| **TARGET_NOT_LIVE** | 83 Seat / JP Vault / Snapshot / Claim / vacancy 路由 / S10 产品 spend 环 |
| **SUPERSEDED** | Track1 SR 作为 Official create；FTB 表内旧 PM impl；历史 `/meta` PM null（**2026-08-18 活 overlay：** `/meta` **NOW** NEW PM） |
| **LEGACY** | FactoryV2 lineage · OLD PM proxy `0xf7B7` · OLD TTG 10M · OLD Governor · `$25` impl 4e16 |
| **CLOSED_REALITY** | **仅** Track1 10 USDC 守恒 `10e6=9.5e6+0.5e6+0`（路径已 SUPERSEDED） |

Track2 **1 USDC** 是 Official create 上的活路径。money-path Reality **PASS**（Owner A · L7+L8）。living `P0_COMMERCIAL_MONEY_PATH_BLOCKER=false`。矩阵 **`TRACK2_1USDC.closed_reality` 仍为 false**（hop 闭 ≠ 矩阵 CLOSED_REALITY）。Official book hop **CLOSED_REALITY**（`GAP-E2E-JOURNEY`）。GO remaining = Owner 书面裁决。

---

## 1 · 活资金图 vs 83 目标图

**活（CURRENT_OFFICIAL_LIVE · 2026-08-18 Official `/meta` + L7）：**

```text
Traveler USDC
  → Wired 0xEE0BE3 createEscrow
  → SR-FT 0xD1DAE665 release
  → 95% provider/guide
  → 5% OLD FeeRouter 0x2aF47C
  → 4500 countryBucket  Safe 0x96491
  → 3575 globalStakers  Safe 0x96491
  → 1100 globalReserve  P4Cap 0xfB906
  →  825 globalOps      P4Cap 0xfB906
TTG sale（Official 产品面）
  → NEW PM 0x882Ad  ttgPerUsdcUnit=100_000  min=1 USDC
  → NEW TTG 0x0EC40  25T
  → remainder USDC → P4Cap
www chrome 08-16 pin 仍 1e18 / 10→10 / 2T·3T·7.5T（Expected Difference · bake FORBIDDEN）
OLD PM 0xf7B7 / $25 4e16 / GOV-04 1e18 = LEGACY
L8 Indexer 只观察，不托管
```

**83 目标（TARGET_NOT_LIVE · 禁止画成 Official）：**

```text
FeeRouter → SeatRegistry (CI-01 未部署)
         → RegionVault / 空位 P4Cap (CI-03 JP Vault 未部署)
         → Snapshot → Claim
```

BPS **4500/3575/1100/825** 与 83 §3 / 84 **数字 MATCH**，收款地址是 **interim custody**，不是 Vault→Snapshot→Claim。

---

## 2 · S01–S14（已展开 · 非指针）

| ID | 轨 | 一句话 | Runtime Status |
|----|----|--------|----------------|
| S01 | Escrow | Official create = Wired；Track1 SR = SUPERSEDED | CURRENT_OFFICIAL_LIVE |
| S02 | Escrow | Release 95% via SR-FT | CURRENT_OFFICIAL_LIVE |
| S03 | Fee | 5% 进 OLD FR；CI-02 不是本跳 | CURRENT_OFFICIAL_LIVE |
| S04 | Fee | 四路到 Safe/Safe/P4Cap/P4Cap INTERIM | CURRENT_OFFICIAL_LIVE |
| S05 | 83 | Vault/Snapshot/Claim | TARGET_NOT_LIVE |
| S06 | 83 | 空位→P4Cap 路由（P4Cap 地址活、路由不活） | TARGET_NOT_LIVE |
| S07 | PM | Official `/meta` NEW PM `0x882Ad` · 100_000；www chrome 1e18 = ED；OLD `$25` LEGACY | CURRENT_OFFICIAL_LIVE |
| S08 | Gov | Governor/Timelock/Safe 权限活；spend 环未闭 | CURRENT_OFFICIAL_LIVE |
| S09 | PM | 活售 NEW PM 100_000；www 1e18 ED；$25 LEGACY；CI-02 hop B = SCHEDULED_WAITING_ETA | CURRENT_OFFICIAL_LIVE |
| S10 | Gov | PM→Treasury→Governor spend 产品环 | TARGET_NOT_LIVE |
| S11 | Escrow | Refund 合约活；无 CLOSED_REALITY 样本 | CURRENT_OFFICIAL_LIVE |
| S12 | Escrow | Dispute：PG 案卷 ≠ L7 分账 | CURRENT_OFFICIAL_LIVE |
| S13 | Fiat | `onboarding_entitlements` 正交 | CURRENT_OFFICIAL_LIVE |
| S14 | 投影 | L8 只观察；Track1 守恒 CLOSED_REALITY | CURRENT_OFFICIAL_LIVE |

WRR 同源：S01/S02 Escrow · S03/S04 fee-routes · S05 vault/accruals/claim · S06 vacancy · S07/S09 PM · S08/S10 proposals/spend。

---

## 3 · 守恒

| 身份 | 式 | 状态 |
|------|----|------|
| TRACK1_10USDC | `10e6 = 9.5e6 + 0.5e6 + 0` | CLOSED_REALITY · 路径 SUPERSEDED |
| FEE_BPS_10000 | `4500+3575+1100+825=10000` | CURRENT_OFFICIAL_LIVE · 目的地 INTERIM |
| TRACK2_1USDC | Official Wired+SR-FT | money-path PASS Owner A · **非**矩阵 CLOSED_REALITY · living P0 false |

---

## 4 · 跨 Pack 引用

| Pack | 引用 |
|------|------|
| **03** | `N-L7-ESCROW` · `N-L6-DISPUTES` · `N-L6-ONBOARDING` · `GP-04` · `GP-06` · `GP-07` |
| **04** | `DATA-ESCROW-CHAIN` ≠ `DATA-ESCROW-PROJECTION` · `DATA-ORDER` · `DATA-DISPUTE` · `DATA-PM-PRICE-LIVE` ≠ `DATA-PM-PRICE-TARGET` · `DATA-ONBOARDING-ENTITLEMENT` |
| **05** | `W3-FACTORY-WIRED`→`W3-SR-FT`→`W3-FR-OLD`→`W3-SAFE`/`W3-P4CAP` · `W3-FR-NEW`/`W3-SEAT`/`W3-REGION-VAULT`/`W3-PM-IMPL-25` 禁止作为 Official 资金跳 |

---

## 5 · 独立 Reality 梯子（本包不执行）

| 梯子 | ETA | 本包态度 |
|------|-----|----------|
| **CI-02** NEW FeeRouter `0xb6bfED` | `2026-08-16T13:42:11Z` | SCHEDULED_WAITING_ETA · Official hop 仍 `0x2aF47C` |
| PM **$25** OLD proxy | L7 execute `2026-08-17T03:22:27Z` | **LEGACY** · 不是 Official 剩余 hop |
| Official www chrome bake | 08-16 pin | **FORBIDDEN** · 10→10 / 1e18 vs CMS 25T / NEW PM 100_000 = Expected Difference |

独立梯子。本包 **禁止** CI-02 hop B / Official www bake / 真钱。Official 售币已是 NEW PM。GO remaining = Owner 书面 **GO** 或 **继续 NO_GO**。

---

## 6 · 本包不做（Pack 06 CLOSED · 不重开）

- 改 FTB / `/meta` / Timelock / Official Runtime  
- deploy / schedule / execute / 真钱  
- `TT_PRODUCTION_GO` 翻转（保持 **NO_GO**）
