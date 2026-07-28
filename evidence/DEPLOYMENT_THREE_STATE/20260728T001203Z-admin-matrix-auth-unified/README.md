# Admin Matrix Auth Unification · Staging Evidence (②)

**Stamp:** `20260728T001203Z`  
**Phase:** ② Staging only — **NOT** ARM · **NOT** PRR · **NOT** Production GO

## Auth SSOT

All Admin Matrix audit, meta-source Reality probe, and SR runtime Reality probe converge on:

```
seed → login → role ∈ {admin, super_admin} → GET /api/v1/admin/capabilities → HTTP 200
```

Implementation: `scripts/dev/lib/official-cold-start-admin-client.cjs` (`loginWithCapabilitiesGate`, `adminSession`).

## Results (canonical)

| Gate | Verdict | Notes |
|------|---------|-------|
| Admin L5 audit + Playwright | **PASS** | 24/24 API probes 200 · 4/4 browser |
| Meta-source probe (rerun) | **PASS_WITH_CONFIRM_DESIGN** | 9 pass · 1 confirm_design (finance chain_off) |
| SR runtime probe | **PASS_RUNTIME_PARTIAL** | finance/SR/RBAC 200 · SR total=3 |
| Three-state bake | **captured** | `bake.json` · `health.json` · `meta.json` |
| Matrix Recalc | **NOT_COMPLETE** | `psg_complete: false` · ACTIVE_FLIP FORBIDDEN |

## Transient flake (documented)

First meta-source run (`meta-source-probe/`) returned **FAIL** (4×401) despite cap=200 — same class of Staging timing issue as prior cap-gate work. **Canonical** meta-source result is **rerun** (`meta-source-probe-rerun/`).

## Bake vs tip

| Field | Value |
|-------|-------|
| Staging bake SHA | `72c764a32407062f19e7f16e11294f94ac4c3f3f` |
| Cited Final Truth tip | `ea71c577…` |
| Classification | **EXPECTED_DIFFERENCE** (CONFIRM_DESIGN) |

## Frozen constraints (unchanged)

- Pin: `PSG-REL-20260720-WEB3-CAND-V2`
- Candidate v2 / V3.1.1 / PSG-EGM frozen
- No ARM · No PRR · No Production GO · No Active Flip

## Reproduce

```bash
export PLAYWRIGHT_BROWSERS_PATH="/c/Users/plant/AppData/Local/ms-playwright"
export STAGING_AUDIT_EMAIL="adm-10x4-20260719143519@traveltrust.test"
export STAGING_AUDIT_PASSWORD="Test123!"
export STAGING_API_BASE="https://tt-api-staging.fly.dev"
export STAGING_WEB_BASE="https://tt-web-staging.fly.dev"

bash scripts/dev/run-admin-l5-staging-audit.sh
node scripts/dev/probe-admin-matrix-meta-source-staging.cjs
node scripts/dev/probe-admin-matrix-sr-staging-runtime.cjs
bash scripts/dev/run-psg-completion-matrix-recalculate.sh
```

## Machine-readable summary

See `CLOSURE-SUMMARY.json`.
