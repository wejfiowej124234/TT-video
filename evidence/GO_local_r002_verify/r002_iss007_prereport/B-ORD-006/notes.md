# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.02s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=0cee5bde-54dd-491f-b26d-1bfb590c4f19 path=/auth/register status=200
[req] x-message-id=05137158-7311-41a6-82ba-6f867e21250d path=/auth/register status=200
[req] x-request-id=d365ccc7-bdfb-4ba1-b955-8baa78a307e1 path=/auth/register status=200
[req] x-message-id=66cf11ab-60cc-4af1-805a-7b9cb4fc061d path=/auth/register status=200
[req] x-request-id=c5ca0fae-aa45-482c-a74d-60ab2a2798ef path=/api/v1/guides status=200
[req] x-message-id=33ec9e62-6d07-46a6-8164-9bee5081d3a0 path=/api/v1/guides status=200
[req] x-request-id=244bdaf1-706a-4470-adb9-f81c8fabfc86 path=/api/v1/guides/7a6ddabc-34a8-43f8-92d9-e06731534afc/stake status=200
[req] x-message-id=40e990ae-e388-4a4d-acf9-37d2b99495b0 path=/api/v1/guides/7a6ddabc-34a8-43f8-92d9-e06731534afc/stake status=200
[req] x-request-id=7eed7618-2a22-4393-aa79-520755db493a path=/api/v1/orders status=200
[req] x-message-id=d5a9efa8-5e9b-423e-aaab-2ca31a4f83c3 path=/api/v1/orders status=200
[req] x-request-id=1e370cc0-4fa7-41a6-aa56-8e9efaf77c8c path=/api/v1/orders/32c83b8e-4c2c-4f99-a434-219c02f728f0/set-escrow-address status=200
[req] x-message-id=35d9514d-d153-4259-b999-31bb55394f9f path=/api/v1/orders/32c83b8e-4c2c-4f99-a434-219c02f728f0/set-escrow-address status=200
[req] x-request-id=6ad7e23b-16b3-4acc-8c8e-8b2dec8abfd2 path=/api/v1/orders/32c83b8e-4c2c-4f99-a434-219c02f728f0 status=200
[req] x-message-id=738071b7-9643-49f8-8312-96598ba1a4bd path=/api/v1/orders/32c83b8e-4c2c-4f99-a434-219c02f728f0 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
