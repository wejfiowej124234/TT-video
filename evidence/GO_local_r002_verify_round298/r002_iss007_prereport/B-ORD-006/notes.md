# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.08s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ee30056a-5227-4e4f-b3d9-2a62544f329b path=/auth/register status=200
[req] x-message-id=84cb3b8f-5722-47d4-b2c0-a38d5e3e66b4 path=/auth/register status=200
[req] x-request-id=835332cf-3c33-4202-acc2-9494809e5982 path=/auth/register status=200
[req] x-message-id=abd65a5c-29ae-4e9f-b000-9d0059367e6d path=/auth/register status=200
[req] x-request-id=001d44a7-f4f3-4278-b636-dcbba9f42e48 path=/api/v1/guides status=200
[req] x-message-id=a9a5ed4d-202e-4919-b7af-bab79db65e14 path=/api/v1/guides status=200
[req] x-request-id=e936ac9b-ec2f-4505-8052-ffde289c350a path=/api/v1/guides/b016e47a-4115-4c76-86a6-d6b9808728ff/stake status=200
[req] x-message-id=55b39d56-67fb-4cdf-9719-e2762169f918 path=/api/v1/guides/b016e47a-4115-4c76-86a6-d6b9808728ff/stake status=200
[req] x-request-id=aba09138-57d1-4d87-8bd9-260311fbc55d path=/api/v1/orders status=200
[req] x-message-id=41189ab4-4224-4bf8-b771-97878db0abf5 path=/api/v1/orders status=200
[req] x-request-id=1e2fc743-633d-46be-a799-9384ebe5bf25 path=/api/v1/orders/3ae0acf6-b826-4a45-afba-7f1f8780b670/set-escrow-address status=200
[req] x-message-id=b762362d-2c59-416f-9f03-bffaa55a5c55 path=/api/v1/orders/3ae0acf6-b826-4a45-afba-7f1f8780b670/set-escrow-address status=200
[req] x-request-id=a1414e07-0edf-4f8e-b316-d02e3e6c0fd9 path=/api/v1/orders/3ae0acf6-b826-4a45-afba-7f1f8780b670 status=200
[req] x-message-id=fd67b584-597b-4f1d-8cfd-60ae8be9ba46 path=/api/v1/orders/3ae0acf6-b826-4a45-afba-7f1f8780b670 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
