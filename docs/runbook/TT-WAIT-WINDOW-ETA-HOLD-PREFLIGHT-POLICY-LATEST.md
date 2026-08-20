# TT · Wait Window · ETA Hold · Preflight Policy（LATEST）

**STATUS:** `MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN`  
**Stamp:** `2026-08-11T04:17:00Z`  
**ETA gate:** `2026-08-11T23:45:35Z`  
**`TT_PRODUCTION_GO`:** `NO_GO` · **Seal ≠ GO**  

**Strategy:** [`TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST`](./TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST.md)  
**Freeze:** [`TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST`](./TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST.md)  
**Cut Queue:** [`TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md) · **PRE_ETA 串行隔离 Cut 已开**  
**Active pack:** **R-USDC-1**  
**Preflight snapshot（过期参考）：** [`TRACK1-PRE-ETA-READONLY-PREFLIGHT`](./TT-WAIT-WINDOW-TRACK1-PRE-ETA-READONLY-PREFLIGHT-LATEST.md) · ETA 须 **fresh**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 窗内允许 / 禁止（现行 Freeze · Owner 钉死）

| 现在 → ETA | |
|------------|--|
| **允许** | 壁钟再确认 · Track1 **fail-closed 只读** Preflight · Cut Manifest 检查 · 异常只记不修 · SSOT 状态刷新（不冒充 Seal/GO） |
| **禁止** | 新深审波次（Wave-4+）· 产品代码 · Official Runtime · 配置 · Indexer · Cut Queue 解锁/改 manifest · 新 Local Prep · Official Deploy · 造数 · execute/release · Seal · GO |

**已备并冻结队列：** R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1（**仅 Seal 后** Cut · **串行 CLOSED 闸**）· R-MEDIA-1 SEPARATE。  
**lineage / Indexer / Media / Admin·USDC / Legal·Cert：** **不挡 Track1** · Seal 后 Ladder 分批。
---

## 1 · 只读 Preflight 入口（已演练 · 无 mutate）

真源清单：[`OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY`](./templates/mainnet-money-path/OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY.md) § Step 0  
**结果 SSOT：** [`TT-WAIT-WINDOW-L1-L2-FINAL-OPS-PACK-REHEARSAL-LATEST`](./TT-WAIT-WINDOW-L1-L2-FINAL-OPS-PACK-REHEARSAL-LATEST.md)

| 项 | 期望 | 2026-08-10 演练 |
|----|------|-----------------|
| `date -u` | **&lt; ETA** → HOLD | ✅ HOLD |
| `bash scripts/gates/check-official-mainnet-web3-alignment.sh` | PASS（只读） | ❌ FAIL · H1 lineage factory |
| Escrow `status()` | Funded（按 Reality 单） | ✅ `2` |
| Timelock `operations(opId)` | `readyAt>0` · `done=false` · 未到 readyAt → WAIT | ✅ pinned · WAIT |
| SR `isEscrow` | 通常仍 false until execute | ✅ `false` |
| USDC on escrow | Reality 10 USDC | ✅ `10000000` |
| `GET https://api.web3-ttg.com/meta` | 与 FTB 地址对齐 | ⚠️ Fee/SR/TL OK · factory lineage |

**常量 / opId：** 见 Rehearsal 模板（FTB）。

**Owner 钉死（2026-08-11T04:05Z）：** ETA 后 **fresh** Preflight 硬项 = 时间 · op · Escrow **10 USDC** · `done=false` · 地址/钱包/gas。  
`/meta` factory lineage · Indexer 0/0 · Media/Admin/Legal 等 = **Seal 后债** · **不得**用 alignment lineage FAIL 否决 Track1 Finalize。

---

## 2 · Finalize 作战包复核

| 包 | 路径 |
|----|------|
| Evidence prefills | [`OWNER-TRACK1-REALITY-FINALIZE-EVIDENCE`](./templates/mainnet-money-path/OWNER-TRACK1-REALITY-FINALIZE-EVIDENCE.md) |
| Read-only rehearsal | [`OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY`](./templates/mainnet-money-path/OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY.md) |

复核要点：chain_id=1 · Escrow · Timelock · SR · FeeRouter · opId · 钱包角色 · **禁止**用 Sepolia forge execute 脚本上主网。

---

## 3 · ETA 后串行（严格 · fail-closed）

```text
壁钟 ≥ ETA
  → 立即停止一切深审/产品工作
  → 生成 fresh Track1 Preflight（时间 · op · Escrow 10 USDC · done=false · 地址/钱包/gas 等）
  → 仅当 Preflight 全部 PASS
       → Timelock.execute(opId)
       → receipt / event / isEscrow 确认
       → Escrow.release()
       → Settlement / Fee 到账对账
       → Reality Evidence Seal
       → Hard Gate 重评
  → 任一步 FAIL / UNKNOWN → 立即 STOP
```

- **不**跳步 · **不**用过期 Preflight 冒充 fresh  
- **不**提前 TrustedFactory · **不**提前 Production GO  
- **Seal ≠ Production GO**  

### Seal 后债（Ladder · 不挡 Finalize）

lineage / Indexer / Media / Admin·USDC / Legal·Cert / Meta·RPC 等 **统一** 留到 Reality Seal 后，按 [`EXTENDED-ISSUE-REMEDIATION-LADDER`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST.md) + Cut Queue 分批（R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1 · R-MEDIA-1 SEPARATE）。

---

## 4 · 诚实边界

`WAVE3_STOP` · `ETA hold` ≠ Seal ≠ GO · UX ARCHIVED ≠ Web3 Reality Seal