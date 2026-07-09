# Phase ③ Entry Review · Post ②.9 (8/8 UI)

**Reviewed at:** 2026-06-07  
**Reviewer:** Release gate automation + Owner handoff  
**Conclusion:** **NO_GO** — staging R4–R7 not green

---

## ②.9 UI Polish

| Item | Status |
|------|--------|
| In-scope UI (RP-001…015) | **8/8 DONE** |
| Local R1–R3 + COM | **PASS** (W3 evidence `w3-20260607T011158Z`) |
| UI development | **FROZEN** — no further ②.9 UI without new DEV_GATE |

---

## R4–R7 Gate Chain (this session)

| Step | Result | Blocker |
|------|--------|---------|
| **R4 S5 deploy** | **FAIL** | `fly not authenticated` — `fly auth whoami` / `api.fly.io` unreachable from runner; W1–W3 UI **not deployed** |
| **R5 Deep Gate** | **FAIL** | G04 ADM-U01 NO_GO (see below); G08 upstream blocked |
| **R6 S6** | **SKIPPED** | Policy: requires Deep Gate PASS |
| **R7 HAT** | **BLOCKED** | Policy: requires Deep Gate PASS |

**Staging SHA (pre-deploy):** API/Web meta `git_sha=7b86e58b` — matches HEAD commit but **excludes uncommitted W1–W3 polish**.

---

## G04 ADM-U01 Root Cause (not RBAC rule defect)

| Layer | Finding |
|-------|---------|
| **Orchestration (fixed)** | Deep Gate did not pass `STAGING_DATABASE_URL` from `scripts/dev/.env.staging-onboarding.local` `DATABASE_URL` into ADM-U01 subprocess → immediate FAIL with `no tokens` |
| **Infra / env (open)** | Staging PG is **flycast** (`tt-traveltrust-staging.flycast`); auto-provision needs **`fly proxy`** + **docker psql** (or native psql). Runner could not reach `api.fly.io` → proxy never listened |
| **URL parsing (fixed)** | `postgres://` DSN was not parseable for docker-exec psql fallback |
| **RBAC rules** | **Not implicated** — prior evidence `run_adm_u01_close_20260603` `release_gate=GO`; failure is credential/DB path, not probe matrix drift |

**Fixes landed:**
- `scripts/dev/lib/staging-adm-u01-env.sh` — load onboarding DSN + fly proxy health check
- `phase2-deep-release-gate.py` — forward `STAGING_DATABASE_URL`; subprocess UTF-8 safe
- `run-admin-rbac-staging-matrix.py` — accept `postgres://`; strip query from db name

---

## Phase ③ Entry Gate

```text
PHASE3_ENTRY_GATE: HOLD
PHASE3_ENTRY_REVIEW: NO_GO
PHASE29_RELEASE_POLISH: W3_DONE · UI_FROZEN
```

**READY requires:** S5 deploy (API/Web same SHA) → Deep Gate **PASS** (G04 with fly proxy + DB) → S6 → HAT → Owner sign-off.

---

## Owner Remediation (ordered)

1. `fly auth login` (ensure `fly apps list` works)
2. `bash scripts/dev/run-phase2-local-staging-parity-gate.sh --deploy`
3. `bash scripts/dev/check-staging-web-alignment.sh` — FAIL=0, SHA match
4. `bash scripts/dev/run-phase2-deep-release-gate.sh` (no `--skip-rbac`)
5. On G04: confirm fly proxy log; need docker or psql
6. `bash scripts/dev/run-phase2-local-staging-parity-gate.sh --staging-retest`
7. `bash scripts/dev/run-phase28-human-acceptance-test.sh`
8. Re-run this review → flip to **READY** if all green
