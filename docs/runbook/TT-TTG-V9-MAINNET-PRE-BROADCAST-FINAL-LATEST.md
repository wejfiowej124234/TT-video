# TT · TTG V9 Mainnet Pre-Broadcast Final Gate (Design Lock · DL_R1)

**STATUS:** `V9_MAINNET_PRE_BROADCAST_FINAL_PASS` · **STOP** · **NOT broadcasting**  
**Candidate (sole ACTIVE):** `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DL_R1**  
**Prereq:** `V9_SEPOLIA_REGRESSION_DL_R1_PASS`  
**Forbidden:** mutate Candidate / audited core · Mainnet broadcast without Owner auth · auto `TT_PRODUCTION_GO` · any R2/Remint/deploy3 asset

**Gate entry:** `python scripts/dev/run-ttg-v9-mainnet-pre-broadcast-final-gate.py`  
**Artifact pin:** `evidence/GO_ttg_v9_audit/V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json`

---

## Nailed pins (Mainnet)

| Pin | Value |
|-----|-------|
| `chain_id` | **1** |
| Solo Timelock delay | **48h** |
| Marketing / Deploy / Timelock admin / TTG 5% | `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| Team / TTG 3% | `0x010365F0835323826569D61D0E13E6F8d25F6828` |
| Treasury / pause Guardian / TTG 7% / Access Fee / P4 ops | `0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736` |
| Sale USDC treasury | **NEW ProjectPool** (never legacy P4Cap `0xfB90…`) |
| Timelock admin | **never** legacy Safe `0x96491…` |
| FeeRouter callers | **KEEP Escrow / Settlement only** · jurisdiction from trusted order ISO · **FORBID FeeIngress** |
| Compiler | solc **0.8.36** · via_IR · optimizer 200 · paris · profile `ttg_v9` |
| Genesis | **50 / 35 / 3 / 5 / 7** · 25T · no-mint |
| Fee | **500 bps** → Active Steward **45/55** else **100%** NEW Pool |
| P4 | **90d ≤ 30%** · USDC-only (DL_R1) |

---

## Exact Match

Source sha256 (frozen Candidate) · local forge creation/runtime bytecode pins · compiler settings · constructor/initializer sequence in broadcast artifact pin — all PASS under this gate.

---

## Owner next (only)

Independent written **Mainnet Broadcast Authorization** must name:

1. `V9_AUDIT_CANDIDATE_DESIGN_LOCK`  
2. `DL_R1`  
3. `V9_SEPOLIA_REGRESSION_DL_R1_PASS`  

Then per-tx Mainnet deploy + on-chain verify. Deploy complete still **does not** flip `TT_PRODUCTION_GO`.

Any Exact Match / caller / address / privilege / param drift → **STOP**.
