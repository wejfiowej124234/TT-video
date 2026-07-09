# D-ITN-001

`cargo test -p traveltrust-api matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=b5c1a90a-a0c6-457b-9e97-04bf158b62ff path=/auth/register status=200
[req] x-message-id=6d31e9c3-35f8-4053-90b7-f054ac615101 path=/auth/register status=200
[req] x-request-id=986e5b92-0352-4101-ae1f-e6d3f4d52eea path=/api/v1/itineraries status=200
[req] x-message-id=e20baa8b-277f-48ce-9f9e-dfe8410f4fe1 path=/api/v1/itineraries status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=a1882272-af0e-4111-8e62-925723aa95d2 order_id=3bbe0ff5-392e-4d80-87c2-00979828817a
[req] x-request-id=10c8c3e4-ce8d-4c18-b967-d46046bb4f6e path=/api/v1/orders/3bbe0ff5-392e-4d80-87c2-00979828817a/itinerary status=200
[req] x-message-id=f4ffe956-eb7f-4b28-9e08-c388c9369cf8 path=/api/v1/orders/3bbe0ff5-392e-4d80-87c2-00979828817a/itinerary status=200
[req] x-request-id=bd8f9ca1-fdd4-494b-85b4-e06a41903976 path=/api/v1/orders/3bbe0ff5-392e-4d80-87c2-00979828817a status=200
[req] x-message-id=0a6b8246-b69d-4297-a43d-9f0cc0f70a00 path=/api/v1/orders/3bbe0ff5-392e-4d80-87c2-00979828817a status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · D-ITN-001 · POST itineraries + PATCH itinerary + GET order detail read-back
