# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=7cdbcf7c-6f45-4b27-98a7-d10dcb13282b path=/auth/register status=200
[req] x-message-id=8ef642bb-d04a-4bbd-8ec2-a5cf9cb40141 path=/auth/register status=200
[req] x-request-id=13eacb81-d198-44b8-930b-fd2cfcd3b6f0 path=/auth/register status=200
[req] x-message-id=1dbe5a01-6e7f-4517-be3f-9eb0339abb44 path=/auth/register status=200
[req] x-request-id=a38c71df-065f-48d6-b9b7-ff47d37752a8 path=/api/v1/guides status=200
[req] x-message-id=af23ba92-9610-459d-877e-bf8769bda8b4 path=/api/v1/guides status=200
[req] x-request-id=0d05c010-cdbb-44cb-9e1b-5db687b11382 path=/api/v1/guides/9f125a41-30da-432d-8058-f83123a9c5d8/stake status=200
[req] x-message-id=35951832-6447-4a33-b93e-10c358568830 path=/api/v1/guides/9f125a41-30da-432d-8058-f83123a9c5d8/stake status=200
[req] x-request-id=5d880ef8-e47a-40ac-9959-009120b81e4e path=/api/v1/orders status=200
[req] x-message-id=f2cdf029-0d7c-451a-ae91-de2e8c4fafff path=/api/v1/orders status=200
[req] x-request-id=5a4be4b4-2aa6-4c83-b07e-97b9009fca9f path=/api/v1/orders/e9afa2fa-17e8-48e0-9857-e289d2720bd9/set-escrow-address status=200
[req] x-message-id=6a5fdfd4-3635-4e28-a2ce-394a2e5278db path=/api/v1/orders/e9afa2fa-17e8-48e0-9857-e289d2720bd9/set-escrow-address status=200
[req] x-request-id=c5c3830b-c986-42e1-bcf9-0f52b37f9eaf path=/api/v1/orders/e9afa2fa-17e8-48e0-9857-e289d2720bd9 status=200
[req] x-message-id=0d90182b-19b5-42c6-9670-17661d94fe23 path=/api/v1/orders/e9afa2fa-17e8-48e0-9857-e289d2720bd9 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
