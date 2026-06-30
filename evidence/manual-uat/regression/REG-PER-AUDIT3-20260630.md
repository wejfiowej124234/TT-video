# REG-PER-AUDIT3-20260630

**Verified UTC:** `2026-06-30T14:06:10Z`

```bash
powershell -File scripts/dev/apply-per-regression-local-env.ps1
bash scripts/dev/verify-cfg-drift-closure.sh
bash scripts/dev/verify-staging-ssot-parity.sh
```
