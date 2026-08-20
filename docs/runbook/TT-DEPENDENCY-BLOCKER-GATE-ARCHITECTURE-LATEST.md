# TT · Dependency / Blocker / Gate Architecture（Pack 12 · LATEST）

**STATUS:** `PACK12_DEPENDENCY_GATE_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改 Runtime / Web3 / FTB / 权限 / 资金）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/project-cross-maps-10-13.v1.yaml`](../../registry/project-cross-maps-10-13.v1.yaml) `pack_12_blockers`  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-dependency-blocker-gate-architecture.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M12_SHALLOW_DEPENDENCY`:** **0** · **`M12_UNRESOLVED_UPSTREAM_POINTER`:** **0** · **`M12_AMBIGUOUS_BLOCKER`:** **0** · **`UNEXPLAINED_GATE_TRANSITION`:** **0** · **`DEPENDENCY_CYCLE`:** **0**  
**本波 STOP：** Pack 12 CLOSED。**Pack 13** 是独立后续波（不在本包修复）。**禁止**把本包重开成 Pack 13 工单。  
**禁止：** 改 FTB / Runtime / Web3 / RBAC / 资金 · deploy / execute / 真钱 · 把 **CI-02** / PM $25 / **Proposal #3** 并成同一 blocker · 复制/发明第二真源

Pack **03–11** 已闭合。本包是 **JOIN DAG / 红绿灯图**：稳定 `DEP-*` / `GATE-*` → 已验证 ID。不是新 SSOT。  
**必须保留。** 它把 Phase 1 静态矩阵变成可**导航**的工程地图；不是多余文档。Phase 2 沿这些边定位 GAP，不在 Phase 1 为变绿而修 Reality。

**硬分裂：** `DEPLOYED ≠ WIRED ≠ OFFICIAL_LIVE ≠ REALITY_VERIFIED ≠ CLOSED_REALITY` · `TIMELOCK_ETA ≠ OWNER_AUTH execute ≠ NOT_DEPLOYED ≠ REALITY_EVIDENCE` · **Proposal #3 ≠ CI-02 blocker ≠ PM25 blocker** · CI-02 execute ≠ NEW FR Official cutover · PM $25 execute ≠ **10→0.4** Reality · ① ≠ ② ≠ ③

---

## 0 · 边的读法

```text
Upstream → Required State → Gate/Condition → Downstream
  → Blocker → Unblock Evidence → Allowed Next Transition
```

每条另标：`lane`（CRITICAL_PATH / ORTHOGONAL）· `dep_class` · `current_blocker` · `next_allowed_gate` · `failure_propagation`。

---

## 1 · 16 条节点（摘要）

| ID | Class | Lane | Current? | Next |
|----|-------|------|----------|------|
| GATE-T1T2-DONE | TECHNICAL | Critical | no | 1 USDC Reality |
| GATE-CI02-ETA | TIMELOCK_ETA | Critical | **yes** · 2026-08-16T13:42:11Z | CI-02 execute |
| GATE-CI02-EXECUTE | OWNER_AUTH | Critical | no（当前还在 ETA） | FR cutover |
| GATE-FR-NEW-WIRE-CUTOVER | RUNTIME | Critical | no · DEPLOYED ≠ Official | Hard GO（不足） |
| GATE-1USDC-REALITY | REALITY_EVIDENCE | Critical | **no** · money-path PASS Owner A · Official book = E2E | Hard GO |
| GATE-GOV04-DONE | TECHNICAL | Orthogonal | no | PM25 ETA |
| GATE-PM25-ETA | TIMELOCK_ETA | Orthogonal | **yes** · 2026-08-16T16:20:23Z | PM25 execute |
| GATE-PM25-EXECUTE | OWNER_AUTH | Orthogonal | no | 10→0.4 Reality |
| GATE-PM-10-TO-04-REALITY | REALITY_EVIDENCE | Orthogonal | no · 活价仍 1e18 | Hard GO（不足） |
| GATE-SEAT-CI01 | NOT_DEPLOYED | Orthogonal | **yes** | Vault CI-03 |
| GATE-VAULT-CI03 | NOT_DEPLOYED | Orthogonal | **yes** | S05 |
| DEP-S05-REGION-83 | NOT_DEPLOYED | Orthogonal | **yes** | — |
| DEP-S06-VACANCY | NOT_DEPLOYED | Orthogonal | **yes** | — |
| GATE-PROPOSAL-3 | ORTHOGONAL | Orthogonal | **yes** · 非 CI-02/PM25 | — |
| GATE-HARD-GO | REALITY_EVIDENCE | Critical | **yes** · NO_GO | 无 |
| DEP-LOGIN-WWW-405 | RUNTIME | Orthogonal | **no** · 历史 405 SUPERSEDED · GAP-LOGIN CLOSED_REALITY | — |

**当前 Critical Path blocker：** CI-02 **ETA**（不是 execute、不是 cutover）。1 USDC money-path **PASS**（Owner A）。PM $25 是 **正交** ETA。Seat/Vault/S05/S06/#3 正交。登录 405 **CLOSED_REALITY**。

---

## 2 · 不得混成同一种 blocker

| 混法 | 正确 |
|------|------|
| CI-02 ETA = CI-02 execute | ETA 到了才允许 OWNER_AUTH execute |
| CI-02 execute = Official NEW FR | execute 之后才是 WIRE/CUTOVER；今天 Official 仍是 OLD FR |
| PM $25 execute = 10→0.4 Reality | execute 之后才验价；今天仍 1e18 |
| Seat NOT_DEPLOYED = CI-02 ETA | 无地址 ≠ Timelock 等待 |
| Proposal #3 = 资金闸 | LONG_WAIT 正交，**不是** CI-02 / PM25 blocker |
| 任一 ETA = Production GO | `GATE-HARD-GO` 仍 NO_GO |

---

## 3 · Phase 2 backlog（只记录）

| ID | 事实 |
|----|------|
| P2-CI02-ETA | NEW FR `done=false` 至 2026-08-16T13:42:11Z |
| P2-PM25-ETA | $25 `done=false` 至 2026-08-16T16:20:23Z |
| P2-1USDC-REALITY | Track2 1 USDC money-path PASS Owner A · Official book hop CLOSED_REALITY; GO remaining = Owner written verdict |
| P2-SEAT-VAULT | Seat/Vault/S05/S06 TARGET_NOT_LIVE |
| P2-PROPOSAL-3-ORTHOGONAL | #3 不是 CI-02/PM25 blocker |
| P2-PACK13-INDEPENDENT | HISTORICAL Pack 12 冻结；Pack 13 是独立后续波 |

**禁止**把上表当本波修复或 execute 工单。

---

## 4 · 本波不做

- 改 FTB、Runtime、Web3、权限、资金  
- 执行 **CI-02** 或 PM **$25**  
- 翻转 `TT_PRODUCTION_GO`  
- 把本包重开成 **Pack 13** 工单（Pack 13 是独立后续波）  
- 把 ETA / Owner execute / 未部署 / 未闭 Reality 画成同一个 blocker
