# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.65s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d496f0ff-f17d-4fa1-bc79-e808aa36fe2a path=/auth/register status=200
[req] x-message-id=6842b9ec-07e9-454f-9997-2622d92d1079 path=/auth/register status=200
[req] x-request-id=3463975a-7ec7-44ba-9a66-5c08167eca65 path=/auth/register status=200
[req] x-message-id=357b0350-85dd-448e-a867-fbf350d434a2 path=/auth/register status=200
[req] x-request-id=1638c353-77a9-493b-aa2d-19fefcbb5456 path=/api/v1/guides status=200
[req] x-message-id=3ef49696-2725-44b8-a852-1d83147a488e path=/api/v1/guides status=200
[req] x-request-id=8ab6c15c-ac6b-434a-b3b1-2431c88c01d7 path=/api/v1/guides/67792cf7-4ad0-4cca-8ab5-5c28a7644cae/stake status=200
[req] x-message-id=c894be5e-63d0-4c1a-bbf6-aabb2a123244 path=/api/v1/guides/67792cf7-4ad0-4cca-8ab5-5c28a7644cae/stake status=200
[req] x-request-id=cef6df45-a206-45ca-b0b0-9b29e82532bd path=/api/v1/orders status=200
[req] x-message-id=069751a7-ce57-464d-8556-6e94e1ec4a2e path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=c23e475e-5ded-4a23-91f1-f5abb6aa4b61 order_id=c22cf202-2582-4c63-8328-185ec8c5b99b
[req] x-request-id=f8a0593c-888c-46f4-87c5-3a31d7d23962 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b/accept status=200
[req] x-message-id=cf818cee-1390-4408-9aae-f514f4fa7130 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b/accept status=200
[req] x-request-id=0fb979e6-da83-43f1-8644-53238c2c2c12 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b/mock-pay status=200
[req] x-message-id=d8901c53-c9a5-48b0-952e-c962dbe42d5d path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b/mock-pay status=200
[req] x-request-id=26dcc1f2-4823-43c9-9ea9-7329b80b1613 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b status=200
[req] x-message-id=5d589afb-7a86-40f1-b968-0fefe94d36f3 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b status=200
[req] x-request-id=39752df6-6aa2-4550-b953-40d6a82a9300 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b/dispute status=200
[req] x-message-id=960c4fbc-63d8-4913-9770-cf416c08f080 path=/api/v1/orders/c22cf202-2582-4c63-8328-185ec8c5b99b/dispute status=200
[req] x-request-id=046293ef-ca7d-4f43-87e4-3d2ca7bffd8e path=/auth/register status=200
[req] x-message-id=f9c71c2e-87de-41e3-85a0-5f4cc694c98b path=/auth/register status=200
[req] x-request-id=10c4cc74-5013-40ec-8f1b-694f72ef4241 path=/api/v1/disputes/0d3fb1c0-8f9d-4470-8dc4-81fa9005b5ed/resolve status=200
[req] x-message-id=d371236a-3549-4450-a924-2acccac83813 path=/api/v1/disputes/0d3fb1c0-8f9d-4470-8dc4-81fa9005b5ed/resolve status=200
[req] x-request-id=a27dbccb-9860-4bcc-808d-dd5bd3259a81 path=/api/v1/disputes/0d3fb1c0-8f9d-4470-8dc4-81fa9005b5ed status=200
[req] x-message-id=91d935d7-e37f-479b-8fba-9aff37f3ded7 path=/api/v1/disputes/0d3fb1c0-8f9d-4470-8dc4-81fa9005b5ed status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
