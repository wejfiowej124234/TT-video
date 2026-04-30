# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=679d5526-369d-4865-818c-cc450ab766ae path=/auth/register status=200
[req] x-message-id=37170078-ac7a-4a64-a835-6e8db331cbcf path=/auth/register status=200
[req] x-request-id=dc89f3b5-e36f-4852-a267-eba04455fecb path=/auth/register status=200
[req] x-message-id=0e87dece-8b21-4535-8bad-e1523e3c97bb path=/auth/register status=200
[req] x-request-id=48e38ead-7de0-4699-9fc9-99e5aacd61d9 path=/api/v1/guides status=200
[req] x-message-id=9fd9e2d6-6616-400b-a887-8d59a982e823 path=/api/v1/guides status=200
[req] x-request-id=ec5df557-ef54-4fe5-be82-72ee79120db0 path=/api/v1/guides/f6b1c88d-f96e-4bfc-a9c1-b0ba535e36a8/stake status=200
[req] x-message-id=6c11556e-8518-4e83-b650-fa184dce1da0 path=/api/v1/guides/f6b1c88d-f96e-4bfc-a9c1-b0ba535e36a8/stake status=200
[req] x-request-id=cc7a881c-438e-405c-a584-04ed5498b967 path=/api/v1/orders status=200
[req] x-message-id=2d6cce3a-4efb-473b-87cd-893f2bc9b407 path=/api/v1/orders status=200
[req] x-request-id=bccdb412-f5e5-4510-bb90-d33817c88a81 path=/api/v1/orders/d37ecd64-ef15-45e4-84e1-217ea872343c/set-escrow-address status=200
[req] x-message-id=8d3dacc6-1161-4b8a-be6e-4f43a176e27b path=/api/v1/orders/d37ecd64-ef15-45e4-84e1-217ea872343c/set-escrow-address status=200
[req] x-request-id=b56d0970-e3f3-47ce-89d8-0e3de3d72300 path=/api/v1/orders/d37ecd64-ef15-45e4-84e1-217ea872343c status=200
[req] x-message-id=12d28097-18a2-45e5-9836-e0fa4c0f05b1 path=/api/v1/orders/d37ecd64-ef15-45e4-84e1-217ea872343c status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
