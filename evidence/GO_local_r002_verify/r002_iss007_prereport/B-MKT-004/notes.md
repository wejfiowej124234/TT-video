# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=93a0bf60-8554-4505-9466-3dc6f295153d path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=86b86d26-5490-4d6e-af09-aacaebe7bcba path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=d83874ac-7704-4c70-b776-6a15e67b1937 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=42730a84-f87b-4825-9516-35046fcb0a7c path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=07fed36e-486e-4631-8abf-67b353d7c770 path=/api/v1/me/market-bookmarks/order/26aa540f-9db7-4fc7-819d-67878f70c63b status=200
[req] x-message-id=3f2de03c-92bf-4134-966b-4dffcf36350b path=/api/v1/me/market-bookmarks/order/26aa540f-9db7-4fc7-819d-67878f70c63b status=200
[req] x-request-id=ec52fc2b-9e6e-4313-83e5-0dd3037d4b6a path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=95ddbbff-77a4-40c6-a5cb-ece41c070876 path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
