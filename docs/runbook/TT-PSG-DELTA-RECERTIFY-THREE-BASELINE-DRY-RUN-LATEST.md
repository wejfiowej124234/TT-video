# PSG Delta Recertify · Three Baseline · DRY-RUN

**Status:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · **REPORT ONLY** · **≠ GO**
**Recorded:** `2026-07-22T06:45:40Z`
**Pin / Runtime tip:** `PSG-REL-20260720-WEB3-CAND-V2` @ `f9c227de14ab…`
**HEAD:** `68ad15c85643…` · dirty=41

## Verdict

- P0 findings: **0**
- Expected Differences: **1**
- Formal cert started: **false**
- Core version modified: **false**

## Axes

| Axis | OK | Detail |
|------|----|--------|
| `final_release` | ✅ | `{"freeze_status": "FROZEN", "cert_suite": "DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO", "ok": true}` |
| `registry_active` | ✅ | `{"pin": "PSG-REL-20260720-WEB3-CAND-V2", "sha": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a", "ok": true}` |
| `baseline_candidate` | ✅ | `{"status": "ACTIVE_WEB3_CANDIDATE_BASELINE", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true}` |
| `baseline_v311` | ✅ | `{"path_exists": true, "ok": true}` |
| `baseline_egm` | ✅ | `{"adjudication": "CLOSED_AS_FRAMEWORK_DESIGN", "ok": true}` |
| `engineering_ssot` | ✅ | `{"status": "ACTIVE_UNDER_PSG", "ok": true}` |
| `git` | ❌ | `{"head": "68ad15c85643e78ed6a71e02ff0f626d6eedd42e", "dirty": 41, "freeze_tip": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5` |
| `staging_api` | ✅ | `{"sha": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "profile": "v311_fund_safety` |
| `staging_web` | ✅ | `{"bake_sha": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a", "bake_pin": "PSG-REL-20260720-WEB3-CAND-V2", "db": "staging_rc_` |
| `evidence` | ✅ | `{"sha": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true, "expected_differ` |
| `deploy_defaults` | ✅ | `{"polluted_lines": [], "ok": true}` |

## Findings

_none_

## Expected Differences

- `FREEZE_OVERLAY_HEAD_VS_FREEZE_TIP` — HEAD=68ad15c85643 freeze_tip=f9c227de14ab — commit freeze artifacts or clean worktree

## Honesty

DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.
