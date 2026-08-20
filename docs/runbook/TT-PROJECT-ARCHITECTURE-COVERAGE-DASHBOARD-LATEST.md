# TT · Project Architecture Coverage Dashboard（Pack 14 · LATEST）

**STATUS:** `PACK14_COVERAGE_DASHBOARD_FINALIZED`  
**Phase:** **1 AS-IS 取证**（不改 Runtime / Web3 / FTB / 数据 / 权限 / 资金 · **不进入 Phase 2**）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/project-coverage-dashboard.v1.yaml`](../../registry/project-coverage-dashboard.v1.yaml)  
**JSON:** [`TT-PROJECT-MASTER-COVERAGE-DASHBOARD-LATEST.json`](./TT-PROJECT-MASTER-COVERAGE-DASHBOARD-LATEST.json)  
**Inputs only:** Pack **01–13** CLOSED · `THREE_TRUTH_PLANES` · L7↔L8 overlay · taxonomy  
**Gate:** `python scripts/dev/check-project-coverage-dashboard.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M14_UNRESOLVED_PACK`:** **0** · **`M14_UNRESOLVED_STATUS`:** **0** · **`M14_AMBIGUOUS_COVERAGE`:** **0** · **`UNEXPLAINED_DASHBOARD_DRIFT`:** **0**  
**本波 STOP：** Pack 14 CLOSED。**禁止**进入 **Phase 2**。Pack **00** Final 是独立后续 Phase 1 波。  
**禁止：** 人工填绿 · 手填虚假百分比 · 把 01–13 地图闭合算成产品 **100%** / Reality **100%** / Production GO

① Pack 01–13 地图加深 ≠ ② staging GO ≠ ③ Production GO。`ARCHITECTURE_MAP_COMPLETE` ≠ `OFFICIAL_LIVE` ≠ `REALITY_VERIFIED` ≠ `CLOSED_REALITY` ≠ `PRODUCTION_GO`。

单品覆盖率 / Reality 率保持 **`NOT_COMPUTED`**。状态机只出平面计数与直方图。

---

## 0 · 平面分裂（写死）

| 平面 | 本波机读 | 含义 |
|------|----------|------|
| **ARCHITECTURE_MAP_COMPLETE** | Pack **01–13** `DEEP_PARTIAL` **13/13** | 地图结构闭合。**不是**产品完成 |
| **OFFICIAL_LIVE** | **PARTIAL** | 官网/已接线合约有活面；登录历史 **405** 已 **CLOSED_REALITY**；活面 FE **`OPS-2026.08.20-v9`** / `3e356617` / `2026-08-20T00:51:57Z`（historical `daa5ae87` SUPERSEDED）（历史 hop `2ba08bd4` WC bake SUPERSEDED as live）；Steward **TARGET_NOT_LIVE** |
| **REALITY_VERIFIED** | **false** | Money-path hop **CLOSED_REALITY** (Owner A · Track2 L7+L8). Official book hop **CLOSED_REALITY**. Pack 01 still counts **HANDOFF** for global JNY / Owner GO. Global plane stays false. |
| **CLOSED_REALITY** | **false** | 商业资金闭环未封 |
| **PRODUCTION_GO** | **NO_GO** | 硬闸未过 |

`packs_seeded=15` 只计行数（Pack 00 `NAV_ONLY` · Pack 14 `COUNTS_ONLY`），**不是**覆盖率。

---

## 1 · 直方图（矩阵状态机）

### Web3（Pack 05 `nodes[].status` · overlay `addresses[].lifecycle`）

须展示：`OFFICIAL_LIVE` · `DEPLOYED` · `WIRED` · `SCHEDULED_WAITING_ETA` · `NOT_DEPLOYED` · `SUPERSEDED` · `LEGACY`。

- **CI-02** NEW FeeRouter = `SCHEDULED_WAITING_ETA`
- **PM $25** impl = Pack 05 **LEGACY**（L7 execute CLOSED on OLD proxy）· Official sale = NEW PM · www chrome 10→10 Expected Difference · bake FORBIDDEN
- Seat / JP Vault / staking = `NOT_DEPLOYED`
- Track1 SR / 旧 PM impl = `SUPERSEDED`
- Pack 05 **无** `DEPLOYED=0` 也必须出列，禁止省略

### Frontend（Pack 02 `screens[].runtime_status`）

须展示：`ROUTE_EXISTS` · `SCREEN_PARTIAL` · `ACTION_BLOCKED` · `TARGET_NOT_LIVE`。

- Login www POST `/auth/login` **405** = 历史 `ACTION_BLOCKED`（L3）；现 **CLOSED_REALITY** / `ACTION_WIRED`
- Region Steward = `TARGET_NOT_LIVE`
- 公开 GET 200 ≠ Action Works ≠ E2E Closed

---

## 2 · 当前真实 Gap（指针，不复制真源）

| Gap | 指针 | 状态 |
|-----|------|------|
| CI-02 | `GATE-CI02-ETA` | `SCHEDULED_WAITING_ETA` |
| PM $25 | `W3-PM-IMPL-25` / `GATE-PM25-ETA` | L7 **LEGACY** · bake FORBIDDEN · Pack 12 gate row still `TIMELOCK_ETA` class（chrome remaining ≠ living sale） |
| 1 USDC Reality | `GATE-1USDC-REALITY` | Money-path **CLOSED_REALITY** Owner A. Official book hop **CLOSED_REALITY**. Pack 01 **HANDOFF** for global JNY / Owner GO. Living `P0_COMMERCIAL_MONEY_PATH_BLOCKER: false`. |
| Login 405 | `DEP-LOGIN-WWW-405` / `FE-AUTH-LOGIN` | **CLOSED_REALITY** / `ACTION_WIRED` |
| Region Steward | `GATE-SEAT-CI01` / `FE-STEWARD` / `CAP-REGION-STEWARD` | `TARGET_NOT_LIVE` · `NOT_DEPLOYED` |
| Hard Gate | `GATE-HARD-GO` | `NO_GO` |

Open P0/P1 **没有**单一产品缺陷分；见 JSON `open_p0_p1.product_defect_score = NOT_COMPUTED`。

---

## 3 · 本波不做

- 改 FTB、Runtime、Web3、UI、数据、权限、资金  
- 修 Login **405** 或把 Steward / $25 画成 Live  
- 把 `ARCHITECTURE_MAP_COMPLETE` 写成产品 **100** 或 `PRODUCTION_GO`  
- 新增第 16 张矩阵  
- 开工 **Phase 2**  
- Pack **00** Final 不在本仪表盘波执行（独立后续 Phase 1）
