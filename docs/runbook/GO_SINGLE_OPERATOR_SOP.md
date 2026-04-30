# GO Single-Operator SOP

## 1) Environment readiness
- Start DB
- Set `DATABASE_URL`
- Run migrations

## 2) Regression evidence
- Run ISS-007 / R-002 narrow slice
- Merge into `evidence/GO_YYYYMMDD/report.json`
- Ensure `NOT_RUN = 0` for required scope

## 3) 93/95/96 alignment
- 93 B-domain P0 five status check
- 95 §8.2 + §9 ISS sign-off
- Gap table P0 sign-off
- 15 appendix-zero sign-off

## 4) Single-operator disclosure (mandatory)
Add to report/signoff docs:

This release is signed off by a single operator acting in multiple roles.
No independent second-party review was performed.

## 5) Gate
- Set `release_gate` to `GO` only after all above are done
- Run: `python scripts/validate-regression-report.py evidence/GO_YYYYMMDD/report.json --require-go`
