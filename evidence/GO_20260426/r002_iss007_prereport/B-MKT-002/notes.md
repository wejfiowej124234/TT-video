# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.38s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=7af9bedd-858a-44c8-a5b0-d87c7e92d0ab path=/auth/register status=200
[req] x-message-id=fe9fb507-9f5d-4f2c-9a66-284197e9d4e7 path=/auth/register status=200
[req] x-request-id=b6bdace7-4b0f-4e3a-868b-8044d0dffc00 path=/api/v1/itineraries status=200
[req] x-message-id=e9bf2ee0-773c-48dd-ae0d-903be6752b60 path=/api/v1/itineraries status=200
[req] x-request-id=9929b206-21b3-4b6b-91e2-dc2f171f1b6a path=/api/v1/discover/orders status=200
[req] x-message-id=98314fd2-f7bd-433a-a109-25c96cd7ced1 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
