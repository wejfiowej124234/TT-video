# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d69499ab-caf8-4e20-a70c-f9ad5c8dd48f path=/auth/register status=200
[req] x-message-id=ceb14473-b317-4c8a-b2d0-f4526dcb2cbc path=/auth/register status=200
[req] x-request-id=f92d6f4b-e778-4b17-9474-3b2638b23096 path=/api/v1/itineraries status=200
[req] x-message-id=011f3dbe-88b8-4436-ae6e-b7dac8a44eca path=/api/v1/itineraries status=200
[req] x-request-id=13915765-766c-45c2-8f8c-251b64e4c938 path=/api/v1/discover/orders status=200
[req] x-message-id=6ea1f79b-7aa7-4a7f-a396-8b91b95b570b path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
