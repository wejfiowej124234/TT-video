# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=63c0bbeb-0e06-4105-9f0f-899d5a9e01f6 path=/auth/register status=200
[req] x-message-id=612049f9-a49b-4f3c-b760-f32bfb9a1e44 path=/auth/register status=200
[req] x-request-id=ecb545b9-206e-42b8-9689-1005d488f42a path=/api/v1/itineraries status=200
[req] x-message-id=169dbaa5-eabf-40ee-bf8c-b1fcc33c0789 path=/api/v1/itineraries status=200
[req] x-request-id=751498f9-c648-409f-b1ac-bb5ef9e46fcd path=/api/v1/discover/orders status=200
[req] x-message-id=930cbca0-6186-4c14-a68a-227276a9ee71 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
