# TT · Wait Window · R-PUBLIC-DATA-ISOLATION-1 · INVENTORY（LATEST）

**STATUS:** `INVENTORY_OPEN · CHILD_PACKS_PARTIAL_CLOSED`  
**Stamp:** `2026-08-11T08:02:00Z`  
**Doctrine:** `PUBLIC_SURFACE_ELIGIBILITY_FAIL_CLOSED_V1`  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Seal  

**Latest API:** `deployment-01KZQX0AK0QW5A92JBB7B00N8E`  
**Regression gate:** `scripts/gates/check-official-public-gates-regression.sh`（phase3 post-deploy 硬接）

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 子包

| Pack | Status |
|------|--------|
| Guides detail parity | **CLOSED** |
| Discover force | **CLOSED** |
| Community governed feed | **CLOSED** |
| Community beyond-feed | **CLOSED** |
| Cold-start governed | **CLOSED** |
| R-MKT restore | **保持**（回归闸 uat=0） |

---

## Domain 表

| Domain | Risk | 注 |
|--------|------|-----|
| Market / Guides / Discover / Community feed+beyond | **CLOSED_OK_THIS_WAVE** | list↔detail↔tag↔explore↔comments 对齐 governed |
| CMS / Official announcements·roadmap | **CLOSED_OK** | governed SQL |
| Cold-start consumer | **CLOSED_OK_WIRING** | governed views；当前 campaign=null → **PROBE_CLEAN** |
| Referral validate | **PROBE_CLEAN** | UAT-ish codes → invalid；**≠ CLOSED**（无 Production-force 专闸） |
| Governance public | **NEEDS_PROBE** | Official anon **401**；MVP/E2E sentinel 仍 AFTER_SEAL 确认 |
| Admin→Public 全矩阵 | **AFTER_SEAL** | |
| Indexer / R-MEDIA | **AFTER_SEAL** | |

**规则：** 探针无测试数据 = **PROBE_CLEAN** · 不得冒充 CLOSED。

---

## Track1

readyAt=`1786491935` · done=false · 10 USDC · isEscrow=false · **FROZEN**

ETA `2026-08-11T23:45:35Z` → STOP 产品 → fresh Preflight。

*Sebastian Ward · Solo*
