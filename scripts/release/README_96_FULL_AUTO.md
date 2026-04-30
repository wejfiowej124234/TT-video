# 96 full automation (v2 orchestration)

No `docs/spec` edits. Outputs: `evidence/<run>/release_orchestration.json`, optional merge into `report.json`.

## Generate v2 orchestration

```bash
# Tier-A evidence stubs (same as tier chain)
python scripts/release/gen_tier_a_evidence_bundle.py evidence/MYRUN/deep
# v2 full auto (TT_96_LIGHT=1 skips npm/page_count **and** external-pack gates:
# env_path_or_fail + r002_report_validate; production runs omit TT_96_LIGHT)
TT_96_LIGHT=1 python scripts/release/run_96_full_automation.py \
  --out-dir evidence/MYRUN \
  --tier-a1-readme evidence/MYRUN/deep/README.md \
  --tier-a2-markdown evidence/MYRUN/deep/59_p0_table.md \
  --require-tier-a-semiauto
```

## External booklet evidence (FAIL without inputs)

For each `AUTO-96-0x` gate set `TT_96_EVIDENCE_96_0x` to a repo-relative path (file or dir, min 64 bytes for files).

**96-11 / R-002:** set `TT_96_REPORT_JSON` to `report.json` (validated with `scripts/validate-regression-report.py --validate-orchestration`), or `TT_96_ACCEPTED_RISK_96_11_R002` to an accepted-risk JSON.

Or `TT_96_ACCEPTED_RISK_96_0x` to a JSON file:

```json
{"kind":"accepted_risk","risk_id":"R-LEGAL-001","rationale":"Board accepted pending counsel review 2026-04-25."}
```

## Scope N_A

`TT_96_SCOPE_BOOKLETS=96-13,96-16` — booklets not listed become step status `N_A`.

## Merge + verdict

```bash
python scripts/release/merge_orchestration_into_report.py \
  evidence/MYRUN/report.json evidence/MYRUN/release_orchestration.json \
  -o evidence/MYRUN/report.merged.json
python scripts/release/go_state_machine.py \
  --orchestration evidence/MYRUN/release_orchestration.json \
  --regression evidence/MYRUN/report.json --policy tri_state_v2 --out evidence/MYRUN/go_state.json
python scripts/validate-regression-report.py evidence/MYRUN/report.merged.json --validate-orchestration
```

## Production GO

Requires: orchestration v2, no `FAIL`, `tier_a_all_pass` + `tier_bc_all_pass`, `release_gate==GO`, no `cases[].status==FAIL`, and either no `ACCEPTED_RISK` or `TT_96_ACK_ACCEPTED_RISKS_FOR_PRODUCTION=1` / `summary.accepted_risks_production_acknowledged`.

## v1 orchestration (`run_96_15_orchestration.py`)

`TT_96_V1_MAP_MANUAL_TO_FAIL` defaults to **1**: any `MANUAL_REQUIRED` tier B/C rows are rewritten to `FAIL` before `release_orchestration.json` is written. Set to `0` only for legacy human-readable dumps.

## 95 F-row hints (machine index)

`scripts/release/data/95_f_row_alignment.v1.json` maps step ids to F-row / control tags; merged into each v2 step as `f_row_hints`.
