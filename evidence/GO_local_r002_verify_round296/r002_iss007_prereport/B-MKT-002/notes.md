# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2e73b637-1677-4ce4-9630-0100ee4a8669 path=/auth/register status=200
[req] x-message-id=a4a06c83-369c-4160-bf9b-81146ced069a path=/auth/register status=200
[req] x-request-id=6dcdc007-4448-43dc-8574-359480f07ac0 path=/api/v1/itineraries status=200
[req] x-message-id=a77c011a-5bd2-4485-8f0d-e50f16d9a8c2 path=/api/v1/itineraries status=200
[req] x-request-id=434f41b4-ef0c-4f9d-9f72-d6f9416b4290 path=/api/v1/discover/orders status=200
[req] x-message-id=0b088895-30a6-4874-966f-606aa562828d path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
