# MTM Count SSOT

**Status:** LOCKED — single source for governance traceability matrix row/tier counts  
**Effective:** 2026-07-09  
**Canonical matrix:** [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](../spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md)

---

## Rule

Any document, gate, runbook, or audit report that cites MTM row or tier counts **must reference this file** or the canonical matrix header — **must not** restate different numbers.

When tier counts change, update **only**:

1. This file
2. The header block in `TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md` (machine key line)
3. `registry/ttg-governance-mtm-counts.v1.yaml` (machine mirror)

---

## Canonical counts (GovFreeze V2 · Certification baseline)

| Metric | Value |
|--------|------:|
| **Total rows** | 146 |
| **DEV_DONE** | 58 |
| **TESTNET_DONE** | 40 |
| **HUMAN_DONE** | 48 |
| **OPS_DONE** | 18 |
| **DR_DONE** | 0 |

**Machine key:**

```
TTG_GOV_MTM: ROWS=146 DEV=58 TN=40 HUMAN=48 OPS=18 DR=0
```

---

## Known drift (do not cite)

These figures appear in older docs and are **superseded**:

| Source | Stale figures | Status |
|--------|---------------|--------|
| `GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md` header | DEV=63 HUMAN=43 OPS=13 | **DRIFT** — fix on next doc touch |
| `country-pool-settlement-gate2.4-prerequisites-checklist.md` | DEV=63 HUMAN=43 OPS=13 | **DRIFT** — fix on next doc touch |

---

## Audit / investor disclosure

For external disclosure of governance certification coverage, cite:

- **146** traceability rows
- Tier breakdown per table above
- Baseline: GovFreeze V2 Clean Sepolia (`gov_freeze_v2_clean_baseline`)

Do **not** cite aggregate "99/100" or other summary scores without pointing to the specific cert gate registry (`registry/ttg-governance-cert-gates.v1.yaml`).
