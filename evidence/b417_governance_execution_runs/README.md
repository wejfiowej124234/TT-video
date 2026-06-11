# B-417 · Governance execution evidence runs

> **SSOT**: TT-B417 · TT-LINE-B · Sprint 171 · BE-DAO-01

## One-shot (Sepolia game-day)

```bash
bash scripts/ops/b417-env-gap-check.sh
bash scripts/ops/b417-list-proposal-states.sh
bash scripts/ops/b417-sepolia-preflight.sh
bash scripts/ops/b417-run-onchain-evidence.sh
bash scripts/ops/b417-evidence-pack-verify.sh "$B417_RECORD_DIR"
```

## Historical anchors

- `run_20260417T0810Z/` — Treasury.spend mini evidence (verify PASS)
- `run_20260416T0602Z/` — queue→execute sidecars

## Owner sign-off

Copy `owner_sign_off.json.template` to `owner_sign_off.json` with `"signed": true` after FinOps review.
