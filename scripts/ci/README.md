# Local CI (no GitHub-hosted runners)

Single entry:

```bash
bash scripts/ci/run_local_ci.sh
```

Produces under `evidence/GO_local_ci_<UTC>/` (override with `TT_LOCAL_CI_EVIDENCE_DIR`):

- `report.json` — R-001 + merged `orchestration`
- `report.93_prereport.json` — 93 matrix slice before merge
- `release_orchestration.json` — 96-15 / v2 automation
- `go_state_suggestion.json` — `go_state_machine` verdict + attributions

Does not call GitHub APIs. Optional `GITHUB_RUN_ID` / `GITHUB_SHA` in child scripts are ignored for execution unless you set them locally.

The **[95]** stage includes **`npm run check:tokens`** in `frontend/` (Tailwind forbidden classes; **community** and **did-rank** are scanned with the rest of the app).

See header comments in `run_local_ci.sh` for environment flags.
