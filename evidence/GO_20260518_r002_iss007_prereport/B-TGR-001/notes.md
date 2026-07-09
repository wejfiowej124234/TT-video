# B-TGR-001

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg`
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-032 · GET trust-growth/config returns ok + postgres storage hint
