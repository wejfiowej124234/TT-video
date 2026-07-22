# PSG Delta Recertify · Three Baseline · DRY-RUN

**Status:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · **REPORT ONLY** · **≠ GO**
**Recorded:** `2026-07-22T05:03:03Z`
**Pin / Runtime tip:** `PSG-REL-20260720-WEB3-CAND-V2` @ `4050f50a7d0c…`
**HEAD:** `4050f50a7d0c…` · dirty=39

## Verdict

- P0 findings: **0**
- Expected Differences: **3**
- Formal cert started: **false**
- Core version modified: **false**

## Axes

| Axis | OK | Detail |
|------|----|--------|
| `final_release` | ✅ | `{"freeze_status": "FROZEN", "cert_suite": "UI_DELTA_DRY_PASS_PENDING_STAGING_REDEPLOY", "ok": true}` |
| `registry_active` | ✅ | `{"pin": "PSG-REL-20260720-WEB3-CAND-V2", "sha": "4050f50a7d0c94939c0e471e197806f766d4391f", "ok": true}` |
| `baseline_candidate` | ✅ | `{"status": "ACTIVE_WEB3_CANDIDATE_BASELINE", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true}` |
| `baseline_v311` | ✅ | `{"path_exists": true, "ok": true}` |
| `baseline_egm` | ✅ | `{"adjudication": "CLOSED_AS_FRAMEWORK_DESIGN", "ok": true}` |
| `engineering_ssot` | ✅ | `{"status": "ACTIVE_UNDER_PSG", "ok": true}` |
| `git` | ❌ | `{"head": "4050f50a7d0c94939c0e471e197806f766d4391f", "dirty": 39, "freeze_tip": "4050f50a7d0c94939c0e471e197806f766d4391` |
| `staging_api` | ✅ | `{"sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "profile": "v311_fund_safety` |
| `staging_web` | ✅ | `{"bake_sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "bake_pin": "PSG-REL-20260720-WEB3-CAND-V2", "db": "staging_rc_` |
| `evidence` | ✅ | `{"sha": "97289a7185610ef0ad8822f0af04bfa533e42986", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true, "expected_differ` |
| `deploy_defaults` | ✅ | `{"polluted_lines": [], "ok": true}` |

## Findings

- **EXPECTED** `STAGING_API_TIP_LAG` — api=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=4050f50a7d0c94939c0e471e197806f766d4391f
- **EXPECTED** `STAGING_WEB_TIP_LAG` — web=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=4050f50a7d0c94939c0e471e197806f766d4391f
- **EXPECTED** `EVIDENCE_TIP_LAG` — evidence=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=4050f50a7d0c94939c0e471e197806f766d4391f

## Expected Differences

- `STAGING_API_TIP_LAG` — api=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=4050f50a7d0c94939c0e471e197806f766d4391f
- `STAGING_WEB_TIP_LAG` — web=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=4050f50a7d0c94939c0e471e197806f766d4391f
- `EVIDENCE_TIP_LAG` — evidence=97289a7185610ef0ad8822f0af04bfa533e42986 freeze_tip=4050f50a7d0c94939c0e471e197806f766d4391f

## Honesty

DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.
