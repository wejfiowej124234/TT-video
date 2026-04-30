# D-ITN-001

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg`
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
