# B-MKT-004

`cargo test -p traveltrust-api matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg` exit=0

```

running 1 test
test routes::me_market_bookmarks_db_api_tests::matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=c0bd6710-81d9-481d-af92-e7153eed0a2e path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=8354509c-70ae-45ed-85a6-aae650bd5dde path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=5cae4711-823f-4b8c-a8f4-a4e58f29c348 path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=2627c866-9d68-4745-98aa-6ec9a45c03f7 path=/api/v1/me/market-bookmarks status=200
[req] x-request-id=14f3f32c-fd56-4a26-b49b-eb456d77062a path=/api/v1/me/market-bookmarks/order/a3693fe9-ef6c-4a34-8694-6f738dd7ce40 status=200
[req] x-message-id=7e32fc64-c98a-4e20-935f-a6a5e8d729be path=/api/v1/me/market-bookmarks/order/a3693fe9-ef6c-4a34-8694-6f738dd7ce40 status=200
[req] x-request-id=72324c62-e061-4929-836e-b71239612a5f path=/api/v1/me/market-bookmarks status=200
[req] x-message-id=7536a29e-385b-4268-b910-16c3783318fc path=/api/v1/me/market-bookmarks status=200

```
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · DELETE order market bookmark then GET omits order_id
