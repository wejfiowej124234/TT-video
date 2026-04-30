# D-ITN-001B

`cargo test -p traveltrust-api matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.56s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=a062fa79-ea2f-4e9e-b0ca-a32cef56b34d path=/auth/register status=200
[req] x-message-id=f61c3274-88f7-4eaa-a145-35150a2c9943 path=/auth/register status=200
[req] x-request-id=17c15800-2d2e-444e-8a0f-55e0d34b2d06 path=/api/v1/itineraries status=200
[req] x-message-id=b6be17fa-f4e1-4fab-96eb-1f824831a19f path=/api/v1/itineraries status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · POST /api/v1/itineraries creates draft + order_id
