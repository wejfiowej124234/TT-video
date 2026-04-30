# D-COM-011

`cargo test -p traveltrust-api matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg` exit=101

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg ... FAILED

failures:

failures:
    routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.08s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)

thread 'routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg' (2852) panicked at crates\api\src\routes\f031_f032_f033_app_http_db_api_tests.rs:198:5:
assertion `left == right` failed: Object {"error": String("unauthorized"), "message": String("unauthorized"), "detail": String("STRICT_SESSION_GATE=1：须提供 Authorization: Bearer <session_token>（不接受仅 X-User-Id）")}
  left: 401
 right: 200
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
error: test failed, to rerun pass `-p traveltrust-api --bin traveltrust-api`

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-031 · acquisition listing then community post acquisition_led showcase
