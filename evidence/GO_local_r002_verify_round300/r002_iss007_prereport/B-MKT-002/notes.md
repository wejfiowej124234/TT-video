# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ec4e4361-e94f-4449-954a-9ed4904c5301 path=/auth/register status=200
[req] x-message-id=1cf04caa-2f11-4b4f-b1b6-71f9d7e2fbbd path=/auth/register status=200
[req] x-request-id=038ed150-f70e-44d9-a51e-684eefc52d24 path=/api/v1/itineraries status=200
[req] x-message-id=0570cbdb-1b2a-4391-907e-85183cf5b87e path=/api/v1/itineraries status=200
[req] x-request-id=53aac693-aaec-408d-8eaf-76f289817595 path=/api/v1/discover/orders status=200
[req] x-message-id=dbc2458b-0941-44fc-9e5e-9f536f2496d2 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
