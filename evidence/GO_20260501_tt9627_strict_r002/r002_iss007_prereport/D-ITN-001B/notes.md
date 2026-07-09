# D-ITN-001B

`cargo test -p traveltrust-api matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.35s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=b45aa50a-c630-4dd0-bed9-f91da66f5f89 path=/auth/register status=200
[req] x-message-id=dc75c74f-bd01-4196-bdf2-81b8b89df899 path=/auth/register status=200
[req] x-request-id=d70a0005-3c37-4318-80a2-3d88155da968 path=/api/v1/itineraries status=200
[req] x-message-id=d9b8473d-9332-411c-b089-63ebfbe60749 path=/api/v1/itineraries status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · POST /api/v1/itineraries creates draft + order_id
