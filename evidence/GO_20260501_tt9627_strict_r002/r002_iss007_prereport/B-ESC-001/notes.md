# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=9b232c27-74c1-4c60-a085-f1284a47e310 path=/auth/register status=200
[req] x-message-id=00ba4a4f-c66d-4ff7-95bf-95892033d95c path=/auth/register status=200
[req] x-request-id=57a0261c-da04-4f53-93e8-41b731087662 path=/auth/register status=200
[req] x-message-id=08304993-57b0-41cc-81a0-83c44d77983c path=/auth/register status=200
[req] x-request-id=ff39a1c7-d99f-44d3-85ad-d74734c1b5b0 path=/api/v1/guides status=200
[req] x-message-id=9216365f-a728-41c8-baa4-01df74b97140 path=/api/v1/guides status=200
[req] x-request-id=a5feeb22-d8f4-4477-a429-9e577669fc72 path=/api/v1/guides/da7a8e4e-af73-4247-b294-f13e7f2b171a/stake status=200
[req] x-message-id=720b9ddb-f244-4bb0-8311-463b87907718 path=/api/v1/guides/da7a8e4e-af73-4247-b294-f13e7f2b171a/stake status=200
[req] x-request-id=dc848682-6c8c-48c3-8797-aeaef107497d path=/api/v1/orders status=200
[req] x-message-id=d4c0fe31-17e7-4427-b2a0-4ece07e3fc6b path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=2c3c067a-b04c-462a-a085-c8793611f3dd order_id=b3191990-2f33-49f9-a54b-cc5e8385c01f
[req] x-request-id=ff7ac801-7aff-4532-87f5-12766cc07a2e path=/api/v1/orders/b3191990-2f33-49f9-a54b-cc5e8385c01f/accept status=200
[req] x-message-id=bcd1c3e5-7919-4cbf-a8a5-fa79b50cc103 path=/api/v1/orders/b3191990-2f33-49f9-a54b-cc5e8385c01f/accept status=200
[req] x-request-id=3e3d703a-4216-49fa-aeab-e0355982561a path=/api/v1/orders/b3191990-2f33-49f9-a54b-cc5e8385c01f/mock-pay status=200
[req] x-message-id=cfef7939-fa07-434e-8f90-83c203d873d7 path=/api/v1/orders/b3191990-2f33-49f9-a54b-cc5e8385c01f/mock-pay status=200
[req] x-request-id=ac6f3faf-8afd-4420-9e47-6e344b00ad46 path=/api/v1/orders/b3191990-2f33-49f9-a54b-cc5e8385c01f status=200
[req] x-message-id=f1ee37c8-44a2-48e6-bdff-70b548dc6117 path=/api/v1/orders/b3191990-2f33-49f9-a54b-cc5e8385c01f status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
