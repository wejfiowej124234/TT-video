# B-MKT-002

`cargo test -p traveltrust-api matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.55s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=40f95a18-8354-4c7b-a41a-7b6724e1d64d path=/auth/register status=200
[req] x-message-id=bbd2719c-0797-4e45-8dd9-c3dc94a4bec6 path=/auth/register status=200
[req] x-request-id=12b024ba-8521-45e7-b8fc-d5ae74652ad6 path=/api/v1/itineraries status=200
[req] x-message-id=9cc04857-01b4-4151-9570-b577a732ad76 path=/api/v1/itineraries status=200
[req] x-request-id=3fbdde35-427a-47dc-a3d5-10a9b7610625 path=/api/v1/discover/orders status=200
[req] x-message-id=ebe880fd-cf30-4c45-9628-0cb1144b8679 path=/api/v1/discover/orders status=200

```
E2E: `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` — B-MKT-002 · GET /api/v1/discover/orders deep-link country/city vs API shape
