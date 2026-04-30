# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=72d69b9a-9b26-402f-b7f9-8cf56bbc8b4e path=/auth/register status=200
[req] x-message-id=aac3872c-d092-4efe-b626-13649036c400 path=/auth/register status=200
[req] x-request-id=95ef979c-6ab1-4c33-9d26-ba2595e493f3 path=/auth/register status=200
[req] x-message-id=69b4e59e-2cf3-4a07-b6f9-2fbea382bd13 path=/auth/register status=200
[req] x-request-id=cfb1a7fd-ed0a-4eea-a257-b33b0c5f47a5 path=/api/v1/guides status=200
[req] x-message-id=b5be476c-fb66-4e53-bc7a-f08431444cca path=/api/v1/guides status=200
[req] x-request-id=50cfeb8c-b380-4b91-85a4-17ef5f94286e path=/api/v1/guides/8673afbf-e6bd-4d69-ad32-e23388bd1601/stake status=200
[req] x-message-id=d9f1541a-941b-4b11-9440-11d9d5cd899c path=/api/v1/guides/8673afbf-e6bd-4d69-ad32-e23388bd1601/stake status=200
[req] x-request-id=dc137ffb-fdb6-4475-ac2c-570d27515f8f path=/api/v1/orders status=200
[req] x-message-id=aefb05b1-0aea-4bb3-aa0e-6808a0ae5c03 path=/api/v1/orders status=200
[req] x-request-id=637e2d69-f5b4-40b1-8f0f-e027d2d0c0b2 path=/api/v1/orders/17acfe8d-3dd8-4599-b85d-f494a9afc3b9/set-escrow-address status=200
[req] x-message-id=c0ce4f59-0e5d-4853-ae10-c0a1f449c3b8 path=/api/v1/orders/17acfe8d-3dd8-4599-b85d-f494a9afc3b9/set-escrow-address status=200
[req] x-request-id=8ff8958c-eac3-4d7d-8f23-2b39b732ed44 path=/api/v1/orders/17acfe8d-3dd8-4599-b85d-f494a9afc3b9 status=200
[req] x-message-id=2a762c67-454b-4285-9be2-1ee3d6704f7e path=/api/v1/orders/17acfe8d-3dd8-4599-b85d-f494a9afc3b9 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
