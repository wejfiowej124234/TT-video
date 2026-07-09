# Local-First Alignment Audit

**At:** 20260630T085331Z
**HEAD (dev SSOT):** `82aba4aa8e710c01b50fd680c22c5352fc4dee78`
**Staging API runtime:** `f29b2772ed39afd57ff604704c1c8329358d08d0`
**Staging Web runtime:** `f29b2772ed39afd57ff604704c1c8329358d08d0`
**Local ahead undeployed:** yes
**Runtime drift:** no

```text
TT_LOCAL_FIRST_ALIGNMENT: NOT_100_PERCENT_ALIGNED
```

## P0 Gaps (0)

- none

## P1 / INFO (5)

- **GAP-DEPLOY-SSOT** (P1): Phase② deploy-path uncommitted — not staging runtime drift until S5 deploy
- **GAP-WT-TRACKED** (P1): scripts/docs tracked dirty — local convergence; ≠ staging runtime drift
- **GAP-PHASE3-WIP-ISOLATED** (INFO): Phase③ WIP in worktree — must stay isolated from Phase② deploy
- **GAP-LOCAL-AHEAD-UNDEPLOYED** (INFO): head=82aba4aa8e71 staging=f29b2772ed39 — Local First; bring at S5 deploy only
- **GAP-EVIDENCE-HISTORICAL** (INFO): TN-P1-010/D24/D6 historical gates · TN-P1-010: need post-soak TN-P1-010 @ freeze 8dcd304a (historical-only reports excluded)

**SSOT:** [TT-LOCAL-FIRST-CONVERGENCE.md](../../docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md)

**Honest:** WT / evidence gaps ≠ staging runtime drift when `local_ahead_undeployed=true`.
