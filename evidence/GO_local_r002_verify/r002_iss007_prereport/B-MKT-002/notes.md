# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.58s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=74492973-819a-4b0f-9542-ae84faea90a2 path=/auth/register status=200
[req] x-message-id=90912b6c-2a2d-4b8c-94d7-1563211db04f path=/auth/register status=200
[req] x-request-id=2af12e89-ebc1-4fad-ae59-0b02d6a32386 path=/api/v1/itineraries status=200
[req] x-message-id=51550a9f-2460-4cad-8f1c-67cac40d0a14 path=/api/v1/itineraries status=200
[req] x-request-id=5da774c5-4f94-4f8d-a295-a5ff7c42a985 path=/api/v1/discover/orders status=200
[req] x-message-id=83c65d6e-d5b5-40cf-8265-970d0fa3d869 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
