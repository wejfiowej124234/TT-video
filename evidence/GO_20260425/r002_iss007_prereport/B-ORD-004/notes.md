# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e6549990-4214-4987-8265-611eb543df84 path=/auth/register status=200
[req] x-message-id=6c7fea8e-8552-4125-85da-4f3e8fda85d1 path=/auth/register status=200
[req] x-request-id=c418a8eb-24f9-4679-8fa4-909828de5499 path=/auth/register status=200
[req] x-message-id=f8c77153-2b8f-4533-8ced-ff54311b5d70 path=/auth/register status=200
[req] x-request-id=1dc63dbe-f9e3-4229-9843-2ec3fdea7e97 path=/api/v1/guides status=200
[req] x-message-id=f3cf3a64-05c0-4791-b01a-c5e23baf6fab path=/api/v1/guides status=200
[req] x-request-id=43d85b91-74d9-47ac-bf28-c12d8538cff4 path=/api/v1/guides/e00ba1d4-0fc3-42cf-ad7d-66aa703626ca/stake status=200
[req] x-message-id=525edda9-5df0-44cc-9729-9cd641195d54 path=/api/v1/guides/e00ba1d4-0fc3-42cf-ad7d-66aa703626ca/stake status=200
[req] x-request-id=13a1c954-334c-4edb-a450-0f4ff5bc5ea2 path=/api/v1/orders status=200
[req] x-message-id=71ec1845-a80c-41ba-8d1a-71dc1492985a path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=04941862-d02f-4f52-88c8-4dfec0fc19ec order_id=e62021cb-deb7-4fb3-8ed4-382930a6fb5c
[req] x-request-id=e5b7c7a3-20c0-401f-8f05-2211e8c7ce39 path=/api/v1/orders/e62021cb-deb7-4fb3-8ed4-382930a6fb5c/itinerary status=200
[req] x-message-id=adc33ed3-f2f3-4c8a-b203-af149788196c path=/api/v1/orders/e62021cb-deb7-4fb3-8ed4-382930a6fb5c/itinerary status=200
[req] x-request-id=7019807c-005a-40b2-bfd3-c11f6490a97b path=/api/v1/orders/e62021cb-deb7-4fb3-8ed4-382930a6fb5c status=200
[req] x-message-id=2c95e846-8cef-46b5-a429-258e1f0d2a71 path=/api/v1/orders/e62021cb-deb7-4fb3-8ed4-382930a6fb5c status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
