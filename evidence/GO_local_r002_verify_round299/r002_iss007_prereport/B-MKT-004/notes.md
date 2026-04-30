# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=9dda3ecc-84fe-46ec-9b52-6c0aefeb4043 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=b9ab7c0f-423c-4430-ade3-ed7031294aea path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=08362dd2-88a0-4232-8167-156f02359721 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=ed97943e-97fd-4528-87d8-762dd7104306 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=81fcbc48-dd1a-4b32-a0ae-60671cf089be path=/api/v1/me/market-bookmarks/order/584e2ebe-a3f4-42e2-9c00-7a64a2e7db46 status=200
[req] x-message-id=bac71940-db25-48d5-b703-d52b9f788086 path=/api/v1/me/market-bookmarks/order/584e2ebe-a3f4-42e2-9c00-7a64a2e7db46 status=200
[req] x-request-id=e6c8e781-022f-4da5-9f58-42e79d2fa771 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=6480bd0d-ed6e-49b2-84aa-5c915198b3e8 path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
