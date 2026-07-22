# PSG Delta Recertify · Three Baseline · DRY-RUN

**Status:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · **REPORT ONLY** · **≠ GO**
**Recorded:** `2026-07-22T04:35:29Z`
**Pin / Runtime tip:** `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a718561…`
**HEAD:** `fbb9dc0e6442…` · dirty=8

## Verdict

- P0 findings: **0**
- Expected Differences: **1**
- Formal cert started: **false**
- Core version modified: **false**

## Axes

| Axis | OK | Detail |
|------|----|--------|
| `final_release` | ✅ | `{"freeze_status": "FROZEN", "cert_suite": "ARMED_NOT_EXECUTED", "ok": true}` |
| `registry_active` | ✅ | `{"pin": "PSG-REL-20260720-WEB3-CAND-V2", "sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "ok": true}` |
| `baseline_candidate` | ❌ | `{"status": null, "ok": false}` |
| `baseline_v311` | ✅ | `{"path_exists": true, "ok": true}` |
| `baseline_egm` | ✅ | `{"adjudication": "CLOSED_AS_FRAMEWORK_DESIGN", "ok": true}` |
| `engineering_ssot` | ✅ | `{"status": "ACTIVE_UNDER_PSG", "ok": true}` |
| `git` | ❌ | `{"head": "fbb9dc0e6442229997559d5308c8acfe3e0f5a50", "dirty": 8, "runtime_tip": "97289a7185610ef0ad8822f0af04bfa533e4298` |
| `staging_api` | ✅ | `{"sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "profile": "v311_fund_safety` |
| `staging_web` | ✅ | `{"bake_sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "bake_pin": "PSG-REL-20260720-WEB3-CAND-V2", "db": "staging_rc_` |
| `evidence` | ❌ | `{"sha": null, "pin": null, "ok": false}` |
| `deploy_defaults` | ✅ | `{"polluted_lines": [], "ok": true}` |

## Findings

- **P1** `EVIDENCE_IDENTITY_DRIFT` — {'sha': None, 'pin': None, 'ok': False}

## Expected Differences

- `FREEZE_OVERLAY_HEAD_VS_RUNTIME_TIP` — HEAD=fbb9dc0e6442 runtime_tip=97289a718561 — CONFIRM_DESIGN until Owner redeploy or tip mint

## Honesty

DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.
