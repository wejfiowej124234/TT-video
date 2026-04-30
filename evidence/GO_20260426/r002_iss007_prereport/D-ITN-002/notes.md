# D-ITN-002

`cargo test -p traveltrust-api matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg` exit=101

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg ... FAILED

failures:

failures:
    routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.08s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)

thread 'routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg' (288) panicked at crates\api\src\routes\f031_f032_f033_app_http_db_api_tests.rs:1186:5:
assertion `left == right` failed: Object {"error": String("unauthorized"), "message": String("unauthorized"), "detail": String("STRICT_SESSION_GATE=1：须提供 Authorization: Bearer <session_token>（不接受仅 X-User-Id）")}
  left: 401
 right: 200
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
error: test failed, to rerun pass `-p traveltrust-api --bin traveltrust-api`

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
