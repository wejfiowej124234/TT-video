# V9 Web3 Mainline · SEPOLIA_REALITY **ACTIVE**

**STATUS:** `SEPOLIA_REALITY = IN_PROGRESS` · **WAITING_ETA**  
**PRODUCT plane:** **FROZEN** — [TT-OFFICIAL-FIRST-PRODUCT-CONVERGENCE-FROZEN-LATEST](TT-OFFICIAL-FIRST-PRODUCT-CONVERGENCE-FROZEN-LATEST.md)  
**AUDIT_1_CANDIDATE_SHA:** `b19b85810c22677d243a82d06ebec8ebcb4d4b47` (**禁止**改 Solidity · 否则 **STOP** 作废 Audit #1 → 退回 Local→Audit #1)  
**Timelock cert:** **SINGLE_12H** — TooEarly → real 12h → Executable **once**  
**READY_AT:** `1787408352` (~2026-08-22 14:19:12 UTC)  

| Flag | Value |
|------|-------|
| `EXACT_MATCH` | **NOT_ISSUED** |
| `MAINNET_BROADCAST` | **NOT_AUTHORIZED** |
| `TT_PRODUCTION_GO` | **NO_GO** |
| Official www Web3 更新 | **禁止**直至 V9 Mainnet 最终 Reality 完成 |

---

## 当前动作（P0）

1. **只读探针** Timelock `operations(idSeed)`：

```bash
bash scripts/dev/probe-ttg-v9-sepolia-timelock-reality-status.sh
```

2. **ETA 到达后**（`state=EXECUTABLE`）执行冻结生命周期：

```bash
TRAVELTRUST_TTG_V9_PERIPHERY_SEPOLIA_OK=1 \
  bash scripts/dev/run-ttg-v9-periphery-governance-sepolia-reality.sh resume
```

3. 收口 **`V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP`** → **仅随后** 进入 **Audit #2**

---

## 链上状态机

| `timelock_operation_state` | 含义 |
|----------------------------|------|
| `WAITING_ETA` | `chain_now < readyAt` |
| `EXECUTABLE` | `readyAt <= chain_now` 且 `done=false` — 可跑 `resume` |
| `EXECUTED` | `done=true` — 勿重复 execute |

Machine: `evidence/GO_ttg_v9_periphery_governance_upgrade/SEPOLIA_TIMELOCK_REALITY_STATUS_LATEST.json`

---

## Cross-refs

- [WAITING_ETA runbook](TT-TTG-V9-PERIPHERY-GOVERNANCE-SEPOLIA-REALITY-WAITING-ETA-LATEST.md)  
- [ETA Ops Checklist](TT-TTG-V9-PERIPHERY-SEPOLIA-ETA-OPS-CHECKLIST-LATEST.md)  
- [Periphery Freeze](TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-FREEZE-LATEST.md)  
- [Audit #2 prep](TT-TTG-V9-AI-AUDIT2-PERIPHERY-GOVERNANCE-UPGRADE-PREP-LATEST.md) (**NOT OPEN** until Sepolia PASS_STOP)
