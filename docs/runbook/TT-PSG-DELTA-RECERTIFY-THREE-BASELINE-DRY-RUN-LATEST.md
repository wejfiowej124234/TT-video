# PSG Delta Recertify · Three Baseline · DRY-RUN

**Status:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · **REPORT ONLY** · **≠ GO**
**Recorded:** `2026-07-24T06:29:25Z`
**Pin / Runtime tip:** `PSG-REL-20260720-WEB3-CAND-V2` @ `ea71c577ce6f…`
**HEAD:** `359273e54426…` · dirty=1340

## Verdict

- P0 findings: **0**
- Expected Differences: **3**
- Formal cert started: **false**
- Core version modified: **false**

## Axes

| Axis | OK | Detail |
|------|----|--------|
| `final_release` | ✅ | `{"freeze_status": "FROZEN", "cert_suite": "DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO", "ok": true}` |
| `registry_active` | ✅ | `{"pin": "PSG-REL-20260720-WEB3-CAND-V2", "sha": "ea71c577ce6f99696df33f9394cf96746edc843b", "ok": true}` |
| `baseline_candidate` | ✅ | `{"status": "ACTIVE_WEB3_CANDIDATE_BASELINE", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true}` |
| `baseline_v311` | ✅ | `{"path_exists": true, "ok": true}` |
| `baseline_egm` | ✅ | `{"adjudication": "CLOSED_AS_FRAMEWORK_DESIGN", "ok": true}` |
| `engineering_ssot` | ✅ | `{"status": "ACTIVE_UNDER_PSG", "ok": true}` |
| `git` | ❌ | `{"head": "359273e54426fc5e2d221f75accf8a18adc66227", "dirty": 1340, "freeze_tip": "ea71c577ce6f99696df33f9394cf96746edc8` |
| `staging_api` | ✅ | `{"sha": "12b41d56e74076f7d0cf424c13d3e3e0cd822003", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "profile": "v311_fund_safety` |
| `staging_web` | ✅ | `{"bake_sha": "1e1908a1d96888f508665519fdac75a3a5d6ba4f", "bake_pin": "PSG-REL-20260720-WEB3-CAND-V2", "db": "staging_rc_` |
| `evidence` | ✅ | `{"sha": "ea71c577ce6f99696df33f9394cf96746edc843b", "pin": "PSG-REL-20260720-WEB3-CAND-V2", "ok": true, "expected_differ` |
| `deploy_defaults` | ✅ | `{"polluted_lines": [], "ok": true}` |

## Findings

- **EXPECTED** `STAGING_API_PATCH_RUNTIME` — api=12b41d56e74076f7d0cf424c13d3e3e0cd822003 living_tip=ea71c577ce6f99696df33f9394cf96746edc843b · Staging Patch Track B · tip cite-only
- **EXPECTED** `STAGING_WEB_PATCH_RUNTIME` — web=1e1908a1d96888f508665519fdac75a3a5d6ba4f living_tip=ea71c577ce6f99696df33f9394cf96746edc843b · Staging Patch Track B · tip cite-only

## Expected Differences

- `STAGING_API_PATCH_RUNTIME` — api=12b41d56e74076f7d0cf424c13d3e3e0cd822003 living_tip=ea71c577ce6f99696df33f9394cf96746edc843b · Staging Patch Track B · tip cite-only
- `STAGING_WEB_PATCH_RUNTIME` — web=1e1908a1d96888f508665519fdac75a3a5d6ba4f living_tip=ea71c577ce6f99696df33f9394cf96746edc843b · Staging Patch Track B · tip cite-only
- `FREEZE_OVERLAY_HEAD_VS_FREEZE_TIP` — HEAD=359273e54426 freeze_tip=ea71c577ce6f — commit freeze artifacts or clean worktree

## Honesty

DRY-RUN ≠ formal Delta Recertify PASS ≠ Staging-grade GO ≠ Production GO.
