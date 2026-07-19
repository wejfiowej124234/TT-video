# Mainnet Cutover Hard Gate evidence

Machine key: `TT_MAINNET_CUTOVER_HARD_GATE`  
Gate: `bash scripts/gates/check-mainnet-cutover-hard-gate.sh`

`MAINNET-CUTOVER-HARD-GATE-LATEST.json` is overwritten by the gate (never SKIP).  
`REFUSED` / open axes = expected until fund-safety evidence closes.

Optional stamps (required for PASS):

- `SAFE-ROLES-VERIFIED-LATEST.json`
- `OPS-SURFACE-VERIFIED-LATEST.json`
- `R01-THIRD-PARTY-AUDIT-PASS.json` **or** `OWNER-RESIDUAL-RISK-SIGNOFF.json`
- `OWNER-CUTOVER-AUTH-LATEST.json`

See `docs/runbook/TT-MAINNET-CUTOVER-HARD-GATE-LATEST.md`.
