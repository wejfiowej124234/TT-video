# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=6c1c6dec-76af-4416-93c7-76be6469a751 path=/auth/register status=200
[req] x-message-id=69df376b-5eb4-4c73-8845-01db7c6b6622 path=/auth/register status=200
[req] x-request-id=000f3229-1129-44b2-a70a-803d94f95341 path=/auth/register status=200
[req] x-message-id=31017ca2-4892-413d-9d33-91d93ed4cd42 path=/auth/register status=200
[req] x-request-id=d2b6fae7-5b90-4cb4-9d82-4672c312b89c path=/api/v1/guides status=200
[req] x-message-id=6d908a3c-ee11-4e02-ba3c-3f6e27e3e895 path=/api/v1/guides status=200
[req] x-request-id=4b3164ba-009f-4ad4-80b1-b96f607d1b80 path=/api/v1/guides/046fa07e-de1d-42ab-8e5b-a6257326af79/stake status=200
[req] x-message-id=c024bc56-19d9-4eff-a324-8950471125f2 path=/api/v1/guides/046fa07e-de1d-42ab-8e5b-a6257326af79/stake status=200
[req] x-request-id=02cfc488-3579-437c-b5c4-30ca76b87f1a path=/api/v1/orders status=200
[req] x-message-id=407fd7ce-f347-419d-ad91-e4bed4d7c3c8 path=/api/v1/orders status=200
[req] x-request-id=7c50983a-5c8b-4499-a6a2-c78bf455a74e path=/api/v1/orders/c6133ff5-4fef-4782-bb1c-3b37d198ed9c/set-escrow-address status=200
[req] x-message-id=97c46d2c-5d7c-4110-9612-7bae26d04453 path=/api/v1/orders/c6133ff5-4fef-4782-bb1c-3b37d198ed9c/set-escrow-address status=200
[req] x-request-id=4e02e47a-aa0c-422b-ad80-2e4bce8c4cf5 path=/api/v1/orders/c6133ff5-4fef-4782-bb1c-3b37d198ed9c status=200
[req] x-message-id=027e9f24-0728-4563-a9d8-9132e1c967b8 path=/api/v1/orders/c6133ff5-4fef-4782-bb1c-3b37d198ed9c status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
