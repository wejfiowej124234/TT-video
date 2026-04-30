# D-COM-001C

`cargo test -p traveltrust-api matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=f757e6e8-b631-4d2c-8f83-fe2847bf67fd path=/api/v1/community/posts status=200
[req] x-message-id=15ac603c-d574-418a-978d-c06e76951c30 path=/api/v1/community/posts status=200
[req] x-request-id=cebf5377-e44b-46be-b2f5-b8a950edbc3d path=/api/v1/community/feed status=200
[req] x-message-id=6ad3a448-3d35-4bf0-846f-c7928e013d06 path=/api/v1/community/feed status=200

```
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · POST tagged post then GET feed?tag includes same post id
