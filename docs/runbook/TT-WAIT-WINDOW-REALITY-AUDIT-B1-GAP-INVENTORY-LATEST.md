# TT · Wait Window · Reality Audit · Batch 1 Gap Inventory（LATEST）

**STATUS:** `GAP_INVENTORY · FIX_NOW_PARTIAL`  
**Stamp:** `2026-08-10T14:16:00Z`  
**Parent:** [`TT-WAIT-WINDOW-FINAL-REALITY-AUDIT-LATEST`](./TT-WAIT-WINDOW-FINAL-REALITY-AUDIT-LATEST.md)  
**Truth:** Official Runtime `https://www.web3-ttg.com` · API `https://api.web3-ttg.com` · Mainnet chain (no execute)

**SOP:** CHECK → GAP → 最小 FIX → Official Deploy → Runtime Verify → SSOT

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Journey scorecard（游客 · Official）

| Step | Route | Task completable? | Notes |
|------|-------|-------------------|-------|
| Home | `/` | ✅ | CTA: Start planning / Browse guides / Sign up clear |
| Register | `/auth/register` | ⚠️ | Form OK · wallet jargon · invite = URL prefill only |
| Invite | register `?ref=` | ⚠️ ACCEPT | No manual invite field when no query |
| Market | `/market` | ⚠️ | Loads · many **Draft** + **Escrow ✓** · highlights slow |
| Guides | `/guides` | ⚠️ | API OK (~1.5s) · UI skeleton often **10–20s** · then 10 cards + Book/View CTA |
| Orders | `/orders` | ⚠️ | Long skeleton · guest must land login/empty honestly |
| Escrow | `/escrow/[id]` | ❌ mis-route | Reality **contract** `0x9996…` → generic invalid · needs **order UUID** |
| Pay | `/pay` | ⚠️ | Honest pay copy · `document.title` zh vs EN UI · Escrow jargon |

---

## Gaps

| ID | Sev | Disposition | Finding |
|----|-----|-------------|---------|
| **B1-G-001** | P0 | **FIX_NOW** | Header wallet often stuck **Connecting…** + **disabled** while wagmi `reconnecting` (MetaMask SDK). Blocks perceived journey even for browse-only guests. |
| **B1-G-002** | P1 | **FIX_NOW** | `/guides` · `/orders` · `/escrow/*` long skeleton with no early timeout/retry UX while `/meta?compact=1` ~27–39s. Guests see “stuck Loading”. |
| **B1-G-003** | P1 | **FIX_NOW** | Register EN: `0x + 40 hex chars, same as DApp` · “DApp payments” · footer **FeeRouter check** — Web3 黑话 / 开发面. |
| **B1-G-004** | P1 | **FIX_NOW** | `/escrow/0x9996…` (chain address) → “request was not valid” · traveler needs plain: use **order id from My orders**, not contract address. |
| **B1-G-005** | P1 | **FIX_NOW** / Batch2 | Market cards: **Draft** + **Escrow ✓** co-appear — 空态/状态骗人风险. |
| **B1-G-006** | P2 | **FIX_NOW** | `guides_desc`: “lock escrow” jargon. |
| **B1-G-007** | P2 | **FIX_NOW** | `/pay` EN UI but title often zh SSR (`行程付款`). |
| **B1-G-008** | P2 | **ACCEPT** | Invite code only via referral URL prefill (no always-visible field) — by design if growth is link-based. |
| **B1-G-009** | P2 | **DEFER→B6** | `/meta` 37s cold · contributes to B1-G-001/002. |
| **B1-G-010** | P2 | **DEFER→B3/B8** | Guide cards EN locale still Chinese bios (content/CMS). |
| **B1-G-011** | P2 | **ACCEPT** | `/escrow` bare 404 — only `/escrow/[id]` exists. |

---

## Explicit non-goals（本 Batch）

- Timelock.execute / Escrow.release / Track1 / TrustedFactory / Production GO  
- Admin 大改 · CMS 大扩 · Migration 大整理 · B12 UI 扩展  
- 83 RegionVault

---

## Next

1. Minimal FIX for **B1-G-001 · 003 · 004 · 006 · 007**（+ G-005 if small）  
2. Official FE deploy · Runtime Verify  
3. Batch 1 CLOSED SSOT → Batch 2 只读资金展示
