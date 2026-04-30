# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=35a7238d-0c6a-45a5-a8e9-20a137f11aeb path=/auth/register status=200
[req] x-message-id=49e1f52c-0b42-4b32-b7a9-58b32395db41 path=/auth/register status=200
[req] x-request-id=3db47773-17ed-421b-8d08-d7af6b8aa305 path=/auth/register status=200
[req] x-message-id=274988b3-0bb4-44df-8deb-f514cd524a0c path=/auth/register status=200
[req] x-request-id=d49f0443-dfcb-421c-ba12-6a20a38fca18 path=/api/v1/guides status=200
[req] x-message-id=4bce655c-fd97-4ab9-8211-15994e0005fc path=/api/v1/guides status=200
[req] x-request-id=89b754c3-0230-45b6-99b9-6f5826aaaa89 path=/api/v1/guides/478889a8-a5eb-4b1c-ab0f-d9a5ce611e61/stake status=200
[req] x-message-id=b2db45f4-c6ca-4659-a5a8-ed435f3caf3f path=/api/v1/guides/478889a8-a5eb-4b1c-ab0f-d9a5ce611e61/stake status=200
[req] x-request-id=d3c498fb-0aae-4c4c-88da-20fe406e507c path=/api/v1/orders status=200
[req] x-message-id=d4fd7e61-6f0e-431f-8718-77f28b96bcaa path=/api/v1/orders status=200
[req] x-request-id=5dee313c-3ea9-4d54-96ab-56f62ce26790 path=/api/v1/orders/5f8b0395-cd68-43f0-b60a-559db18fc192/set-escrow-address status=200
[req] x-message-id=0deb3d37-3d57-4453-bf2e-4e520e221427 path=/api/v1/orders/5f8b0395-cd68-43f0-b60a-559db18fc192/set-escrow-address status=200
[req] x-request-id=ddaca36b-0409-4cb1-8fae-52ea094a3c85 path=/api/v1/orders/5f8b0395-cd68-43f0-b60a-559db18fc192 status=200
[req] x-message-id=656e3b9d-4b57-4c67-8cf2-8492d6eace0b path=/api/v1/orders/5f8b0395-cd68-43f0-b60a-559db18fc192 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
