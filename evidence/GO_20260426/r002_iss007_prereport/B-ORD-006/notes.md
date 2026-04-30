# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.67s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.33s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=e740e0c5-4c33-47a0-ac9d-dbf100377a3c path=/auth/register status=200
[req] x-message-id=ae928c9d-c1e4-42c2-a8b5-af7d413d2c2a path=/auth/register status=200
[req] x-request-id=e5b70006-fb4c-4ae9-8e2b-2e4a59fa09fc path=/auth/register status=200
[req] x-message-id=182d70bf-638b-48e9-9ab1-5d3a10f10198 path=/auth/register status=200
[req] x-request-id=70a6e11a-e0a1-4ba6-bf18-e7786f57a6f4 path=/api/v1/guides status=200
[req] x-message-id=49cfdbd9-6b04-454d-971a-3d3ef483b40d path=/api/v1/guides status=200
[req] x-request-id=2f8daa88-76cf-4f2a-8383-d00bde84eb9e path=/api/v1/guides/59001af1-b3ff-4264-a293-d433f6843cab/stake status=200
[req] x-message-id=6c45a92c-78c4-4e0d-b61d-1c7a8f5f08e5 path=/api/v1/guides/59001af1-b3ff-4264-a293-d433f6843cab/stake status=200
[req] x-request-id=efebbb09-9491-43a5-8906-80c1c2e9ee2f path=/api/v1/orders status=200
[req] x-message-id=6630763f-bbcc-438f-874e-bb14e5ccc264 path=/api/v1/orders status=200
[req] x-request-id=b03c21cb-9f4a-4346-9d3f-ffd25c54982b path=/api/v1/orders/2c1e2e6f-4015-4ae4-9de8-00a052ecea52/set-escrow-address status=200
[req] x-message-id=e2ae9d7c-47e5-4ad3-b532-86a0fd2826fe path=/api/v1/orders/2c1e2e6f-4015-4ae4-9de8-00a052ecea52/set-escrow-address status=200
[req] x-request-id=0a9650ab-40ad-454e-b032-4d71444f8f67 path=/api/v1/orders/2c1e2e6f-4015-4ae4-9de8-00a052ecea52 status=200
[req] x-message-id=75f91986-21bb-41d8-ab96-2471d4505c0a path=/api/v1/orders/2c1e2e6f-4015-4ae4-9de8-00a052ecea52 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
