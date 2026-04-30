# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=9fdbcb59-733b-4cab-b597-d935cb3d53e7 path=/api/v1/community/posts status=200
[req] x-message-id=9ffdc27b-2d1f-495f-9a42-d698324572b4 path=/api/v1/community/posts status=200
[req] x-request-id=66d7b219-8bb5-4db6-8fc1-4a6996b5ea33 path=/api/v1/community/posts/4ced2c5f-2d56-4489-a09e-f67b87b94bc6/collect status=200
[req] x-message-id=6f220e77-3461-499a-a52c-f08ec1586843 path=/api/v1/community/posts/4ced2c5f-2d56-4489-a09e-f67b87b94bc6/collect status=200
[req] x-request-id=15e0d266-8392-4b60-8e7a-3efb6865a0aa path=/api/v1/community/posts/4ced2c5f-2d56-4489-a09e-f67b87b94bc6/collect status=200
[req] x-message-id=6274b7bd-a629-4044-9448-30c3063a5e9f path=/api/v1/community/posts/4ced2c5f-2d56-4489-a09e-f67b87b94bc6/collect status=200
[req] x-request-id=230d8c64-990e-4c4f-9624-1a36b8e5027a path=/api/v1/community/posts/4ced2c5f-2d56-4489-a09e-f67b87b94bc6/collect status=200
[req] x-message-id=d1b84c29-9679-48b7-b36a-14b1b580e6ad path=/api/v1/community/posts/4ced2c5f-2d56-4489-a09e-f67b87b94bc6/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
