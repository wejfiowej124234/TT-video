# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=79ccbac9-613d-4f06-adb2-1b3ea85dec94 path=/auth/register status=200
[req] x-message-id=eeed841b-beb2-4267-8d31-bac01976e462 path=/auth/register status=200
[req] x-request-id=373690eb-2eac-4d1a-850a-4d525feabbb1 path=/api/v1/itineraries status=200
[req] x-message-id=6afc2667-1b92-416d-b77d-d94f873357a5 path=/api/v1/itineraries status=200
[req] x-request-id=fc3d91ed-330e-46bc-9605-69872874e9dc path=/api/v1/discover/orders status=200
[req] x-message-id=b3e9f722-7d15-4d94-9e86-f9ad81de58a7 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
