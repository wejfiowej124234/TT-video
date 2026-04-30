# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=74fbf513-d440-43c9-8a2d-d53436c01ce2 path=/auth/register status=200
[req] x-message-id=4ed56586-4a9e-4b19-a938-c53bff043c0f path=/auth/register status=200
[req] x-request-id=4bc8300e-3ee3-4105-ae10-8d1c2b8e5d7a path=/api/v1/itineraries status=200
[req] x-message-id=4da49e13-8945-4932-b5db-7854d9d9e55f path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=3249e928-5d78-4723-85df-5aa5f9da6e0e order_id=3852b5d8-521d-454f-8f14-46a13562f6f2
[req] x-request-id=ec8629ad-25e3-4434-baf7-7ee359cfcd48 path=/api/v1/orders/3852b5d8-521d-454f-8f14-46a13562f6f2/itinerary status=200
[req] x-message-id=b5b879f2-57cb-4298-a116-22a232d0501f path=/api/v1/orders/3852b5d8-521d-454f-8f14-46a13562f6f2/itinerary status=200
[req] x-request-id=b748c3f3-9c1c-4f3a-a845-481d64ce898f path=/api/v1/orders/3852b5d8-521d-454f-8f14-46a13562f6f2 status=200
[req] x-message-id=2e77f751-dfe2-42d8-a420-e0335c635835 path=/api/v1/orders/3852b5d8-521d-454f-8f14-46a13562f6f2 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
