# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.60s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3a4db7a0-59d4-4b64-8e4f-c3c0ddf57045 path=/auth/register status=200
[req] x-message-id=077b224c-3327-44fc-839f-6dc088742a18 path=/auth/register status=200
[req] x-request-id=a975e945-fd86-48be-96d8-eb6c3d517277 path=/api/v1/itineraries status=200
[req] x-message-id=59172ec7-d4ba-4398-bf55-43d704642431 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=58fc3b50-0144-420f-b689-1d747809946a order_id=02faf887-eb08-4cfa-bec9-bdfdff37af22
[req] x-request-id=0a836587-bf77-48ab-ac0c-c535b33a14ef path=/api/v1/orders/02faf887-eb08-4cfa-bec9-bdfdff37af22/itinerary status=200
[req] x-message-id=ce01dfab-43eb-43c0-84ca-d388ca815ecf path=/api/v1/orders/02faf887-eb08-4cfa-bec9-bdfdff37af22/itinerary status=200
[req] x-request-id=0bedfe92-50c9-4a8d-90ba-ed7a22d87a8c path=/api/v1/orders/02faf887-eb08-4cfa-bec9-bdfdff37af22 status=200
[req] x-message-id=87d9e710-a965-4033-9c7d-9c34788d39bc path=/api/v1/orders/02faf887-eb08-4cfa-bec9-bdfdff37af22 status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
