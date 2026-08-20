# TT · Wait Window · CUT_QUEUE_HOLD · PRE_ETA_READ_ONLY（LATEST）

**STATUS:** `SUPERSEDED_PRODUCT_HOLD → MAXIMIZE_PRE_ETA_REMEDIATION`  
**Stamp:** `2026-08-11T04:17:00Z` · **BEFORE_ETA**  
**ETA gate:** `2026-08-11T23:45:35Z`  
**`TT_PRODUCTION_GO`:** `NO_GO` · **Seal ≠ GO**  

**Superseded by:** [`TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST`](./TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST.md)  
**Cut Queue（现可串行隔离 Cut）：** [`TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md)  
**本文件保留：** 29-file baseline hash（回滚参考）· Track1 Money Path 仍 **FROZEN**

**Machine:** [`TT-WAIT-WINDOW-CUT-QUEUE-HOLD-PRE-ETA-READ-ONLY-LATEST.json`](./TT-WAIT-WINDOW-CUT-QUEUE-HOLD-PRE-ETA-READ-ONLY-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 现行（见 Strategy · 本段仅留档）

产品只记不修的 PRE_ETA_READ_ONLY **已废止**。  
Track1 Money Path **仍绝对冻结**。  
29-file hash = 回滚基线；串行 Cut 见 Cut Queue LATEST。

| 面 | 状态 |
|----|------|
| 产品代码 | **允许**最小单包 FIX（串行） |
| Official Runtime | **允许**隔离 Cut |
| Cut Queue | **ACTIVE**（隔离闸 · 非等 Seal） |
| Track1 execute/release | **FORBIDDEN until ETA + Preflight PASS** |

---

## 1 · 冻结 Manifest（29 files · sha256_16）

| Pack | Files | Local tests baseline | Rollback |
|------|-------|----------------------|----------|
| **R-USDC-1** | 14 | 5 files / 49 tests | FE only · 独立 |
| **R-PAY-IA-1** | 5 | 4 files / 21 tests | `next.config` + contracts · 独立 |
| **R-ADMIN-1** | 10 | 5 files / 15 tests | FE primary · orphan API 可选 · 独立 |

**交叉：** multi-pack files = **NONE** · union = **29** · hard file deps = **false**  
**软序 + 硬闸：** Seal 后 `R-USDC-1` **CLOSED** → 才开 `R-PAY-IA-1` → **CLOSED** → 才开 `R-ADMIN-1`

完整 path + `sha256_16` + bytes 见 JSON `frozen_manifest`（本戳锁定；ETA 前禁止改产品字节）。

---

## 2 · ETA 前允许 / 禁止

| 允许 | 禁止 |
|------|------|
| Track1 fail-closed **只读** Preflight | 产品代码新增/修改 |
| Cut Queue / Manifest 检查 | Official Runtime / Deploy |
| SSOT 状态刷新（不冒充 Seal/GO） | execute / release / Settlement·Fee |
| 异常 **RECORD_ONLY** | 顺手修 · 解锁 Cut Queue · 翻 GO |

---

## 3 · ETA 后 Track1 串行（独占）

```text
fresh Track1 Preflight ALL PASS
  （时间 · op · Escrow 10 USDC · done=false · 地址/钱包/gas 等）
  → Timelock.execute
  → receipt / event / isEscrow 确认
  → Escrow.release
  → Settlement / Fee 到账对账
  → Reality Evidence Seal
  → Hard Gate 重评
```

任一 FAIL/UNKNOWN → **立即 STOP**。  
Seal 前 **不得** Official Cut；**Seal ≠ GO**。
---

## 4 · Seal 后 Cut Queue（串行 CLOSED 闸）

```text
Reality Seal PASS
  → unlock Cut Queue
  → Cut-1 R-USDC-1  Official Deploy → RV → SSOT → Staging/Local → CLOSED
  → Cut-2 R-PAY-IA-1 … → CLOSED
  → Cut-3 R-ADMIN-1  … → CLOSED
```

**前包未 CLOSED → 禁止开启后包。**

---

## 5 · 诚实边界

- `CUT_QUEUE_HOLD` ≠ Seal ≠ `TT_PRODUCTION_GO`
- `LOCAL_READY_NOT_DEPLOYED_FROZEN` ≠ CLOSED ≠ Runtime Verified
- 本戳 Preflight `PRE_ETA_HOLD_NOT_EXECUTE` ≠ execute 授权
