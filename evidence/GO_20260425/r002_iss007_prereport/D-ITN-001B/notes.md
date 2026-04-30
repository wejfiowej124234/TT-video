# D-ITN-001B

`cargo test -p traveltrust-api matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.56s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b8f98259-3f43-4dc4-b21f-e29ede3ee890 path=/auth/register status=200
[req] x-message-id=e0cd5e46-4986-42ff-8537-6909f78fd51e path=/auth/register status=200
[req] x-request-id=19b4b862-5383-4dac-839d-3b6f81e216b7 path=/api/v1/itineraries status=200
[req] x-message-id=d91cc7d2-e2ea-4cfa-bcdc-d444806835e6 path=/api/v1/itineraries status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · POST /api/v1/itineraries creates draft + order_id
