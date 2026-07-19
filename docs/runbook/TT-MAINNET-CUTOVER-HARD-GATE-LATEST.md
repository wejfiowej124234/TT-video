# TT · Mainnet Fund-Safety Cutover Hard Gate

**Machine:** `TT_MAINNET_CUTOVER_HARD_GATE`  
**SSOT:** [`registry/mainnet-cutover-hard-gate.v1.yaml`](../../registry/mainnet-cutover-hard-gate.v1.yaml)  
**Gate:** `bash scripts/gates/check-mainnet-cutover-hard-gate.sh`  
**Status (initial):** **REFUSED**  
**Fund bar:** **REAL ETH Mainnet** — paper GO forbidden · env-alone unlock forbidden · never SKIP

> **① Local / ② Sepolia PASS ≠ ③ Mainnet GO.**  
> This gate exists so cutover cannot claim green without fund-safety evidence.

---

## 0 · Doctrine

| Rule | Meaning |
|------|---------|
| Highest standard | Real ETH Mainnet user-fund safety |
| Paper GO | **Forbidden** |
| Env unlock alone | **Forbidden** (`TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1` insufficient) |
| Missing evidence | **exit 1** `CUTOVER_REFUSED` |
| User funds | Only after Shadow → Owner auth → small wave → Full GO |
| Anomaly | **fail-closed** — halt wave · pause · no “force GO” |

---

## 1 · Required axes (evidence, not checkboxes)

| ID | Axis | Evidence |
|----|------|----------|
| AXIS-01 | Mainnet Release Freeze | `registry/mainnet-release-freeze.v1.yaml` → `FROZEN` |
| AXIS-02 | Escrow final freeze | `registry/escrow-final-freeze-mainnet.v1.yaml` → `FROZEN` · V1 FORBIDDEN |
| AXIS-03 | Mainnet fork full rehearsal | `…/mainnet-fork-rehearsal/MAINNET-FORK-REHEARSAL-LATEST.json` (`chain_forked: 1`) |
| AXIS-04 | Bytecode / address / chain_id=1 | Via launch precheck + fork evidence |
| AXIS-05 | Safe multisig + roles | `SAFE-ROLES-VERIFIED-LATEST.json` |
| AXIS-06 | Broadcast mis-exec protection | Hard gate + phase-boundary wiring |
| AXIS-07 | Secrets / infra / DNS / monitor / rollback | `OPS-SURFACE-VERIFIED-LATEST.json` |
| AXIS-08 | R-01 **or** Owner residual-risk signoff | See template below |
| AXIS-09 | Readiness audit P0=0 | `WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json` |
| AXIS-10 | PG-P0-ESC CLOSED | readiness registry field |
| AXIS-11 | Deployment package generated | package gate PASS |
| AXIS-12 | Shadow Launch `GO` | real run dir · four JSON · not TEMPLATE |
| AXIS-13 | G6 no-rollback ack | real file · not template |
| AXIS-14 | Owner cutover auth | registry `mainnet_cutover_authorized: true` + auth JSON |

---

## 2 · Verdict progression

```text
REFUSED
  → PREP_IN_PROGRESS   (scaffolds only; still refuse broadcast)
  → EVIDENCE_INCOMPLETE
  → AUTHORIZED_FOR_WAVE  (hard gate PASS for wave enable · still no Full GO)
  → FULL_GO              (all axes + Shadow + Owner + wave evidence)
```

**Refuse is success for this cycle** until evidence closes.  
`exit 1` + `verdict: REFUSED` or `EVIDENCE_INCOMPLETE` means the gate is working — **not** a broken install.

**Verified 2026-07-19 (scaffold):**

| Check | Result |
|-------|--------|
| `bash scripts/gates/check-mainnet-cutover-hard-gate.sh` | **exit 1** · open axes listed · never SKIP |
| `TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1` alone | **boundary exit 2** · hard gate still REFUSE |
| Fork harness without RPC | **exit 1** · refuses to invent fork |
| Live mainnet broadcast | **not executed** (stub + refuse) |

### Evidence progress (2026-07-19 · fail-closed maintained)

| Axis | Status | Notes |
|------|--------|-------|
| AXIS-03 Fork | **CLOSED** | `REHEARSAL_PASS` · `chain_forked=1` · block ~25568042 · no live broadcast |
| AXIS-01 Release Freeze | OPEN | Digests computed (`DIGESTS_READY_DIRTY_WORKTREE`) · `--apply` **refused** (dirty worktree) · status stays `NOT_FROZEN` |
| AXIS-02 Escrow Freeze | OPEN | Digests filled · `--apply` **refused** (`pg_p0_esc=OPEN`) · status stays `NOT_FROZEN` |
| AXIS-05 Safe | OPEN | Stamp `INCOMPLETE` · `safe_address=TBD` |
| AXIS-07 Ops | OPEN | Structural docs checked · secrets/infra/DNS/monitoring still false |
| AXIS-08 R-01 | OPEN | Unsigned residual draft only · gate rejects |
| AXIS-09…14 | OPEN | P0 audit · PG-P0-ESC · package · Shadow · G6 · Owner auth |

**Hard rule:** do not hand-edit `status: FROZEN` or `mainnet_cutover_authorized: true`. Use evidence scripts:

```bash
bash scripts/dev/run-mainnet-release-freeze-evidence.sh          # digests
bash scripts/dev/run-mainnet-release-freeze-evidence.sh --apply  # only if clean tree
bash scripts/dev/run-escrow-final-freeze-evidence.sh             # digests
bash scripts/dev/run-escrow-final-freeze-evidence.sh --apply     # only if pg_p0_esc=CLOSED
export MAINNET_FORK_RPC_URL=https://…   # or public read RPC
bash scripts/dev/rehearse-mainnet-cutover-fork.sh
```

**ACTIVE** remains `v311_sepolia_clean_baseline`. **No Wave Deployment** until hard gate PASS.

---

## 3 · Commands

```bash
# Always run — never SKIP
bash scripts/gates/check-mainnet-cutover-hard-gate.sh
# expect today: exit 1 · CUTOVER_REFUSED · open_axes listed in LATEST JSON

# Fork rehearsal scaffold (no live mainnet broadcast)
bash scripts/dev/rehearse-mainnet-cutover-fork.sh
# requires MAINNET_FORK_RPC_URL · writes fork evidence or honest FAIL
```

Phase-3 shells source [`web3-phase-boundary.sh`](../../scripts/dev/lib/web3-phase-boundary.sh), which **calls this hard gate** even when `TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1`.

---

## 4 · R-01 / residual risk

Template: [`templates/mainnet-package/R01-OR-RESIDUAL-RISK-SIGNOFF.md`](./templates/mainnet-package/R01-OR-RESIDUAL-RISK-SIGNOFF.md)

Gate accepts **either**:

- `R01-THIRD-PARTY-AUDIT-PASS.json`, or  
- `OWNER-RESIDUAL-RISK-SIGNOFF.json` (formal residual list + Owner signature)

---

## 5 · Non-goals (this scaffold cycle)

- No Ethereum mainnet broadcast  
- No ACTIVE flip / `PRODUCTION_SCOPE_MAINNET`  
- No Shadow `GO` claim without a real run  
- No Production GO / no user-fund enablement  
- No FG-15 cert Staging mutation  

---

## 6 · Evidence

| Artifact | Path |
|----------|------|
| Gate LATEST | `evidence/GO_production_readiness/mainnet-cutover-hard-gate/MAINNET-CUTOVER-HARD-GATE-LATEST.json` |
| Fork rehearsal | `evidence/GO_production_readiness/mainnet-fork-rehearsal/` |
| Readiness audit | `evidence/GO_production_readiness/web3-mainnet-audit/` |

**Honest line:** Closing axes is engineering work over time. This document does **not** authorize spending real ETH.
