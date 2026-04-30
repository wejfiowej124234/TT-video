# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=9dd3031b-6b70-4c0b-bc8e-105df50d121e path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=3a6a1a15-13d4-412c-b424-0a657ab36838 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=583789f4-2314-49d4-9717-1b6c13e44417 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=abca7b90-b473-4780-8372-6c0d9e03cf4e path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=55b88619-5d20-4666-ad6b-aaefddbced08 path=/api/v1/me/market-bookmarks/order/153e3376-cf84-44bf-af5a-3cbd36778e2f status=200
[req] x-message-id=cfbdc9cd-cfdd-46fd-acf0-735e9e5058b9 path=/api/v1/me/market-bookmarks/order/153e3376-cf84-44bf-af5a-3cbd36778e2f status=200
[req] x-request-id=f5dba489-7610-4799-8f44-ff505b2979b7 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=36a2c4a4-ed87-491a-a339-9443ea38b5b8 path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
