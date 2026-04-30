# D-ITN-003

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg`
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
