# TT · Wait Window · L1+L2 Final Ops-Pack Read-only Rehearsal（LATEST）

**STATUS:** `PREFLIGHT_PASS_SCHEDULE_PINNED_WAIT_ETA`  
**Stamp:** `2026-08-10T14:04:30Z`  
**ETA gate:** `2026-08-11T23:45:35Z` (`readyAt=1786491935`)  
**`TT_PRODUCTION_GO`:** `NO_GO`  
**Equals Seal:** `false`

**Parent:** [`TT-WAIT-WINDOW-ETA-HOLD-PREFLIGHT-POLICY-LATEST`](./TT-WAIT-WINDOW-ETA-HOLD-PREFLIGHT-POLICY-LATEST.md)  
**Pack:** [`OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY`](./templates/mainnet-money-path/OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY.md) · [`OWNER-TRACK1-REALITY-FINALIZE-EVIDENCE`](./templates/mainnet-money-path/OWNER-TRACK1-REALITY-FINALIZE-EVIDENCE.md)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Verdict（一行）

链上 Track1 只读预检 **绿 · HOLD**：Escrow Funded + Timelock op 钉死未执行 + allowlist 仍 false + 10 USDC 在 escrow。壁钟 **BEFORE_ETA** → **禁止 execute**。Official alignment gate **FAIL**（API `/meta` 仍挂 lineage factory）记为 **OPEN_OPS_HYGIENE**，**不**冒充 Seal，**不**提前翻 GO。

---

## L1 · Finalize 作战包复核（只读）

| # | 项 | 结果 |
|---|----|------|
| 1 | Canonical ETA / opId vs FTB | ✅ `2026-08-11T23:45:35Z` · `0xe1d51e09…c116` |
| 2 | Addresses：Timelock · SR · Fee · Escrow · Wired | ✅ 与 FTB / 模板常量一致 |
| 3 | Reality Escrow + ORDER_ID | ✅ `0x9996…B8d6` · `0x764cae8c…dda5` |
| 4 | Execute 路径 | ✅ Mainnet = `cast send` Timelock `execute(bytes32)` · **禁止** Sepolia `ExecuteSettlementRouterSetEscrow.s.sol` |
| 5 | Post-ETA 串行顺序 | ✅ execute → release → Settlement/Fee → Seal → Hard Gate · fail-closed |
| 6 | ABI 纠偏 | ✅ 模板 Allowlist 读口改为 `isEscrow(address)`（非 `isEscrowAllowed`） |

---

## L2 · 链上 / Runtime 只读读数

| # | 读数 | 结果 | 期望 |
|---|------|------|------|
| 1 | Wall clock UTC | `2026-08-10T14:04:30Z` · `BEFORE_ETA=true` · ~153700s | HOLD |
| 2 | Escrow `status()` | `2` (Funded) | `2` |
| 3 | Timelock `operations(opId)` | `readyAt=1786491935` · `done=false` · target=`0xe5C3…B372` (SR) | pinned · not done |
| 4 | SR `isEscrow(escrow)` | `false` | false until execute |
| 5 | USDC `balanceOf(escrow)` | `10000000` (= **10 USDC**) | Reality deposit |
| 6 | `check-official-mainnet-web3-alignment.sh` | **FAIL** | 见下 |
| 7 | Live `GET /meta` | Fee/SR/Timelock ✅ · factory=`0x052052…a4f7` **lineage** ≠ Wired `0xEE0B…C1C6` | OPEN_OPS_HYGIENE |
| 8 | FE bake Wired+Fee+SR | ✅ `.env.mainnet.local` + `tt-web-prod` build.env | OK |

**RPC note:** publicnode 偶发 TLS EOF；Escrow/Timelock/USDC/`isEscrow` 已取到有效读数。壁钟 vs `readyAt` 足以判定 HOLD。

---

## OPEN（窗内不修成 Seal）

| ID | 项 | 处置 |
|----|----|------|
| **H1** | Official API `/meta` `escrow_factory_v2_address` 仍 lineage | **OPEN_OPS_HYGIENE** · 不 mutate FTB/Track1 · 不阻塞 Timelock wait · Seal/alignment PASS 前须 bake 指回 Wired |
| **H2** | Alignment gate FAIL | 与 H1 同源 · **≠** Reality 链上失败 |

---

## Freeze（即刻生效）

| 允许至 ETA | 禁止至 ETA |
|------------|------------|
| 本 SSOT 只读复核 · 壁钟再确认 | `Timelock.execute` · `Escrow.release` · TrustedFactory · Production GO |
| | 新 UX Batch / 扩大产品 FIX · 改 FTB / Registry / Wired / Track1 |

**下一步（ETA 后 · 严格串行）：**  
`execute(opId)` → `Escrow.release()` → Settlement/Fee 对账 → Reality Seal → Hard Gate 重评 · 任一步失败立即停。

---

## Honesty

`L1+L2 rehearsal PASS_HOLD` ≠ Reality Seal ≠ Production GO · UX B1–B11 ARCHIVED ≠ Web3 Seal · alignment FAIL ≠ Timelock 未钉死
