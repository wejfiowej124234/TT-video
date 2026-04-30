# GO_96_bundle_20260425 — evidence index

**stamp**: 20260425

## Paths

| Path | Purpose |
|------|---------|
| evidence/GO_20260425/report.json | R-001 report (not templates/); PARTIAL_GO until all 96-13 routes are run. |
| evidence/GO_96_ux_20260425/README.md | 96-13 manual UX notes for /pay and /escrow/[id]. |
| evidence/GO_96_16_routes_20260425/README.md | 119 routes matrix pointers. |
| evidence/GO_96_15_deep_20260425/README.md | 96-15 Tier A inputs and orchestration alignment. |

## Reproduce gates

    python scripts/validate-regression-report.py evidence/GO_20260425/report.json --fail-on-no-go
    bash scripts/check-runbook-golive-doclink-gate.sh
    bash scripts/release/run_96_tier_a_p0_full_chain.sh

For strict Tier A paths, point tier-a1/tier-a2 at evidence/GO_96_15_deep_20260425/tier_a_semiauto_inputs/ (see that README).
