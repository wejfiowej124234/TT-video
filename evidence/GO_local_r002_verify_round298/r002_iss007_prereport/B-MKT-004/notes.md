# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.33s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3e40e7ae-3bc9-4c8f-97a8-ad6edf2ef31f path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=6b312ffe-3cce-4ef0-aa05-9c2240e34ff9 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=2e5d8dfa-facc-426c-b2db-aae05563b027 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=fe454aee-2a36-42ae-b124-60f26741a5dc path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=7595ed61-830b-4d7f-969c-b7ded4aa4d5d path=/api/v1/me/market-bookmarks/order/7ba68e78-188f-4882-90a3-2d919bf1168e status=200
[req] x-message-id=a4291cc1-80d2-4986-ba10-c4a55e0bbd41 path=/api/v1/me/market-bookmarks/order/7ba68e78-188f-4882-90a3-2d919bf1168e status=200
[req] x-request-id=525b5e28-ad62-4723-83c6-74fd0b3d0949 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=b049a11a-da49-446c-adc5-9113adea8f14 path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
