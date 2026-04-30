# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=1edd6be0-4110-4f5c-b134-b48e0acdf490 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=623c37ef-0433-4a9e-9345-ee5a06217ba6 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=669ca33a-29bb-4808-aca1-347c34929e5f path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=aabb45f3-c527-428f-8931-adf2acd41691 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=db8349ff-b5bf-4c3f-b881-e0f6891fbe49 path=/api/v1/me/market-bookmarks/order/e2697577-96d8-4f61-9d3c-9ed67faabdc1 status=200
[req] x-message-id=44a3dc1e-7253-41ef-8679-87ed978ccaf8 path=/api/v1/me/market-bookmarks/order/e2697577-96d8-4f61-9d3c-9ed67faabdc1 status=200
[req] x-request-id=93d1a6cf-ffab-4630-bf4a-3c400ad7f27a path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=df809f72-c222-447a-b6d6-6156866c3bcc path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
