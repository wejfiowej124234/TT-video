# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=22fb1b4a-29a5-4388-bb5e-1748ffa94955 path=/auth/register status=200
[req] x-message-id=fe251fbc-2c2c-4081-803a-53a0b420dbdf path=/auth/register status=200
[req] x-request-id=1d52ef02-a570-42a6-89ca-4e9c8d82146c path=/api/v1/itineraries status=200
[req] x-message-id=8261b2e5-9e93-4c45-b867-f63d7e824f51 path=/api/v1/itineraries status=200
[req] x-request-id=b93d73d5-b5ad-4ceb-aca8-da199fc8b751 path=/api/v1/discover/orders status=200
[req] x-message-id=c4e1019c-d4d1-4b96-bf10-3e6b990b5fb7 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
