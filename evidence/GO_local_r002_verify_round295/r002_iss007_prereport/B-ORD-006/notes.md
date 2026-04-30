# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=90e96718-2607-4cd4-9e1e-e09be6ab46b4 path=/auth/register status=200
[req] x-message-id=54108b01-70a0-4c5c-869b-bc93b7a1dfc6 path=/auth/register status=200
[req] x-request-id=97c3333e-bf43-4df8-ab47-91b15b9fd921 path=/auth/register status=200
[req] x-message-id=e1b5b9e5-015a-4720-897e-b7e6386d4608 path=/auth/register status=200
[req] x-request-id=8ee0bc9f-b2ad-42bd-adf0-60f0c2e2c604 path=/api/v1/guides status=200
[req] x-message-id=7bc6fb22-eb95-4b62-8bc3-47aaedfb9f56 path=/api/v1/guides status=200
[req] x-request-id=6d3a2df8-f661-4ad8-9fb7-b60633c0a726 path=/api/v1/guides/a71353eb-9fd3-453e-b6a3-04df0d939e7c/stake status=200
[req] x-message-id=de2572be-fa27-4f1d-af86-5c4a3265a368 path=/api/v1/guides/a71353eb-9fd3-453e-b6a3-04df0d939e7c/stake status=200
[req] x-request-id=a6b65ff1-8b09-4949-928c-c08cf4ed04e9 path=/api/v1/orders status=200
[req] x-message-id=fcdaceff-700b-47a9-9f1d-2500535f2c1d path=/api/v1/orders status=200
[req] x-request-id=32b1026f-8a1a-4bf0-83e3-bedff001b655 path=/api/v1/orders/981e2e0e-16da-4dd3-9b36-7b61e0b88f17/set-escrow-address status=200
[req] x-message-id=5ecddf0a-1c6e-44ce-9029-1b9a6f0589cc path=/api/v1/orders/981e2e0e-16da-4dd3-9b36-7b61e0b88f17/set-escrow-address status=200
[req] x-request-id=4ad03088-ba47-4132-a716-e9c845bc6025 path=/api/v1/orders/981e2e0e-16da-4dd3-9b36-7b61e0b88f17 status=200
[req] x-message-id=3071ac88-0565-472b-982b-e27a8e3e3d60 path=/api/v1/orders/981e2e0e-16da-4dd3-9b36-7b61e0b88f17 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
