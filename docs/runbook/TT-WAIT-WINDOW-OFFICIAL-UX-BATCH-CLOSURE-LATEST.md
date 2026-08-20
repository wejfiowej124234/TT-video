# TT · Wait Window · Official UX Batch · ARCHIVED（LATEST）

**STATUS:** `ARCHIVED_PRODUCT_FIX_SCOPE_FROZEN`  
**Stamp:** `2026-08-10T13:56:00Z`  
**Product truth:** Official Runtime（`www` / `api.web3-ttg.com`）  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Reality Seal · **≠** Finalize CLOSED  

**Parent freeze (unchanged):** Mainnet Reality · FTB · Registry v1 · Wired · Track1 Timelock  
**ETA gate:** `2026-08-11T23:45:35Z`  
**ETA hold policy:** [`TT-WAIT-WINDOW-ETA-HOLD-PREFLIGHT-POLICY-LATEST`](./TT-WAIT-WINDOW-ETA-HOLD-PREFLIGHT-POLICY-LATEST.md)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Owner 封存令（写死）

```text
B1–B11 Official UX Batch     = ARCHIVED · 停止扩大产品修复范围
允许到 ETA 前                 = 只读 Preflight · Finalize 作战包复核
禁止到 ETA 前                 = 新产品 UX Batch · 扩大 FIX 面 · TrustedFactory · Production GO
禁止任何时刻（本窗）           = 改 FTB / Registry v1 / Wired / Track1 schedule
ETA 后唯一串行                 = Timelock.execute → Escrow.release → Settlement/Fee 到账对账
                              → Reality Evidence Seal → Hard Gate 重评
任一步失败                    = 立即停 · 不跳步 · 不提前 TrustedFactory · 不提前 GO
```

**Track1 prep（只读）:**  
[`OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY`](./templates/mainnet-money-path/OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY.md) ·  
[`OWNER-TRACK1-REALITY-FINALIZE-EVIDENCE`](./templates/mainnet-money-path/OWNER-TRACK1-REALITY-FINALIZE-EVIDENCE.md)

---

## 1 · 封存批次（禁止开 B12+ UX Batch）

| Batch | 域 | 状态 | Gap / Verify |
|-------|----|------|----------------|
| **B1** | Market | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B1-MARKET-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B1-MARKET-RUNTIME-VERIFY-LATEST.json) |
| **B2** | Auth | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B2-AUTH-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B2-AUTH-RUNTIME-VERIFY-LATEST.json) |
| **B3** | Orders | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B3-ORDERS-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B3-ORDERS-RUNTIME-VERIFY-LATEST.json) |
| **B4** | Escrow | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B4-ESCROW-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B4-ESCROW-RUNTIME-VERIFY-LATEST.json) |
| **B5** | Admin | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B5-ADMIN-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B5-ADMIN-RUNTIME-VERIFY-LATEST.json) |
| **B6** | CMS | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B6-CMS-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B6-CMS-RUNTIME-VERIFY-LATEST.json) |
| **B7** | Me | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B7-ME-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B7-ME-RUNTIME-VERIFY-LATEST.json) |
| **B8** | Provider / Guide | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B8-PROVIDER-GUIDE-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B8-PROVIDER-GUIDE-RUNTIME-VERIFY-LATEST.json) |
| **B9** | Community | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B9-COMMUNITY-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B9-COMMUNITY-RUNTIME-VERIFY-LATEST.json) |
| **B10** | Guides 深度 | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B10-GUIDES-DEPTH-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B10-GUIDES-DEPTH-RUNTIME-VERIFY-LATEST.json) |
| **B11** | Governance 公开面 | **CLOSED · ARCHIVED** | [`GAP`](./TT-WAIT-WINDOW-UX-B11-GOVERNANCE-PUBLIC-GAP-LATEST.md) · [`VERIFY`](./TT-WAIT-WINDOW-UX-B11-GOVERNANCE-PUBLIC-RUNTIME-VERIFY-LATEST.json) |

---

## 2 · ETA 前 / 后

| 窗 | 允许 | 禁止 |
|----|------|------|
| **现在 → ETA** | 只读 Preflight · Finalize 作战包复核 · 本政策 SSOT | 新产品 UX Batch · 扩大 FIX · execute/release · TrustedFactory · GO · 改 FTB/Registry/Wired/Track1 |
| **ETA 后** | 严格串行 Finalize ladder | 跳步 · 失败后继续 · 提前 TrustedFactory · 提前 GO |

```text
ETA 后唯一串行:
  Timelock.execute → Escrow.release → Settlement/Fee 到账对账
  → Reality Evidence Seal → Hard Gate 重评
任一步失败 = STOP
```

---

## 3 · 诚实边界

- `B1–B11 ARCHIVED` ≠ Reality Seal ≠ Production GO  
- Official UX Batch Closure ≠ Web3 Reality Seal  
- UX 轨不替代 Track1 Finalize
