# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.18s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=b9a8fccd-7ba7-422d-9ba2-f2307f48e2b4 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=cb527b06-a2b1-4d78-9f57-530d6c1c77ed path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=c3d52a90-aff9-4851-8ed8-e3315b3592bf path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=f28cb2a0-5bbe-49a5-b47b-5a91296361f8 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=8a5c5e9c-cd8b-41f7-808e-8241159436fd path=/api/v1/me/market-bookmarks/order/5b3812b5-1d05-451c-ae15-7b9bb0ad17d1 status=200
[req] x-message-id=8ad5b99e-d6a4-4498-9876-2ec6b4f0a0e4 path=/api/v1/me/market-bookmarks/order/5b3812b5-1d05-451c-ae15-7b9bb0ad17d1 status=200
[req] x-request-id=8c4d0bb4-fdb0-424f-b1ab-09b82a643086 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=147f8834-a23d-44fc-861f-1fc54fc499fd path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
