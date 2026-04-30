# Tier A1 — CI merge gate bundle (machine)

This directory satisfies **Tier A1 semiauto** minimum bytes for `run_96_15_orchestration.py`
when wired from **Production gate** (see `gates/production_gate.yaml`).

It is **not** a human production signoff bundle (see go-live checklist for real GO evidence).
It exists so **96-15 Tier A/B/C machine gates** run on every PR without `workflow_dispatch`.
