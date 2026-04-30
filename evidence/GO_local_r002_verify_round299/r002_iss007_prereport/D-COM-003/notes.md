# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=7cf8bd98-14b1-4dc1-9921-a22b6e29f2ca path=/api/v1/community/posts status=200
[req] x-message-id=119c6126-1db6-45f3-9071-670aaf98c992 path=/api/v1/community/posts status=200
[req] x-request-id=a5a64864-952b-4e29-b10c-84e6cceb1088 path=/api/v1/community/posts/e2c539ec-2d7f-435a-9c77-78f6c9833c7a/like status=200
[req] x-message-id=10d42771-0a6e-468f-a5eb-681dbd590874 path=/api/v1/community/posts/e2c539ec-2d7f-435a-9c77-78f6c9833c7a/like status=200
[req] x-request-id=4be23d02-b417-4053-8d4d-c9461807e0d5 path=/api/v1/community/posts/e2c539ec-2d7f-435a-9c77-78f6c9833c7a/like status=200
[req] x-message-id=1ec8eee5-baf1-4a5b-accf-e1a54f51323a path=/api/v1/community/posts/e2c539ec-2d7f-435a-9c77-78f6c9833c7a/like status=200
[req] x-request-id=cb3766a2-31d4-4296-b316-9cb367ba51d1 path=/api/v1/community/posts/e2c539ec-2d7f-435a-9c77-78f6c9833c7a/like status=200
[req] x-message-id=0bc547dd-0286-419f-abf3-8a504f2b0404 path=/api/v1/community/posts/e2c539ec-2d7f-435a-9c77-78f6c9833c7a/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
