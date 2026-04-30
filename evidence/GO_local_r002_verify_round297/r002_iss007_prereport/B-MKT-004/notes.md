# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d2a9b557-cd01-4bb9-bdd8-75c3790e8c55 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=13600d25-e5f5-4040-a635-2888bd8f6fb7 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=65812208-d4b6-44ce-9c24-d7816591c6d4 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=26200e8b-a11b-45cb-b724-6cbb7492ac0c path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=5b76da3d-ea35-46b7-982d-1c5f619c8923 path=/api/v1/me/market-bookmarks/order/172fc133-4b12-46eb-8ceb-a4c673c04663 status=200
[req] x-message-id=5918187f-bf90-41ac-9ce0-c84d79ff183a path=/api/v1/me/market-bookmarks/order/172fc133-4b12-46eb-8ceb-a4c673c04663 status=200
[req] x-request-id=760ce55c-eac7-4dae-9ccb-790133be95f7 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=51e5d50e-5f72-4922-bf93-ce0745123cdc path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
