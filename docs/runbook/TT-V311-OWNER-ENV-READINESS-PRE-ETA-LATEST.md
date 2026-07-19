# Owner Env Readiness · Pre-ETA

**Machine:** `TT_V311_OWNER_ENV_READINESS_PRE_ETA`  
**Status:** `READY_EXCEPT_WC`  
**Recorded:** `2026-07-18T13:59:13Z`  
**Governance:** `FROZEN_WAITING_EXECUTE`

## Done
| ID | Item | Status |
|----|------|--------|
| ENV-01 | Sepolia cert env CHAIN_ID=11155111 + RPC + signing key | `PASS_OWNER_ACTIONS_FOR_UI_FULL` |
| ENV-02 | frontend/.env.sepolia.local CHAIN_ID=11155111 + freeze address pins | `PREPARED_AWAITING_OWNER_WC_INJECT` |
| ENV-03 | Anvil .env.local 31337 preserved (Expected Difference) | `PRESERVED` |
| ENV-04 | Post-Execute Operator Card + Dry Run | `DRY_RUN_PASS_READY_FOR_ETA` |
| ENV-05 | Package preflight (NOT_LOCKED until Function 54/0/0) | `PREFLIGHT_PASS` |
| ENV-06 | F-02 Heartbeat + Drift monitor loop armed | `ARMED` |

## Blocked · Owner only
| ID | Item | Status | Action |
|----|------|--------|--------|
| ENV-WC | WalletConnect KEY_PRESENT | `KEY_ABSENT` | `bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>' && node scripts/dev/probe-walletconnect-project-id.cjs` |

## Monitor only until ETA
```bash
python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py
python scripts/dev/run-v311-full-system-drift-audit.py
```

**ETA 后：** 严格 [`TT-V311-POST-EXECUTE-OPERATOR-CARD-LATEST.md`](../../docs/runbook/TT-V311-POST-EXECUTE-OPERATOR-CARD-LATEST.md) S0→S5。  
**禁止：** 协议/ACTIVE/Runtime/Registry/Package/Money-Path 变更 · 跳阶 · Production GO。
