# TT · Wait Window · Reality Audit · Batch 1 CLOSED（LATEST）

**STATUS:** `BATCH_1_CLOSED`  
**Stamp:** `2026-08-10T14:34:00Z`  
**Parent:** [`TT-WAIT-WINDOW-FINAL-REALITY-AUDIT-LATEST`](./TT-WAIT-WINDOW-FINAL-REALITY-AUDIT-LATEST.md)  
**Gap:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B1-GAP-INVENTORY-LATEST`](./TT-WAIT-WINDOW-REALITY-AUDIT-B1-GAP-INVENTORY-LATEST.md)  

**Deploy:** `tt-web-prod` · `bash scripts/dev/deploy-tt-web-production.sh` · tip bake（working tree · reported `git_sha=c3eeaf10…`）  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Reality Seal

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Verify matrix（Official Runtime）

| ID | Fix | Runtime |
|----|-----|---------|
| **B1-G-001** | Auto-reconnect stale → 8s 后退出 Connecting / CTA 可点 | ✅ `/guides` `disabled=false` · Connect wallet |
| **B1-G-003** | Register 文案去 DApp · Auth footer 默认藏 FeeRouter | ✅ placeholder `Optional · starts with 0x…` · 无 FeeRouter check 链 |
| **B1-G-004** | `/escrow/0x…` 明确「合约地址≠订单号」 | ✅ 新文案 · 无 generic invalid |
| **B1-G-005** | Draft 卡不挂 Escrow ✓ | ✅ Market Draft 行无 Escrow ✓ |
| **B1-G-006** | guides_desc 去 lock escrow | ✅ “protect trip funds” |
| **B1-G-007** | `/pay` locale document.title | ✅ `Pay & Escrow \| TravelTrust` |

| ID | Disposition | Notes |
|----|-------------|-------|
| **B1-G-002** | **OPEN→B6** | 长 skeleton / `/meta` 慢仍在；任务终可完成 |
| **B1-G-008** | ACCEPT | 邀请码 URL prefill |
| **B1-G-009** | DEFER→B6 | `/meta` cold |
| **B1-G-010** | DEFER→B3/B8 | EN 下中文 bio |
| **B1-G-011** | ACCEPT | `/escrow` bare 404 |

---

## Journey residual（诚实）

游客可走：**Home → Register → Market/Guides（Book/View）→ Pay（UUID）→ Orders（需登录）**。  
**禁止**把链上 Reality escrow 地址当 `/escrow/[id]`。  
**Draft 北京重复单**仍在 Market 列表 → **Batch 3**。

---

## Honesty

Batch 1 CLOSED ≠ Seal ≠ GO · 未触碰 Track1 / Timelock / Production GO
