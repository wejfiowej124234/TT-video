# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2bec8eb6-b12b-4d18-ac52-daafbab44c2f path=/auth/register status=200
[req] x-message-id=9ff1be01-1617-45d4-9dad-336de32d80bc path=/auth/register status=200
[req] x-request-id=1e552498-761d-4c57-b058-10c510712025 path=/auth/register status=200
[req] x-message-id=c3d2e706-98b1-4930-929c-245c393e089e path=/auth/register status=200
[req] x-request-id=bbe9f872-008e-4027-a3c0-2a253b9ea3b0 path=/api/v1/guides status=200
[req] x-message-id=51092e32-04dc-4495-a88a-89f6940817d2 path=/api/v1/guides status=200
[req] x-request-id=eb47cf05-e337-41d3-929e-0eb27872e9d6 path=/api/v1/guides/624c4358-8a9e-4677-88d3-3418a6a9c9df/stake status=200
[req] x-message-id=9e84fb1b-b8df-4573-bb82-131d51f5b057 path=/api/v1/guides/624c4358-8a9e-4677-88d3-3418a6a9c9df/stake status=200
[req] x-request-id=1518581d-4477-4be8-aacb-deddc00310e5 path=/api/v1/orders status=200
[req] x-message-id=483427d9-519f-4957-b1d2-b531bfe077bc path=/api/v1/orders status=200
[req] x-request-id=1932da5e-88bf-4368-9a31-f92b5122d3e6 path=/api/v1/orders/a128595b-06da-485e-a3f4-d92916d991f7/set-escrow-address status=200
[req] x-message-id=4b67da92-326b-4d46-9636-d9abb33199a3 path=/api/v1/orders/a128595b-06da-485e-a3f4-d92916d991f7/set-escrow-address status=200
[req] x-request-id=c7940e96-059f-49c8-be07-e34c7031bd0f path=/api/v1/orders/a128595b-06da-485e-a3f4-d92916d991f7 status=200
[req] x-message-id=d8251591-6931-4e37-9eb0-a31f615f432e path=/api/v1/orders/a128595b-06da-485e-a3f4-d92916d991f7 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
