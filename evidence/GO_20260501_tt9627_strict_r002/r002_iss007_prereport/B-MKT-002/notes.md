# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.59s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=57ad5e4a-e0b1-457d-a43f-8056df02b786 path=/auth/register status=200
[req] x-message-id=2eb8e91f-1a74-4fd0-879b-f23ac7aaa6e9 path=/auth/register status=200
[req] x-request-id=76d6d329-1e39-466d-a5c3-c4e67b312547 path=/api/v1/itineraries status=200
[req] x-message-id=6dc2f844-1548-49b2-a4e8-0ef6a0de72cc path=/api/v1/itineraries status=200
[req] x-request-id=267987e9-eb9e-4dc9-bfd5-2ee34f4e7ea7 path=/api/v1/discover/orders status=200
[req] x-message-id=c4557007-cc37-4405-90f8-46727f691006 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
