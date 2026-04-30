# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=62643c56-4812-43fb-b266-971035579eed path=/auth/register status=200
[req] x-message-id=ccd0ac29-14f3-4e81-9e12-28e5cb4fba9c path=/auth/register status=200
[req] x-request-id=ab7a482c-981c-4102-ab37-0244bbbe9f62 path=/api/v1/itineraries status=200
[req] x-message-id=8b5d4b36-d9bf-4e7a-a12e-3dcd1c5bbbe3 path=/api/v1/itineraries status=200
[req] x-request-id=a4e46c97-c860-4f42-baaf-d41f11d45575 path=/api/v1/discover/orders status=200
[req] x-message-id=119f5150-b472-46da-95e3-ac8b1d7d1045 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
