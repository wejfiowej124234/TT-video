# PSG Delta Recertify · Three Baseline · DRY-RUN

**Status:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · **REPORT ONLY** · **≠ GO**
**Recorded:** `2026-07-22T08:15:38Z`
**Pin / Runtime tip:** `PSG-REL-20260720-WEB3-CAND-V2` @ `6b85bde97737…`
**HEAD:** `a190592afdf1…` · dirty=41

## Verdict

- P0 findings: **0**
- Expected Differences: **2**
- Formal cert started: **false**
- Core version modified: **false**

## Axes

| Axis | OK | Detail |
|------|----|--------|
| `final_release` | ✅ | `{"freeze_status": "FROZEN", "cert_suite": "DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO", "ok": true}` |
| `registry_active` | ✅ | `{"pin": "PSG-REL-20260720-WEB3-CAND-V2", "sha": "6b85bde9773788638c4d8cf031dfe48ef56d1706", "ok": true}` |
| `baseline_candidate` | ✅ | `{"status": "ACTIVE_WEB3_CANDIDATE_BASELINE", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true}` |
| `baseline_v311` | ✅ | `{"path_exists": true, "ok": true}` |
| `baseline_egm` | ✅ | `{"adjudication": "CLOSED_AS_FRAMEWORK_DESIGN", "ok": true}` |
| `engineering_ssot` | ✅ | `{"status": "ACTIVE_UNDER_PSG", "ok": true}` |
| `git` | ❌ | `{"head": "a190592afdf1c2225544659902a213f028357465", "dirty": 41, "freeze_tip": "6b85bde9773788638c4d8cf031dfe48ef56d170` |
| `staging_api` | ✅ | `{"sha": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "profile": "v311_fund_safety` |
| `staging_web` | ✅ | `{"bake_sha": "6b85bde9773788638c4d8cf031dfe48ef56d1706", "bake_pin": "PSG-REL-20260720-WEB3-CAND-V2", "db": "staging_rc_` |
| `evidence` | ✅ | `{"sha": "6b85bde9773788638c4d8cf031dfe48ef56d1706", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true, "expected_differ` |
| `deploy_defaults` | ✅ | `{"polluted_lines": [], "ok": true}` |

## Findings

- **EXPECTED** `STAGING_API_TIP_LAG` — api=f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a freeze_tip=6b85bde9773788638c4d8cf031dfe48ef56d1706

## Expected Differences

- `STAGING_API_TIP_LAG` — api=f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a freeze_tip=6b85bde9773788638c4d8cf031dfe48ef56d1706
- `FREEZE_OVERLAY_HEAD_VS_FREEZE_TIP` — HEAD=a190592afdf1 freeze_tip=6b85bde97737 — commit freeze artifacts or clean worktree

## Honesty

DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.
