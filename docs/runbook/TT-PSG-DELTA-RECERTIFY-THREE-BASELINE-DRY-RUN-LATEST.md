# PSG Delta Recertify · Three Baseline · DRY-RUN

**Status:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · **REPORT ONLY** · **≠ GO**
**Recorded:** `2026-07-22T06:01:58Z`
**Pin / Runtime tip:** `PSG-REL-20260720-WEB3-CAND-V2` @ `f9c227de14ab…`
**HEAD:** `f9c227de14ab…` · dirty=48

## Verdict

- P0 findings: **0**
- Expected Differences: **2**
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
| `git` | ❌ | `{"head": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a", "dirty": 48, "freeze_tip": "f9c227de14abf1aca0a3b0649dd4c7bf379c6b5` |
| `staging_api` | ✅ | `{"sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "profile": "v311_fund_safety` |
| `staging_web` | ✅ | `{"bake_sha": "4050f50a7d0c94939c0e471e197806f766d4391f", "bake_pin": "PSG-REL-20260720-WEB3-CAND-V2", "db": "staging_rc_` |
| `evidence` | ❌ | `{"sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": false, "expected_diffe` |
| `deploy_defaults` | ✅ | `{"polluted_lines": [], "ok": true}` |

## Findings

- **EXPECTED** `STAGING_API_TIP_LAG` — api=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a
- **EXPECTED** `STAGING_WEB_TIP_LAG` — web=4050f50a7d0c94939c0e471e197806f766d4391f freeze_tip=f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a
- **P1** `EVIDENCE_IDENTITY_DRIFT` — {'sha': '97289a7185610ef0ad8822f0af04bfa533e42986', 'pin': 'PSG-REL-20260720-WEB3-CAND-V2', 'ok': False, 'expected_difference': False}

## Expected Differences

- `STAGING_API_TIP_LAG` — api=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a
- `STAGING_WEB_TIP_LAG` — web=4050f50a7d0c94939c0e471e197806f766d4391f freeze_tip=f9c227de14abf1aca0a3b0649dd4c7bf379c6b5a

## Honesty

DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.
