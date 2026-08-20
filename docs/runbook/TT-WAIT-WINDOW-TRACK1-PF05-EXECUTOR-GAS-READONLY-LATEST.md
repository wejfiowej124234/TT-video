# TT · Wait Window · Track1 PF-05 Executor / Gas（Read-only · LATEST）

**STATUS:** **PASS**  
**Stamp:** `2026-08-11T03:14:19Z` · block `25729004`  
**Mode:** 只读 · **禁止发交易** · **零链上状态变更** · Cut Queue / Official Runtime / 产品代码 **零改动**  

**Parent Preflight:** [`TT-WAIT-WINDOW-TRACK1-PRE-ETA-READONLY-PREFLIGHT-LATEST`](./TT-WAIT-WINDOW-TRACK1-PRE-ETA-READONLY-PREFLIGHT-LATEST.md)  
**Machine:** [`TT-WAIT-WINDOW-TRACK1-PF05-EXECUTOR-GAS-READONLY-LATEST.json`](./TT-WAIT-WINDOW-TRACK1-PF05-EXECUTOR-GAS-READONLY-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 1 · Execute 权限模型（本 op）

| 事实 | 证据 |
|------|------|
| Timelock = `GovernanceTimelock`（非 OZ TimelockController `EXECUTOR_ROLE`） | `contracts/src/GovernanceTimelock.sol` |
| `execute(bytes32)` = **任意调用方**（permissionless） | 源码：`function execute(bytes32 id) external` · 无 `onlyAdmin` |
| 门闩仅：`readyAt≠0` · `done=false` · `timestamp≥readyAt` | 同文件 |
| **Admin Safe** 只管 schedule / allowlist / governor | 链上 `admin()` = `0x96491aa8…40e7` |
| Safe **不必**为 execute 付 gas / 签名 | Safe ETH=`0` · 与模型一致 |

文档对齐：[`OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY`](./templates/mainnet-money-path/OWNER-TRACK1-FINALIZE-REHEARSAL-READONLY.md) Step1「谁付 gas = 任何人 · 常用 Wallet A」。

---

## 2 · 本 op 载荷（只读）

| 字段 | 值 |
|------|-----|
| opId | `0xe1d51e09…c116` |
| readyAt | `1786491935` |
| done | `false` |
| target | SettlementRouter `0xe5C3ED16…B372` |
| data | `setEscrow(0x9996FBD5…B8d6, true)` |
| `allowedExecutionTarget(SR)` | `true` |

---

## 3 · 预定执行钱包 + Gas

| 项 | 值 |
|----|-----|
| 预定执行钱包 | **Wallet A** `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4`（FTB / Matrix / Evidence） |
| Wallet A ETH | **0.334069 ETH**（`334069075949911771` wei） |
| 保守预算 | 150k gas × 50 gwei ≈ **0.0075 ETH** |
| Headroom | **≥10×** |
| 观测 baseFee | ≈ **46.2 gwei** |
| Safe ETH | `0`（execute **不依赖** Safe 余额） |

**可签名可发送（链上条件）：** permissionless 允许该 EOA · ETH 足够付 gas · 路径可达时间门。  
**Owner PK 保管：** 链外 ETA 操作前提（本探针 **不**探测私钥 · **不**因此标 UNKNOWN）。

---

## 4 · 模拟（无广播）

```text
eth_call / estimateGas
  from = Wallet A
  to   = Timelock
  data = execute(opId)
→ revert TooEarly()  selector 0x085de625
```

**解读：** ETA 前预期；证明路径 **非** `OnlyAdmin` / `UnknownOperation`；**无状态变更**。

---

## 5 · 裁决

**PF-05 = PASS**（关闭先前 A-02 UNKNOWN）。  
仍被 **PF-01 BEFORE_ETA** 挡住 · **≠ execute 授权** · **≠ Seal** · **≠ Production GO**。
