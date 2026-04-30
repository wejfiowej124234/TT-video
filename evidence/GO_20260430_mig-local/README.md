# Local evidence (solo-dev §6.5) — SPEC migration checklist closure

**Date**: 2026-04-30  
**Phase**: ① Local only (no CI; no ②③ claims)

## Commands (all exit 0)

```bash
cd "$(git rev-parse --show-toplevel)"
python registry/validate-spec-path-dependencies-registry.py
python registry/audit-inv7-vs-registry-classification.py
bash scripts/check-handbook-frontmatter.sh
bash scripts/check-handbook-engineering-content.sh
python registry/scan-spec-consumer-refs.py --strict
export CARGO_HOME="$(pwd)/.cargo-home-mig-evidence"
mkdir -p "$CARGO_HOME"
cargo test -p traveltrust-api
```

**Result**: `cargo test -p traveltrust-api` — **840 passed**, 0 failed (isolated `CARGO_HOME` avoids package-cache lock with default toolchain).

## Artifacts

- `.cargo-home-mig-evidence/` — gitignored local Cargo cache for this run.
- `registry/audit-inv7-vs-registry-classification.py` — P-A §7 × registry sniff.

## Policy (this batch)

- **No** new `git rm docs/spec/...` — delete path only in a future dedicated batch per STATUS / 98 / 96.
- Engineering read guide: `docs/handbook/engineering/`; contract SSOT unchanged (04 / 93 / 14 / 07).

## Latest local re-run (maintenance tick)

- `python registry/scan-spec-consumer-refs.py --strict`: **total hits 195**, **not on allowlist: 0** (P-C).
- `cargo test -p traveltrust-api` (isolated `CARGO_HOME`): **840 passed**, 0 failed.
- Registry validator + audit script + `check-handbook-*`: **exit 0** (same commands as above).

## Session re-verify (Cursor run; metrics unchanged)

- `validate` / `audit-inv7` / `check-handbook-frontmatter` / `check-handbook-engineering-content` / `scan-spec-consumer-refs.py --strict`: **exit 0**; scan **total hits 195**, **not on allowlist: 0**.
- `CARGO_HOME=.cargo-home-mig-evidence cargo test -p traveltrust-api`: **840 passed**, 0 failed.
- **No** `git rm docs/spec/...` in this batch; delete path remains **dedicated-commit-only** per STATUS / 98 / 96.
