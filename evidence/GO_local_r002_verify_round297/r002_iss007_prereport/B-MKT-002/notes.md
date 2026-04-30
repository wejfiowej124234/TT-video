# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=fb4f7a5f-6334-409e-955a-e98f1bc59a51 path=/auth/register status=200
[req] x-message-id=47b547d2-a1a2-49d4-bef5-b81326d494a7 path=/auth/register status=200
[req] x-request-id=da427952-1550-4aad-a15d-98a0b6638118 path=/api/v1/itineraries status=200
[req] x-message-id=e93b8b71-5461-41c1-801f-00167de36077 path=/api/v1/itineraries status=200
[req] x-request-id=03a3f63a-a4aa-4626-a878-1f272d74cfef path=/api/v1/discover/orders status=200
[req] x-message-id=eb3d2c06-24e1-42c1-985c-0788cee664b5 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
