# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=4eaef0ff-15aa-47a9-a5e9-2c808eae327d path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=120591d0-6e46-4f4c-aab3-4dd1e24973c7 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=cd6fe61c-2fc5-4695-b73c-d389d6bdc518 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=5616f1f0-1077-4fc4-8f7a-deba2737269d path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=6dc0e18a-b0df-4e42-af75-08f813a4403b path=/api/v1/me/market-bookmarks/order/ea444e2f-66d1-47b0-a0f0-3ea9708ab102 status=200
[req] x-message-id=b3b13769-868e-4382-bc82-6c9e14059fb8 path=/api/v1/me/market-bookmarks/order/ea444e2f-66d1-47b0-a0f0-3ea9708ab102 status=200
[req] x-request-id=58729a51-1eb5-42ea-bb92-5130684e0262 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=70407b5f-0ddd-4d1b-8b22-40222c767c3e path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
