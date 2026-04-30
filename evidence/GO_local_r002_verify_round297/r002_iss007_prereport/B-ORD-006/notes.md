# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=a8162c5b-6e98-4b56-a15f-97eb20eb2c5b path=/auth/register status=200
[req] x-message-id=ca1a1df3-fb70-4d36-a38f-b434bcfc9a10 path=/auth/register status=200
[req] x-request-id=692ea4e4-58cf-4f20-bf8a-cd15c459e226 path=/auth/register status=200
[req] x-message-id=fa22e4ae-1833-4671-ac77-dac05f749c29 path=/auth/register status=200
[req] x-request-id=0a8f1b71-e285-444c-8f50-909ddbfe903a path=/api/v1/guides status=200
[req] x-message-id=22e546d0-75c2-433e-803b-5e3adbd835af path=/api/v1/guides status=200
[req] x-request-id=1858e804-48d9-4d56-ad53-54f7af772210 path=/api/v1/guides/63685596-03db-451e-8e1d-45b48bb8fe61/stake status=200
[req] x-message-id=837de77e-04d7-4e42-bd78-bea775a8b852 path=/api/v1/guides/63685596-03db-451e-8e1d-45b48bb8fe61/stake status=200
[req] x-request-id=23edaa29-06ae-404d-af85-795f1dd5b642 path=/api/v1/orders status=200
[req] x-message-id=f418b850-4875-48cd-8029-e1e9cbd8851a path=/api/v1/orders status=200
[req] x-request-id=4f91ebb3-adc9-48ab-9305-225a5e4c78fd path=/api/v1/orders/4fb6afd5-1214-45a3-9653-8e42785b941f/set-escrow-address status=200
[req] x-message-id=6757f9bb-83c3-4b45-b568-82e770d0da09 path=/api/v1/orders/4fb6afd5-1214-45a3-9653-8e42785b941f/set-escrow-address status=200
[req] x-request-id=36f3dffa-45a8-40d0-9fa7-89855d89e29d path=/api/v1/orders/4fb6afd5-1214-45a3-9653-8e42785b941f status=200
[req] x-message-id=b5b3d050-877c-4e8c-a15a-4d9876a13df0 path=/api/v1/orders/4fb6afd5-1214-45a3-9653-8e42785b941f status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
