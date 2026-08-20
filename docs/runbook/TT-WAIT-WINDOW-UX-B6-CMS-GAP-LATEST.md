# TT · Wait Window · B6 CMS GAP（LATEST）

**Batch:** `B6-CMS`  
**Stamp:** `2026-08-10T11:36:00Z`  
**Phase:** **CLOSED** · Official Runtime **PASS**  
**`TT_PRODUCTION_GO`:** `NO_GO`  

**Frozen untouched:** Mainnet Web3 / FTB / Registry v1 / Wired / Track1 · 五主结构/视觉未改  
**Prior:** B5 Admin **CLOSED**  
**Runtime verify:** [`TT-WAIT-WINDOW-UX-B6-CMS-RUNTIME-VERIFY-LATEST.json`](./TT-WAIT-WINDOW-UX-B6-CMS-RUNTIME-VERIFY-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## CHECK

| URL | 观察 |
|-----|------|
| `/admin/content` EN | Content Center EN OK；title 跟 Admin console（B5 已闭） |
| `/` EN（修复前） | 正文 EN；**国家 chip 仍中文** |
| `/` EN（修复后） | **Japan / China / South Korea…** PASS |

---

## Gap Inventory

| ID | Pri | Decision | Status |
|----|-----|----------|--------|
| **B6-C-001** | P1 | **FIX_NOW** | **CLOSED** · `LandingHeroForm` → `marketCountryChipLabel` |
| **B6-C-002** | P2 | **DEFER** | 公告/社区卡 Content Accuracy（例：东京摄影一日路线）另轨 |

---

## Fix

| Path | Change |
|------|--------|
| `frontend/components/landing/LandingHeroForm.tsx` | chip 显示 `marketCountryChipLabel(c.value, t)` |
| `frontend/lib/landing/b6HomepageCountryChipI18n.test.ts` | Local vitest PASS |

**Deploy:** `tt-web-prod` · `git_sha=c3eeaf10…`（dirty tree bake）

---

## Honesty

`B6 CLOSED ≠ Seal ≠ Production GO` · ≠ CMS Content QA Country CLOSED · 未碰 Mainnet/RBAC/资金
