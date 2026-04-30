# D-ITN-001B

`cargo test -p traveltrust-api matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.38s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=0eaa3824-3d82-4ade-bced-c6ac7df3449f path=/auth/register status=200
[req] x-message-id=76ef81da-cc4c-4fc5-bfa0-e1427f7f77a8 path=/auth/register status=200
[req] x-request-id=cb0b414d-e1ee-4f1e-9a19-6c36adaafb74 path=/api/v1/itineraries status=200
[req] x-message-id=cb385469-03e1-4ba1-ae27-861f6e87625b path=/api/v1/itineraries status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · POST /api/v1/itineraries creates draft + order_id
